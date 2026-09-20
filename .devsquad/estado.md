# Estado del proyecto — SG Querétaro

Carpeta de trabajo: `/home/user/qro-security`
Rama: `claude/sg-queretaro-sales-platform-6a7359`
Última actualización: 2026-09-20

## Fase actual
**Implementación en curso — primer incremento (andamiaje + migraciones) completado.**

## Progreso por fases

- [x] **Inicialización** — perfil creado de forma inferida en `.devsquad/perfil.md` (campos marcados "confirmar" pendientes de validación).
- [x] **Contexto de negocio** — documento de la dueña guardado en `docs/contexto-negocio.md`.
- [x] **Requerimientos (BSA)** — `.devsquad/requerimientos.md`: 8 épicas, 27 historias con criterios de aceptación, 10 reglas de negocio, requisitos no funcionales, alcance V1/V1.5/Futuro, 11 preguntas abiertas y matriz de riesgos.
- [x] **Modelo de datos** — `.devsquad/modelo-datos.md`: esquema completo derivado de una revisión a fondo de `index.html`, con 20 hallazgos que el documento de negocio no cubría, 5 decisiones de modelado con su trade-off, políticas de RLS y rutas de archivos en R2. **La data del demo es dummy:** solo prueba qué campos necesita la interfaz, nunca volúmenes, marcas ni contenidos reales del catálogo.
- [x] **Arquitectura** — `.devsquad/arquitectura.md`: monolito modular en capas, estructura de carpetas completa, tres clientes de Supabase (con 4 candados sobre la service role key), dos buckets en R2, notificaciones con patrón outbox, 9 decisiones de arquitectura con su trade-off (la central: `products.reserved` + función SQL con `FOR UPDATE` para cero sobreventas), 28 variables de entorno, ANF inferidos, y costo real de producción corregido: **~$45–47 USD/mes** (Vercel Pro $20 + Supabase Pro $25 + dominio ~$15/año), no $0 como se había estimado — el desarrollo sí es $0.
- [x] **Diseño de UI del panel administrativo** — `.devsquad/diseño.md` (1885 líneas): tokens heredados del demo del sitio público con 3 correcciones de contraste WCAG AA, navegación por rol, Atomic Design, y las 13 pantallas con sus estados. Incluye el tablero completo (G2, adelantado a V1 el 2026-09-20) con 6 gráficas justificadas y paleta de datos separada de los colores semánticos de estado. **Aprobado por la dueña (2026-09-20).**
- [x] **Maqueta visual interactiva (Artifact)** — construida sobre `diseño.md`: Login, Tablero completo, Pedidos, Detalle de pedido (normal y variante RN-11), Catálogo, Alta de producto (con el selector de categoría de 3 niveles usando la taxonomía real de 54 subcategorías), Categorías (árbol D7), Devoluciones (con cajón de resolución), Solicitudes de servicio, Analítica, Configuración, e Importador CSV (pasos 1-2). Quedan sin maquetar, documentados en `diseño.md` con su sección exacta: las pestañas de Precio/Fotos/Especificaciones/Documentos del editor de producto (§11.7) y el paso 3 (aplicar) del importador CSV (§11.8) — ninguno bloquea la implementación, están completamente especificados.
- [x] **Preparación del entorno** — verificado (2026-09-20): Node.js v22.22.2, npm 10.9.7, Git 2.43.0, Supabase CLI funcional vía `npx`. Todo cumple lo requerido en `arquitectura.md` §11.1, nada que instalar en este entorno.
- [~] **Implementación** — en curso. Primer incremento completado (2026-09-20): andamiaje de Next.js + 8 migraciones de base de datos. Ver detalle debajo y "Próxima sesión".

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
25. **Regla de traducción literal del frontend (2026-09-20):** el frontend
    (sitio público y panel admin) se implementa como copy-paste de la
    estructura/clases/estilos de los HTML de referencia a Next.js, no como
    interpretación libre. Se guardó `panel-admin-maqueta.html` en la raíz
    del repo (antes solo vivía en el Artifact, fuera del alcance del
    coder) y se agregó a archivos protegidos junto con `index.html`. Nada
    del frontend se crea por asunción: lo que no esté en los HTML ni en
    `diseño.md`/`docs/contexto-negocio.md` se pregunta antes de construirse.
    Ver `perfil.md` §Archivos protegidos y `requerimientos.md` H1/H1-bis.
26. **Primer incremento de implementación completado (2026-09-20):**
    andamiaje de Next.js (App Router, TypeScript estricto) inicializado en
    la raíz del repo sin tocar `index.html`, `support.js`, `uploads/` ni
    `panel-admin-maqueta.html`; estructura de carpetas completa de
    `arquitectura.md` §4; `globals.css` con los tokens exactos de
    `diseño.md` §2 (paleta, Chakra Petch/IBM Plex Sans/IBM Plex Mono vía
    `next/font/google`, `clip-path`, modo oscuro único) y el CSS de
    dark-mode/Geist del template de `create-next-app` eliminado por
    completo; `.env.example` con 25 variables documentadas;
    `src/server/config/env.ts` validando con Zod al arrancar; regla de
    ESLint (`no-restricted-imports`) como candado 3 de arquitectura §6.2;
    8 migraciones SQL (`supabase/migrations/0001`–`0008`) con RLS en todas
    las tablas y las 4 funciones transaccionales de §9.1
    (`apartar_pedido`, `liberar_apartado`, `marcar_enviado`,
    `aplicar_saldo`), **validadas funcionalmente contra un Postgres 16
    local** (no se pudo levantar el stack completo de `supabase start`
    porque el proxy de red del entorno bloquea la descarga de las imágenes
    Docker de Supabase — ver nota en "Próxima sesión"). Se probó
    explícitamente el escenario de concurrencia de §9.1 (dos pedidos
    compitiendo por la última pieza: el segundo recibe el error de negocio
    limpio) y el de saldo insuficiente (RN-7).

## Nota de sesión

Esta sesión corrió sin la herramienta de delegación a subagentes disponible, por lo
que la fase de BSA se ejecutó directamente por el orquestador siguiendo la skill
`descubrimiento-requerimientos`. Si en una sesión futura la delegación está
disponible, el arquitecto debe recibir explícitamente las secciones "Stack" y
"Archivos protegidos" de `.devsquad/perfil.md`.

## Próxima sesión

### Qué se completó
Andamiaje de Next.js + `globals.css` con los tokens del diseño + validación
de entorno con Zod + `.env.example` + las 8 migraciones de base de datos
(esquema completo, RLS en todas las tablas, las 4 funciones transaccionales
de concurrencia/saldo). `npm run build` y `npm run lint` pasan limpio.
`git status` limpio, todo comiteado.

### Próximo incremento: catálogo público
Listado por grupo/subcategoría, ficha de producto y búsqueda (Épica A de
`requerimientos.md`), traduciendo **literalmente** `index.html` a
componentes Atomic Design (`src/components/atoms|molecules|organisms`) —
regla nueva de la dueña (2026-09-20, decisión #25): copy-paste de
estructura/clases/estilos, no interpretación libre. Nada que no esté en
`index.html`, `panel-admin-maqueta.html` o `diseño.md` se inventa: se
pregunta primero.

### Decisiones técnicas tomadas por el Coder que no estaban 100% explícitas
(reportadas para que BSA/Arquitecto las revisen si hace falta, no bloquean nada)
1. **`ORDER_AUTO_CANCEL_DAYS` default en `env.ts` = 3, no 5.**
   `arquitectura.md` §10.5 sugería 5 como default, pero
   `requerimientos.md` PA-7 ya tiene la decisión final de la dueña (3 días,
   2026-09-20). Se usó el valor decidido, no el sugerido.
2. **`legal_pages.slug` solo admite `privacidad`/`terminos`** (los dos que
   `modelo-datos.md` §4.6 declara explícitamente), aunque
   `requerimientos.md` §6 también pide publicar una política de
   devoluciones antes de producción. No se agregó un tercer slug por
   cuenta propia — es una ambigüedad entre dos documentos aprobados, queda
   señalada en el `CHECK` de `0006_servicios_y_contenido.sql` para que se
   resuelva explícitamente (probablemente: agregar `devoluciones` al
   enum, o reutilizar `terminos`).
3. **`notification_outbox` sin FK a `orders`/`returns`/`service_requests`**:
   se diseñó con `payload jsonb` genérico porque un solo evento de negocio
   ("comprobante recibido") puede no tener aún todas las relaciones
   resueltas y porque la tabla es compartida entre varios módulos
   (arquitectura §7.3 no especifica su esquema exacto de columnas, solo
   "evento, canal, destino, intentos, estado").
4. **`subcategories`** no tiene una restricción de base de datos que
   obligue a que `parent_id` pertenezca al mismo `group_id`: se documentó
   en un comentario SQL que esa validación vive en `server/domain`, porque
   una FK compuesta lo hubiera requerido duplicar `group_id` en cada fila
   hija de forma redundante. Vale la pena que el Arquitecto confirme que
   está de acuerdo con dejarlo solo en la capa de aplicación.

### Bloqueo real (no de código): no se pudo levantar Supabase local completo
`npx supabase start` no pudo descargar las imágenes Docker de Supabase — el
proxy de red de este entorno rechaza las conexiones a
`production.cloudfront.docker.com` (política del gateway, no arreglable
desde el código). **Mitigación aplicada:** se instaló Postgres 16 nativo
(ya estaba disponible vía `apt`) y se aplicaron las 8 migraciones en orden
contra una base de datos limpia, con roles (`anon`, `authenticated`,
`service_role`, `supabase_auth_admin`) y un `auth.users`/`auth.uid()`/
`auth.jwt()` mínimos simulados a mano para poder probar RLS y las 4
funciones transaccionales de extremo a extremo (incluida la prueba de
concurrencia de última pieza y la de saldo insuficiente). **Lo que NO se
validó:** el comportamiento real de Supabase Auth (el Auth Hook de
`custom_access_token_hook` necesita habilitarse manualmente en el
dashboard del proyecto real, ya documentado como paso pendiente dentro de
`0007_rls_policies.sql`), Supabase Studio, y el resto de servicios del
stack (Storage, Realtime, Kong). Se recomienda repetir
`npx supabase start` (o `supabase db push` contra el proyecto real una vez
que la dueña lo cree) desde un entorno sin esa restricción de red antes de
salir a producción.

### Tareas manuales de la persona mientras tanto
1. Crear el proyecto de Supabase real (aunque sea en el plan gratis para
   desarrollo) para poder aplicar estas migraciones y habilitar el Auth
   Hook `custom_access_token_hook` como "Custom Access Token" en
   Authentication → Hooks (paso manual, no se puede hacer por SQL).
2. Crear la cuenta de Cloudflare (R2 + Turnstile) y de Resend — son
   dependencias externas del siguiente incremento en adelante.
3. Seguir con AR-3 (dominio propio): sigue siendo lo que más bloquea el
   lanzamiento real, no el desarrollo.
4. Decidir la ambigüedad de `legal_pages.slug` (punto 2 de arriba) cuando
   se llegue al incremento de contenido editorial — no urge ahora.
