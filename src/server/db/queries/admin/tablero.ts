import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";

/** G2/H6 — "pago validado" (RN, ya usado en G1/G2.2) es todo pedido en
 * `listo_envio`, `enviado` o `entregado`: de ahí en adelante el pago ya
 * se confirmó, antes no. */
const ESTADOS_PAGO_VALIDADO = ["listo_envio", "enviado", "entregado"] as const;

export type PeriodoTablero = "7" | "30" | "mes";

function rangoDelPeriodo(periodo: PeriodoTablero): { desde: Date; dias: number } {
  const ahora = new Date();
  if (periodo === "mes") {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    return { desde, dias: Math.ceil((ahora.getTime() - desde.getTime()) / 86_400_000) + 1 };
  }
  const dias = periodo === "7" ? 7 : 30;
  const desde = new Date(ahora.getTime() - dias * 86_400_000);
  return { desde, dias };
}

export interface TarjetasAtencion {
  comprobantesPorValidar: number;
  pedidosPorEnviar: number;
  devolucionesPendientes: number;
  solicitudesSinContactar: number;
  pedidosPorVencer: number;
  productosAgotados: number;
}

/** G2.2: "lo que requiere atención hoy" — fotos del momento, no dependen
 * del periodo elegido. */
export async function obtenerTarjetasAtencion(): Promise<TarjetasAtencion> {
  const supabase = await crearClienteServidor();

  const { data: settingDias } = await supabase.from("settings").select("value").eq("key", "order_auto_cancel_days").maybeSingle();
  const diasCancelacion = Number(settingDias?.value) || 3;
  // "Por vencer" = a un día o menos de cancelarse solo (PA-7): faltando
  // <= 1 día del plazo total configurado.
  const corteVencimiento = new Date(Date.now() - (diasCancelacion - 1) * 86_400_000).toISOString();

  const [comprobantes, listoEnvio, devoluciones, solicitudes, porVencer, agotados] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "comprobante_recibido"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "listo_envio"),
    supabase.from("returns").select("id", { count: "exact", head: true }).in("status", ["solicitada", "en_revision"]),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "nueva"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pendiente_pago").lte("created_at", corteVencimiento),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "activo").lte("stock", 0),
  ]);

  return {
    comprobantesPorValidar: comprobantes.count ?? 0,
    pedidosPorEnviar: listoEnvio.count ?? 0,
    devolucionesPendientes: devoluciones.count ?? 0,
    solicitudesSinContactar: solicitudes.count ?? 0,
    pedidosPorVencer: porVencer.count ?? 0,
    productosAgotados: agotados.count ?? 0,
  };
}

export interface KpisTablero {
  ventas: number;
  ventasDeltaPct: number | null;
  pedidos: number;
  pedidosDeltaPct: number | null;
  ticketPromedio: number;
  ticketDeltaPct: number | null;
  tasaSePagan: number; // 0-100
  tasaSePaganDeltaPct: number | null;
}

function deltaPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? null : 100;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** G2.3: ventas, ticket promedio, tasa de conversión pedido→pago
 * validado — con el delta contra el periodo inmediato anterior de igual
 * longitud, para el ▲/▼ de la maqueta. */
export async function obtenerKpisTablero(periodo: PeriodoTablero): Promise<KpisTablero> {
  const supabase = await crearClienteServidor();
  const { desde, dias } = rangoDelPeriodo(periodo);
  const desdeAnterior = new Date(desde.getTime() - dias * 86_400_000);

  const [pedidosActual, pedidosAnterior, validadosActual, validadosAnterior] = await Promise.all([
    supabase.from("orders").select("id, total, status, created_at").gte("created_at", desde.toISOString()),
    supabase.from("orders").select("id, status").gte("created_at", desdeAnterior.toISOString()).lt("created_at", desde.toISOString()),
    supabase.from("orders").select("total").in("status", ESTADOS_PAGO_VALIDADO).gte("created_at", desde.toISOString()),
    supabase.from("orders").select("total").in("status", ESTADOS_PAGO_VALIDADO).gte("created_at", desdeAnterior.toISOString()).lt("created_at", desde.toISOString()),
  ]);

  const filasActual = pedidosActual.data ?? [];
  const filasAnterior = pedidosAnterior.data ?? [];
  const validadasActual = validadosActual.data ?? [];
  const validadasAnterior = validadosAnterior.data ?? [];

  const ventas = validadasActual.reduce((s, o) => s + Number(o.total), 0);
  const ventasAnteriores = validadasAnterior.reduce((s, o) => s + Number(o.total), 0);
  const pedidos = validadasActual.length;
  const pedidosAnteriores = validadasAnterior.length;
  const ticketPromedio = pedidos > 0 ? ventas / pedidos : 0;
  const ticketAnterior = pedidosAnteriores > 0 ? ventasAnteriores / pedidosAnteriores : 0;

  const validadosDeGenerados = (filas: typeof filasActual) => filas.filter((o) => (ESTADOS_PAGO_VALIDADO as readonly string[]).includes(o.status)).length;
  const tasaSePagan = filasActual.length > 0 ? (validadosDeGenerados(filasActual) / filasActual.length) * 100 : 0;
  const tasaAnterior = filasAnterior.length > 0 ? (filasAnterior.filter((o) => (ESTADOS_PAGO_VALIDADO as readonly string[]).includes(o.status)).length / filasAnterior.length) * 100 : 0;

  return {
    ventas,
    ventasDeltaPct: deltaPct(ventas, ventasAnteriores),
    pedidos,
    pedidosDeltaPct: deltaPct(pedidos, pedidosAnteriores),
    ticketPromedio,
    ticketDeltaPct: deltaPct(ticketPromedio, ticketAnterior),
    tasaSePagan,
    tasaSePaganDeltaPct: deltaPct(tasaSePagan, tasaAnterior),
  };
}

export interface PuntoVentaDia {
  fecha: string; // ISO, día
  actual: number;
  anterior: number;
}

/** Serie diaria de ventas (pago validado) del periodo vs el anterior,
 * para la gráfica de líneas. */
export async function obtenerVentasPorDia(periodo: PeriodoTablero): Promise<PuntoVentaDia[]> {
  const supabase = await crearClienteServidor();
  const { desde, dias } = rangoDelPeriodo(periodo);
  const desdeAnterior = new Date(desde.getTime() - dias * 86_400_000);

  const { data } = await supabase.from("orders").select("total, created_at").in("status", ESTADOS_PAGO_VALIDADO).gte("created_at", desdeAnterior.toISOString());
  const filas = data ?? [];

  const porDiaActual = new Map<string, number>();
  const porDiaAnterior = new Map<string, number>();
  for (const o of filas) {
    const fecha = new Date(o.created_at);
    const clave = fecha.toISOString().slice(0, 10);
    if (fecha >= desde) porDiaActual.set(clave, (porDiaActual.get(clave) ?? 0) + Number(o.total));
    else porDiaAnterior.set(clave, (porDiaAnterior.get(clave) ?? 0) + Number(o.total));
  }

  const puntos: PuntoVentaDia[] = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(desde.getTime() + i * 86_400_000);
    const dAnt = new Date(desdeAnterior.getTime() + i * 86_400_000);
    puntos.push({
      fecha: d.toISOString().slice(0, 10),
      actual: porDiaActual.get(d.toISOString().slice(0, 10)) ?? 0,
      anterior: porDiaAnterior.get(dAnt.toISOString().slice(0, 10)) ?? 0,
    });
  }
  return puntos;
}

export interface EtapaEmbudo {
  estado: string;
  cifra: number;
}

/** Foto actual (no depende del periodo) de cuántos pedidos hay en cada
 * etapa abierta del flujo. */
export async function obtenerEmbudo(): Promise<EtapaEmbudo[]> {
  const supabase = await crearClienteServidor();
  const estados = ["pendiente_pago", "comprobante_recibido", "listo_envio", "enviado"] as const;
  const resultados = await Promise.all(estados.map((e) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", e)));
  return estados.map((estado, i) => ({ estado, cifra: resultados[i].count ?? 0 }));
}

export interface ProductoVendido {
  nombre: string;
  sku: string;
  unidades: number;
  importe: number;
}

/** G1: más vendidos del periodo, solo pago validado. */
export async function obtenerMasVendidos(periodo: PeriodoTablero, limite = 5): Promise<ProductoVendido[]> {
  const supabase = await crearClienteServidor();
  const { desde } = rangoDelPeriodo(periodo);

  const { data: pedidos } = await supabase.from("orders").select("id").in("status", ESTADOS_PAGO_VALIDADO).gte("created_at", desde.toISOString());
  const orderIds = (pedidos ?? []).map((o) => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await supabase.from("order_items").select("name, sku, qty, subtotal").in("order_id", orderIds);
  const porSku = new Map<string, ProductoVendido>();
  for (const it of items ?? []) {
    const actual = porSku.get(it.sku) ?? { nombre: it.name, sku: it.sku, unidades: 0, importe: 0 };
    actual.unidades += it.qty;
    actual.importe += Number(it.subtotal);
    porSku.set(it.sku, actual);
  }
  return [...porSku.values()].sort((a, b) => b.unidades - a.unidades).slice(0, limite);
}

export interface ImporteGrupo {
  nombre: string;
  importe: number;
}

/** "¿De qué vive el negocio?" — importe validado por grupo del periodo. */
export async function obtenerImportePorGrupo(periodo: PeriodoTablero): Promise<ImporteGrupo[]> {
  const supabase = await crearClienteServidor();
  const { desde } = rangoDelPeriodo(periodo);

  const { data: pedidos } = await supabase.from("orders").select("id").in("status", ESTADOS_PAGO_VALIDADO).gte("created_at", desde.toISOString());
  const orderIds = (pedidos ?? []).map((o) => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await supabase.from("order_items").select("product_id, subtotal").in("order_id", orderIds);
  const productIds = [...new Set((items ?? []).map((it) => it.product_id))];
  if (productIds.length === 0) return [];

  const { data: productos } = await supabase.from("products").select("id, group_id").in("id", productIds);
  const grupoPorProducto = new Map((productos ?? []).map((p) => [p.id, p.group_id]));

  const { data: grupos } = await supabase.from("groups").select("id, name");
  const nombrePorGrupo = new Map((grupos ?? []).map((g) => [g.id, g.name]));

  const importePorGrupo = new Map<string, number>();
  for (const it of items ?? []) {
    const groupId = grupoPorProducto.get(it.product_id);
    if (!groupId) continue;
    importePorGrupo.set(groupId, (importePorGrupo.get(groupId) ?? 0) + Number(it.subtotal));
  }

  return [...importePorGrupo.entries()]
    .map(([groupId, importe]) => ({ nombre: nombrePorGrupo.get(groupId) ?? "Otro", importe }))
    .sort((a, b) => b.importe - a.importe);
}

export interface SaldoYDevoluciones {
  saldoComprometido: number;
  clientesConSaldo: number;
  tasaDevolucionesPct: number;
}

export async function obtenerSaldoYDevoluciones(periodo: PeriodoTablero): Promise<SaldoYDevoluciones> {
  const supabase = await crearClienteServidor();
  const { desde } = rangoDelPeriodo(periodo);

  const { data: movimientos } = await supabase.from("credit_movements").select("user_id, amount");
  const saldoPorCliente = new Map<string, number>();
  for (const m of movimientos ?? []) {
    saldoPorCliente.set(m.user_id, (saldoPorCliente.get(m.user_id) ?? 0) + Number(m.amount));
  }
  const saldosPositivos = [...saldoPorCliente.values()].filter((v) => v > 0);
  const saldoComprometido = saldosPositivos.reduce((s, v) => s + v, 0);

  const [devolucionesAprobadas, ventasValidadas] = await Promise.all([
    supabase.from("returns").select("credit_amount").eq("status", "aprobada").gte("created_at", desde.toISOString()),
    supabase.from("orders").select("total").in("status", ESTADOS_PAGO_VALIDADO).gte("created_at", desde.toISOString()),
  ]);
  const montoDevuelto = (devolucionesAprobadas.data ?? []).reduce((s, d) => s + Number(d.credit_amount ?? 0), 0);
  const montoVendido = (ventasValidadas.data ?? []).reduce((s, o) => s + Number(o.total), 0);

  return {
    saldoComprometido,
    clientesConSaldo: saldosPositivos.length,
    tasaDevolucionesPct: montoVendido > 0 ? (montoDevuelto / montoVendido) * 100 : 0,
  };
}

export interface ProductoStockCritico {
  sku: string;
  nombre: string;
  disponible: number;
}

/** "Se te va a acabar" — productos activos con 3 piezas disponibles o menos. */
export async function obtenerStockCritico(limite = 4): Promise<ProductoStockCritico[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("products").select("sku, name, stock, reserved").eq("status", "activo").order("stock", { ascending: true }).limit(200);
  return (data ?? [])
    .map((p) => ({ sku: p.sku, nombre: p.name, disponible: Math.max(0, p.stock - p.reserved) }))
    .filter((p) => p.disponible <= 3)
    .sort((a, b) => a.disponible - b.disponible)
    .slice(0, limite);
}
