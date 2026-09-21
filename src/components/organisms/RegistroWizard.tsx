"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { esquemaRegistro } from "@/lib/esquemas/registro";
import { esquemaDireccion } from "@/lib/esquemas/direccion";
import { esquemaDatosFiscales, REGIMENES_FISCALES, USOS_CFDI } from "@/lib/esquemas/datosFiscales";
import { registrarCliente, iniciarSesion } from "@/server/actions/cuenta";
import { guardarDireccion } from "@/server/actions/direcciones";
import { guardarDatosFiscales } from "@/server/actions/datosFiscales";
import { CampoConError } from "@/components/molecules/CampoConError";
import { Boton } from "@/components/atoms/Boton";
import { useCarrito } from "@/components/providers/CarritoProvider";

/** index.html:950-1023 (`isRegister`) — asistente de 3 pasos: datos de
 * contacto (B2.1), dirección de envío (B3.1) y facturación opcional
 * (B3.2/B3.3), traducido literalmente en estructura y progreso visual.
 * El demo no persiste nada real; aquí cada paso escribe de verdad al
 * terminar (registro → Auth, dirección y datos fiscales → Server Actions
 * ya autenticadas con la sesión recién creada). */

type PasoRegistro = 1 | 2 | 3;

const ETIQUETAS_PASO: Record<PasoRegistro, string> = {
  1: "Datos de contacto",
  2: "Dirección de envío",
  3: "Facturación (opcional)",
};

export function RegistroWizard() {
  const router = useRouter();
  const carrito = useCarrito();
  const [paso, setPaso] = useState<PasoRegistro>(1);
  const [quiereFactura, setQuiereFactura] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const [contacto, setContacto] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [direccion, setDireccion] = useState({
    label: "Casa", street: "", extNumber: "", intNumber: "", postalCode: "",
    neighborhood: "", municipality: "", state: "", recipientName: "", directions: "",
  });
  const [fiscal, setFiscal] = useState<{ rfc: string; legalName: string; taxRegime: string; cfdiUse: string; postalCode: string }>({
    rfc: "", legalName: "", taxRegime: REGIMENES_FISCALES[0], cfdiUse: USOS_CFDI[0], postalCode: "",
  });

  function campo<T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, clave: keyof T) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setter((d) => ({ ...d, [clave]: e.target.value }));
  }

  async function avanzar() {
    setErrorGeneral(null);
    if (paso === 1) {
      const parseo = esquemaRegistro.safeParse(contacto);
      if (!parseo.success) {
        setErrores(Object.fromEntries(parseo.error.issues.map((i) => [String(i.path[0]), i.message])));
        return;
      }
      setErrores({});
      setPaso(2);
      window.scrollTo(0, 0);
      return;
    }
    if (paso === 2) {
      const parseo = esquemaDireccion.safeParse({ ...direccion, isDefault: true });
      if (!parseo.success) {
        setErrores(Object.fromEntries(parseo.error.issues.map((i) => [String(i.path[0]), i.message])));
        return;
      }
      setErrores({});
      setPaso(3);
      window.scrollTo(0, 0);
      return;
    }

    // Paso 3: crear la cuenta y, si aplica, guardar dirección/facturación.
    if (quiereFactura) {
      const parseoFiscal = esquemaDatosFiscales.safeParse({ ...fiscal, isDefault: true });
      if (!parseoFiscal.success) {
        setErrores(Object.fromEntries(parseoFiscal.error.issues.map((i) => [String(i.path[0]), i.message])));
        return;
      }
    }

    setEnviando(true);
    const registro = await registrarCliente(contacto);
    if (!registro.ok) {
      setErrorGeneral(registro.error);
      setEnviando(false);
      return;
    }

    // §9.9: la verificación de correo no bloquea la compra — si Auth no
    // regresó sesión activa (proyecto configurado para exigir confirmación),
    // se intenta iniciar sesión directo con la contraseña recién creada.
    if (registro.data.requiereVerificacion) {
      await iniciarSesion({ email: contacto.email, password: contacto.password });
    }

    const [resultadoDireccion, resultadoFiscal] = await Promise.all([
      guardarDireccion({ ...direccion, isDefault: true }),
      quiereFactura ? guardarDatosFiscales({ ...fiscal, isDefault: true }) : Promise.resolve(null),
    ]);
    if (!resultadoDireccion.ok) {
      // La cuenta ya se creó; no se pierde el registro por un error al
      // guardar la dirección — el cliente la agrega después en Mi cuenta.
      setErrorGeneral("Tu cuenta se creó, pero no pudimos guardar tu dirección. Agrégala desde Mi cuenta.");
    }
    if (resultadoFiscal && !resultadoFiscal.ok) {
      setErrorGeneral((prev) => prev ?? "Tu cuenta se creó, pero no pudimos guardar tus datos fiscales.");
    }

    await carrito.fusionarTrasLogin();
    setEnviando(false);
    router.push(carrito.cantidadTotal > 0 ? "/pagar" : "/mi-cuenta/pedidos");
    router.refresh();
  }

  return (
    <section style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px 90px" }}>
      <h1 style={{ margin: 0, fontSize: "clamp(28px,3vw,40px)" }}>Crear cuenta</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "28px 0 34px", flexWrap: "wrap" }}>
        {([1, 2, 3] as PasoRegistro[]).map((n) => (
          <span key={n} style={{ display: "flex", gap: 10, alignItems: "center", flex: "1 1 200px" }}>
            <span
              className="font-data"
              style={{
                width: 30, height: 30, flex: "0 0 auto", display: "grid", placeItems: "center", fontSize: 13,
                border: `1px solid ${paso >= n ? "var(--accent)" : "var(--border-subtle)"}`,
                color: paso >= n ? "var(--accent)" : "var(--text-disabled)",
                background: paso === n ? "var(--bg-hover)" : "transparent",
              }}
            >
              {n}
            </span>
            <span style={{ fontSize: 13.5, color: paso >= n ? "var(--text-primary)" : "var(--text-disabled)" }}>{ETIQUETAS_PASO[n]}</span>
            {n < 3 && <span style={{ flex: 1, height: 1, minWidth: 20, background: paso > n ? "var(--accent)" : "var(--border-subtle)" }} />}
          </span>
        ))}
      </div>

      <h2 style={{ margin: "0 0 20px", fontSize: 24 }}>{ETIQUETAS_PASO[paso]}</h2>

      {paso === 3 && (
        <button
          type="button"
          onClick={() => setQuiereFactura((v) => !v)}
          style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", textAlign: "left", padding: 18, border: "1px solid var(--border)", background: "var(--bg-card)", marginBottom: 22 }}
        >
          <InterruptorVisual activo={quiereFactura} />
          <span>
            <span style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>Quiero factura</span>
            <span style={{ display: "block", marginTop: 3, fontSize: 13.5, color: "var(--text-muted)" }}>Puedes activarla después desde Mi cuenta.</span>
          </span>
        </button>
      )}

      {(paso < 3 || quiereFactura) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {paso === 1 && (
            <>
              <CampoConError label="Nombre(s)" placeholder="Mariana" value={contacto.firstName} onChange={campo(setContacto, "firstName")} error={errores.firstName} />
              <CampoConError label="Apellidos" placeholder="López Ríos" value={contacto.lastName} onChange={campo(setContacto, "lastName")} error={errores.lastName} />
              <div style={{ gridColumn: "span 2" }}>
                <CampoConError label="Correo electrónico" type="email" placeholder="mariana.lopez@correo.com" value={contacto.email} onChange={campo(setContacto, "email")} error={errores.email} />
              </div>
              <CampoConError label="Teléfono celular" placeholder="442 000 0000" hint="10 dígitos" value={contacto.phone} onChange={campo(setContacto, "phone")} error={errores.phone} />
              <CampoConError label="Contraseña" type="password" value={contacto.password} onChange={campo(setContacto, "password")} error={errores.password} />
              <CampoConError label="Confirmar contraseña" type="password" value={contacto.confirmPassword} onChange={campo(setContacto, "confirmPassword")} error={errores.confirmPassword} />
            </>
          )}
          {paso === 2 && (
            <>
              <div style={{ gridColumn: "span 2" }}>
                <CampoConError label="Calle" placeholder="Av. Ejemplo" value={direccion.street} onChange={campo(setDireccion, "street")} error={errores.street} />
              </div>
              <CampoConError label="Número exterior" placeholder="123" value={direccion.extNumber} onChange={campo(setDireccion, "extNumber")} error={errores.extNumber} />
              <CampoConError label="Número interior (opcional)" placeholder="Depto. 4" value={direccion.intNumber} onChange={campo(setDireccion, "intNumber")} />
              <CampoConError label="Código postal" placeholder="76000" hint="Al escribirlo, confirma estado y municipio" value={direccion.postalCode} onChange={campo(setDireccion, "postalCode")} error={errores.postalCode} />
              <CampoConError label="Colonia" value={direccion.neighborhood} onChange={campo(setDireccion, "neighborhood")} error={errores.neighborhood} />
              <CampoConError label="Municipio" placeholder="Querétaro" value={direccion.municipality} onChange={campo(setDireccion, "municipality")} error={errores.municipality} />
              <CampoConError label="Estado" placeholder="Querétaro" value={direccion.state} onChange={campo(setDireccion, "state")} error={errores.state} />
              <div style={{ gridColumn: "span 2" }}>
                <CampoConError label="Nombre de quien recibe" placeholder="Mariana López Ríos" value={direccion.recipientName} onChange={campo(setDireccion, "recipientName")} error={errores.recipientName} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <CampoConError label="Referencias para el repartidor" placeholder="Portón negro, entre farmacia y papelería" value={direccion.directions} onChange={campo(setDireccion, "directions")} />
              </div>
            </>
          )}
          {paso === 3 && quiereFactura && (
            <>
              <CampoConError label="RFC" placeholder="XAXX010101000" value={fiscal.rfc} onChange={campo(setFiscal, "rfc")} error={errores.rfc} />
              <CampoConError label="Nombre o razón social" placeholder="Mariana López Ríos" value={fiscal.legalName} onChange={campo(setFiscal, "legalName")} error={errores.legalName} />
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Régimen fiscal</label>
                <select
                  value={fiscal.taxRegime}
                  onChange={(e) => setFiscal((f) => ({ ...f, taxRegime: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", color: "var(--text-primary)", fontSize: 15 }}
                >
                  {REGIMENES_FISCALES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Uso de CFDI</label>
                <select
                  value={fiscal.cfdiUse}
                  onChange={(e) => setFiscal((f) => ({ ...f, cfdiUse: e.target.value }))}
                  style={{ width: "100%", padding: "11px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", color: "var(--text-primary)", fontSize: 15 }}
                >
                  {USOS_CFDI.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <CampoConError label="Código postal fiscal" placeholder="76000" value={fiscal.postalCode} onChange={campo(setFiscal, "postalCode")} error={errores.postalCode} />
            </>
          )}
        </div>
      )}

      {paso === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26 }}>
          <button type="button" onClick={() => setAcepta((v) => !v)} style={{ display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", fontSize: 14, color: "var(--text-muted)" }}>
            <CasillaVisual marcada={acepta} />
            <span>
              Acepto el <a href="/legal/privacidad" style={{ color: "var(--accent)" }}>Aviso de privacidad</a> y los{" "}
              <a href="/legal/terminos" style={{ color: "var(--accent)" }}>Términos y condiciones</a>.
            </span>
          </button>
        </div>
      )}

      {errorGeneral && <p style={{ margin: "18px 0 0", fontSize: 13.5, color: "var(--danger-text)" }}>{errorGeneral}</p>}

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 32, flexWrap: "wrap" }}>
        {paso > 1 && (
          <Boton variante="secundaria" onClick={() => setPaso((p) => (p - 1) as PasoRegistro)}>
            Volver
          </Boton>
        )}
        <Boton onClick={avanzar} disabled={enviando || (paso === 3 && !acepta)} tamano="lg">
          {enviando ? "Un momento…" : paso === 3 ? "Crear cuenta" : "Continuar"}
        </Boton>
        <a href="/ingresar" style={{ fontSize: 14, color: "var(--text-muted)" }}>Ya tengo cuenta</a>
      </div>
    </section>
  );
}

function InterruptorVisual({ activo }: { activo: boolean }) {
  return (
    <span style={{ position: "relative", width: 46, height: 26, flex: "0 0 auto", borderRadius: 13, border: `1px solid ${activo ? "var(--accent)" : "var(--border-subtle)"}`, background: activo ? "var(--bg-hover)" : "var(--bg-surface)" }}>
      <span style={{ position: "absolute", top: 3, left: activo ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: activo ? "var(--accent)" : "var(--text-disabled)", transition: "left .18s" }} />
    </span>
  );
}

function CasillaVisual({ marcada }: { marcada: boolean }) {
  return (
    <span
      style={{
        width: 18, height: 18, borderRadius: 3, flex: "0 0 auto", display: "grid", placeItems: "center",
        border: `1px solid ${marcada ? "var(--accent)" : "var(--border-subtle)"}`,
        background: marcada ? "var(--accent)" : "transparent", color: "var(--bg-base)", fontSize: 12,
      }}
    >
      {marcada && "✓"}
    </span>
  );
}
