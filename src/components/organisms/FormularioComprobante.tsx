"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { esquemaComprobante } from "@/lib/esquemas/checkout";
import { solicitarSubidaComprobanteAction, confirmarComprobanteAction } from "@/server/actions/comprobantes";
import { formatearPrecio } from "@/lib/formato";
import { CampoConError } from "@/components/molecules/CampoConError";
import { Boton } from "@/components/atoms/Boton";

const TIPOS_ACEPTADOS = ".jpg,.jpeg,.png,.heic,.pdf";
const TAMANO_MAXIMO_MB = 5;

/** index.html:1384-1449 (`isUpload`) — C2: sube directo del navegador a R2
 * con una URL firmada (arquitectura §7.1); el archivo nunca pasa por el
 * servidor de Next.js. */
export function FormularioComprobante({ orderId, folio, total }: { orderId: string; folio: string; total: string }) {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [datos, setDatos] = useState({ transferDate: "", amount: "", originBank: "", speiTrackingKey: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"form" | "subiendo" | "hecho">("form");
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setErrorArchivo(`El archivo pesa más de ${TAMANO_MAXIMO_MB} MB. Sube una imagen más ligera o un PDF.`);
      setArchivo(null);
      return;
    }
    setErrorArchivo(null);
    setArchivo(f);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    if (!archivo) {
      setErrorGeneral("Elige primero tu comprobante.");
      return;
    }
    const parseo = esquemaComprobante.safeParse({ ...datos, orderId });
    if (!parseo.success) {
      setErrores(Object.fromEntries(parseo.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrores({});
    setEstado("subiendo");

    const firma = await solicitarSubidaComprobanteAction({
      orderId,
      folio,
      nombreArchivo: archivo.name,
      contentType: archivo.type,
    });
    if (!firma.ok) {
      setErrorGeneral(firma.error);
      setEstado("form");
      return;
    }

    const subida = await fetch(firma.data.url, { method: "PUT", body: archivo, headers: { "Content-Type": archivo.type } });
    if (!subida.ok) {
      setErrorGeneral("No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.");
      setEstado("form");
      return;
    }

    const confirmado = await confirmarComprobanteAction(orderId, firma.data.key, parseo.data);
    if (!confirmado.ok) {
      setErrorGeneral(confirmado.error);
      setEstado("form");
      return;
    }
    setEstado("hecho");
  }

  if (estado === "hecho") {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <span style={{ display: "inline-grid", placeItems: "center", width: 76, height: 76, border: "1.5px solid var(--success)", borderRadius: "50%", color: "var(--success)", fontSize: 34 }}>✓</span>
        <h1 style={{ margin: "26px 0 0", fontSize: "clamp(26px,2.8vw,38px)", lineHeight: 1.2 }}>¡Tu compra se completó con éxito!</h1>
        <p style={{ margin: "16px auto 0", maxWidth: "56ch", fontSize: 16.5, lineHeight: 1.6, color: "var(--text-muted)" }}>
          Recibimos tu comprobante del pedido {folio}. Un agente de ventas se pondrá en contacto contigo en un lapso máximo de 24 horas.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
          <Boton tamano="lg" onClick={() => router.push(`/mi-cuenta/pedidos/${folio}`)}>Ver mi pedido</Boton>
          <Boton variante="secundaria" tamano="lg" onClick={() => router.push("/catalogo")}>Seguir comprando</Boton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <h1 style={{ margin: 0, fontSize: "clamp(26px,2.8vw,36px)" }}>Subir comprobante</h1>
      <p style={{ margin: "10px 0 0", fontSize: 15, color: "var(--text-muted)" }}>
        Pedido <span className="font-data" style={{ color: "var(--text-primary)" }}>{folio}</span> · Importe {formatearPrecio(total)}
      </p>

      {!archivo ? (
        <div style={{ marginTop: 26, padding: "44px 24px", border: "1px dashed var(--border-subtle)", background: "var(--bg-surface)", textAlign: "center" }}>
          <p style={{ margin: "14px 0 0", fontSize: 16, color: "var(--text-primary)" }}>Elige tu comprobante</p>
          <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>JPG, PNG, HEIC o PDF de hasta {TAMANO_MAXIMO_MB} MB</p>
          <label style={{ display: "inline-block", marginTop: 20, padding: "13px 20px", border: "1px solid var(--accent)", color: "var(--accent)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 14.5, cursor: "pointer" }}>
            Elegir archivo
            <input type="file" accept={TIPOS_ACEPTADOS} onChange={elegirArchivo} style={{ display: "none" }} />
          </label>
        </div>
      ) : (
        <div style={{ marginTop: 26, display: "flex", gap: 16, alignItems: "center" }}>
          <span className="font-data" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{archivo.name}</span>
          <button type="button" onClick={() => setArchivo(null)} style={{ fontSize: 13.5, color: "var(--accent)" }}>Cambiar archivo</button>
        </div>
      )}

      {errorArchivo && (
        <div style={{ marginTop: 14, padding: "14px 18px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)" }}>
          <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-primary)" }}>{errorArchivo}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 18, marginTop: 28 }}>
        <CampoConError label="Fecha de la transferencia" type="date" value={datos.transferDate} onChange={(e) => setDatos((d) => ({ ...d, transferDate: e.target.value }))} error={errores.transferDate} />
        <CampoConError label="Monto transferido" type="number" step="0.01" placeholder="5879.00" value={datos.amount} onChange={(e) => setDatos((d) => ({ ...d, amount: e.target.value }))} error={errores.amount} />
        <CampoConError label="Banco de origen (opcional)" placeholder="Banco Demo" value={datos.originBank} onChange={(e) => setDatos((d) => ({ ...d, originBank: e.target.value }))} />
        <CampoConError label="Clave de rastreo SPEI (opcional)" placeholder="2026091640044200000000" value={datos.speiTrackingKey} onChange={(e) => setDatos((d) => ({ ...d, speiTrackingKey: e.target.value }))} />
      </div>

      {errorGeneral && <p style={{ margin: "18px 0 0", fontSize: 14, color: "var(--danger-text)" }}>{errorGeneral}</p>}

      <div style={{ marginTop: 28 }}>
        <Boton type="submit" tamano="lg" disabled={estado === "subiendo"}>
          {estado === "subiendo" ? "Enviando…" : "Enviar comprobante"}
        </Boton>
      </div>
    </form>
  );
}
