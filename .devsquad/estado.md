# Estado del proyecto — SG Querétaro

Carpeta de trabajo: `/home/user/qro-security`
Rama: `claude/sg-queretaro-sales-platform-6a7359`
Última actualización: 2026-09-19

## Fase actual
**Diseño de UI del panel completado y aprobado por la dueña del proyecto (2026-09-20). Sigue preparación del entorno antes de implementar.**

## Progreso por fases

- [x] **Inicialización** — perfil creado de forma inferida en `.devsquad/perfil.md` (campos marcados "confirmar" pendientes de validación).
- [x] **Contexto de negocio** — documento de la dueña guardado en `docs/contexto-negocio.md`.
- [x] **Requerimientos (BSA)** — `.devsquad/requerimientos.md`: 8 épicas, 27 historias con criterios de aceptación, 10 reglas de negocio, requisitos no funcionales, alcance V1/V1.5/Futuro, 11 preguntas abiertas y matriz de riesgos.
- [x] **Modelo de datos** — `.devsquad/modelo-datos.md`: esquema completo derivado de una revisión a fondo de `index.html`, con 20 hallazgos que el documento de negocio no cubría, 5 decisiones de modelado con su trade-off, políticas de RLS y rutas de archivos en R2. **La data del demo es dummy:** solo prueba qué campos necesita la interfaz, nunca volúmenes, marcas ni contenidos reales del catálogo.
- [x] **Arquitectura** — `.devsquad/arquitectura.md`: monolito modular en capas, estructura de carpetas completa, tres clientes de Supabase (con 4 candados sobre la service role key), dos buckets en R2, notificaciones con patrón outbox, 9 decisiones de arquitectura con su trade-off (la central: `products.reserved` + función SQL con `FOR UPDATE` para cero sobreventas), 28 variables de entorno, ANF inferidos, y costo real de producción corregido: **~$45–47 USD/mes** (Vercel Pro $20 + Supabase Pro $25 + dominio ~$15/año), no $0 como se había estimado — el desarrollo sí es $0.
- [x] **Diseño de UI del panel administrativo** — `.devsquad/diseño.md` (1885 líneas): tokens heredados del demo del sitio público con 3 correcciones de contraste WCAG AA, navegación por rol, Atomic Design, y las 13 pantallas con sus estados. Incluye el tablero completo (G2, adelantado a V1 el 2026-09-20) con 6 gráficas justificadas y paleta de datos separada de los colores semánticos de estado. **Aprobado por la dueña (2026-09-20).**
- [x] **Maqueta visual interactiva (Artifact)** — construida sobre `diseño.md`: Login, Tablero completo, Pedidos, Detalle de pedido (normal y variante RN-11), Catálogo, Alta de producto (con el selector de categoría de 3 niveles usando la taxonomía real de 54 subcategorías), Categorías (árbol D7), Devoluciones (con cajón de resolución), Solicitudes de servicio, Analítica, Configuración, e Importador CSV (pasos 1-2). Quedan sin maquetar, documentados en `diseño.md` con su sección exacta: las pestañas de Precio/Fotos/Especificaciones/Documentos del editor de producto (§11.7) y el paso 3 (aplicar) del importador CSV (§11.8) — ninguno bloquea la implementación, están completamente especificados.
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
9. **Inventario (2026-09-20):** tres momentos distintos. Al **generar el
    pedido no pasa nada** (la pieza sigue a la venta). Al **subir el
    comprobante la pieza sale de disponibilidad** (queda apartada). Al marcar
    **"Enviado" baja el stock físico**. El apartado se libera solo si el
    comprobante se rechaza o el pedido se cancela.
10. **Validación de pago por correo (2026-09-20):** además del panel, el
    administrador puede confirmar el pago desde un enlace en el correo. Debe
    ser un token de un solo uso, con vencimiento y guardado como hash.
11. **Roles (2026-09-20):** dos roles — `admin` (acceso total) e
    `inventario` (solo carga y edición de productos/stock).
12. **Envío (2026-09-20):** el asesor confirma el envío y en ese acto marca
    el pedido como "Enviado". El costo de envío no se calcula en línea;
    `orders.shipping_cost` queda nulo hasta que el asesor lo captura.
13. **Corrección de inventario (2026-09-20):** el apartado de stock ocurre al
    SUBIR el comprobante (no al generar el pedido). El stock físico sigue
    bajando solo al marcar "Enviado". Ver `modelo-datos.md` §1 y
    `arquitectura.md` §9.1 para la implementación transaccional.
14. **Despliegue confirmado (arquitectura, 2026-09-20):** Vercel. Pendiente
    de decisión de la dueña: subir a plan Pro antes de producción (AR-1),
    Supabase Pro antes de producción (AR-2), y contratar dominio propio ya
    (AR-3, es lo único que bloquea — afecta CDN de imágenes y que el correo
    con datos bancarios no caiga en spam). Ver `arquitectura.md` §14.
15. **PA-9 cerrada — RN-11 nueva (2026-09-20):** ningún pedido cambia de
    estado automáticamente, ni siquiera cuando el saldo a favor cubre el
    100% del pedido y no hay comprobante que subir. Ese pedido entra igual
    a la bandeja de revisión del administrador (mismo punto que un
    comprobante), mostrando el saldo aplicado en vez de una imagen, y
    requiere confirmación manual antes de pasar a "Listo para envío".
    Razón de la dueña: validar un pago es un juicio humano sobre un
    documento no estructurado, y ese criterio debe aplicar parejo sin
    importar el método de pago. Ver `requerimientos.md` RN-11 y D3.3,
    `modelo-datos.md` §4.3 (`orders.payment_method`).
16. **PA-3 cerrada (2026-09-20):** plazo de devolución = **30 días**
    naturales desde la entrega. Configurable en H4.
17. **PA-7 cerrada (2026-09-20):** cancelación automática de pedido no
    pagado = **3 días** desde que se generó, con recordatorio por correo
    al día 2. Configurable en H4.
18. **PA-10 cerrada (2026-09-20):** un producto devuelto **sí reingresa**,
    pero nunca se mezcla con el stock nuevo. Sellado de fábrica → suma al
    stock del SKU original. Abierto/usado/incompleto/exhibición → el admin
    puede publicarlo como una **ficha de producto "Usado"** aparte, con su
    propio precio, foto real y motivo visible; stock siempre 1 porque es
    una pieza única. Ver `requerimientos.md` D2.6 y `modelo-datos.md` D6
    (`products.condition`, `condition_detail`, `source_return_id`).
19. **AR-4 cerrada (2026-09-20):** folio aleatorio, confirmado tal como
    recomendaba `arquitectura.md` §9.2.
20. **Reinicio total de subcategorías (2026-09-20):** después de varios
    intentos y correcciones el mismo día (subir de más, luego filtrar de
    más), la dueña pidió borrar **toda** la información de subcategorías y
    sub-subcategorías de los 6 grupos y recapturarla desde cero. Se
    eliminó de `docs/contexto-negocio.md` (adendas §14-16 removidas, §3 y
    §12 reiniciadas) y de las referencias correspondientes en
    `requerimientos.md` (PA-1) y `modelo-datos.md` (PA-12). **Los 6 grupos
    principales no cambian**, solo sus subcategorías. Pendiente: la dueña
    irá reenviando la información grupo por grupo.
21. **Lo que sí se conserva de todo ese proceso (2026-09-20):** la decisión
    de arquitectura de que `subcategories` sea un árbol auto-referenciado
    (`parent_id`, `modelo-datos.md` D7) — es una capacidad general del
    esquema, no depende de qué subcategorías termine teniendo cada grupo, y
    ya se confirmó que al menos un grupo va a necesitar un tercer nivel.
22. **PA-1/PA-12 cerradas — subcategorías de los 6 grupos completas
    (2026-09-20):** recapturadas desde cero, cada una filtrada por el punto
    de marcado en la app de referencia (solo lo marcado aplica; lo repetido
    en el traslape entre dos capturas del mismo grupo se cuenta una vez, no
    se descarta). Resultado final, ver `docs/contexto-negocio.md` §3:
    - Videovigilancia: 10 (de 11 — se descarta "Drones, Robots e Industrial")
    - Control de Acceso: 14 (de 21)
    - Automatización e Intrusión: 10 (de 19)
    - Energía y Climatización: 10 (de 10, todas aplican)
    - Cableado Estructurado: 9 (de 9, todas aplican)
    - GPS, Telemática y Equipamiento Vehicular: 1 (de ~19 — solo "Video
      Móvil y Cámaras Vehiculares")

    **Pendiente para todos:** el tercer nivel (sub-subcategoría) — ninguno
    lo tiene todavía. Se recaptura después, mismo criterio de marcado.
23. **Tercer nivel completo para los 6 grupos (2026-09-20):** cada captura
    se filtró tomando **solo** la sub-subcategoría de las subcategorías ya
    registradas en el punto 22 — cualquier subcategoría de la captura que
    no estuviera en esa lista se ignoró (ej. "Detectores / Sensores" y
    "Lutron" en Automatización e Intrusión, "Accesorios Generales" y
    "Drones, Robots e Industrial" en Videovigilancia). Resultado por grupo,
    ver `docs/contexto-negocio.md` §3: Automatización e Intrusión 10/10,
    Control de Acceso 14/14, Energía y Climatización 10/10, Videovigilancia
    10/10, Cableado Estructurado 9/9, GPS 1/1. **PA-1/PA-12 quedan cerradas
    por completo** — la taxonomía del catálogo (grupo → subcategoría →
    sub-subcategoría) ya está definida para los 6 grupos, sin pendientes.
24. **G2 promovido de V1.5 a V1 — el tablero es la pantalla de inicio
    (2026-09-20):** la dueña pidió que el tablero esté "bien alimentado con
    gráficas e información, presentable y agradable para el cliente". Deja
    de ser un parche posterior: es lo primero que ve el rol `admin` al
    entrar al panel. **H6 se modificó en consecuencia** — antes decía
    entrar directo a la bandeja de Pedidos precisamente porque el tablero
    no existía en V1; ahora el tablero informa y da acceso de un clic a lo
    accionable. El rol `inventario` sigue entrando a Catálogo. Ver
    `requerimientos.md` G2 y H6.

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
