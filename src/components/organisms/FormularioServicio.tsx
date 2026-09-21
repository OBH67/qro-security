"use client";

import { useState, useTransition } from "react";
import { enviarSolicitudServicioAction } from "@/server/actions/servicios";
import { WidgetTurnstile } from "@/components/molecules/WidgetTurnstile";
import type { TipoServicio } from "@/types/database";

/** index.html:1485-1523 (`srvFormOpen`) — traducción literal de los campos
 * (`srvFields`, index.html:2474-2492). "Usar mi ubicación actual" y el
 * mapa son decorativos en el propio demo (`useLocation: () => this.say(...)`),
 * se mantienen igual — no hay geolocalización real modelada en ningún
 * documento de negocio. */

const ESTADOS = [
  "Querétaro", "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
  "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo",
  "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
] as const;

const HORARIOS = ["9:00 a 12:00", "12:00 a 15:00", "15:00 a 18:00", "Cualquier hora"] as const;
const TIPOS_INMUEBLE = [
  { valor: "casa", etiqueta: "Casa" },
  { valor: "local", etiqueta: "Local" },
  { valor: "oficina", etiqueta: "Oficina" },
  { valor: "bodega", etiqueta: "Bodega" },
  { valor: "industria", etiqueta: "Industria" },
  { valor: "otro", etiqueta: "Otro" },
] as const;
const SERVICIOS_OPCIONES: { valor: TipoServicio; etiqueta: string }[] = [
  { valor: "monitoreo", etiqueta: "Monitoreo de alarmas 24/7" },
  { valor: "guardias", etiqueta: "Guardias de seguridad" },
  { valor: "financiamiento", etiqueta: "Financiamiento y créditos" },
];

const estiloCampo: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "#0B1622", border: "1px solid #1F3244", borderRadius: 4, fontSize: 15, color: "#EAF2F8" };
const estiloEtiqueta: React.CSSProperties = { display: "block", fontSize: 13, color: "#9FB2C3", marginBottom: 6 };

export function FormularioServicio({ servicioInicial }: { servicioInicial?: TipoServicio }) {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientType, setClientType] = useState<"particular" | "negocio" | "empresa">("particular");
  const [serviceType, setServiceType] = useState<TipoServicio>(servicioInicial ?? "monitoreo");
  const [token, setToken] = useState("");
  const [ubicacionMsg, setUbicacionMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (enviado) {
    return (
      <div style={{ padding: 34, border: "1px solid #45E39A", background: "rgba(69,227,154,.05)", textAlign: "center" }}>
        <span style={{ display: "inline-grid", placeItems: "center", width: 58, height: 58, border: "1.5px solid #45E39A", borderRadius: "50%", color: "#45E39A", fontSize: 26 }}>✓</span>
        <h2 style={{ margin: "20px 0 0", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 26, color: "#EAF2F8" }}>Recibimos tu solicitud</h2>
        <p style={{ margin: "12px auto 0", maxWidth: "50ch", fontSize: 16, lineHeight: 1.6, color: "#9FB2C3" }}>Un asesor te contactará en menos de 24 horas.</p>
        <button type="button" onClick={() => setEnviado(false)} style={{ marginTop: 22, fontSize: 14, color: "#3CE7FF" }}>
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formulario = new FormData(e.currentTarget);
        const datos = {
          serviceType,
          clientType,
          fullName: String(formulario.get("fullName") ?? ""),
          phone: String(formulario.get("phone") ?? ""),
          email: String(formulario.get("email") ?? ""),
          state: String(formulario.get("state") ?? ""),
          municipality: String(formulario.get("municipality") ?? ""),
          neighborhood: String(formulario.get("neighborhood") ?? ""),
          addressReference: String(formulario.get("addressReference") ?? ""),
          propertyType: String(formulario.get("propertyType") ?? ""),
          preferredTime: String(formulario.get("preferredTime") ?? ""),
          amount: formulario.get("amount") ? Number(formulario.get("amount")) : undefined,
          termMonths: formulario.get("termMonths") ? Number(formulario.get("termMonths")) : undefined,
          message: String(formulario.get("message") ?? ""),
          sitioWeb: String(formulario.get("sitioWeb") ?? ""),
          turnstileToken: token,
        };
        startTransition(async () => {
          const resultado = await enviarSolicitudServicioAction(datos);
          if (!resultado.ok) {
            setError(resultado.error);
            return;
          }
          setEnviado(true);
        });
      }}
    >
      <h2 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(24px,2.4vw,32px)", color: "#EAF2F8" }}>Solicita información</h2>
      <p style={{ margin: "10px 0 26px", fontSize: 15, color: "#9FB2C3" }}>Para particulares y empresas. Te contactamos en menos de 24 horas.</p>

      <label style={estiloEtiqueta}>Tipo de cliente</label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
        {(["particular", "negocio", "empresa"] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setClientType(n)}
            style={{
              flex: "1 1 110px",
              padding: "13px 16px",
              fontFamily: "'Chakra Petch',sans-serif",
              fontWeight: 500,
              fontSize: 15,
              border: `1px solid ${clientType === n ? "#3CE7FF" : "#1F3244"}`,
              color: clientType === n ? "#3CE7FF" : "#9FB2C3",
              background: clientType === n ? "rgba(60,231,255,.08)" : "transparent",
              textTransform: "capitalize",
            }}
          >
            {n}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
        {/* Honeypot: oculto con CSS, no `type="hidden"` — un bot simple sí lo rellena. */}
        <div style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
          <label htmlFor="sitioWeb">Sitio web</label>
          <input id="sitioWeb" name="sitioWeb" tabIndex={-1} autoComplete="off" />
        </div>

        <div>
          <label style={estiloEtiqueta}>Nombre completo</label>
          <input name="fullName" required placeholder="Mariana López Ríos" style={estiloCampo} />
        </div>
        <div>
          <label style={estiloEtiqueta}>Teléfono</label>
          <input name="phone" required placeholder="442 000 0000" style={estiloCampo} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={estiloEtiqueta}>Correo electrónico</label>
          <input name="email" type="email" required placeholder="mariana.lopez@correo.com" style={estiloCampo} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={estiloEtiqueta}>Servicio de interés</label>
          <select name="serviceType" value={serviceType} onChange={(e) => setServiceType(e.target.value as TipoServicio)} style={estiloCampo}>
            {SERVICIOS_OPCIONES.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={estiloEtiqueta}>Estado</label>
          <select name="state" defaultValue="Querétaro" style={estiloCampo}>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={estiloEtiqueta}>Municipio o ciudad</label>
          <input name="municipality" required defaultValue="Querétaro" style={estiloCampo} />
        </div>
        <div>
          <label style={estiloEtiqueta}>Colonia</label>
          <input name="neighborhood" placeholder="Centro" style={estiloCampo} />
        </div>
        <div>
          <label style={estiloEtiqueta}>Tipo de inmueble</label>
          <select name="propertyType" defaultValue="casa" style={estiloCampo}>
            {TIPOS_INMUEBLE.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={estiloEtiqueta}>Dirección o referencia de ubicación</label>
          <textarea name="addressReference" rows={2} placeholder="Av. Ejemplo 123, entre calle A y calle B" style={{ ...estiloCampo, resize: "vertical" }} />
        </div>
        <div>
          <label style={estiloEtiqueta}>Horario preferido para contactarte</label>
          <select name="preferredTime" defaultValue={HORARIOS[0]} style={estiloCampo}>
            {HORARIOS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        {serviceType === "financiamiento" && (
          <>
            <div>
              <label style={estiloEtiqueta}>Monto aproximado</label>
              <input name="amount" type="number" min={1} step="0.01" placeholder="45000.00" style={estiloCampo} />
            </div>
            <div>
              <label style={estiloEtiqueta}>Plazo deseado</label>
              <select name="termMonths" defaultValue="3" style={estiloCampo}>
                <option value="3">3 meses</option>
                <option value="6">6 meses</option>
                <option value="12">12 meses</option>
              </select>
            </div>
          </>
        )}
        <div style={{ gridColumn: "span 2" }}>
          <label style={estiloEtiqueta}>Mensaje</label>
          <textarea name="message" rows={3} placeholder="Cuéntanos qué necesitas" style={{ ...estiloCampo, resize: "vertical" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, alignItems: "stretch", marginTop: 20, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setUbicacionMsg("Usaríamos tu ubicación actual")}
          style={{ padding: "13px 20px", border: "1px solid #1F3244", color: "#EAF2F8", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 14.5, alignSelf: "flex-start" }}
        >
          Usar mi ubicación actual
        </button>
        {ubicacionMsg && <span style={{ alignSelf: "center", fontSize: 13, color: "#9FB2C3" }}>{ubicacionMsg}</span>}
      </div>

      <div style={{ marginTop: 22 }}>
        <WidgetTurnstile onToken={setToken} />
      </div>

      {error && <p style={{ margin: "16px 0 0", fontSize: 14, color: "#FF4D5E" }}>{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="clip-corner-md"
        style={{
          marginTop: 26,
          padding: "15px 28px",
          background: "#3CE7FF",
          color: "#07111C",
          fontFamily: "'Chakra Petch',sans-serif",
          fontWeight: 600,
          fontSize: 16,
          boxShadow: "0 0 18px rgba(60,231,255,.35)",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
