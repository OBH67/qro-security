# Estado del proyecto — SG Querétaro

Carpeta de trabajo: `/home/user/qro-security`
Rama: `claude/sg-queretaro-sales-platform-6a7359`
Última actualización: 2026-09-19

## Fase actual
**Requerimientos completados. En espera de decisiones de la dueña del proyecto para iniciar arquitectura.**

## Progreso por fases

- [x] **Inicialización** — perfil creado de forma inferida en `.devsquad/perfil.md` (campos marcados "confirmar" pendientes de validación).
- [x] **Contexto de negocio** — documento de la dueña guardado en `docs/contexto-negocio.md`.
- [x] **Requerimientos (BSA)** — `.devsquad/requerimientos.md`: 8 épicas, 27 historias con criterios de aceptación, 10 reglas de negocio, requisitos no funcionales, alcance V1/V1.5/Futuro, 11 preguntas abiertas y matriz de riesgos.
- [x] **Modelo de datos** — `.devsquad/modelo-datos.md`: esquema completo derivado de una revisión a fondo de la dummy data de `index.html`, con 20 hallazgos que el documento de negocio no cubría, 5 decisiones de modelado con su trade-off, políticas de RLS y rutas de archivos en R2.
- [ ] **Arquitectura** — Stack y modelo de datos ya definidos; falta formalizar `arquitectura.md` (estructura de carpetas, capas, variables de entorno, atributos no funcionales).
- [ ] **Diseño de UI del panel administrativo** — el sitio público ya tiene diseño (demo de Claude Design); el panel admin no. Se hace después de arquitectura y antes de código.
- [ ] **Preparación del entorno** — pendiente (skill `preparar-entorno`), justo antes de implementar.
- [ ] **Implementación** — pendiente.

## Decisiones ya tomadas (no volver a preguntar)

1. Sin pasarela de pago: transferencia + comprobante validado manualmente.
2. Devoluciones = saldo a favor (100% sellado / 70% abierto), nunca efectivo.
3. Sitio web responsive; no hay app nativa.
4. Sin facturación automática vía PAC; solo se capturan datos fiscales.
5. El demo visual del sitio público (`index.html`, `support.js`, `uploads/`) es referencia intocable; no se rediseña ni se modifica.
6. La carga masiva de catálogo (CSV/Excel) es parte de V1, no opcional: con ~1,050 SKUs la captura manual es inviable.
7. La notificación por WhatsApp se diseña como capa intercambiable, con correo funcionando desde el día 1 para no bloquear el lanzamiento.
8. **Stack técnico (2026-09-20):** Next.js full-stack (frontend + backend en
   un solo proyecto, sin backend separado en Python/Node) + Supabase
   (Postgres + Auth) + Cloudflare R2 (fotos de producto y comprobantes de
   pago, no Supabase Storage). Costo estimado: $0/mes en operación normal.
9. **Descuento de inventario (2026-09-20):** el stock baja cuando el
   administrador marca el pedido como **"Enviado"**, no al generar el pedido
   ni al validar el comprobante. Para evitar sobreventa, el catálogo muestra
   stock disponible = stock físico − piezas de pedidos pagados sin enviar.
10. **Validación de pago por correo (2026-09-20):** además del panel, el
    administrador puede confirmar el pago desde un enlace en el correo. Debe
    ser un token de un solo uso, con vencimiento y guardado como hash.
11. **Roles (2026-09-20):** dos roles — `admin` (acceso total) e
    `inventario` (solo carga y edición de productos/stock).
12. **Envío (2026-09-20):** el asesor confirma el envío y en ese acto marca
    el pedido como "Enviado". El costo de envío no se calcula en línea;
    `orders.shipping_cost` queda nulo hasta que el asesor lo captura.

## Nota de sesión

Esta sesión corrió sin la herramienta de delegación a subagentes disponible, por lo
que la fase de BSA se ejecutó directamente por el orquestador siguiendo la skill
`descubrimiento-requerimientos`. Si en una sesión futura la delegación está
disponible, el arquitecto debe recibir explícitamente las secciones "Stack" y
"Archivos protegidos" de `.devsquad/perfil.md`.

## Próxima sesión

### Qué se completó
Perfil inferido, contexto de negocio versionado en el repo y documento de
requerimientos completo listo para arquitectura.

### Qué falta
Elegir stack, responder las 4 preguntas bloqueantes y ejecutar la fase de
arquitectura (`arquitectura.md`), luego diseño del panel admin, entorno y código.

### Tareas manuales de la persona mientras tanto
1. Leer `.devsquad/requerimientos.md`, en especial la sección 7 (alcance V1) y la 8 (preguntas abiertas), y marcar lo que no coincida con su entendimiento.
2. Confirmar o corregir los campos "(inferido — confirmar)" de `.devsquad/perfil.md`.
3. Preguntar al cliente final: PA-11 (¿existe ya el catálogo en Excel o en algún sistema?) — es lo que más puede mover la fecha de lanzamiento.
4. Iniciar el trámite de WhatsApp Business API (número dedicado + verificación del negocio): tarda días o semanas y no depende del código.
5. Conseguir los datos bancarios oficiales de SG Querétaro y los textos legales (aviso de privacidad, términos, política de devoluciones).
6. Recuperar `prompt-claude-design-sg-queretaro.md` si existe: se referencia en el contexto de negocio pero no está en el repositorio, y le sería muy útil al diseñador del panel admin.
