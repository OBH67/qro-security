# Perfil — DevSquad AI

> Este perfil se creó de forma **inferida** a partir del documento de contexto de
> negocio que la dueña del proyecto redactó. Los campos marcados como
> `(inferido — confirmar)` deben validarse en la siguiente interacción.

## Persona
- Nombre preferido: pendiente de confirmar (contacto: omarbalanzar113@gmail.com)
- Rol: dueña/responsable del proyecto; interlocutora con el cliente final (SG Querétaro)
- Nivel técnico: **intermedio-alto (inferido — confirmar)**. El documento de negocio
  distingue correctamente entre alcance funcional, UI, integraciones y "fuera de
  alcance", y menciona conceptos como API oficial vs. proveedor externo, sobreventa
  y estados de pedido. Trato: directo, sin sobre-explicar lo obvio, pero explicando
  costo/impacto de cada decisión técnica.
- Idioma: español (México)

## Proyecto
- Nombre: Plataforma de ventas en línea — Seguridad General Querétaro (SG Querétaro)
- Carpeta de trabajo: `/home/user/qro-security`
- Rama: `claude/sg-queretaro-sales-platform-6a7359`
- Cliente final: SG Querétaro, distribuidor de equipo de seguridad electrónica,
  Querétaro, México.
- Tipo: e-commerce B2C/B2B con pagos en línea vía Stripe (tarjeta como método
  principal, OXXO y SPEI) y transferencia con comprobante (secundario) + panel
  administrativo (ERP ligero: pedidos, inventario, catálogo, analítica,
  devoluciones, solicitudes de servicio).

## Stack
**DEFINIDO por la dueña del proyecto (2026-09-20):**
- **Frontend + backend:** Next.js (App Router), un solo proyecto full-stack
  (Route Handlers / Server Actions para toda la lógica de servidor: catálogo,
  pedidos, comprobantes, WhatsApp). No se separa un backend en Python/Node —
  la escala del proyecto (~1,050 SKUs, un panel admin, tráfico regional
  bajo-medio) no lo justifica.
- **Base de datos + autenticación:** Supabase (Postgres + Row Level Security
  + Auth).
- **Almacenamiento de archivos** (fotos de producto y comprobantes de pago):
  **Cloudflare R2**, no Supabase Storage — el free tier de Supabase Storage
  (1 GB, 5 GB egress/mes) se queda corto para el catálogo, y R2 no cobra
  egress, lo cual importa porque cada visita al catálogo genera tráfico de
  salida constante. Solo la URL del archivo se guarda en Supabase; el binario
  vive en R2.
- Despliegue: **Vercel**, confirmado en `arquitectura.md` §1.1.
- **Pagos en línea (2026-09-24):** **Stripe** con Payment Element embebido
  (tarjeta, OXXO, SPEI), solo pagos únicos por pedido (nunca suscripciones).
  Arranca en modo prueba. Detalle en `.devsquad/requerimientos-pagos-stripe.md`
  y `.devsquad/arquitectura-pagos-stripe.md`.

> **Corrección de costo (arquitectura, 2026-09-20):** la estimación original de
> "$0/mes" solo aplica **durante el desarrollo**. Para producción, el plan
> gratis de Vercel prohíbe uso comercial y el de Supabase no hace respaldos ni
> mantiene el proyecto activo sin tráfico — hace falta subir ambos a plan de
> pago antes de lanzar, más un dominio propio. Costo real de producción:
> **~$45–47 USD/mes** (Vercel Pro $20 + Supabase Pro $25 + dominio ~$15/año).
> R2 y el resto del stack sí se mantienen en $0. Detalle completo y
> justificación en `.devsquad/arquitectura.md` §11.2 y §14 (AR-1 a AR-3).
> **Actualización (2026-09-24):** Stripe no tiene cuota mensual fija, pero
> agrega una comisión por cada pago (tarjeta ~3.6% + $3 MXN + IVA; OXXO/SPEI
> con tarifa propia), absorbida por el negocio. Ver
> `.devsquad/arquitectura-pagos-stripe.md` §8.

Restricciones ya conocidas que la arquitectura debe respetar:
- Catálogo de ~1,000–1,050 SKUs con fotos y especificaciones técnicas.
- Subida y almacenamiento de archivos (comprobantes de pago y fotos de producto).
- Integración saliente con WhatsApp (proveedor por definir).
- Sitio público responsive (no app nativa).
- Pagos: Stripe (tarjeta, OXXO, SPEI) + transferencia con comprobante,
  desacoplados con patrón Strategy. Ningún dato de tarjeta toca el backend propio.

## Archivos protegidos
No modificar sin autorización explícita de la persona:
- `index.html` — demo visual del sitio público generado en Claude Design.
- `support.js` — runtime del demo de Claude Design.
- `uploads/` — imágenes del demo (incluye el logo).
- `panel-admin-maqueta.html` — maqueta visual interactiva del panel administrativo,
  construida en esta sesión a partir de `.devsquad/diseño.md` y aprobada por la
  dueña del proyecto (2026-09-20). Mismo estatus que `index.html`: es la
  referencia del panel, no un borrador.

**Regla de traducción a código (2026-09-20, instrucción explícita de la dueña):**
estos dos HTML (`index.html` para el sitio público, `panel-admin-maqueta.html`
para el panel) son la fuente de verdad del frontend, no una inspiración. El
coder traduce **literalmente** su estructura, clases, estilos inline, colores,
tipografías y layout a componentes de Next.js — es un copy-paste de HTML a
JSX/React, no una reinterpretación. **Nada del frontend se crea por
asunción**: si una pantalla, estado o componente no está en uno de estos dos
archivos (o en las secciones de `diseño.md` que los documentan, para los
estados/casos que el HTML no puede mostrar todos a la vez — cargando, error,
vacío), no se inventa: se marca como pendiente y se pregunta antes de
construirlo. Ambos archivos usan el mismo formato de componente
(`support.js` + `class Component extends DCLogic`) — el coder no ejecuta ese
runtime, lee el HTML/CSS resultante como referencia exacta de marcado y
estilo.

## Reglas de negocio no negociables (resumen)
1. Métodos de pago (2026-09-24): **tarjeta vía Stripe** (principal,
   preseleccionado), **OXXO** y **SPEI** vía Stripe, y **transferencia con
   comprobante** validado manualmente. En todos los casos un humano aprueba el
   pago antes de pasar a "Listo para envío" (RN-11).
2. Las devoluciones nunca son en efectivo ni reembolso a tarjeta: generan
   **saldo a favor**; el admin elige el porcentaje (10%–100%) al aprobar.
3. Al recibirse un comprobante, el administrador debe ser notificado por WhatsApp
   con la imagen del comprobante y los datos del pedido.
4. Los servicios (monitoreo, guardias, financiamiento) no se venden en línea: solo
   generan una solicitud de contacto.
5. Precios del catálogo con IVA incluido.

## Detalle completo del negocio
Ver `docs/contexto-negocio.md` (documento fuente redactado por la dueña del proyecto).
