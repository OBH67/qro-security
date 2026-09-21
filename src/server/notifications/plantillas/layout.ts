import "server-only";

/**
 * Layout base de los correos transaccionales (H3). Estilos siempre en
 * línea (no `<style>`, no clases): es el único método soportado de forma
 * consistente por los clientes de correo. Fondo claro estándar a
 * propósito — el modo oscuro del sitio no es buena práctica en correo
 * (contraste impredecible según el cliente), solo se reutiliza el acento
 * de marca (`#3CE7FF`) y la tipografía de encabezados.
 */

const ACENTO = "#0EA5B7"; // versión del acento (#3CE7FF) con contraste suficiente sobre blanco
const TEXTO = "#1A2733";
const TEXTO_MUTED = "#5D7080";
const BORDE = "#E2E8EF";

export function envolverCorreo(params: { titulo: string; cuerpoHtml: string; cta?: { texto: string; url: string } }): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#F4F6F8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid ${BORDE};max-width:560px;width:100%;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid ${BORDE};">
                <span style="font-size:15px;font-weight:700;letter-spacing:.5px;color:${TEXTO};">SEGURIDAD GENERAL</span>
                <span style="font-size:12px;letter-spacing:2px;color:${TEXTO_MUTED};display:block;margin-top:2px;">QUERÉTARO</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 18px;font-size:21px;color:${TEXTO};">${params.titulo}</h1>
                <div style="font-size:15px;line-height:1.6;color:${TEXTO};">${params.cuerpoHtml}</div>
                ${
                  params.cta
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr><td style="background:${ACENTO};">
                        <a href="${params.cta.url}" style="display:inline-block;padding:13px 24px;color:#07111C;font-weight:700;font-size:14px;text-decoration:none;">${params.cta.texto}</a>
                      </td></tr></table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${BORDE};font-size:12px;color:${TEXTO_MUTED};">
                Seguridad General Querétaro · Este es un correo automático, no respondas directamente a este mensaje.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function tablaProductos(items: { name: string; qty: number; subtotal: string }[]): string {
  const filas = items
    .map(
      (it) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #E2E8EF;font-size:14px;color:${TEXTO};">${it.name}</td>
         <td style="padding:8px 0;border-bottom:1px solid #E2E8EF;font-size:13px;color:${TEXTO_MUTED};text-align:center;">×${it.qty}</td>
         <td style="padding:8px 0;border-bottom:1px solid #E2E8EF;font-size:14px;color:${TEXTO};text-align:right;">${formatearMoneda(it.subtotal)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${filas}</table>`;
}

export function formatearMoneda(valor: number | string): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
