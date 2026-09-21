"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  agregarAlCarritoAction,
  actualizarCantidadCarritoAction,
  quitarDelCarritoAction,
  obtenerCarritoAction,
  resolverProductosPublicosAction,
  fusionarCarritoAction,
} from "@/server/actions/carrito";
import type { ItemCarritoResuelto } from "@/types/database";

/**
 * Carrito (B1): con sesión vive en base de datos (§9.6); sin sesión vive en
 * `localStorage` de este navegador — cero infraestructura para visitantes
 * que quizá nunca compren, y sobrevive a recargas de página (B1.2)
 * incluso sin cuenta, aunque el criterio de "cambio de dispositivo" solo
 * aplica con sesión iniciada, como pide el criterio.
 */

interface ItemLocal {
  productId: string;
  qty: number;
}

interface CarritoContexto {
  items: ItemCarritoResuelto[];
  cargando: boolean;
  sesionIniciada: boolean;
  cantidadTotal: number;
  subtotal: number;
  algunoConProblemaDeStock: boolean;
  agregar: (item: { productId: string; sku: string; slug: string; name: string; price: number; disponible: number; imagenUrl: string | null }, qty: number) => Promise<void>;
  actualizarCantidad: (productId: string, qty: number) => Promise<void>;
  quitar: (productId: string) => Promise<void>;
  fusionarTrasLogin: () => Promise<void>;
}

const CLAVE_LOCAL = "sgq_carrito_v1";
const CarritoContext = createContext<CarritoContexto | null>(null);

function leerLocal(): ItemLocal[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE_LOCAL);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    return datos.filter((d): d is ItemLocal => typeof d?.productId === "string" && typeof d?.qty === "number");
  } catch {
    return [];
  }
}

function guardarLocal(items: ItemLocal[]) {
  try {
    window.localStorage.setItem(CLAVE_LOCAL, JSON.stringify(items));
  } catch {
    // Privado/bloqueado: el carrito sigue funcionando en memoria para esta
    // vista, solo no sobrevive a un refresh — degradación aceptable.
  }
}

export function CarritoProvider({ sesionIniciada, children }: { sesionIniciada: boolean; children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarritoResuelto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Bandera de "sigo montado": evita el `setState` de una respuesta que
    // llega después de que el componente se desmontó (navegación rápida).
    let vigente = true;

    async function cargarConSesion() {
      const resultado = await obtenerCarritoAction();
      if (!vigente) return;
      if (resultado.ok) setItems(resultado.data.items);
      setCargando(false);
    }

    async function cargarLocal() {
      const locales = leerLocal();
      if (locales.length === 0) {
        if (vigente) {
          setItems([]);
          setCargando(false);
        }
        return;
      }
      const resultado = await resolverProductosPublicosAction(locales.map((l) => l.productId));
      if (!vigente) return;
      if (resultado.ok) {
        const resueltos: ItemCarritoResuelto[] = [];
        for (const local of locales) {
          const producto = resultado.data.find((p) => p.productId === local.productId);
          if (!producto) continue; // ya no existe / se desactivó
          resueltos.push({ ...producto, qty: local.qty, stockCambio: local.qty > producto.disponible });
        }
        setItems(resueltos);
      }
      setCargando(false);
    }

    if (sesionIniciada) void cargarConSesion();
    else void cargarLocal();

    return () => {
      vigente = false;
    };
    // Solo al montar: `sesionIniciada` cambia de valor por una navegación
    // completa (Server Component), no dentro de esta sesión de cliente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agregar: CarritoContexto["agregar"] = useCallback(
    async (item, qty) => {
      if (sesionIniciada) {
        const resultado = await agregarAlCarritoAction(item.productId, qty);
        if (resultado.ok) setItems(resultado.data.items);
        return;
      }
      const locales = leerLocal();
      const existente = locales.find((l) => l.productId === item.productId);
      const nuevaCantidad = Math.min(item.disponible, (existente?.qty ?? 0) + qty);
      const nuevos = existente
        ? locales.map((l) => (l.productId === item.productId ? { ...l, qty: nuevaCantidad } : l))
        : [...locales, { productId: item.productId, qty: nuevaCantidad }];
      guardarLocal(nuevos);
      setItems((prev) => {
        const sinEste = prev.filter((p) => p.productId !== item.productId);
        return [...sinEste, { ...item, qty: nuevaCantidad, stockCambio: false }];
      });
    },
    [sesionIniciada],
  );

  const actualizarCantidad: CarritoContexto["actualizarCantidad"] = useCallback(
    async (productId, qty) => {
      if (sesionIniciada) {
        const resultado = await actualizarCantidadCarritoAction(productId, qty);
        if (resultado.ok) setItems(resultado.data.items);
        return;
      }
      if (qty <= 0) {
        const nuevos = leerLocal().filter((l) => l.productId !== productId);
        guardarLocal(nuevos);
        setItems((prev) => prev.filter((p) => p.productId !== productId));
        return;
      }
      const nuevos = leerLocal().map((l) => (l.productId === productId ? { ...l, qty } : l));
      guardarLocal(nuevos);
      setItems((prev) => prev.map((p) => (p.productId === productId ? { ...p, qty: Math.min(qty, p.disponible), stockCambio: qty > p.disponible } : p)));
    },
    [sesionIniciada],
  );

  const quitar: CarritoContexto["quitar"] = useCallback(
    async (productId) => {
      if (sesionIniciada) {
        const resultado = await quitarDelCarritoAction(productId);
        if (resultado.ok) setItems(resultado.data.items);
        return;
      }
      guardarLocal(leerLocal().filter((l) => l.productId !== productId));
      setItems((prev) => prev.filter((p) => p.productId !== productId));
    },
    [sesionIniciada],
  );

  const fusionarTrasLogin = useCallback(async () => {
    const locales = leerLocal();
    const resultado = await fusionarCarritoAction(locales);
    if (resultado.ok) {
      setItems(resultado.data.items);
      guardarLocal([]);
    }
  }, []);

  const cantidadTotal = useMemo(() => items.reduce((acc, it) => acc + it.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((acc, it) => acc + it.price * it.qty, 0), [items]);
  const algunoConProblemaDeStock = useMemo(() => items.some((it) => it.stockCambio), [items]);

  return (
    <CarritoContext.Provider
      value={{ items, cargando, sesionIniciada, cantidadTotal, subtotal, algunoConProblemaDeStock, agregar, actualizarCantidad, quitar, fusionarTrasLogin }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito(): CarritoContexto {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
