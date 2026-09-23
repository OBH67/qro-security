"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarDatosBancariosAction, guardarContactoAction, guardarPlazosAction, enviarCorreoPruebaAction } from "@/server/actions/admin/configuracion";
import { validarClabe, agruparClabe } from "@/lib/clabe";
import { formatearPrecio } from "@/lib/formato";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import type { ConfiguracionAdmin, UltimaModificacionSeccion } from "@/server/db/queries/admin/configuracion";

function textoUltimaModificacion(u: UltimaModificacionSeccion | null): string | null {
  if (!u) return null;
  const fecha = new Date(u.cuando);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  const hora = fecha.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  const dia = esHoy ? "hoy" : fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  return `Última modificación: ${dia} ${hora} por ${u.quien}`;
}

/** panel-admin-maqueta.html:960-1013 (`isConfiguracion`) — traducción
 * literal: 3 secciones que se guardan por separado (diseño.md §11.13:
 * "un error en los plazos no impide guardar lo bancario"). */
export function ConfiguracionForm({
  configuracion,
  ultimaModificacion,
}: {
  configuracion: ConfiguracionAdmin;
  ultimaModificacion: { bancarios: UltimaModificacionSeccion | null; contacto: UltimaModificacionSeccion | null; plazos: UltimaModificacionSeccion | null };
}) {
  const router = useRouter();

  const [bankName, setBankName] = useState(configuracion.bankName ?? "");
  const [beneficiary, setBeneficiary] = useState(configuracion.beneficiary ?? "");
  const [clabe, setClabe] = useState(configuracion.clabe ?? "");
  const [accountNumber, setAccountNumber] = useState(configuracion.accountNumber ?? "");
  const [guardandoBancarios, startBancarios] = useTransition();
  const [errorBancarios, setErrorBancarios] = useState<string | null>(null);
  const [okBancarios, setOkBancarios] = useState(false);

  const [adminEmail, setAdminEmail] = useState(configuracion.adminEmail ?? "");
  const [adminWhatsapp, setAdminWhatsapp] = useState(configuracion.adminWhatsapp ?? "");
  const [guardandoContacto, startContacto] = useTransition();
  const [errorContacto, setErrorContacto] = useState<string | null>(null);
  const [okContacto, setOkContacto] = useState(false);
  const [enviandoPrueba, startPrueba] = useTransition();
  const [pruebaEnviada, setPruebaEnviada] = useState(false);

  const [returnWindowDays, setReturnWindowDays] = useState(configuracion.returnWindowDays ?? "30");
  const [orderAutoCancelDays, setOrderAutoCancelDays] = useState(configuracion.orderAutoCancelDays ?? "3");
  const [guardandoPlazos, startPlazos] = useTransition();
  const [errorPlazos, setErrorPlazos] = useState<string | null>(null);
  const [okPlazos, setOkPlazos] = useState(false);

  const clabeDigitada = clabe.trim();
  const validacionClabe = useMemo(() => (clabeDigitada ? validarClabe(clabeDigitada) : { valida: false, error: null }), [clabeDigitada]);

  function guardarBancarios() {
    setErrorBancarios(null);
    setOkBancarios(false);
    startBancarios(async () => {
      const resultado = await guardarDatosBancariosAction({ bankName, beneficiary, clabe: clabeDigitada, accountNumber });
      if (!resultado.ok) {
        setErrorBancarios(resultado.error);
        return;
      }
      setOkBancarios(true);
      router.refresh();
    });
  }

  function guardarContacto() {
    setErrorContacto(null);
    setOkContacto(false);
    startContacto(async () => {
      const resultado = await guardarContactoAction({ adminEmail, adminWhatsapp });
      if (!resultado.ok) {
        setErrorContacto(resultado.error);
        return;
      }
      setOkContacto(true);
      router.refresh();
    });
  }

  function enviarPrueba() {
    setPruebaEnviada(false);
    startPrueba(async () => {
      const resultado = await enviarCorreoPruebaAction(adminEmail);
      if (!resultado.ok) {
        setErrorContacto(resultado.error);
        return;
      }
      setPruebaEnviada(true);
    });
  }

  function guardarPlazos() {
    setErrorPlazos(null);
    setOkPlazos(false);
    startPlazos(async () => {
      const resultado = await guardarPlazosAction({ returnWindowDays: Number(returnWindowDays), orderAutoCancelDays: Number(orderAutoCancelDays) });
      if (!resultado.ok) {
        setErrorPlazos(resultado.error);
        return;
      }
      setOkPlazos(true);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 20, maxWidth: 900 }}>
      <div style={{ position: "sticky", top: 20, height: "fit-content", display: "flex", flexDirection: "column", gap: 2 }}>
        <a href="#config-bancarios" style={{ fontSize: 13, padding: "8px 10px", color: "var(--accent)", borderLeft: "2px solid var(--accent)", background: "var(--bg-card)" }}>
          Datos bancarios
        </a>
        <a href="#config-contacto" style={{ fontSize: 13, padding: "8px 10px", color: "var(--text-muted)", borderLeft: "2px solid transparent" }}>
          Contacto
        </a>
        <a href="#config-plazos" style={{ fontSize: 13, padding: "8px 10px", color: "var(--text-muted)", borderLeft: "2px solid transparent" }}>
          Plazos
        </a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="tarjeta" id="config-bancarios" style={{ padding: 22 }}>
          <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: "0 0 12px" }}>Datos bancarios</h2>
          <div style={{ fontSize: 13, color: "var(--warning)", background: "var(--warning-tint)", border: "1px solid var(--warning)", padding: "10px 12px", marginBottom: 16 }}>
            ⚠ Estos datos se le muestran al cliente al generar su pedido. Un error aquí significa transferencias a una cuenta equivocada. Revísalos dos veces.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Banco *</label>
              <input className="campo" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Beneficiario *</label>
              <input className="campo" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 8 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>CLABE interbancaria *</label>
              <input className="campo mono" value={clabe} onChange={(e) => setClabe(e.target.value.replace(/\D/g, "").slice(0, 18))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Número de cuenta</label>
              <input className="campo mono" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>
          </div>
          {clabeDigitada && (
            <div style={{ fontSize: 12, color: validacionClabe.valida ? "var(--success)" : "var(--danger-text)", marginBottom: 18 }}>
              {validacionClabe.valida ? "✓ 18 dígitos · dígito verificador correcto" : validacionClabe.error}
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Vista previa de lo que verá el cliente:</div>
          <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border)", padding: 14, fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
            <FilaVistaPrevia label="Banco" valor={bankName || "—"} />
            <FilaVistaPrevia label="Beneficiario" valor={beneficiary || "—"} />
            <FilaVistaPrevia label="CLABE" valor={validacionClabe.valida ? agruparClabe(clabeDigitada) : clabeDigitada || "—"} mono />
            <FilaVistaPrevia label="Referencia" valor="SGQ-7K4M2X" mono />
            <FilaVistaPrevia label="Importe" valor={formatearPrecio(5879)} mono />
          </div>
          {errorBancarios && <p style={{ fontSize: 13, color: "var(--danger-text)", marginTop: 14 }}>{errorBancarios}</p>}
          {okBancarios && !errorBancarios && <p style={{ fontSize: 13, color: "var(--success)", marginTop: 14 }}>Datos bancarios guardados.</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{textoUltimaModificacion(ultimaModificacion.bancarios)}</span>
            <BotonAdmin
              className="cut cut-10"
              onClick={guardarBancarios}
              disabled={Boolean(clabeDigitada) && !validacionClabe.valida}
              cargando={guardandoBancarios}
              textoCargando="Guardando…"
            >
              Guardar datos bancarios
            </BotonAdmin>
          </div>
        </div>

        <div className="tarjeta" id="config-contacto" style={{ padding: 22 }}>
          <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: "0 0 12px" }}>Contacto del administrador</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Correo para avisos *</label>
              <input className="campo" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>WhatsApp para avisos</label>
              <input className="campo mono" value={adminWhatsapp} onChange={(e) => setAdminWhatsapp(e.target.value)} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Aquí llegan los avisos de comprobante recibido y las solicitudes de servicio.</div>
          {errorContacto && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 12 }}>{errorContacto}</p>}
          {okContacto && !errorContacto && <p style={{ fontSize: 13, color: "var(--success)", marginBottom: 12 }}>Contacto guardado.</p>}
          {pruebaEnviada && <p style={{ fontSize: 13, color: "var(--success)", marginBottom: 12 }}>Correo de prueba enviado a {adminEmail}.</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{textoUltimaModificacion(ultimaModificacion.contacto)}</span>
            <div style={{ display: "flex", gap: 10 }}>
              <BotonAdmin
                variante="fantasma"
                className="cut cut-10"
                onClick={enviarPrueba}
                disabled={!adminEmail.trim()}
                cargando={enviandoPrueba}
                textoCargando="Enviando…"
              >
                Enviarme un correo de prueba
              </BotonAdmin>
              <BotonAdmin className="cut cut-10" onClick={guardarContacto} cargando={guardandoContacto} textoCargando="Guardando…">
                Guardar contacto
              </BotonAdmin>
            </div>
          </div>
        </div>

        <div className="tarjeta" id="config-plazos" style={{ padding: 22 }}>
          <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: "0 0 12px" }}>Plazos</h2>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Días para solicitar una devolución</label>
            <input className="campo mono" style={{ width: 100, display: "inline-block" }} type="number" min={1} value={returnWindowDays} onChange={(e) => setReturnWindowDays(e.target.value)} />{" "}
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>días desde que se entrega el pedido</span>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Días para cancelar un pedido no pagado</label>
            <input className="campo mono" style={{ width: 100, display: "inline-block" }} type="number" min={1} value={orderAutoCancelDays} onChange={(e) => setOrderAutoCancelDays(e.target.value)} />{" "}
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>días desde que se genera el pedido</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Se envía un recordatorio por correo el día 2.</div>
          {errorPlazos && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 12 }}>{errorPlazos}</p>}
          {okPlazos && !errorPlazos && <p style={{ fontSize: 13, color: "var(--success)", marginBottom: 12 }}>Plazos guardados.</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{textoUltimaModificacion(ultimaModificacion.plazos)}</span>
            <BotonAdmin className="cut cut-10" onClick={guardarPlazos} cargando={guardandoPlazos} textoCargando="Guardando…">
              Guardar plazos
            </BotonAdmin>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilaVistaPrevia({ label, valor, mono }: { label: string; valor: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className={mono ? "mono" : undefined}>{valor}</span>
    </div>
  );
}
