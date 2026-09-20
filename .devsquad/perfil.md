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
- Tipo: e-commerce B2C/B2B sin pasarela de pago + panel administrativo (ERP ligero:
  pedidos, inventario, catálogo, analítica, devoluciones, solicitudes de servicio).

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
  vive en R2. Estimado de costo con este stack: $0/mes en operación normal,
  con margen amplio antes de empezar a pagar algo.
- Despliegue esperado: Vercel (a confirmar/formalizar en `arquitectura.md`).

Restricciones ya conocidas que la arquitectura debe respetar:
- Catálogo de ~1,000–1,050 SKUs con fotos y especificaciones técnicas.
- Subida y almacenamiento de archivos (comprobantes de pago y fotos de producto).
- Integración saliente con WhatsApp (proveedor por definir).
- Sitio público responsive (no app nativa).
- Sin pasarela de pago.

## Archivos protegidos
No modificar sin autorización explícita de la persona:
- `index.html` — demo visual del sitio público generado en Claude Design.
- `support.js` — runtime del demo de Claude Design.
- `uploads/` — imágenes del demo (incluye el logo).

Estos archivos son **insumo de referencia visual**, no el punto de partida técnico.
La UI del sitio público ya está resuelta ahí y no debe rediseñarse; debe
traducirse a código funcional conservando su lenguaje visual.

## Reglas de negocio no negociables (resumen)
1. No hay pasarela de pago: el pago es por transferencia bancaria y se valida
   manualmente con un comprobante subido por el cliente.
2. Las devoluciones nunca son en efectivo: generan **saldo a favor** (100% si el
   producto está sellado de fábrica, 70% si está abierto o sin empaque original).
3. Al recibirse un comprobante, el administrador debe ser notificado por WhatsApp
   con la imagen del comprobante y los datos del pedido.
4. Los servicios (monitoreo, guardias, financiamiento) no se venden en línea: solo
   generan una solicitud de contacto.
5. Precios del catálogo con IVA incluido.

## Detalle completo del negocio
Ver `docs/contexto-negocio.md` (documento fuente redactado por la dueña del proyecto).
