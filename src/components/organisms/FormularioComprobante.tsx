"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { esquemaComprobante } from "@/lib/esquemas/checkout";
import { solicitarSubidaComprobanteAction, confirmarComprobanteAction } from "@/server/actions/comprobantes";
import { formatearPrecio, formatearMontoInput } from "@/lib/formato";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [datos, setDatos] = useState({ transferDate: "", amount: "", originBank: "", speiTrackingKey: "" });
  const [montoConFoco, setMontoConFoco] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"form" | "subiendo" | "hecho">("form");
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Vista previa del archivo elegido, para que la persona confirme que se
  // ve legible antes de mandarlo — antes solo se mostraba el nombre del
  // archivo, a ciegas. `createObjectURL` funciona para jpg/png (no para
  // HEIC/PDF, que el navegador no renderiza directo dentro de un <img>;
  // esos se quedan con el ícono genérico de abajo). Se revoca la URL
  // anterior en cada cambio para no ir acumulando memoria.
  useEffect(() => {
    if (!archivo || !/^image\/(jpeg|png)$/.test(archivo.type)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

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
      <h1 className="cuenta-escritorio-solo" style={{ margin: 0, fontSize: "clamp(26px,2.8vw,36px)" }}>Subir comprobante</h1>
      <p className="cuenta-escritorio-solo" style={{ margin: "10px 0 0", fontSize: 15, color: "var(--text-muted)" }}>
        Pedido <span className="font-data" style={{ color: "var(--text-primary)" }}>{folio}</span> · Importe {formatearPrecio(total)}
      </p>

      {/* Tarjeta de resumen del pedido — mockup `Panel_Usuario_Movil.dc.html`
          (`showUpload`, tarjeta superior). El título "Subir comprobante" ya
          lo da el encabezado móvil; aquí solo va el resumen del pedido. */}
      <div
        className="cuenta-movil-solo"
        style={{ padding: "13px 15px", border: "1px solid #1F3244", background: "#0F1D2B", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
      >
        <span>
          <span style={{ display: "block", fontSize: 12, color: "#9FB2C3" }}>Pedido</span>
          <span style={{ display: "block", marginTop: 2, fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: "#EAF2F8" }}>{folio}</span>
        </span>
        <span style={{ textAlign: "right" }}>
          <span style={{ display: "block", fontSize: 12, color: "#9FB2C3" }}>Importe</span>
          <span style={{ display: "block", marginTop: 2, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 18, color: "#3CE7FF" }}>{formatearPrecio(total)}</span>
        </span>
      </div>

      <div className="cuenta-escritorio-solo">
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
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          {previewUrl ? (
            // Bastante grande a propósito — el objetivo es que la persona
            // pueda confirmar que el texto del comprobante (banco,
            // importe, fecha, clave de rastreo) se alcanza a LEER antes
            // de mandarlo, no solo que reconozca la miniatura. `contain`
            // (no `cover`) para no recortar ningún borde con datos.
            // eslint-disable-next-line @next/next/no-img-element -- vista previa de un archivo local (blob:), next/image no sabe optimizar eso
            <img
              src={previewUrl}
              alt="Vista previa del comprobante que vas a enviar"
              style={{ display: "block", width: "100%", maxWidth: 420, maxHeight: 560, objectFit: "contain", border: "1px solid var(--border)", background: "var(--bg-surface)" }}
            />
          ) : (
            <span style={{ display: "grid", placeItems: "center", width: "100%", maxWidth: 420, minHeight: 140, border: "1px solid var(--border)", background: "var(--bg-surface)", fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 16 }}>
              Sin vista previa para este tipo de archivo
            </span>
          )}
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span className="font-data" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{archivo.name}</span>
            <button type="button" onClick={() => setArchivo(null)} style={{ fontSize: 13.5, color: "var(--accent)" }}>Cambiar archivo</button>
          </div>
        </div>
      )}

      {errorArchivo && (
        <div style={{ marginTop: 14, padding: "14px 18px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)" }}>
          <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-primary)" }}>{errorArchivo}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 18, marginTop: 28 }}>
        <CampoConError label="Fecha de la transferencia" type="date" value={datos.transferDate} onChange={(e) => setDatos((d) => ({ ...d, transferDate: e.target.value }))} error={errores.transferDate} />
        <CampoConError
          label="Monto transferido"
          inputMode="decimal"
          placeholder="5,879.00"
          // El estado (`datos.amount`) siempre se queda como texto plano
          // sin comas — es lo que espera `z.coerce.number()` al enviar.
          // El separador de miles (como el resto de los precios del
          // sitio, `formatearPrecio`) solo se aplica a lo que se VE, y
          // nada más mientras el campo no tiene el foco — reformatear en
          // cada tecleo movería el cursor de lugar mientras se escribe.
          value={montoConFoco ? datos.amount : formatearMontoInput(datos.amount)}
          onFocus={() => setMontoConFoco(true)}
          onBlur={() => setMontoConFoco(false)}
          onChange={(e) => setDatos((d) => ({ ...d, amount: e.target.value.replace(/[^\d.]/g, "") }))}
          error={errores.amount}
        />
        <CampoConError label="Banco de origen (opcional)" placeholder="Banco Demo" value={datos.originBank} onChange={(e) => setDatos((d) => ({ ...d, originBank: e.target.value }))} />
        <CampoConError label="Clave de rastreo SPEI (opcional)" placeholder="2026091640044200000000" value={datos.speiTrackingKey} onChange={(e) => setDatos((d) => ({ ...d, speiTrackingKey: e.target.value }))} />
      </div>
      </div>

      {errorGeneral && <p style={{ margin: "18px 0 0", fontSize: 14, color: "var(--danger-text)" }}>{errorGeneral}</p>}

      <div className="cuenta-escritorio-solo" style={{ marginTop: 28 }}>
        <Boton type="submit" tamano="lg" disabled={estado === "subiendo"}>
          {estado === "subiendo" ? "Enviando…" : "Enviar comprobante"}
        </Boton>
      </div>

      {/* Bloque móvil — traducción literal de `showUpload` en
          `Panel_Usuario_Movil.dc.html`: dropzone con "Elegir archivo" /
          "Tomar foto" (real `capture="environment"`, no un botón decorativo),
          la vista previa REAL ya existente (no el texto genérico del mock,
          que ahí es un dato inventado por no tener archivos reales), los
          mismos 4 campos, y el botón de enviar fijo abajo. */}
      <div className="cuenta-movil-solo">
        {!archivo ? (
          <div style={{ marginTop: 14, padding: "32px 18px", border: "1px dashed #2A3B4D", background: "#0B1622", textAlign: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#3CE7FF" strokeWidth={1.5} style={{ width: 28, height: 28 }}>
              <path d="M12 16V5m0 0-4 4m4-4 4 4" />
              <path d="M5 19h14" />
            </svg>
            <p style={{ margin: "12px 0 0", fontSize: 15.5, color: "#EAF2F8" }}>Elige tu comprobante</p>
            <p style={{ margin: "5px 0 0", fontSize: 13, color: "#9FB2C3" }}>JPG, PNG, HEIC o PDF · máx. {TAMANO_MAXIMO_MB} MB</p>
            <label
              className="clip-corner-md"
              style={{ display: "block", width: "100%", marginTop: 18, padding: 13, border: "1px solid #3CE7FF", color: "#3CE7FF", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 14.5, cursor: "pointer", textAlign: "center" }}
            >
              Elegir archivo
              <input type="file" accept={TIPOS_ACEPTADOS} onChange={elegirArchivo} style={{ display: "none" }} />
            </label>
            <label style={{ display: "block", width: "100%", marginTop: 9, padding: 13, border: "1px solid #1F3244", color: "#EAF2F8", fontSize: 14.5, cursor: "pointer", textAlign: "center" }}>
              Tomar foto
              <input type="file" accept="image/*" capture="environment" onChange={elegirArchivo} style={{ display: "none" }} />
            </label>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa de un archivo local (blob:), next/image no sabe optimizar eso
              <img
                src={previewUrl}
                alt="Vista previa del comprobante que vas a enviar"
                style={{ display: "block", width: "100%", height: 210, objectFit: "cover", border: "1px solid #1F3244", background: "#16283A" }}
              />
            ) : (
              <div style={{ border: "1px solid #1F3244", background: "#16283A", height: 210, display: "grid", placeItems: "center", textAlign: "center", padding: 16 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#7E93A6", lineHeight: 1.7 }}>
                  Sin vista previa para este tipo de archivo
                  <br />
                  {archivo.name} · {(archivo.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#9FB2C3" }}>{archivo.name}</span>
              <button type="button" onClick={() => setArchivo(null)} style={{ fontSize: 13.5, color: "#3CE7FF" }}>Cambiar</button>
            </div>
          </div>
        )}

        {errorArchivo && (
          <div style={{ marginTop: 14, padding: "14px 18px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)" }}>
            <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-primary)" }}>{errorArchivo}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
          <CampoMovil label="Fecha de la transferencia" type="date" value={datos.transferDate} onChange={(e) => setDatos((d) => ({ ...d, transferDate: e.target.value }))} />
          <CampoMovil
            label="Monto transferido"
            inputMode="decimal"
            placeholder="1,289.00"
            value={montoConFoco ? datos.amount : formatearMontoInput(datos.amount)}
            onFocus={() => setMontoConFoco(true)}
            onBlur={() => setMontoConFoco(false)}
            onChange={(e) => setDatos((d) => ({ ...d, amount: e.target.value.replace(/[^\d.]/g, "") }))}
          />
          <CampoMovil label="Banco de origen (opcional)" placeholder="Banco Demo" value={datos.originBank} onChange={(e) => setDatos((d) => ({ ...d, originBank: e.target.value }))} />
          <CampoMovil label="Clave de rastreo SPEI (opcional)" placeholder="2026091640044200000000" value={datos.speiTrackingKey} onChange={(e) => setDatos((d) => ({ ...d, speiTrackingKey: e.target.value }))} />
        </div>

        <div style={{ position: "sticky", bottom: 0, marginTop: 20, padding: "12px 0 calc(12px + env(safe-area-inset-bottom))", background: "#07111CF5", backdropFilter: "blur(8px)", borderTop: "1px solid #16283A" }}>
          <button
            type="submit"
            disabled={estado === "subiendo"}
            className="clip-corner-lg"
            style={{
              width: "100%",
              padding: 16,
              background: "#3CE7FF",
              color: "#07111C",
              fontFamily: "'Chakra Petch',sans-serif",
              fontWeight: 600,
              fontSize: 16,
              boxShadow: "0 0 18px rgba(60,231,255,.3)",
              opacity: estado === "subiendo" ? 0.6 : 1,
            }}
          >
            {estado === "subiendo" ? "Enviando…" : "Enviar comprobante"}
          </button>
        </div>
      </div>
    </form>
  );
}

function CampoMovil({ label, ...resto }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, color: "#9FB2C3", marginBottom: 6 }}>{label}</label>
      <input {...resto} style={{ width: "100%", minHeight: 48, padding: "13px 14px", background: "#0B1622", border: "1px solid #1F3244", color: "#EAF2F8", fontSize: 15.5 }} />
    </div>
  );
}
