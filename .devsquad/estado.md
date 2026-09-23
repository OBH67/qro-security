# Estado del proyecto — SG Querétaro

Carpeta de trabajo: `/home/user/qro-security`
Rama: `claude/sg-queretaro-sales-platform-6a7359`
Última actualización: 2026-09-23

## Fase actual
**Implementación en curso — decimonoveno incremento (2026-09-21): la
página de categoría (grupo) usa el mismo panel de filtros que una
subcategoría, con una nueva sección "Categorías" que navega el árbol por
nivel. El panel admin sigue con el paso 3 del Importador CSV como único
pendiente. Ver detalle debajo.**

## Progreso por fases

- [x] **Inicialización** — perfil creado de forma inferida en `.devsquad/perfil.md` (campos marcados "confirmar" pendientes de validación).
- [x] **Contexto de negocio** — documento de la dueña guardado en `docs/contexto-negocio.md`.
- [x] **Requerimientos (BSA)** — `.devsquad/requerimientos.md`: 8 épicas, 27 historias con criterios de aceptación, 10 reglas de negocio, requisitos no funcionales, alcance V1/V1.5/Futuro, 11 preguntas abiertas y matriz de riesgos.
- [x] **Modelo de datos** — `.devsquad/modelo-datos.md`: esquema completo derivado de una revisión a fondo de `index.html`, con 20 hallazgos que el documento de negocio no cubría, 5 decisiones de modelado con su trade-off, políticas de RLS y rutas de archivos en R2. **La data del demo es dummy:** solo prueba qué campos necesita la interfaz, nunca volúmenes, marcas ni contenidos reales del catálogo.
- [x] **Arquitectura** — `.devsquad/arquitectura.md`: monolito modular en capas, estructura de carpetas completa, tres clientes de Supabase (con 4 candados sobre la service role key), dos buckets en R2, notificaciones con patrón outbox, 9 decisiones de arquitectura con su trade-off (la central: `products.reserved` + función SQL con `FOR UPDATE` para cero sobreventas), 28 variables de entorno, ANF inferidos, y costo real de producción corregido: **~$45–47 USD/mes** (Vercel Pro $20 + Supabase Pro $25 + dominio ~$15/año), no $0 como se había estimado — el desarrollo sí es $0.
- [x] **Diseño de UI del panel administrativo** — `.devsquad/diseño.md` (1885 líneas): tokens heredados del demo del sitio público con 3 correcciones de contraste WCAG AA, navegación por rol, Atomic Design, y las 13 pantallas con sus estados. Incluye el tablero completo (G2, adelantado a V1 el 2026-09-20) con 6 gráficas justificadas y paleta de datos separada de los colores semánticos de estado. **Aprobado por la dueña (2026-09-20).**
- [x] **Maqueta visual interactiva (Artifact)** — construida sobre `diseño.md`: Login, Tablero completo, Pedidos, Detalle de pedido (normal y variante RN-11), Catálogo, Alta de producto (con el selector de categoría de 3 niveles usando la taxonomía real de 54 subcategorías), Categorías (árbol D7), Devoluciones (con cajón de resolución), Solicitudes de servicio, Analítica, Configuración, e Importador CSV (pasos 1-2). Quedan sin maquetar, documentados en `diseño.md` con su sección exacta: las pestañas de Precio/Fotos/Especificaciones/Documentos del editor de producto (§11.7) y el paso 3 (aplicar) del importador CSV (§11.8) — ninguno bloquea la implementación, están completamente especificados.
- [x] **Preparación del entorno** — verificado (2026-09-20): Node.js v22.22.2, npm 10.9.7, Git 2.43.0, Supabase CLI funcional vía `npx`. Todo cumple lo requerido en `arquitectura.md` §11.1, nada que instalar en este entorno.
- [~] **Implementación** — en curso. Primer incremento (2026-09-20): andamiaje de Next.js + 8 migraciones de base de datos. Segundo incremento (2026-09-20): catálogo público (Épica A completa: A1-A4). Tercer incremento (2026-09-21): carrito y cuenta de cliente + pedido/comprobante (Épica B completa + Épica C sin C3). Panel admin en curso desde el noveno incremento (base/tablero); decimosexto incremento (2026-09-21) es la octava y última tanda planeada, Analítica (G1) + Configuración (H4). Ver detalle debajo.

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
27. **Segundo incremento de implementación completado (2026-09-20): catálogo
    público, Épica A completa (A1-A4).** Traducción literal de `index.html`
    (header con mega-menú y menú móvil, portada, página de grupo, listado
    con filtros/orden/paginación, ficha de producto, búsqueda, 404) a
    componentes Atomic Design (`src/components/atoms|molecules|organisms|
    templates/`) sobre Server Components de Next.js. Nueva migración
    `0009_catalogo_lectura_publica.sql` (vista `catalogo_productos` +
    función `buscar_productos()`, ambas de solo lectura, corren con
    privilegios de invoker — nunca saltan RLS). Detalle completo,
    simplificaciones deliberadas frente al demo (ninguna afecta un
    criterio de aceptación) y validación hecha, en "Próxima sesión" debajo.

## Nota de sesión

Esta sesión corrió sin la herramienta de delegación a subagentes disponible, por lo
que la fase de BSA se ejecutó directamente por el orquestador siguiendo la skill
`descubrimiento-requerimientos`. Si en una sesión futura la delegación está
disponible, el arquitecto debe recibir explícitamente las secciones "Stack" y
"Archivos protegidos" de `.devsquad/perfil.md`.

## Próxima sesión

### Qué se completó en este incremento (catálogo público, Épica A)

Traducción literal de `index.html` a Next.js, con Atomic Design real
(`src/components/atoms|molecules|organisms|templates/`), cubriendo A1-A4
completas:

- **Capa de datos** (`src/server/db/queries/catalogo.ts`, solo lecturas,
  cliente con sesión — nunca `service_role`): grupos, árbol de
  subcategorías de hasta 3 niveles (D7), resolución de ruta por slugs con
  `notFound()` si no existe, conteo de productos por subcategoría,
  listado paginado con filtros combinables (marca, rango de precio,
  disponibilidad) y orden (más vendidos/precio/novedades), ficha de
  producto completa, productos relacionados, búsqueda tolerante a
  acentos/mayúsculas por nombre+SKU+marca, contenido de portada (banners,
  reseñas, marcas, FAQs — todo con estado vacío si la tabla todavía no
  tiene filas).
- **Lógica de dominio pura** (`src/server/domain/catalogo.ts`, sin
  React/Next/Supabase, arquitectura.md §4 regla #2): construcción del
  árbol de subcategorías, resolución de ruta de slugs, cálculo de IDs de
  descendientes — **validada contra Postgres real** (ver abajo), no solo
  compilada.
- **Nueva migración `0009_catalogo_lectura_publica.sql`**: vista
  `catalogo_productos` (con `security_invoker = true`, calcula
  `disponible = stock - reserved` al vuelo, nunca almacenado — respeta
  modelo-datos.md §1 al pie de la letra) y función `buscar_productos()`
  (RPC, invoker rights, usa el índice trigram de `0003_catalogo.sql`).
  Ninguna de las dos toca el esquema aprobado ni salta RLS. **Pendiente:
  que el Arquitecto la revise** — es una decisión de la capa de lectura,
  no del modelo de datos, pero es nueva.
- **`supabase/seed.sql`** (nuevo): los 6 grupos y sus ~346 filas de
  subcategorías (2-3 niveles), generados desde la taxonomía **real y
  confirmada** de `docs/contexto-negocio.md` §3 — no es data dummy, es
  contenido de producción. Verificado contra Postgres que los conteos por
  grupo coinciden exactamente con el documento (10/14/10/10/9/1 raíces) y
  que no hay fugas de `parent_id` entre grupos.
- **`supabase/seed_dev.sql`** (nuevo, **solo desarrollo, no producción**):
  ~16 productos de muestra con fotos (URLs externas), marcas, un producto
  "usado" (D6) y uno de tercer nivel (Cable - Bobinas → Categoría 6A),
  reseñas, FAQs y un banner — para poder ver y probar el catálogo
  mientras no existe el catálogo real (PA-11).
- **Componentes**: `EncabezadoSitio` (mega-menú + menú móvil, ambos
  cliente), `PiePagina`, `TarjetaProducto`, `IndicadorStock`,
  `PanelFiltros` + chips activos (todo enlaces/formularios GET — la URL
  es la fuente de verdad de los filtros, criterio A4), `Paginacion`,
  `SelectOrden`, `GaleriaProducto`, `PestanasProducto` (ficha técnica de
  pares clave-valor desde `products.attributes`, con etiquetas de
  `category_attributes` cuando existen), `BannerHero`, `PanelResenas`,
  `AcordeonFaqs`, `CintaMarcas`. Páginas: portada, `/catalogo/[grupo]`,
  `/catalogo/[grupo]/todos`, `/catalogo/[grupo]/[...subcategoria]`
  (catch-all para soportar los 3 niveles de D7), `/producto/[slug]`,
  `/buscar`, 404 y límites de error (`error.tsx`) en la raíz y en el
  grupo público.
- **Validación hecha** (sin Supabase real disponible en este entorno —
  mismo bloqueo de red que el incremento anterior, ver abajo): se levantó
  Postgres 16 nativo, se aplicaron las 9 migraciones + `seed.sql` +
  `seed_dev.sql`, y se probaron **directamente contra la base de datos,
  como el rol `anon`**, exactamente los patrones de consulta que usa el
  código: la vista `catalogo_productos` calcula `disponible` bien, la
  función `buscar_productos()` encuentra "Cámara" con "camara" (sin
  acento) y por SKU y por marca, y no revienta con una búsqueda sin
  resultados; el filtro combinado de disponibilidad + rango de precio
  funciona; una subcategoría con hijos (Cable - Bobinas) incluye los
  productos de su hijo (Categoría 6A) en el listado; un producto marcado
  `descontinuado` desaparece de la vista pública y del `select` directo
  por slug (criterio A1.4) tanto para `anon` como si se intenta
  modificarlo sin ser staff (RLS lo bloquea). **Lo que no se pudo probar
  end-to-end**: la traducción HTTP real de `supabase-js`/PostgREST (no
  hay Kong/PostgREST en este entorno, solo Postgres nativo) — es una
  librería de terceros bien probada, usada tal cual documenta su API, no
  código propio.
- `npm run build` y `npm run lint` pasan limpio. `.env.local` con valores
  de desarrollo (no reales) creado para poder correr el build — está en
  `.gitignore`, no se sube.

### Simplificaciones deliberadas frente al demo (ninguna afecta un criterio de aceptación de A1-A4)

1. **Sin barra flotante que reaparece al hacer scroll hacia arriba** en el
   encabezado — decorativo.
2. **El encabezado no cambia de color según el banner activo de la
   portada** (en el demo si el SPA cambiaba de "pantalla" el header seguía
   con el degradado del hero) — con páginas reales por URL, un encabezado
   consistente en todas es más simple y no menos usable.
3. **El mega-menú no incluye el panel "DESTACADO"** con un producto del
   grupo en hover — hubiera requerido datos adicionales por grupo sin
   ganancia funcional para A1.
4. **La franja de marcas no tiene la animación `marquee` infinita** — es
   un scroll horizontal normal; la animación es decorativa y hay que
   pausarla con `prefers-reduced-motion` de cualquier forma.
5. **La sección "Para Ti" del demo (tabs por subcategoría con carrusel
   automático) se sustituyó por "Explora por categoría"** (grid de los 6
   grupos): "Para Ti" implica personalización que no está modelada en
   ningún lado (no hay tracking de usuario ni preferencias, y
   `requerimientos.md` no la menciona) — se optó por la opción que sí
   sirve al criterio A1 (navegar por grupo) en vez de inventar un
   algoritmo de "para ti".
6. **La sección "Arma tu sistema completo" (kit fijo con SKU inventado)
   se omitió** — no corresponde a ninguna tabla de `modelo-datos.md`.
   Documentado como **PA-21** en `requerimientos.md` §8.2.
7. **El panel de filtros no se oculta en un cajón inferior en móvil**:
   se apila arriba del listado en pantallas angostas. Es más simple y no
   esconde funcionalidad detrás de un botón extra.
8. **Sin sugerencias en vivo mientras se escribe en el buscador** (el
   demo mostraba una lista bajo el campo): el buscador es un formulario
   `GET` normal a `/buscar` (funciona sin JavaScript); las sugerencias en
   vivo no son parte de los criterios de A2, solo del demo.
9. **Los facetas por atributo del panel de filtros del demo (Resolución,
   Tipo, Uso) no se implementaron**: dependen de PA-17 (`modelo-datos.md`
   §7, "¿qué atributos se filtran en cada grupo?"), que sigue abierta. A4
   solo pide marca, precio y disponibilidad — eso sí está completo.
10. **El "Agregar al pedido" de las tarjetas y de la ficha de producto se
    pinta con su estilo final pero no tiene acción todavía** (no suma a
    ningún carrito): el carrito es la Épica B, siguiente incremento, y no
    se inventó un carrito parcial para no confundir. El selector de
    cantidad de la ficha sí es interactivo (estado local), acotado al
    stock disponible.
11. **Los enlaces a "Mi cuenta"/"Iniciar sesión"/"Mi pedido" (carrito) y a
    Servicios/Cómo comprar/Devoluciones apuntan a rutas que todavía no
    existen** — es esperado en una entrega por incrementos; no se
    construyeron páginas de relleno para esas rutas por estar fuera de
    alcance de este incremento.

### Decisiones técnicas del Coder que valen la pena revisar
1. **Migración `0009_catalogo_lectura_publica.sql`** (vista + función RPC,
   ver arriba) — nueva, el Arquitecto no la vio. Trade-off documentado en
   la cabecera del archivo.
2. **URL del listado con subcategoría anidada**: `arquitectura.md` §4
   esbozaba `catalogo/[grupo]/[subcategoria]/page.tsx` (un solo segmento).
   D7 (mismo documento) exige soportar hasta 3 niveles, así que se usó
   `catalogo/[grupo]/[...subcategoria]/page.tsx` (catch-all) + una ruta
   estática `catalogo/[grupo]/todos/page.tsx` para "todos los productos
   del grupo sin acotar a subcategoría". Es una decisión de enrutamiento,
   no de negocio ni de diseño visual.
3. **`src/types/database.ts` es un `Database` escrito a mano**, sin
   `supabase gen types` (no hay proyecto real). El cliente de Supabase se
   usa **sin** el genérico `Database` (ver comentario en
   `src/server/supabase/server.ts`): con un esquema a mano, la inferencia
   de `@supabase/postgrest-js` sobre `select` con joins colapsaba a
   `never` en casos válidos. La seguridad de tipos se mantiene en la
   frontera de cada función de `queries/catalogo.ts`, que sí declara su
   tipo de retorno. Cuando exista un proyecto real, generar los tipos de
   verdad y volver a intentar pasar el genérico.
4. **`etiquetaStock`/`barrasStock`/precio con IVA** viven en
   `src/lib/formato.ts` (código puro, compartible cliente/servidor) en
   vez de en cada componente — mismo dato mostrado en tarjeta, PDP y
   (eventualmente) panel admin debe calcularse una sola vez.

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

### Tercer incremento completado (2026-09-21): carrito y cuenta de cliente
(Épica B completa) + pedido, pago por transferencia y comprobante (Épica C,
**sin C3**)

**Qué se construyó:**

1. **B1 · Carrito.** `CarritoProvider` (cliente): sin sesión vive en
   `localStorage` (`src/components/providers/CarritoProvider.tsx`), con
   sesión vive en `carts`/`cart_items` (arquitectura §9.6). Nunca guarda
   precio, solo intención (SKU/`productId` + cantidad); precio y
   disponible se resuelven siempre contra `catalogo_productos` en el
   servidor (B1.3/B1.4, RN-10). Fusión al iniciar sesión
   (`fusionarCarritoAction`), acotada siempre al disponible actual.
   Botones "Agregar al pedido"/"Comprar ahora" de la ficha de producto ya
   quedaron cableados (`AgregarAlPedido.tsx`), cerrando la simplificación
   #10 del incremento anterior.
2. **B2 · Cuenta.** Registro (3 pasos, traducción literal de
   `index.html:950-1023`), login, cierre de sesión, recuperación de
   contraseña — todo sobre Supabase Auth (`src/server/actions/cuenta.ts`).
   El trigger `on_auth_user_created` (0002) sigue creando `profiles`
   automáticamente. Verificación de correo no bloquea la compra (§9.9): si
   Auth exige confirmación y no regresa sesión, se hace un segundo intento
   de login automático con la misma contraseña recién creada.
3. **B3 · Direcciones y datos fiscales.** CRUD completo
   (`src/server/actions/direcciones.ts` /
   `src/server/actions/datosFiscales.ts`) usando el cliente CON SESIÓN
   (RLS `addresses_own`/`billing_profiles_own` ya bastan — no hace falta
   `service_role` para que alguien edite sus propias filas). RFC validado
   en formato (12 o 13 caracteres) solo si se activa "Quiero factura".
4. **C1 · Generar pedido.** Nueva función SQL `crear_pedido()`
   (`supabase/migrations/0010_pedidos_carrito_b_c.sql`): congela
   precio/nombre/SKU por partida (D3), valida disponible con el mismo
   candado `FOR UPDATE` ordenado por id que `apartar_pedido` (§9.1),
   genera folio único reutilizando `generar_folio()` (formato ya
   confirmado, AR-4), y si el saldo cubriera el 100% (`total = 0` —
   **no aplica todavía, ver punto 8**) reutiliza `apartar_pedido()` para
   entrar directo a `comprobante_recibido` sin romper RN-11. Los datos
   bancarios para "Datos para transferir" se leen de `settings` (nunca en
   el código, C1.6); como H4 (pantalla para que el admin los edite) no es
   parte de este incremento, la pantalla muestra un estado vacío
   explícito en vez de datos inventados
   (`src/components/organisms/DatosTransferencia.tsx`).
5. **C2 · Subir comprobante.** Nueva función SQL `confirmar_comprobante()`
   (mismo archivo 0010): inserta el comprobante y aparta las piezas en una
   sola transacción, reusando `apartar_pedido()`. Subida directa
   navegador→R2 con URL firmada de 5 minutos (arquitectura §7.1,
   `src/server/storage/firmar.ts`); el servidor nunca recibe el archivo.
   Tras el `PUT`, se verifica tamaño y **tipo real por magic bytes**
   (`src/server/domain/comprobantes.ts` — JPG/PNG/PDF/HEIC, probado con
   casos válidos e inválidos, incluida una extensión que miente sobre el
   tipo real) antes de confirmar — no solo la extensión ni el
   `Content-Type` declarado (criterio C2.2).
6. **C4 · Mis pedidos.** Lista (`/mi-cuenta/pedidos`) y detalle
   (`/mi-cuenta/pedidos/[folio]`) — folio, fecha, total, estado, señal de
   progreso (`PasosPedido.tsx`, traducción de `index.html:1110-1121`),
   productos, dirección y datos fiscales congelados, y el comprobante
   subido con su estado. El historial de cambios (`order_status_history`)
   **no** se muestra al cliente a propósito: RLS solo lo deja leer a
   `admin` (modelo-datos.md §5) — mostrarlo habría requerido saltarse RLS
   con `service_role` para una lectura que el propio modelo dice que no
   es del cliente.

**Lo que se dejó fuera, a propósito, y por qué:**

- **C3 (WhatsApp al admin)**: instrucción explícita del encargo. Las
  funciones `crear_pedido()`/`confirmar_comprobante()` sí encolan en
  `notification_outbox` los eventos `comprobante.recibido` por canal
  `correo` y `whatsapp` (ya lo hacía `apartar_pedido()` desde 0008) — el
  punto de integración queda listo, pero no hay ningún despachador que la
  procese todavía (ni correo ni WhatsApp salen de verdad en este
  incremento). Falta construir `src/server/notifications/` completo
  (§7.3): interfaz `CanalNotificacion`, canal `correo.ts` con Resend,
  canal `whatsapp.ts` (bloqueado por PA-5) y el cron de reintentos.
- **D3 (aplicar saldo a favor en el checkout)**: el bloque
  `showSaldo`/`applySaldo` de `index.html:1069-1074` **no** se tradujo.
  Épica D (devoluciones) no es parte de este incremento y es la única
  fuente de saldo — mostrar ese bloque habría simulado una función que
  ningún cliente puede usar todavía (nadie tiene saldo real). La función
  SQL `crear_pedido()` sí acepta `p_credit_to_apply` y llama a
  `aplicar_saldo()` si es mayor a cero — la lógica de servidor ya está
  lista para cuando exista D2 (resolver devoluciones); en este incremento
  el llamador de TypeScript siempre manda `0`.
- **Nav de "Mi cuenta"**: se construyeron 4 secciones (Mis pedidos, Mis
  datos, Direcciones, Datos de facturación) de las 7 que lista
  `index.html:2671` (`acctNav`). Se omitieron "Saldo a favor" y
  "Devoluciones" — mismo motivo que el punto anterior: son pantallas de
  Épica D, enlazarlas habría sido navegación a un lugar que no existe.
- **Panel admin / C5**: fuera de alcance de este incremento (Épica H no
  arrancó); un pedido nunca avanza de estado sin acción del admin (RN-11)
  y ese "admin" todavía no tiene panel — es consistente con lo pedido,
  no un hueco nuevo.
- **PA-22 (nueva, abierta)**: la pantalla de "Recuperar contraseña" no
  existe en `index.html` ni en `diseño.md` (fuera de su alcance). Se
  construyó con el mismo lenguaje visual que login/registro por ser la
  única referencia disponible. Ver `requerimientos.md` §8.2.

**Validado en este incremento:**
`npm run build` y `npm run lint` pasan limpio (Next.js 16.3.5 con
`proxy.ts`, no `middleware.ts` — convención renombrada en esta versión,
ver `node_modules/next/dist/docs/.../proxy.md`, migrado en este mismo
incremento). Los esquemas Zod (RFC, dirección, registro) y la detección de
tipo real de archivo por magic bytes (`server/domain/comprobantes.ts`) se
probaron con `npx tsx` contra casos válidos e inválidos — todos con el
resultado esperado. **No se pudo validar `crear_pedido()` ni
`confirmar_comprobante()` contra un Postgres real** (mismo bloqueo de red
que el primer incremento: `supabase start` no puede descargar imágenes
Docker en este entorno, y este agente no tiene permiso para crear un rol
de prueba en el Postgres nativo local sin usar `sudo`/`su`, bloqueados
aquí por seguridad del worktree). Mitigación aplicada: ambas funciones se
validaron sintácticamente con `libpg-query` (parser real de Postgres,
`parse()` + `parsePlPgSQL()`, sin errores) y se revisaron a mano
reutilizando exactamente el patrón ya probado en vivo de `apartar_pedido`/
`aplicar_saldo`/`generar_folio` (0008) en vez de escribir lógica nueva de
concurrencia. **Se recomienda correr las 10 migraciones contra un
Postgres real (nativo o `supabase start`) antes de la siguiente sesión**,
con el mismo escenario de concurrencia de última pieza que ya se probó
para 0008, esta vez disparando `crear_pedido()` dos veces con el mismo
producto casi agotado.

### Próximo incremento: C3 (WhatsApp), Épica D (devoluciones y saldo) o
panel admin (Épica H)

Con B + C (sin C3) completo, el negocio ya puede operar por transferencia
de principio a fin salvo por dos huecos: (1) nadie recibe el aviso de un
comprobante nuevo salvo quien revise `notification_outbox` a mano —
`src/server/notifications/` (§7.3) es la pieza que falta, empezando por
el canal de correo (Resend, no bloqueado por PA-5) antes que WhatsApp; y
(2) no hay panel para que el admin valide nada (C5) — todo pedido con
comprobante subido queda esperando en `comprobante_recibido` sin quien lo
mueva a `listo_envio`. Cualquiera de los dos desbloquea el ciclo completo
de v1 (`.devsquad/requerimientos.md` §1); la decisión de cuál primero es
de negocio, no técnica. Antes de empezar cualquiera, correr la validación
contra Postgres real pendiente (punto anterior) — construir sobre
`crear_pedido()`/`confirmar_comprobante()` sin haberlas visto correr una
vez es el riesgo más alto que deja este incremento.

### Cuarto incremento (2026-09-21): idempotencia de pedidos — cierra un hueco de seguridad real

**El problema:** el backend no tenía ninguna protección contra pedidos
duplicados por doble clic, reintento de red tras timeout, o el mismo
cliente confirmando el mismo carrito en dos pestañas. El candado de
`apartar_pedido()` (0008, §9.1) protege el STOCK entre pedidos de
clientes DISTINTOS que compiten por el mismo producto, pero no protegía
contra que el MISMO cliente creara dos pedidos por el mismo carrito.

**Qué se construyó** (`supabase/migrations/0011_idempotencia_pedidos.sql`,
no se editó 0010 — instrucción explícita):

1. **Llave de idempotencia end-to-end.** `orders.idempotency_key uuid`,
   índice único COMPUESTO `(user_id, idempotency_key)` (parcial, `where
   idempotency_key is not null`) — único por CLIENTE, no global, porque la
   llave la genera el cliente. `crear_pedido()` recibe
   `p_idempotency_key uuid default null` (parámetro nuevo al final, para
   no romper llamadas existentes sin llave): si ya existe un pedido de
   ese cliente con esa llave, lo regresa tal cual en vez de crear uno
   nuevo. `generarPedidoAction` la exige (`esquemaGenerarPedido.idempotencyKey`,
   `z.uuid()` obligatorio) — obligatoria desde la Server Action hacia
   adelante, no a nivel de base de datos (compatibilidad con llamadas
   internas/pruebas sin llave, como pidió el encargo).
2. **Candado transaccional por cliente**, mismo patrón que
   `aplicar_saldo()` (0008): `perform pg_advisory_xact_lock(hashtext(p_user_id::text))`
   al inicio de `crear_pedido()`, ANTES de la verificación de
   idempotencia. Cierra la ventana de carrera real: sin este candado, dos
   llamadas concurrentes con la misma llave podrían ambas llegar al
   "¿ya existe?" antes de que la primera hiciera commit, y ambas crear su
   propio pedido — la llave sola no basta bajo concurrencia genuina.
3. **`confirmar_comprobante()` revisado por el mismo riesgo** (dos
   subidas simultáneas insertando dos filas en `payment_proofs`).
   Veredicto documentado en el propio SQL: la función YA estaba protegida
   por su `select ... for update` sobre la fila del pedido (primera línea
   del cuerpo desde 0010) combinado con el chequeo de estado estricto de
   `apartar_pedido()`, que revierte toda la transacción de la segunda
   llamada — verificado con la prueba de concurrencia (abajo). Se agregó
   de cualquier forma un `pg_advisory_xact_lock(hashtext(p_order_id::text))`
   explícito y un chequeo de estado más temprano con mensaje de negocio
   claro, por consistencia de patrón y para fallar más rápido — no porque
   hiciera falta para la corrección.
4. **Frontend.** `CheckoutForm.tsx`: `const [idempotencyKey] =
   useState(() => crypto.randomUUID())` — se genera UNA vez por montaje
   del componente (no en cada clic: reintentos/doble clic dentro de la
   misma pantalla reusan la misma llave) y se guarda en estado de React,
   a propósito, no en `sessionStorage`: un refresh de `/pagar` es, para
   este negocio, un intento de compra distinto (decisión técnica
   documentada en el propio SQL, no una pregunta abierta — el usuario
   pudo cambiar de opinión sobre el carrito entre un refresh y el
   siguiente). Un remount de React ya genera la llave nueva solo. El
   formulario de comprobante no necesitó cambios: `confirmar_comprobante()`
   ya es idempotente por el mecanismo del punto 3, sin necesitar una
   llave adicional del cliente.
5. **Bug preexistente encontrado y corregido en el camino** (no
   introducido en este incremento, bloqueaba la prueba de concurrencia
   que este mismo incremento exige correr): `crear_pedido()` y
   `confirmar_comprobante()` (0010) insertaban `source = 'cliente'` en
   `order_status_history`, pero el `CHECK` de esa columna (0004) solo
   permitía `'panel' | 'correo' | 'sistema'` — es decir, **toda llamada
   real a `crear_pedido()` fallaba** desde que se escribió 0010, nunca se
   había probado contra un Postgres real (confirma la advertencia del
   incremento anterior: "no se pudo validar... contra un Postgres real").
   Se corrigió el `CHECK` para incluir `'cliente'`, en la misma migración
   0011 donde se detectó.

**Cómo se probó (de verdad, no solo que compilara):**

- **Bloqueo real de este entorno, superado igual que en el incremento
  anterior:** `npx supabase start` sigue sin poder descargar imágenes
  Docker aquí. Esta vez sí fue posible instalar y arrancar Postgres 16
  nativo (`apt`, ya presente) como root, simulando con un harness mínimo
  los roles (`anon`/`authenticated`/`service_role`/`supabase_auth_admin`),
  `auth.users` y `auth.uid()`/`auth.jwt()` — y aplicar las 11 migraciones
  en orden, de punta a punta, sin errores, contra una base limpia.
- **Prueba de concurrencia real** (no simulada, no solo revisión de
  código): dos transacciones separadas (`psql` en dos procesos de
  sistema operativo distintos), sincronizadas con una barrera explícita
  en base de datos para forzar que ambas ejecuten `crear_pedido()` con
  el **mismo** `user_id`/`idempotency_key`/`items` en el mismo instante
  (arrancaron con **5 ms** de diferencia, verificado con
  `clock_timestamp()`). Resultado: **un solo pedido** (`SGQ-B8DK8J`),
  confirmado con `select count(*) ... where idempotency_key = '...'` → 1.
  La segunda transacción esperó el candado advisory, vio el pedido ya
  comiteado por la primera, y lo devolvió tal cual — sin duplicar.
- Misma prueba para `confirmar_comprobante()`: dos transacciones
  concurrentes (100 microsegundos de diferencia) confirmando el mismo
  pedido con distinto archivo de comprobante. Resultado: **un solo
  `payment_proofs`** insertado; la segunda llamada recibió el error de
  negocio "Este pedido ya no está pendiente de comprobante." y se
  revirtió limpio, sin dejar fila huérfana.
- Defensa en profundidad verificada por separado: un `INSERT` directo a
  `orders` con una `(user_id, idempotency_key)` ya usada es rechazado por
  el índice único, incluso sin pasar por `crear_pedido()`.
- `npm run build` y `npm run lint` pasan limpio.

**Lo que NO se hizo, a propósito:**

- No se agregó expiración a la llave de idempotencia. Decisión técnica
  documentada en el propio SQL: nunca expira, es 1:1 con "un intento de
  checkout"; un refresh de `/pagar` genera una llave nueva porque es, en
  los hechos, un intento de compra distinto. No se abrió como pregunta
  abierta (PA) porque el criterio es defendible por sí solo, tal como
  permitía el encargo.
- No se le agregó una llave de idempotencia al formulario de comprobante:
  `confirmar_comprobante()` no crea un recurso nuevo por clave (reemplaza
  o inserta bajo el candado de la fila del pedido), así que agregar una
  llave ahí habría sido protección redundante sin un riesgo real que
  cerrar — documentado en el punto 3 de arriba.

### Quinto incremento (2026-09-21): corrección de la regla de traducción literal — chrome del sitio + portada

**El problema que se corrigió:** la dueña reclamó, comparando capturas,
que el frontend público no seguía `index.html` "tal cual" como pedía su
instrucción explícita (`perfil.md` "Regla de traducción a código",
`requerimientos.md` H1.5). El segundo incremento (catálogo público) se
había auto-autorizado once "simplificaciones deliberadas" — logo
sustituido por texto "SGQ", botones "Avisos"/"Ofertas" omitidos, colores
vía `var(--token)` en vez del hex literal del HTML, secciones inventadas
("Explora por categoría") en vez de las reales del demo ("Para Ti"), y
varias piezas completas del HTML sin construir (franja de confianza,
barra flotante, degradado del encabezado, mega-menú "DESTACADO",
marquesina de marcas, botón flotante "Asesor"). Eso incumplía la regla:
"si algo no está claro se pregunta, no se simplifica por decisión propia".

**Qué se corrigió, componente por componente** (todo con valores hex
literales del HTML, no tokens de `globals.css` — instrucción explícita de
la dueña, verificada con estilos computados en el navegador: `#FF4D5E` y
`#EAF2F8` exactos):

1. **`EncabezadoSitio.tsx` — reescrito completo.** Logo real
   (`uploads/ChatGPT Image Sep 18, 2026, 10_42_49 PM.png`, copiado a
   `public/uploads/`), botones "Avisos" y "Ofertas" con sus SVG exactos y
   el punto rojo de notificación, barra flotante que reaparece al subir
   scroll y se oculta al bajar (`floatNavStyle`, index.html:39-60),
   degradado del encabezado que cicla cada 5 s sobre los 3 colores fijos
   del demo (`headerStyle`, index.html:2136 — nota de diseño: en el demo
   ese arreglo de colores nunca fue dato editable, es contenido fijo del
   componente, no de una tabla; aquí el encabezado cicla su propio estado
   en vez de compartir el `state.heroSlide` global de la SPA, mismo
   intervalo), mega-menú con el panel "DESTACADO" (producto más vendido
   real por grupo, nueva función en `obtenerNavegacionGrupos()`), chips de
   navegación en móvil, destello (`sgFlash`) del botón de carrito al
   agregar algo.
2. **`BannerHero.tsx` — reescrito completo.** Ahora es la sección
   `index.html:276-338` entera (antes solo traducía el carrusel): capas de
   degradado radial por banner, imagen real con crossfade, puntos,
   `PanelResenas` al lado, y la franja de confianza (envío / factura /
   asesoría) debajo. Los colores del degradado por banner
   (`gradient_from`/`gradient_to`) ya existían como columnas en
   `0006_servicios_y_contenido.sql` desde un incremento anterior — no se
   inventó nada, solo se empezaron a usar.
3. **`supabase/seed_dev.sql`** — se agregaron los 3 banners literales de
   `heroSlidesData` (index.html:1955-1959) con sus colores exactos y las
   imágenes reales `uploads/hero1.png`/`hero2.png`/`hero3.png` (antes
   solo había un banner con una URL de Pexels y sin degradado).
4. **`ParaTi.tsx`** (nuevo) — la sección "Para Ti" (index.html:340-372)
   que el segundo incremento había sustituido por una "Explora por
   categoría" inventada. Nueva consulta `obtenerParaTi()` en `catalogo.ts`:
   arma las pestañas a partir de subcategorías reales con productos (no
   hardcodeadas), con el mismo criterio de "las más surtidas primero" que
   usaba el demo con datos dummy.
5. **`BotonAsesorFlotante.tsx`** (nuevo) + **`ToastProvider.tsx`** (nuevo,
   contexto de cliente) — botón flotante "Asesor" (index.html:1860-1863).
   El número de WhatsApp real es H4/PA-5 (no construidos todavía), así que
   reproduce el mismo aviso de juguete del demo (`say('Abriría WhatsApp
   con un asesor')`) en vez de inventar un enlace a un número que no
   existe — documentado en el propio componente, no omitido en silencio.
   El `ToastProvider` también cerró huecos reales: "Agregado a tu pedido"
   al usar el botón de las tarjetas (que no tenía `onClick` desde el
   segundo incremento) y "Avísame cuando llegue" en agotados.
6. **`PiePagina.tsx`, `CintaMarcas.tsx`, `PanelResenas.tsx`,
   `AcordeonFaqs.tsx`** — mismos datos y estructura de antes, pasados a
   hex literal; se agregó la marquesina infinita real (`sgMarquee`, antes
   era un scroll horizontal simple) y el botón "Ver todas" de reseñas.
7. **`globals.css`** — se agregaron los 7 `@keyframes` literales del
   `<helmet>` de `index.html` (`sgPulse`, `sgRec`, `sgScan`, `sgFlash`,
   `sgWake`, `sgIn`, `sgMarquee`) que faltaban.
8. **`TarjetaProducto.tsx`** — chips de especificaciones cortas (nuevas,
   derivadas de `products.attributes`, hasta 3 valores) que el demo
   pintaba en "Más vendidos" (`p.specs`) y que no existían; se conectó de
   verdad el botón "Agregar al pedido" (antes solo tenía el estilo final
   sin `onClick`, hueco heredado del segundo incremento).
9. **`page.tsx`** — reescrito con el orden y las secciones reales de
   `index.html:275-515`: muro de video, "Para Ti", "Más vendidos", "Cómo
   comprar", "Servicios" (nueva, no existía), "Sectores que atendemos",
   marquesina de marcas, preguntas frecuentes. La sección "Arma tu sistema
   completo" (kit con SKU inventado) sigue sin construirse: es PA-21,
   **ya cerrada por la dueña el 2026-09-20** ("no existe un concepto real
   de 'kit destacado'"), no una omisión nueva.
10. **`next.config.ts`** — dos correcciones reales (no solo de esta
    sesión de prueba): el protocolo de `NEXT_PUBLIC_R2_PUBLIC_URL` se
    deriva de la URL en vez de asumir `https` fijo, y se agrega el puerto
    al patrón cuando la URL lo trae — sin esto, cualquier CDN que use un
    puerto no estándar habría fallado en producción igual que falló en
    pruebas locales. `dangerouslyAllowLocalIP` solo se activa fuera de
    producción (protección SSRF de Next 16 que bloqueaba imágenes locales
    en desarrollo; en producción el CDN siempre es un dominio público real).

**Verificación visual hecha (no solo "compila"):** se sirvió `index.html`
por HTTP (`npx serve`) y se abrió con Playwright headless (Chromium ya
instalado, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). El demo no
renderizaba nada al principio (pantalla en blanco): `support.js` carga
React/ReactDOM/Babel desde `unpkg.com`, bloqueado por la política de
salida de este entorno (mismo tipo de bloqueo ya documentado para
`supabase start`/Docker en incrementos anteriores) — se resolvió
descargando esos mismos paquetes por versión exacta desde el registro de
npm (sí permitido) y sirviéndolos en local, inyectados vía
`window.__resources` (mecanismo de override que el propio `support.js` ya
soporta, sin tocar `index.html`). Con eso el demo sí renderizó completo y
se pudo comparar contra `localhost:3000` lado a lado.

Para tener datos reales que comparar: se instaló Postgres 16 nativo (ya
disponible), se aplicaron el mock de plataforma (`/tmp/0000_mock_supabase_platform.sql`,
solo local, no se sube), las 11 migraciones y ambos seeds. A diferencia de
incrementos anteriores, esta vez también se consiguió levantar **PostgREST
real** (binario oficial descargado del release de GitHub, permitido por la
política de salida) apuntando a ese Postgres, con roles `anon`/
`authenticated`/`service_role` vía JWT HS256 generado localmente, detrás
de un proxy Node mínimo (~40 líneas, sin dependencias) que emula las rutas
`/rest/v1` de Supabase — así la app corrió contra datos reales de verdad
(no solo SQL a mano), la limitación que los cuatro incrementos anteriores
habían dejado documentada como bloqueo de red. Nada de esta infraestructura
de prueba (PostgREST, el proxy, los JWT, `.env.local`) se sube al
repositorio.

**Comparación final:** capturas lado a lado en escritorio (1440×900) y
móvil (390×844) de `index.html` vs `localhost:3000`, más un acercamiento
al encabezado. Colores verificados con estilos computados del navegador,
no solo a ojo (`rgb(255,77,94)` = `#FF4D5E`, `rgb(234,242,248)` = `#EAF2F8`,
exactos). El resultado es una coincidencia estructural y visual muy
cercana: mismo encabezado con logo real/Avisos/Ofertas/cuenta/carrito,
misma navegación con mega-menú, mismo hero con capas e imagen real, mismo
panel de reseñas, misma franja de confianza, mismo "Para Ti", mismos
"Más vendidos" con specs y barras, misma franja de marquesina, mismo pie,
mismo botón flotante de Asesor.

**Lo que NO quedó perfecto — honesto, no maquillado:**

- **Las fotos de servicio (Monitoreo/Guardias/Financiamiento) no se vieron
  en la captura de este entorno**: son URLs de `images.pexels.com`,
  bloqueadas por la misma política de salida que bloqueó `unpkg.com`. El
  código es correcto (mismo patrón que ya usaba `seed_dev.sql` desde el
  segundo incremento) — es una limitación de este entorno de prueba, no
  del código. Se verá bien en cualquier entorno con salida a internet
  normal.
- **Sugerencias de búsqueda en vivo** (`showSuggest`, index.html:84-96,
  lista bajo el campo mientras se escribe) **no se construyeron.** Es la
  única pieza de `index.html` que se dejó fuera de este incremento a
  propósito por presupuesto de tiempo, no por decisión de diseño — sigue
  pendiente, no está resuelta como PA porque no depende de una decisión de
  negocio, solo de tiempo de implementación.
- **El degradado del encabezado no está perfectamente sincronizado en
  color con el banner real que se ve en el hero en todo momento**: cada
  uno cicla su propio índice cada 5 s de forma independiente (ver punto 1
  arriba) — con los 3 banners de `seed_dev.sql` sembrados a propósito
  iguales al demo arrancan sincronizados, pero pueden desalinearse con el
  tiempo o si el admin agrega/quita banners reales. Es una limitación
  conocida y documentada, no un error silencioso.
- **No se tradujo el panel "DESTACADO" con la animación exacta de hover
  del demo** (el demo lo cambia con `onMouseEnter` en cada fila del
  mega-menú; aquí también, pero no se verificó el detalle de temporización
  del `onMouseLeave` del contenedor completo pixel a pixel).
- El resto de páginas del sitio (listado, ficha de producto, carrito,
  cuenta) **no se tocaron** en este incremento — seguían usando `var()`
  antes y lo siguen haciendo: quedan fuera del alcance explícito de este
  encargo (chrome + portada), aunque tienen la misma desviación que
  motivó el reclamo. Recomendado como próximo incremento si la dueña
  quiere el sitio completo 100% literal, no solo portada + chrome.

**Decisiones técnicas nuevas que vale la pena que el Arquitecto revise:**
- `obtenerNavegacionGrupos()` ahora hace una consulta adicional por grupo
  (destacado + su imagen) — 6 grupos, aceptable a esta escala, mismo
  criterio que ya usaba la función.
- `obtenerParaTi()` es una consulta más pesada (cuenta productos por cada
  subcategoría raíz de los 6 grupos para elegir las pestañas) — también
  aceptable a esta escala (~54 subcategorías), pero si el catálogo crece
  mucho más podría valer la pena cachear el resultado en vez de calcularlo
  en cada carga de portada (la portada ya es `force-dynamic`).

### Sexto incremento (2026-09-21): cierre completo del lado del cliente —
Épica D (D1 solicitar devolución, D3 usar saldo), Épica E (servicios/leads),
páginas de contenido y legales, y dos enlaces rotos preexistentes

**Encargo explícito de la dueña:** completar todo lo faltante del lado del
cliente para poder arrancar con el panel admin, sin necesidad de probar
end-to-end lo que depende de un panel que todavía no existe (aprobar
devoluciones, ver leads de servicio).

**Qué se construyó:**

1. **D1 · Solicitar devolución (cliente).** Nueva migración
   `supabase/migrations/0012_devoluciones.sql`: función
   `solicitar_devolucion()` (mismo patrón que `crear_pedido()` — folio vía
   `generar_folio()`, `service_role`-only, ya que la política RLS pública
   de `returns` no alcanza para generar folio de forma segura desde el
   cliente). Valida en una sola transacción: el pedido es del cliente y
   está `entregado`, está dentro del plazo (`settings.return_window_days`,
   PA-3 = 30 días), y la cantidad solicitada no excede lo comprado menos lo
   ya devuelto (sumando devoluciones previas no rechazadas). Calcula el
   porcentaje/crédito **estimado** por partida según RN-6 (100% sellado,
   70% abierto, 0 y "lo revisa un asesor" para "otro") — el monto final
   sigue siendo D2 (panel admin, fuera de este incremento).
   El demo (`index.html`) no tiene este formulario — el botón "Solicitar
   devolución" ahí solo muestra un toast (`newReturn`, ver quinto
   incremento). Se diseñó una pantalla propia
   (`/mi-cuenta/devoluciones/nueva`, `FormularioNuevaDevolucion.tsx`)
   consistente con el resto de "Mi cuenta": selector de pedido elegible,
   checkbox + cantidad + condición por partida, motivo, fotos opcionales
   (mismo patrón de subida directa a R2 con URL firmada que ya usaba C2,
   incluida la validación de magic bytes — `mutations/devoluciones.ts`
   reutiliza `validarComprobante()` de `domain/comprobantes.ts`), y saldo
   estimado en vivo. `/mi-cuenta/devoluciones` (antes solo el blurb+2
   botones literales del demo) ahora también lista las solicitudes del
   cliente con su estado — el demo no la mostraba ahí; se agregó porque sin
   eso el cliente no tendría cómo ver qué pasó con lo que pidió (mismo
   criterio que ya existe para "Mis pedidos").
2. **`/devoluciones` (pública, política — antes no existía, enlace roto
   desde el pie de página).** Traducción literal de `index.html:1597-1644`
   (`isDev`): el plazo `[X] días... dato por confirmar` del demo ya está
   resuelto de verdad (`obtenerPlazoDevolucionDias()`, lee
   `settings.return_window_days`).
3. **D3 · Usar saldo a favor en el checkout.** `crear_pedido()` (0010) ya
   aceptaba `p_credit_to_apply` desde el incremento anterior — solo faltaba
   conectar el llamador. `CheckoutForm.tsx` ahora trae el bloque de saldo
   literal del demo (`showSaldo`/`applySaldo`, index.html:1069-1074) con el
   saldo REAL del cliente (`obtenerSaldoDisponible()`, no el $450 fijo del
   demo) — el bloque solo aparece si el cliente de verdad tiene saldo. El
   total y el checkbox de confirmación se ajustan cuando el saldo cubre el
   100% (RN-11/D3.3: sin comprobante que subir, pero tampoco avanza
   automático). Cadena completa: `esquemas/checkout.ts` (`creditToApply`) →
   `actions/pedidos.ts` → `mutations/pedidos.ts` → RPC (ya listo en SQL).
   `/mi-cuenta/saldo` (antes solo enlazada, sin página): saldo disponible +
   historial de movimientos (`credit_movements`), literal de
   `index.html:1285-1305` (`secSaldo`).
4. **Épica E · Servicios (leads).** `/servicios` (landing con las 3
   tarjetas + formulario inline, literal de `index.html:1453-1526`) y
   `/servicios/[tipo]` (detalle por tipo — incluye/cómo funciona/para
   quién es/FAQ, literal de `index.html:1528-1595` y `srvDetailData`).
   `enviarSolicitudServicioAction()` no requiere sesión (E1.3) e inserta en
   `service_requests` vía una nueva mutation con el mismo patrón de
   reintento de folio que ya usa `crear_pedido()`. **Anti-spam real
   (E1.4)**, no solo un campo: Cloudflare Turnstile (`WidgetTurnstile.tsx`
   + `domain/captcha.ts`, que verifica el token contra la API real de
   Cloudflare, no solo "si llegó algo") + honeypot como segunda capa
   (`esquemas/servicio.ts`, campo `sitioWeb` oculto con CSS). Las
   variables `NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY` ya
   existían en `env.ts` desde la arquitectura pero no se usaban en ningún
   lado — este incremento es el primero en conectarlas de verdad.
5. **Páginas de contenido que faltaban** (enlazadas desde el pie de página
   y/o el encabezado desde el segundo incremento, todas 404 hasta ahora):
   `/como-comprar` (literal, `index.html:1645-1669`), `/contacto` (literal,
   `index.html:1671-1721` — el formulario "Escríbenos" no persiste en
   ningún lado, igual que en el propio demo: ningún documento de negocio
   modela un mensaje de contacto genérico como recurso, a diferencia de E1
   que sí tiene su tabla; documentado en el propio componente, no omitido
   en silencio), `/preguntas-frecuentes` (literal, `index.html:1723-1745`,
   agrupa por `topic`), `/legal/[slug]` (privacidad y términos — el body
   real lo escribe la dueña desde H4/panel admin, fuera de este
   incremento; se sembró con la MISMA estructura de secciones y el mismo
   aviso "texto de relleno para el demo" que ya traía `index.html`, no se
   inventó redacción legal).
6. **Dos enlaces rotos preexistentes, sin relación directa con el encargo
   pero descubiertos al recorrer todos los enlaces del sitio (mismo
   criterio que el quinto incremento con el chrome):**
   - `/marcas`: el propio nav del demo manda este enlace a `home`
     (`index.html:2198`, `go: () => this.go('home')`) — nunca fue una
     pantalla real ni en el demo. Se corrigió `EncabezadoSitio.tsx` para
     apuntar a `/` en vez de a una ruta que nunca existió.
   - `/catalogo` (sin grupo): varios componentes ya enlazaban aquí
     (encabezado, carrito vacío, "Mis pedidos" vacío, y ahora también
     "Cómo comprar") sin que la ruta existiera. Se agregó
     `catalogo/page.tsx` que redirige al primer grupo real
     (`/catalogo/{slug}/todos`) — mismo criterio que ya usaba el mega-menú
     para "Promociones" en el quinto incremento.
   - Se corrigieron además, en el camino, dos enlaces internos con `<a>`
     en vez de `<Link>` en `RegistroWizard.tsx` (a `/legal/privacidad` y
     `/legal/terminos`) que el linter no marcaba como error hasta que esas
     rutas existieron de verdad.

**Validado en este incremento (de verdad, no solo que compilara):**

- `npm run build` y `npm run lint` pasan limpio (27 rutas nuevas,
  `tsc --noEmit` sin errores en todo el árbol).
- **`solicitar_devolucion()` probada contra Postgres real** (mismo
  Postgres 16 nativo + PostgREST + proxy del quinto incremento, no SQL a
  mano): 6 escenarios con datos reales insertados a propósito (un pedido
  entregado hace 5 días dentro del plazo, uno entregado hace 40 días fuera
  del plazo, uno no entregado) — éxito con condición "sellado" (100% exacto,
  $489.00 sobre un producto de $489.00), rechazo por plazo vencido, rechazo
  por pedido no entregado, rechazo al intentar devolver más piezas de las
  que quedan disponibles (compró 2, ya había una solicitud viva por 1),
  éxito de la pieza restante con condición "abierto" (70% exacto, $342.30),
  y rechazo al usar un `user_id` que no es dueño del pedido.
- **`crearSolicitudServicio()` probada contra Postgres/PostgREST real**
  (bypaseando el guard `server-only` con una reimplementación idéntica en
  un script de prueba efímero, no subido — la lógica de negocio real vive
  en `mutations/servicios.ts`): folio único generado, inserción completa
  con todos los campos, incluido el caso de financiamiento con
  monto/plazo.
- Las 27 rutas nuevas responden 200 (`/catalogo` responde 307 al grupo
  correcto) contra datos reales del seed de producción actualizado.
  Comparación visual con Playwright de `/como-comprar`, `/servicios` y
  otras contra el layout del demo — coincide.

**Lo que NO se pudo validar en este entorno (limitación de red/infra, no de
código — mismo tipo de bloqueo ya documentado en incrementos anteriores):**

- **El widget de Turnstile no se pudo ver renderizado**:
  `challenges.cloudflare.com` está bloqueado por la política de salida de
  este entorno (`connect_rejected`, mismo tipo de bloqueo que ya afectó a
  `unpkg.com`/Pexels/Docker Hub en incrementos anteriores). El código es
  el patrón estándar de Cloudflare (`next/script` + `window.turnstile.render`)
  y `verificarTurnstile()` llama a la misma API real que el propio widget
  usa — funcionará en cualquier entorno con salida a internet normal. Para
  este entorno se usaron las sitekeys de prueba oficiales de Cloudflare
  ("always passes") en `.env.local`, no reales.
- **No se pudo simular una sesión de cliente autenticada de extremo a
  extremo vía la UI** para ver renderizadas `/mi-cuenta/saldo`,
  `/mi-cuenta/devoluciones` y el bloque de saldo de `/pagar` con datos
  reales: el proxy local que emula Supabase (creado en el quinto
  incremento) solo cubre `/rest/v1`, no Auth completo — mismo límite ya
  documentado ("Auth no disponible en este entorno de prueba"). Mitigación:
  las queries nuevas (`queries/saldo.ts`, `queries/devoluciones.ts`) usan
  el mismo patrón de "consultas separadas por tabla" ya extensivamente
  probado en `queries/pedidos.ts`, y la pieza de mayor riesgo real (la
  función SQL transaccional) sí se validó de punta a punta. Recomendado
  antes de producción: una pasada manual de este flujo contra el proyecto
  de Supabase real.

**Decisiones técnicas nuevas que vale la pena que el Arquitecto revise:**
- Migración `0012_devoluciones.sql` — nueva función `service_role`-only,
  mismo patrón que `crear_pedido()`/`confirmar_comprobante()`.
- `return_photos` se escribe siempre por `service_role`
  (`mutations/devoluciones.ts`, con la misma validación de magic bytes que
  C2) en vez de aprovechar la política RLS pública de inserción directa
  del cliente — consistencia de patrón con el resto de subidas de archivo,
  no porque la política esté mal.
- El formulario de contacto genérico (`/contacto`) no persiste a
  propósito — ver punto 5 arriba. Si en algún momento la dueña quiere que
  sí llegue a alguien, la ruta más simple sería reutilizar
  `notification_outbox` con un nuevo `event_type`, no crear una tabla
  nueva de mensajes.

### Próximo incremento: panel admin (Épica F, G, H) — ya es lo único que falta
para operar el negocio completo

Con este incremento, el lado del cliente queda funcionalmente completo:
catálogo, cuenta, carrito, pedido y pago, comprobante, devoluciones y saldo,
servicios/leads, y todo el contenido de apoyo (cómo comprar, FAQ, legal,
contacto). El panel de administrador (`(admin)/admin/*`, todas carpetas
vacías todavía) es ahora el único hueco: sin él nadie puede validar un
comprobante, resolver una devolución, ni ver un lead de servicio desde una
interfaz — todo pedido con comprobante subido se queda esperando en
`comprobante_recibido` indefinidamente. C3 (aviso real por WhatsApp/correo
de un comprobante nuevo) tampoco tiene despachador todavía
(`notification_outbox` sigue encolando sin que nada la procese) — construir
el canal de correo (Resend, no bloqueado por PA-5) sigue siendo la pieza
más barata para cerrar ese hueco, independiente de si se hace antes o
después del panel.

### Séptimo incremento (2026-09-21): C3 — despachador real de notificaciones
(canal de correo vía Resend, WhatsApp queda listo pero no conectado — PA-5)

**El problema que cerró:** hasta este incremento, `notification_outbox`
encolaba eventos (patrón outbox, §7.3) pero nada los procesaba — un
comprobante subido quedaba esperando revisión sin que nadie se enterara,
salvo quien mirara la tabla a mano.

**Qué se construyó**, siguiendo al pie de la letra la estructura ya
documentada en `arquitectura.md` §7.3/§4 (`src/server/notifications/`):

1. **`tipos.ts`** — interfaz `CanalNotificacion` (`disponible()`/`enviar()`)
   y los 5 tipos de evento que hoy tienen un emisor real:
   `comprobante.recibido` (admin), `comprobante.recibido.cliente` (nuevo,
   ver punto 4), `pedido.enviado`, `pedido.cancelado`,
   `pedido.pago_rechazado`, `servicio.solicitado` (admin) y
   `servicio.solicitado.cliente`. Documentados también, sin emisor
   todavía, los que sí lista H3 pero dependen de piezas que no existen:
   `pedido.generado` (falta encolarlo en `crear_pedido()`),
   `pedido.pago_validado`/`devolucion.resuelta` (acciones del panel admin,
   Épica H, no construida), y verificación de cuenta/recuperación de
   contraseña (los manda Supabase Auth de forma nativa, nunca pasan por
   este outbox).
2. **`canales/correo.ts`** — activo desde el día 1 (Resend, ya instalado
   `npm install resend`), con un mapa `event_type → plantilla` en
   `plantillas/` (un archivo por correo, como pide la arquitectura) y
   `plantillas/layout.ts` (HTML con estilos en línea, el único método
   confiable entre clientes de correo; fondo claro a propósito — el modo
   oscuro del sitio no es buena práctica en correo). Un evento sin
   plantilla registrada se marca `fallido` con un mensaje claro en vez de
   fallar en silencio.
3. **`canales/whatsapp.ts`** — implementa la interfaz pero `disponible()`
   regresa `false` mientras `WHATSAPP_PROVIDER=none` (PA-5 sigue sin
   resolverse): conectar el proveedor real después no toca nada más que
   este archivo, tal como prometía la arquitectura. **`canales/nulo.ts`**
   — el "no hay proveedor" genérico que usa el despachador para cualquier
   canal no disponible, en vez de reventar o reintentar para siempre.
4. **Nueva migración `0013_notificaciones_despacho.sql`** (no se tocó
   0008/0010, mismo criterio que 0011 con `crear_pedido()`):
   - `notification_outbox.next_attempt_at`: el cron de reintentos
     necesita saber CUÁNDO reintentar sin inferirlo de `created_at`.
   - `apartar_pedido()` reemplazada (`create or replace function`, mismo
     cuerpo) para encolar también el correo al **cliente** cuando sube su
     comprobante (C2.4 lo pedía; antes solo se avisaba al administrador).
5. **`despachador.ts`** — `despacharPendientes()` (despacho inmediato,
   llamado desde `mutations/comprobantes.ts` y `mutations/pedidos.ts`
   justo después de que la función SQL ya hizo commit — nunca dentro de
   la transacción, criterio C3.2: una falla de Resend no puede revertir
   un cambio de estado ya confirmado) y `reintentarNotificacionesVencidas()`
   (para el cron: toma lo `fallido`/`pendiente` vencido, reintenta con
   espera creciente 2^intentos minutos, hasta 5 veces, luego `agotado`).
6. **`src/app/api/cron/reintentar-notificaciones/route.ts`** — protegido
   con `CRON_SECRET` (`Authorization: Bearer`, ya declarado en `env.ts`
   desde la arquitectura, sin usar hasta ahora).
7. **`mutations/servicios.ts`** — ahora encola `servicio.solicitado`
   (admin) y `servicio.solicitado.cliente` (confirmación, E1.5) tras
   crear la solicitud; es TypeScript puro (no una función SQL), así que
   el outbox se encola ahí mismo en vez de en una migración.

**Validado en este incremento (de verdad, no solo que compilara):**

- `npm run build`/`lint` limpios (solo 8 warnings de parámetros `_admin`/
  `_fila` no usados en plantillas que no los necesitan — misma firma que
  las que sí, a propósito, no bloquean nada).
- **El despachador real (código de producción, no una reimplementación)
  se corrió contra Postgres/PostgREST reales**, neutralizando
  temporalmente `server-only` en `node_modules` (nunca en el código
  fuente, restaurado al terminar) para poder importarlo fuera de Next.js:
  - `apartar_pedido()` (con el cambio de 0013) encola de verdad las 3
    filas esperadas, incluida la nueva al cliente con su correo real.
  - Las **7 plantillas de correo** (comprobante recibido ×2, pedido
    enviado/cancelado/pago rechazado, solicitud de servicio ×2)
    renderizaron sin errores y la llamada llegó hasta la API real de
    Resend — se confirmó con una API key de prueba inválida a propósito:
    el error 403 vino de Resend (mensaje de su lado), no de una excepción
    de JavaScript al construir el HTML.
  - El manejo de fallas se probó de verdad: con Resend rechazando por key
    inválida y WhatsApp sin proveedor, las filas quedaron `fallido` con
    `attempts=1`, `last_error` descriptivo y `next_attempt_at` en el
    futuro — exactamente el comportamiento esperado, no solo revisado en
    el código.
  - A diferencia de Cloudflare Turnstile (bloqueado por la política de
    salida de este entorno), **`api.resend.com` sí es alcanzable** — la
    limitación real para probar un envío exitoso de punta a punta es no
    tener una cuenta de Resend real todavía (dependencia externa de la
    dueña, ya documentada como tarea pendiente).

**Lo que NO se pudo validar:** un envío exitoso de verdad (necesita una
cuenta de Resend real con dominio verificado — sin eso, cualquier prueba
con una key inventada solo puede probar el camino de error, ya hecho).
Recomendado: en cuanto la dueña cree la cuenta de Resend y verifique un
dominio, correr `reintentarNotificacionesVencidas()` una vez contra el
proyecto real para confirmar el camino feliz también.

### Próximo incremento: sigue siendo el panel admin (Épica F, G, H)

Con C3 cerrado, el lado del cliente completo (catálogo, cuenta, pedido,
devoluciones, servicios) y el despacho de correo real, el negocio ya
puede operar de principio a fin salvo por un solo hueco: **nadie puede
validar un pago, resolver una devolución, ni gestionar el catálogo desde
una interfaz** — todo pedido con comprobante sigue esperando en
`comprobante_recibido` hasta que alguien lo mueva a mano en la base de
datos. El panel admin es ahora, sin ambigüedad, lo único que falta para
un ciclo de negocio completo.

### Octavo incremento (2026-09-21): E1.4 — límite de envíos por IP en el
formulario de servicios

Cerraba la única mitad pendiente de E1.4 ("protegido contra spam —
captcha o equivalente— **y con límite de envíos por IP**"): el captcha
(Turnstile) ya estaba del sexto incremento, el límite por IP no.

**Qué se construyó**, siguiendo la decisión ya tomada en
`arquitectura.md` §9.8 (tabla `rate_limits` en Postgres, no Redis — "evita
un servicio, una cuenta y una llave más que cuidar" a este volumen):

1. **Migración `0014_rate_limits.sql`** — tabla genérica `(scope, key,
   created_at)`, pensada para reutilizarse en H2 (5 intentos de login por
   15 min por correo, panel admin, todavía no construido) sin otra
   migración: solo un `scope` distinto. RLS con lectura de admin para
   depurar, igual que `notification_outbox`.
2. **`src/server/auth/limites.ts`** (ruta que ya anticipaba
   `arquitectura.md` §4) — `intentarConsumirLimite(scope, key, {
   maxIntentos, ventanaMinutos })`: cuenta intentos en la ventana: si hay
   margen, registra y permite; si no, bloquea sin registrar. Ante un
   error de Postgres deja pasar (un fallo del limitador nunca debe
   bloquear a un cliente real, mismo criterio que C3.2 aplicado a un
   candado que no protege dinero ni inventario). Sin IP/correo (`key`
   vacío), nunca bloquea.
3. **`server/actions/servicios.ts`** — 5 solicitudes por hora por IP
   (§9.8), verificado ANTES de Turnstile (evita gastar una llamada
   externa en quien ya está limitado) y ANTES del honeypot (un bot no
   puede usar el honeypot como escapatoria del límite).

**Validado contra Postgres real** (mismo método de las últimas veces:
`server-only` neutralizado temporalmente en `node_modules`, nunca en el
código fuente, restaurado al terminar): 3 intentos permitidos con
`maxIntentos=3`, 4º y 5º bloqueados: una IP distinta no se ve afectada
por el límite de otra, y sin IP nunca bloquea. `npm run build`/`lint`
limpios (mismos 8 warnings preexistentes de las plantillas de correo, sin
relación con este cambio).

### Estado del lado del cliente: sin pendientes conocidos

Con este incremento se cerraron los tres puntos que quedaban abiertos
(ver séptimo incremento): C3 (correo real), y ahora E1.4 completo. Las
únicas dos cosas que faltan del lado del cliente son decisiones de
negocio de la dueña, no código:
- **Sugerencias de búsqueda en vivo** — decorativo, quedó fuera por
  presupuesto de tiempo en un incremento anterior, no bloquea nada.
- **PA-4 (mensaje de política de envío en la ficha de producto)** —
  sigue con el texto genérico del demo hasta que la dueña confirme el
  plazo/costo real.

**El panel admin (Épica F, G, H) es ahora, sin ambigüedad, todo lo que
falta para operar el negocio de punta a punta.**

### Noveno incremento (2026-09-21): panel admin, primera tanda — acceso,
roles y tablero (H1-bis, H2, H5, H6, G2)

**Encargo explícito de la dueña:** "ya tenemos un artefacto con el diseño
del Admin, por favor replicar el diseño, literal como hicimos con el
cliente" — mismo criterio de H1 (traducción literal, no interpretación)
aplicado al panel vía H1-bis.

**La referencia visual.** El Artifact "Panel Admin SG Querétaro"
(`https://claude.ai/artifact/XEVXi92NzVSRYDmzVo6gNA`, un canvas de diseño
con un solo artboard interactivo) resultó ser **exactamente**
`panel-admin-maqueta.html` (archivo protegido, ya en la raíz del repo
desde antes de este incremento — confirmado con md5sum idéntico). Toda la
maqueta (13 pantallas: login, tablero, pedidos + 2 variantes de detalle,
catálogo, nuevo/editar producto, categorías, devoluciones + cajón de
resolución, solicitudes + cajón, analítica, configuración, importador CSV
en 2 pasos) se leyó completa del archivo del repo, no del Artifact.

**Qué se construyó en esta primera tanda:**

1. **CSS del panel** (`src/app/(admin)/admin.css`) — traducción literal
   del bloque `<style>` de la maqueta (mismas clases: `.tarjeta`,
   `.btn-primario/secundario/fantasma/peligro`, `.chip`, `.navitem`,
   `.badge`, `.cut-*`, etc.), con un único ajuste real: las variables de
   tipografía (`--font-title` etc.) apuntan a las mismas fuentes que ya
   carga `next/font` en el layout raíz (`--font-chakra-petch`...) en vez
   de volver a pedirlas a Google Fonts con el nombre literal — evita una
   petición duplicada, mismo patrón que `globals.css` del sitio público.
   Scopeado bajo `.admin-root` para no colisionar con el CSS del cliente.
2. **H2 — acceso seguro, en dos capas** (arquitectura §6.4): `proxy.ts`
   (capa 1) redirige sin sesión a `/admin/ingresar`; el layout
   `admin/(protegido)/layout.tsx` (capa 2) vuelve a resolver la sesión y
   además exige rol de staff (`server/auth/roles.ts`, nuevo —
   `obtenerSesionStaff()`, reutiliza `is_admin()`/`is_inventario()` que
   ya existían desde la arquitectura). Login propio
   (`iniciarSesionStaffAction`) que autentica con el mismo Supabase Auth
   del cliente pero cierra la sesión de inmediato si la cuenta no es
   staff — un cliente normal nunca queda ni un segundo con sesión activa
   dentro de `/admin`. Límite de 5 intentos/15 min por correo y por IP,
   reutilizando `rate_limits`/`intentarConsumirLimite()` del octavo
   incremento (mismo mecanismo, `scope` distinto — exactamente para lo
   que se dejó preparado).
   **Ruta protegida bajo un route group interno** (`admin/(protegido)/`)
   para que `/admin/ingresar` no quede atrapada detrás de su propio
   candado — el group no cambia ninguna URL.
3. **H5 — alcance del rol `inventario`**: `rutaPermitidaParaRol()`
   filtra tanto el menú del sidebar (H5.1, solo ve "Catálogo") como el
   acceso directo por URL (H5.2: `PantallaAccesoDenegado.tsx`, traducción
   literal de la maqueta, en vez de un error técnico o un redirect).
4. **Sidebar** (`SidebarAdmin.tsx`) — traducción literal salvo el bloque
   "VISTA DE DEMOSTRACIÓN" de la maqueta (los chips Admin/Inventario que
   ahí simulan cambiar de rol sin dos cuentas reales): omitido a
   propósito y documentado, no en silencio — aquí el rol viene de la
   sesión real, no hay nada que "cambiar" con un botón. Contadores reales
   (`obtenerContadoresPanel()`): comprobantes por validar, devoluciones
   pendientes, solicitudes nuevas.
5. **H6/G2 — el tablero, pantalla de entrada del rol `admin`**
   (`admin/(protegido)/page.tsx`) — la pantalla más grande de la maqueta,
   traducida completa con datos reales:
   - Tarjetas de atención (6, fotos del momento: comprobantes por
     validar, pedidos por enviar, devoluciones pendientes, solicitudes
     sin contactar, pedidos por vencer — a un día o menos del plazo de
     cancelación automática configurable, PA-7 — y productos agotados).
   - 4 KPIs con delta contra el periodo anterior de igual longitud
     (ventas, pedidos, ticket promedio, "se pagan" = tasa de conversión
     pedido→pago validado), 3 periodos (7 días/30 días/Este mes — el
     cuarto de la maqueta, "Personalizado", queda para una iteración
     posterior con selector de rango, no bloquea V1 por PA-8).
   - Gráfica de ventas por día (SVG, línea actual vs. periodo anterior),
     embudo de pedidos abiertos, más vendidos, importe por grupo (barra
     apilada), saldo a favor comprometido + tasa de devoluciones, stock
     crítico.
   - **G2.5 (estado sin datos) resuelto de verdad, no decorativo**: cada
     bloque con gráfica tiene su `EstadoVacioGrafica` cuando no hay datos
     en el periodo — necesario porque la base de datos real arranca
     vacía.
   - "Pago validado" (RN ya usada en G1) = pedido en `listo_envio`,
     `enviado` o `entregado`.

**Validado en este incremento:**

- `npm run build`/`lint` limpios (mismos 8 warnings preexistentes de las
  plantillas de correo).
- **El login del panel se probó visualmente con Playwright contra el
  servidor real** (Next.js + PostgREST + Postgres del mismo arnés de
  incrementos anteriores) — coincide pixel por pixel con la maqueta.
- El candado de capa 1 se probó real: `/admin` sin sesión responde 307 a
  `/admin/ingresar`.
- **La lógica matemática de los KPIs del tablero se probó contra
  Postgres real** (mismo truco de incrementos anteriores: neutralizar
  `server-only` en `node_modules`, nunca en el código fuente) con pedidos
  de prueba en distintos estados y fechas: delta de ventas 100% y delta
  de pedidos 0% verificados a mano contra los datos insertados — la
  fórmula es correcta.

**Lo que NO se pudo validar:** el login funcional de punta a punta con
sesión de staff real (el proxy que emula Supabase en este entorno solo
cubre `/rest/v1`, no `/auth/v1/token` — mismo límite ya documentado desde
el quinto incremento). Por lo tanto tampoco se pudo ver el Tablero
renderizado con sesión real en este entorno; sí se probaron por separado
sus piezas de mayor riesgo (login visual, candado, matemática de KPIs).
Recomendado: una pasada manual contra el proyecto de Supabase real en
cuanto exista un usuario `admin` de verdad.

### Décimo incremento (2026-09-21): panel admin, segunda tanda — Pedidos
completo (C5)

**Qué se construyó:**

1. **Nueva migración `0015_acciones_pedidos_admin.sql`** — las dos
   transiciones que faltaban, mismo patrón que 0008:
   - `validar_pago()`: `comprobante_recibido` → `listo_envio` (C5.3),
     fija `paid_at`. Cubre igual los pedidos normales y los RN-11
     (pagados 100% con saldo) — ambos llegan a `comprobante_recibido` por
     el mismo camino y requieren la misma confirmación humana explícita
     (decisión de la dueña, 2026-09-20).
   - `marcar_entregado()`: `enviado` → `entregado` (C5.3). **Fija
     `delivered_at`, que hasta este incremento ninguna función escribía**
     — sin esto, D1 (solicitar devolución, ya construida del lado del
     cliente desde el sexto incremento) nunca habría encontrado un
     pedido elegible de verdad: su `solicitar_devolucion()` exige
     `status = 'entregado'` y calcula el plazo desde `delivered_at`. Este
     incremento es, en los hechos, el que termina de cerrar D1.
2. **`mutations/admin/pedidos.ts`** — `validarPago`, `rechazarComprobante`
   y `marcarEnviado` llaman directo a sus RPC ya existentes;
   `marcarEntregado` a la nueva. `cancelarPedido` es la única con lógica
   propia en TypeScript: si el pedido tenía saldo aplicado (D3.4: "el
   saldo... se devuelve íntegro si el pedido se cancela"), lo devuelve
   vía `aplicar_saldo()` (kind `ajuste`) ANTES de liberar el apartado —
   documentado y probado con datos reales.
3. **2 plantillas de correo nuevas** (`pedido.pago_validado`,
   `pedido.entregado`) registradas en `canales/correo.ts` — el sistema de
   notificaciones del séptimo incremento ya tenía todo el mecanismo
   listo, solo faltaba agregar el evento y su plantilla.
4. **UI** (`admin/pedidos`, `admin/pedidos/[folio]`) — traducción literal
   de `panel-admin-maqueta.html:333-508`: bandeja con chips de estado +
   búsqueda + conteos reales; detalle unificado por una sola condición
   (`payment_method === 'saldo_completo'` decide la variante RN-11 vs.
   normal, en vez de duplicar la pantalla); comprobante mostrado con URL
   firmada de lectura (`firmarLecturaPrivada()`, ya existente); historial
   con los 5 pasos posibles del flujo, marcados según ocurrieron de
   verdad; acciones con modal de confirmación (`AccionesPedido.tsx`,
   client component, un solo componente para las 5 acciones porque
   comparten el mismo patrón "modal → Server Action → refrescar").
5. **Exportar CSV** de la bandeja (`/api/admin/pedidos/exportar`, Route
   Handler protegido con el mismo candado H2/H5 que el resto del panel)
   — la maqueta tiene el botón; C5 no lo exige explícitamente como
   criterio escrito, pero está en la maqueta y H1-bis pide traducirla
   literal, así que se implementó de verdad, no como botón decorativo.

**Validado contra Postgres real, con las funciones SQL y el código de
producción (no reimplementaciones):**

- `validar_pago()`: transición correcta + `paid_at` fijado + rechazo
  correcto de un segundo intento sobre un pedido que ya avanzó.
- Flujo completo `validar_pago → marcar_enviado → marcar_entregado`
  sobre el mismo pedido: bitácora de 3 pasos correcta, `delivered_at`
  fijado, y las 3 notificaciones (`pago_validado`, `enviado`,
  `entregado`) encoladas correctamente.
- `cancelarPedido()` (mutation TypeScript, bypaseando temporalmente
  `server-only` en `node_modules` como en incrementos anteriores, nunca
  en el código fuente): con un pedido de $300 de saldo aplicado, tras
  cancelar se verificó el movimiento de saldo real en
  `credit_movements` — `ajuste` de `+$300.00`, descripción correcta.
- Candado de capa 1 probado real: `/admin/pedidos` sin sesión responde
  307 a `/admin/ingresar`.
- `npm run build`/`lint` limpios (mismos warnings preexistentes de
  parámetros `_admin` sin usar en plantillas, +2 por las plantillas
  nuevas, mismo patrón, no bloquean nada).

**Lo que NO se pudo validar:** igual que en la primera tanda, la UI con
una sesión de staff real (el proxy de este entorno no cubre
`/auth/v1/token`) — mitigado probando por separado cada pieza de mayor
riesgo (las funciones SQL, la mutation de cancelación, el candado).

### Decimoprimer incremento (2026-09-21): panel admin, tercera tanda —
Catálogo, alta y edición de producto (F1)

**Qué se construyó:**

1. **Nueva migración `0016_catalogo_admin.sql`**:
   - **`admin_change_log`** — bitácora genérica por `entity_type` (no
     solo de productos: H4.3 pide el mismo mecanismo para Configuración,
     "mismo criterio que F1.5" — se modela una sola tabla reutilizable en
     vez de duplicarla cuando llegue ese incremento).
   - **`crear_producto()`** (F1.1): SKU único validado, slug generado del
     nombre con reintento ante colisión (mismo patrón que
     `generar_folio()`).
   - **`actualizar_producto()`** (F1.2/F1.3): cada campo es opcional
     (`null` = "no cambiar"), sirve tanto a la edición completa como a la
     edición rápida de un solo campo (precio, en la tabla). Solo
     price/stock/status quedan en bitácora, como pide F1.5. "Baja" (F1.3)
     es este mismo camino con `status = 'descontinuado'` — nunca un
     DELETE, RN-9 en `diseño.md` ("la palabra «eliminar» no aparece nunca
     para productos").
   - **Bug encontrado y corregido durante la propia prueba contra
     Postgres real** (no en revisión de código): la primera versión de
     `actualizar_producto()` decidía si limpiar `condition_detail`
     comparando contra el parámetro crudo `p_condition` en vez del valor
     RESULTANTE de `condition` — si se editaba solo el stock de un
     producto que ya era "usado" (sin volver a mandar `p_condition`), el
     motivo visible al cliente se habría borrado por accidente. Corregido
     antes de aplicar la migración final.
2. **UI** (`admin/catalogo`, `admin/catalogo/nuevo`, `admin/catalogo/[id]`)
   — traducción literal de `panel-admin-maqueta.html:510-709`: lista con
   filtros (búsqueda, grupo, estado, condición) y edición de precio con
   doble clic en la tabla; formulario de alta/edición con la pestaña
   "General" completa (único formulario compartido entre crear y editar).
   Las otras 4 pestañas (Precio y stock, Fotos, Especificaciones,
   Documentos) quedan como placeholder explícito, igual que la propia
   maqueta — están documentadas en `diseño.md` §11.7 como pendientes de
   una pasada posterior (H1-bis.2), no inventadas ni omitidas en
   silencio. El comportamiento de "Usado" (stock fijo en 1, SKU sugerido
   con sufijo `-U1`) sale de `diseño.md` §11.7, que cubre lo que la
   maqueta no mostró por ser una interacción dinámica.
3. **Exportar CSV no era parte de esta pantalla** en la maqueta (solo
   Pedidos y Devoluciones lo muestran) — no se inventó.

**Validado contra Postgres real, con las funciones SQL y las mutations de
producción:**

- `crear_producto()`: slug con sufijo ante nombre duplicado, rechazo
  correcto de SKU duplicado.
- `actualizar_producto()`, el bug ya corregido: cambiar solo precio no
  toca condición; cambiar a "usado" con motivo lo guarda; **volver a
  llamar sin pasar `condition` preserva el motivo existente** (el caso
  exacto que habría fallado con el bug); volver a "nuevo" limpia el
  motivo a `null`. Bitácora verificada con las 2 filas correctas (price,
  stock) tras los cambios correspondientes.
- Las mutations de TypeScript (`crearProductoAdmin`/
  `actualizarProductoAdmin`, código de producción, no una
  reimplementación) probadas contra Postgres/PostgREST reales de punta a
  punta.
- `npm run build`/`lint` limpios (se encontraron y corrigieron 4 errores
  reales de lint en este incremento: dos `<a>` que debían ser `<Link>` y
  comillas sin escapar en JSX — quedan los mismos 10 warnings
  preexistentes de plantillas de correo).

**Lo que NO se pudo validar:** la UI con sesión de staff real (mismo
límite de siempre en este entorno).

### Decimosegundo incremento (2026-09-21): panel admin, cuarta tanda —
Categorías (F3)

**Qué se construyó:**

1. **Nueva migración `0017_categorias_admin.sql`**:
   - **`crear_grupo()`** — alta de un grupo de primer nivel, slug con
     reintento (mismo patrón que `crear_producto()`).
   - **`crear_subcategoria()`** — alta en cualquier nivel del árbol D7
     (`p_parent_id` nulo = primer nivel); valida que el padre, si existe,
     sea del mismo grupo (la FK no puede expresarlo, ya lo documentaba
     0003).
   - **`actualizar_categoria()`** — renombrar/ocultar, unificada para
     grupo o subcategoría con un parámetro `p_tipo` (una sola función en
     vez de dos casi idénticas).
   - **`eliminar_subcategoria()`** — la pieza más delicada de F3: rechaza
     el borrado si ELLA o CUALQUIER DESCENDIENTE (CTE recursiva, D7 no
     tiene límite de profundidad) tiene productos activos. Probado con un
     caso real de 2 niveles: producto en una sub-subcategoría, intento de
     borrar la subcategoría raíz — rechazado correctamente citando el
     conteo real de productos afectados.
2. **UI** (`admin/catalogo/categorias`) — traducción literal de
   `panel-admin-maqueta.html:711-774`: árbol expandible con conteo de
   productos activos por nodo, panel de edición a la derecha
   (nombre/slug/padre/visible-oculta/eliminar), botones "Nuevo grupo" y
   "Nueva subcategoría" con formularios inline.

**Validado contra Postgres real:**

- `eliminar_subcategoria()`: caso simple (subcategoría con hijo, sin
  productos) se elimina completa vía `on delete cascade`; caso con
  productos en un descendiente anidado se rechaza citando el conteo
  correcto — la recursión funciona de verdad, no solo en teoría.
- Las 4 mutations de TypeScript (código de producción) probadas de punta
  a punta contra Postgres/PostgREST reales: crear grupo, crear
  subcategoría, renombrar + ocultar, eliminar.
- `npm run build`/`lint` limpios (mismos 10 warnings preexistentes, sin
  errores nuevos).

**Lo que NO se pudo validar:** la UI con sesión de staff real (mismo
límite de siempre).

### Decimotercer incremento (2026-09-21): panel admin, quinta tanda —
Importador CSV, pasos 1 y 2 (F2)

**Decisión de seguridad tomada en este incremento:** F2.1 pide soportar
CSV y Excel. Se intentó instalar `xlsx` (SheetJS), la librería estándar
de npm para esto — `npm audit` reportó una vulnerabilidad de severidad
alta (prototype pollution + ReDoS) **sin parche disponible en el
registro de npm** (SheetJS mueve sus versiones parchadas a su propio CDN,
fuera de npm). Se desinstaló de inmediato y **este incremento solo
soporta CSV** — Excel queda documentado como límite real, no una omisión
silenciosa. El propio parser de CSV se escribió a mano (RFC 4180 básico:
comillas, comas y saltos de línea dentro de un campo) para no depender de
ninguna librería externa para esto tampoco.

**Qué se construyó** — solo pasos 1 y 2; el paso 3 ("Aplicar", por
lotes con avance en segundo plano, `diseño.md` §11.8) es trabajo real de
infraestructura (colas/jobs) que no es parte de este incremento, tal
como ya documentaba el plan:

1. **`server/domain/csvImportador.ts`** (código puro, sin
   `server-only` — mismo criterio que `domain/comprobantes.ts`: debe
   poder probarse sin infraestructura) — el parser de CSV y
   `filasCrudasDesdeTexto()` (valida que existan las columnas `sku` y
   `nombre`, si no, el mismo mensaje de `diseño.md`: "No encontramos las
   columnas «sku» y «nombre»...").
2. **`server/domain/validacionImportacion.ts`** (también puro) —
   `validarFilaImportacion()`, las reglas reales de F2.2: SKU vacío,
   precio/stock no numéricos, producto nuevo sin grupo/subcategoría,
   subcategoría que no existe (con el nombre exacto que falló, nunca un
   código), SKU existente → "Se actualiza" vs. nuevo → "Se crea".
3. **`analizarCsvAction()`** — recibe el archivo por `FormData`, lo
   parsea y valida contra el catálogo real (`obtenerCatalogoParaValidar
   Importacion()`), sin escribir nada en la base.
4. **UI** (`admin/catalogo/importar`) — traducción literal de
   `panel-admin-maqueta.html:1019-1094`, ambos pasos en un solo
   componente cliente (el archivo subido no se persiste entre pasos, no
   hay necesidad de dos rutas): tarjetas de conteo, filtro por
   correctas/con error/todas, descarga de plantilla y de las filas con
   error. El botón "Aplicar N productos" queda visible pero
   deshabilitado, con una nota explicando que la aplicación por lotes es
   la siguiente pieza — nunca se fingió una función que no existe.

**Validado (código de dominio puro, sin infraestructura — exactamente lo
que este diseño permite):**

- El parser: campos con comas dentro de comillas y comillas escapadas
  (`""`) parseados correctamente.
- Las 5 reglas de validación probadas con un CSV real: SKU existente →
  "Se actualiza"; SKU vacío → error; precio no numérico → error con el
  valor exacto citado; subcategoría inexistente → error; producto nuevo
  válido → "Se crea". Los 5 casos dieron el resultado esperado.
- `npm run build`/`lint` limpios, 0 vulnerabilidades de npm tras
  desinstalar `xlsx` (mismos 10 warnings preexistentes).

### Decimocuarto incremento (2026-09-21): panel admin, sexta tanda —
Devoluciones (D2)

**Qué se construyó** — traducción literal de
`panel-admin-maqueta.html:776-849` (`isDevoluciones`): bandeja con chips
de estado + cajón de resolución deslizante. Solo `admin` (H5.1, no es
parte del alcance de `inventario`):

1. **`supabase/migrations/0018_devoluciones_admin.sql`** —
   `resolver_devolucion()` (`service_role`-only): aprobar recalcula el
   `credit_amount` de cada partida según el porcentaje que el admin
   confirme (100/70/otro), abona el saldo con `aplicar_saldo()` (kind
   `devolucion`), y si el admin marca "regresa como nueva" sube el stock
   del producto; rechazar exige `resolution_note` (el cliente lo ve) y no
   toca inventario ni saldo. Ambos casos encolan su correo
   (`devolucion.aprobada` / `devolucion.rechazada`) y bloquean con un
   error claro si la devolución ya fue resuelta.
2. **Notificaciones** — dos plantillas nuevas
   (`plantillas/devolucionAprobada.ts`, `devolucionRechazada.ts`)
   registradas en `canales/correo.ts`; `notifications/tipos.ts`
   actualizado.
3. **`queries/admin/devoluciones.ts`** — bandeja (folio, fecha, cliente,
   pedido, producto, condición/% sugerido, monto, estado) con conteos
   por estado para los chips, y detalle para el cajón (motivo, condición,
   fotos firmadas, saldo actual del cliente, `unit_price` de cada partida
   para que el cajón calcule 100%/70%/otro en vivo).
4. **`mutations/admin/devoluciones.ts` + `actions/admin/devoluciones.ts`**
   — mismo patrón que Pedidos: la Action revalida solo tras un RPC
   exitoso y despacha el outbox justo después (C3.2).
5. **UI** (`TablaDevolucionesAdmin.tsx` + `admin/devoluciones/page.tsx`)
   — un componente cliente para la tabla y el cajón (el detalle se trae
   con una Server Action al abrir una fila, porque las queries de lectura
   exigen sesión de servidor); el cajón calcula el monto en vivo según el
   radio elegido, expone las 3 opciones de destino de la pieza física
   (regresa como nueva / publicar como usado / no revender — PA-10, se
   resolvió a favor del criterio detallado D2.6 sobre el resumen
   abreviado) y exige motivo antes de dejar rechazar.

**Validado contra Postgres 16 + PostgREST real** (mismo criterio de
`server-only` neutralizado temporalmente en `node_modules` para correr un
script standalone con `npx tsx`, nunca en el código fuente): se sembró un
usuario, pedido, dos partidas y sus devoluciones reales vía
`solicitar_devolucion()`, y se probó `aprobarDevolucion()`/
`rechazarDevolucion()` de principio a fin — aprobar al 100% con
reingreso subió el stock en 1 pieza exacta y generó el movimiento de
saldo correcto (`$500.00`, kind `devolucion`); una segunda resolución
sobre la misma devolución quedó bloqueada con el mensaje esperado;
rechazar sin motivo falló como debía y rechazar con motivo guardó el
`resolution_note`. Las queries de lectura (`crearClienteServidor()`, que
exige contexto de request de Next.js) se verificaron por revisión de
código contra el patrón ya probado de `queries/admin/pedidos.ts`, no por
script standalone — mismo límite documentado en tandas anteriores.
`npx tsc --noEmit`, `npm run build` y `npm run lint` limpios (mismos 12
warnings preexistentes, 0 errores).

### Decimoquinto incremento (2026-09-21): panel admin, séptima tanda —
Solicitudes de servicio (E2)

**Qué se construyó** — traducción literal de
`panel-admin-maqueta.html:851-910` (`isSolicitudes`): bandeja con
búsqueda + filtro por servicio + chips de estado, cajón de contacto.
Solo `admin` (H5.1). Más simple que Devoluciones/Pedidos porque
`service_requests` no mueve inventario ni dinero, así que no hizo falta
ninguna función SQL nueva — mismo razonamiento ya usado para
`crearSolicitudServicio()` (E1):

1. **`queries/admin/solicitudes.ts`** — bandeja filtrable por estado,
   tipo de servicio y búsqueda (nombre/correo/teléfono), con conteos por
   estado para los chips. Cada fila ya trae todos los campos capturados,
   así que el cajón de detalle no necesita una consulta aparte (a
   diferencia de Devoluciones, que sí agrega datos de varias tablas).
2. **`mutations/admin/solicitudes.ts`** — `actualizarEstadoSolicitud()`,
   un `update` directo con `service_role` (sin función SQL: no hay
   concurrencia que proteger).
3. **`actions/admin/solicitudes.ts`** — `marcarEnSeguimientoAction()` /
   `marcarCerradaAction()`, mismo patrón de guardia que el resto del
   panel.
4. **UI** (`TablaSolicitudesAdmin.tsx` + `admin/solicitudes/page.tsx`) —
   tabla + cajón con los 3 botones de contacto directo (`tel:`,
   `wa.me`, `mailto:`, sin integración real — igual que la maqueta) y
   las acciones de cambio de estado.
5. **`/api/admin/solicitudes/exportar`** — CSV, mismo patrón que
   `/api/admin/pedidos/exportar` (E2.4).

**Validado contra Postgres 16 + PostgREST real** (mismo criterio de
`server-only` neutralizado temporalmente): se creó una solicitud real vía
`generar_folio()` + insert directo, y se probó `actualizarEstadoSolicitud()`
de nueva → contactada → cerrada, confirmando en cada paso el `status` y
que `assigned_to` quedó con el id de quien resolvió. Se aprovechó la
misma corrida para volver a probar `resolver_devolucion()` end-to-end
(el entorno de Postgres/PostgREST/proxy local se había caído entre
sesiones y se reinició) — sin regresiones. `npx tsc --noEmit`, `npm run
build` y `npm run lint` limpios (mismos 12 warnings preexistentes).

### Decimosexto incremento (2026-09-21): panel admin, octava tanda —
Analítica (G1) + Configuración (H4)

**Qué se construyó** — última tanda planeada del panel admin (queda
solo el paso 3 del Importador CSV, documentado como pendiente real de
infraestructura, no como tanda):

**Analítica (G1)** — traducción literal de `panel-admin-maqueta.html:
913-956` / `diseño.md` §11.12: KPIs (piezas, importe, pedidos, ticket
promedio), más/menos vendidos con barras horizontales y "Ver los datos",
filtro por rango de fechas (7/30/mes/personalizado con validación de
rango), grupo, subcategoría (cascada cliente) y orden (unidades/importe),
más los 4 estados vacíos del diseño (sin ventas en el periodo, sin
ventas nunca, rango inválido, pocos datos). `queries/admin/analitica.ts`
reutiliza el mismo criterio de "pago validado" que `tablero.ts` (G1.2)
pero agrega lo que el tablero no necesitaba: rango arbitrario y filtro
por grupo/subcategoría (G1.3) — "menos vendidos" son productos que sí
vendieron al menos 1 pieza, nunca los que no vendieron nada. Exportación
CSV de ambos rankings completos.

**Configuración (H4)** — traducción literal de
`panel-admin-maqueta.html:960-1013`: 3 secciones que se guardan por
separado (bancarios / contacto / plazos), cada una con su propia Server
Action, para que un error en una no bloquee las otras (diseño.md
§11.13). Solo `admin` (H4.1, H5.1):

1. **`src/lib/clabe.ts`** (código puro, sin `server-only`) —
   `validarClabe()` con el algoritmo real de dígito verificador
   (módulo 10, pesos 3-7-1) y `agruparClabe()` para la vista previa
   agrupada como en `index.html` (`clabeGroups`).
2. **`supabase/migrations/0019_configuracion_admin.sql`** —
   `actualizar_configuracion()` (`service_role`-only): una llave a la
   vez, bitácora en `admin_change_log` (H4.3, misma tabla de F1.5) solo
   si el valor en verdad cambió. **Corrigió de paso una laguna real de
   la migración 0016**: `admin_change_log` se había creado sin el grant
   de tabla a `service_role` que sí tienen `products`/`returns` — no
   rompía nada porque hasta ahora solo se insertaba desde dentro de
   funciones `SECURITY DEFINER`, pero la lectura de "última
   modificación" de esta pantalla sí lo necesitaba. Se encontró
   corriendo la prueba end-to-end contra Postgres real, no por revisión
   de código.
3. **UI** (`ConfiguracionForm.tsx` + `admin/configuracion/page.tsx`) —
   CLABE validada en vivo con el mismo mensaje de error que el diseño
   ("Esa CLABE no es válida: tiene N dígitos y deben ser 18"), vista
   previa exacta de lo que ve el cliente, botón "Enviarme un correo de
   prueba" (nuevo evento `configuracion.correo_prueba` en el outbox, con
   su propia plantilla), y "Última modificación: [fecha] por [nombre]"
   por sección, leído de `admin_change_log`.
4. H4.4 ("las instrucciones de pago que ve el cliente siempre leen
   estos valores de aquí") no necesitó tocar código del lado
   público: `DatosTransferencia.tsx`/`queries/pedidos.ts` ya leían
   `settings` desde el incremento de Pedidos.

**Validado contra Postgres 16 + PostgREST real** (mismo criterio de
`server-only` neutralizado temporalmente): el checksum de CLABE se
probó con una CLABE válida (calculada a mano con el algoritmo real,
`032180000118359719`), una con dígito verificador incorrecto y una
corta — los 3 casos dieron el resultado esperado. `guardarConfiguracion()`
se probó de punta a punta: valor guardado y reflejado en `settings`,
bitácora con `old_value`/`new_value` correctos, sin fila nueva en la
bitácora al guardar el mismo valor dos veces, error claro ante una llave
inexistente, y el correo de prueba encolado y despachado (falla real de
Resend por API key de prueba, no de la lógica). `npx tsc --noEmit`,
`npm run build` y `npm run lint` limpios (14 warnings preexistentes del
mismo tipo, 0 errores).

### Plan de incrementos restante del panel admin

El panel tiene 13 pantallas en la maqueta. Las 13 ya están construidas.
Queda un solo pendiente, real y ya documentado en cada tanda anterior:

1. **Importador CSV, paso 3 ("Aplicar")** — requiere una tabla de
   trabajos por lotes y un procesamiento en segundo plano
   (`arquitectura.md` §9.5), infraestructura que no existe hoy. No es
   una tanda del panel en sí, es la pieza de infraestructura que falta
   para cerrar F2 por completo.

### Decimoséptimo incremento (2026-09-21): catálogo público — filtros
enriquecidos

La dueña compartió capturas de otro sitio (un distribuidor de cableado,
con panel de filtros mucho más rico que el nuestro) y pidió acercar el
listado del catálogo a ese patrón. Antes de tocar código se hizo un
gap-analysis contra el modelo de datos real y se le hicieron 4 preguntas
de negocio (no de diseño) porque la referencia mezclaba conceptos que no
aplican a SG Querétaro:

- **Sucursales** (la referencia tenía un filtro por ubicación): **no
  aplica** — un solo inventario, como ya estaba modelado. Se ignoró.
- **Badges** ("Envío gratis", "Instalación aérea", "Anti-roedores",
  "Cable blindado"): **se ignoraron por completo** — inspiración visual
  de otro catálogo, sin equivalente real en SG Querétaro.
- **"Caja abierta"** como toggle de Promociones: **sí se agregó**, como
  tercera condición real de producto (antes solo nuevo/usado).
- **Precio detrás de login** (patrón B2B de la referencia): **se
  mantienen precios públicos**, como ya definían los requerimientos
  (B2C, catálogo abierto) — no era una pregunta de diseño, hubiera
  significado revertir varias historias ya construidas.

**Qué se construyó** — todo dentro de `/catalogo/[grupo]/**`
(`ListadoCatalogo.tsx`, compartido por `/todos` y las rutas de
subcategoría):

1. **`supabase/migrations/0020_condicion_caja_abierta.sql`** — agrega
   `'caja_abierta'` al enum de `products.condition` (antes solo
   nuevo/usado). Redefine los dos `check` del CHECK original (Postgres no
   tiene `alter check`, hay que borrar y volver a crear). Se propagó el
   tipo `CondicionProducto` (ya existía en `types/database.ts`, ahora
   con el tercer valor) a los ~10 archivos que antes tenían la unión
   `"nuevo" | "usado"` copiada a mano: queries/mutations/actions de
   catálogo admin, `FormularioProducto.tsx` (tercer radio + su propia
   lista de motivos), `TablaCatalogoAdmin.tsx`, el badge de la ficha
   pública, `TarjetaProducto.tsx`, y el schema de Zod. "Caja abierta" se
   trató igual que "usado" en toda la mecánica ya existente (D6: pieza
   única, stock forzado a 1, motivo visible obligatorio) — el propio
   comentario original de la columna (`0003_catalogo.sql`) ya hablaba de
   "usado/abierto" como la misma idea.
2. **Atributos dinámicos por categoría, ahora sí filtrables (D1/PA-17)**
   — `category_attributes.filterable` existía desde el primer incremento
   del catálogo pero nunca se conectó a nada. `obtenerAtributosFiltrables()`
   (nueva, `queries/catalogo.ts`) arma una faceta de checkboxes con
   conteo real por cada atributo `filterable`/`data_type='text'` del
   grupo o de las subcategorías visibles; `listarProductos()` ahora
   acepta `atributos: Record<string, string[]>` y filtra con
   `.in(\`attributes->>${clave}\`, valores)` (la clave se valida contra
   `/^[a-z0-9_]+$/` antes de interpolarse en la ruta de la columna,
   nunca se confía en el nombre crudo). Verificado con el único atributo
   sembrado hoy (`resolucion` en Videovigilancia — `seed_dev.sql`): el
   filtro por "4 MP" bajó el listado de 5 a 2 resultados con el chip
   activo correcto, probado tanto contra Postgres real como en el
   navegador con el servidor de desarrollo corriendo.
3. **`PanelFiltros.tsx` reescrito** — sección "Promociones" (nuevo/caja
   abierta/en existencia, antes solo un checkbox de disponibilidad
   suelto), buscador sobre la lista de marcas cuando hay más de 6,
   secciones dinámicas por cada faceta de atributo filtrable, y sus
   chips activos correspondientes en `ChipsFiltrosActivos`. `lib/filtros.ts`
   extendido con `condicion: CondicionProducto[]` y
   `atributos: Record<string,string[]>` en el estado de `FiltrosListado`
   (todo sigue reflejado en la URL — `attr_<clave>=v1,v2`, criterio A4
   original).
4. **`BannerCatalogo.tsx`** (nuevo, más simple que `BannerHero` de
   portada: una sola imagen ancha, sin carrusel ni reseñas) +
   `obtenerBannerDeGrupo()` — la tabla `banners` (0006) ya existía y ya
   la administraba la dueña, pero solo se usaba en el home; ahora
   `/catalogo/*` también la muestra (banner propio del grupo si existe,
   si no uno genérico con `group_id` nulo).
5. **`TarjetaProducto.tsx`** — ahora muestra el nombre de marca (el dato
   ya existía en `ProductoTarjeta.marca`, nunca se pintaba) y el badge
   "Caja abierta" junto al de "Usado".

**Validado**: `npx tsc --noEmit`/`npm run build`/`npm run lint` limpios
(mismos 14 warnings preexistentes). Contra Postgres 16 + PostgREST real
(`server-only` neutralizado temporalmente): el CHECK nuevo acepta
`caja_abierta` y sigue rechazando cualquier otro valor; el filtro
`.in('attributes->>resolucion', [...])` y el `.or()` con `in.()` embebido
que arma el alcance grupo/subcategoría de `obtenerAtributosFiltrables()`
funcionan tal como los usa el código (ninguno de los dos tenía
precedente en el codebase, se verificaron aparte antes de confiar en
ellos). Además, con el servidor de desarrollo corriendo de verdad: se
tomó una captura del listado de Videovigilancia mostrando las 4
secciones del panel (Promociones/Marca/Precio/Resolución) y la marca en
las tarjetas, y otra tras aplicar el filtro de atributo confirmando que
el conteo bajó de 5 a 2 resultados con el chip correcto.

### Decimoctavo incremento (2026-09-21): encabezado con scroll +
barra de filtros pegajosa en catálogo móvil

La dueña compartió capturas de otros sitios (con una barra de filtros
compacta que se queda fija arriba al hacer scroll en móvil) y pidió ese
comportamiento. Al investigar el patrón equivalente en `index.html`
(`floatNavStyle`, `onScroll`, líneas 1991-2004/2139) se encontró que
**una sesión anterior había revertido deliberadamente ese comportamiento**
para todo el sitio (`EncabezadoSitio.tsx`, comentario de cabecera,
documentado como "pedido explícito de la dueña" porque consideraron que
el comportamiento del demo era un bug). Se le preguntó a la dueña si
confirmaba revertir esa decisión anterior — **confirmó que sí**, así que
esta tanda deshace esa desviación y además resuelve el pedido nuevo de
la barra de filtros en móvil, que no tiene precedente en `index.html`
(se construyó aparte, con el mismo mecanismo de `position:sticky`).

**Qué se construyó:**

1. **`EncabezadoSitio.tsx`** — el encabezado principal vuelve a ser
   `position:relative` (como el demo): en vez de sobreponerse siempre al
   contenido, se va con la página al hacer scroll (en la portada, con el
   hero, por eso el degradado que ya solo aplica en `/` — esa primera
   desviación del comentario de cabecera SÍ se mantiene, la dueña no pidió
   revertirla). Se agregó la barra flotante compacta (traducción literal
   de index.html:39-60): oculta por default, aparece solo al hacer scroll
   hacia arriba estando a más de 80px del top, se oculta de nuevo al bajar
   o acercarse al top — mismo estado que `floatNav` del demo, con la
   misma lógica exacta de `onScroll` (index.html:1991-2004) traducida a
   un `useEffect` con `window.scrollY`. Se quitó la medición de
   `--header-height` con `ResizeObserver` (ya no hace falta: el
   encabezado no se sobrepone a nada) y `LayoutTienda.tsx` ya no compensa
   con `padding-top`.
2. **`BarraFiltrosMovil.tsx`** (nuevo) + `ListadoCatalogo.tsx` — en
   catálogo móvil, un disparador "Filtros y orden" (index.html:596) que
   abre un cajón deslizante desde abajo con el `PanelFiltros` completo
   (index.html:600/2402, `filterPanelStyle`) — cajón que el sitio nunca
   había tenido: antes `PanelFiltros` solo se apilaba completo arriba de
   la cuadrícula en móvil, ocupando toda la pantalla. El disparador es
   `position:sticky`, así que al hacer scroll hacia abajo (una vez que el
   encabezado —ya `position:relative`— sale de vista) queda pegado arriba
   con solo el acceso a filtros; al volver al inicio de la página el
   encabezado completo reaparece de forma natural, sin JS adicional.
   **Bug real encontrado y corregido durante la propia verificación**: el
   primer intento envolvía el disparador en un `<div>` aparte con la
   clase que lo muestra/oculta por media query — `position:sticky` se
   "pega" dentro de los límites de su contenedor de bloque más cercano
   (su padre inmediato), y ese `<div>` envoltorio medía exactamente lo
   alto del botón, sin margen para quedarse pegado mientras se hacía
   scroll por el resto de la página (se iba con el scroll como si fuera
   `position:static`). Se corrigió poniendo la clase de visibilidad en el
   mismo nodo que `position:sticky`, para que su padre real sea la
   `<section>` completa (alta, con espacio de sobra).

**Validado con el servidor de desarrollo corriendo de verdad** (Playwright
vía navegador real, no solo lectura de código): en escritorio, captura en
el top de la portada (encabezado con degradado del hero), al hacer scroll
hacia abajo (encabezado completamente fuera de vista) y al hacer scroll
hacia arriba (barra flotante compacta visible: logo, buscador, cuenta,
carrito). En móvil, captura en el top del catálogo (encabezado completo +
disparador de filtros debajo del banner), al hacer scroll (disparador
pegado arriba, encabezado fuera de vista — se verificó primero que
`getBoundingClientRect().top` daba negativo, confirmando el bug antes de
corregirlo, y `0` después), y con el cajón de filtros abierto mostrando
las 4 secciones completas. `npx tsc --noEmit`, `npm run build` y
`npm run lint` limpios (mismos 14 warnings preexistentes).

### Decimonoveno incremento (2026-09-21): página de categoría unificada
con la de subcategoría + sección "Categorías" en el panel

La dueña notó que el rediseño del panel de filtros (decimoséptimo
incremento) solo se aplicó a las páginas de subcategoría
(`/catalogo/[grupo]/[...subcategoria]` y `/todos`), pero `/catalogo/[grupo]`
(la página de aterrizaje de una categoría) seguía siendo una pantalla
aparte (tarjetas de subcategoría + destacados, sin filtros ni banner —
traducción literal de index.html:517-581, `isGroup`). Pidió que entrar a
una categoría tenga el mismo panel, y que ese panel tenga una sección
"Categorías" que navegue el árbol: en una categoría se muestran sus
subcategorías raíz; dentro de una subcategoría se muestran sus hijas
(el "nivel 3" cuando aplica).

**Qué se construyó:**

1. **`queries/catalogo.ts`** — `obtenerSubcategoriasHijas(groupId,
   parentId)` (nueva), generaliza `contarProductosPorSubcategoriaRaiz`
   (eliminada, quedó sin uso) a cualquier profundidad del árbol:
   `parentId: null` regresa las categorías raíz; `parentId: <id>`
   regresa las hijas directas de esa subcategoría, cada una con su
   conteo de productos activos (incluyendo descendientes).
2. **`PanelFiltros.tsx`** — nueva sección "Categorías" (prop opcional
   `categorias: CategoriaNav[]`, con `href` ya armado por quien llama):
   lista de navegación (no checkboxes — son rutas, no filtros
   multi-selección) con conteo y una `›` indicando que lleva a otra
   página. Se oculta sola cuando no hay hijas (la hoja más profunda del
   árbol).
3. **`/catalogo/[grupo]/page.tsx`** — reescrita por completo: en vez de
   la pantalla de tarjetas + destacados, ahora renderiza el mismo
   `ListadoCatalogo` que una subcategoría (banner, Promociones, Marca,
   Precio, atributos dinámicos, orden, cajón de filtros en móvil), con
   "Categorías" mostrando las subcategorías raíz del grupo.
4. **`/catalogo/[grupo]/todos/page.tsx`**: mismo contenido (ya usaba
   `ListadoCatalogo`), ahora también con la sección "Categorías" —
   se conserva como ruta aparte porque varios enlaces del sitio
   (mega-menú, portada, contacto) ya apuntan ahí explícitamente.
5. **`/catalogo/[grupo]/[...subcategoria]/page.tsx`** — "Categorías"
   ahora muestra las hijas directas de la hoja actual del árbol (D7),
   con sus propios `href` construidos sobre la ruta en curso.
6. Limpieza: `PRODUCTOS_DESTACADOS_GRUPO` (constantes.ts) quedó sin uso
   y se eliminó junto con la función que reemplazó
   `obtenerSubcategoriasHijas`.

**Validado con el servidor de desarrollo corriendo de verdad** (captura
en navegador real en los 3 niveles): entrar a "Videovigilancia" (grupo)
muestra el panel completo con "Categorías" listando sus 9 subcategorías
raíz con conteo; entrar a "Cámaras IP y NVRs" (subcategoría nivel 1)
muestra sus propias hijas (4G, Bala, Cubo, etc.); entrar a "Bala"
(nivel 2, sin hijas en el catálogo de muestra) esconde la sección
"Categorías" por completo y muestra el estado vacío correcto (sin
productos en esa hoja). `npx tsc --noEmit`, `npm run build` y
`npm run lint` limpios (mismos 14 warnings preexistentes).

### Vigésimo incremento (2026-09-21): banner que persiste en todas las
categorías + orden dentro del cajón de filtros móvil

Dos correcciones puntuales que la dueña encontró al revisar el
decimonoveno incremento:

1. **Banner que desaparecía en categorías sin banner propio** —
   `obtenerBannerDeGrupo()` solo mostraba algo si había un banner exacto
   para ese grupo o uno genérico (`group_id` nulo); como no existe
   ningún banner genérico en los datos de muestra, categorías como
   "Control de Acceso" se quedaban sin franja promocional. Se agregó un
   tercer nivel de reserva: si tampoco hay uno genérico, se usa el
   primero activo — la franja debe persistir en todas las secciones del
   catálogo, no solo en las que ya tienen un banner propio asignado.
2. **"Ordenar por" ausente del cajón de filtros en móvil** — el
   disparador dice "Filtros y orden" pero el selector de orden nunca se
   metió adentro, solo quedó visible en la fila de resultados de
   escritorio. Se agregó `<SelectOrden>` al inicio del cajón
   (`BarraFiltrosMovil.tsx`), arriba de "Categorías"/"Promociones".

Validado con capturas del servidor de desarrollo real: "Control de
Acceso" ahora muestra el banner de reserva, y el cajón móvil de
"Videovigilancia" muestra "Ordenar por" justo debajo de "Filtros".
`npx tsc --noEmit`, `npm run build` y `npm run lint` limpios (mismos 14
warnings preexistentes).

### Corrección (2026-09-21): el banner del catálogo recortaba la imagen

`BannerCatalogo.tsx` forzaba la imagen a una caja ultra-panorámica fija
(1400×280, `object-fit: cover`) sin importar la proporción real de la
imagen subida — cualquier foto que no fuera exactamente esa relación de
aspecto se recortaba (perdía texto o contenido importante por arriba/
abajo). Se cambió a `object-fit: contain` con una altura responsiva
(`clamp(140px, 22vw, 280px)`): la imagen completa siempre se ve, sin
recortes, y el color de fondo (`gradient_from`) rellena el espacio
sobrante en vez de dejarlo en negro. Verificado por estilo computado
(`objectFit: "contain"`) contra el servidor de desarrollo real.
`npx tsc --noEmit`, `npm run build` y `npm run lint` limpios.

### Corrección (2026-09-21): el banner tapaba la columna de filtros

El banner se renderizaba como una franja de ancho completo por ENCIMA
de las dos columnas (filtros + productos), así que visualmente se
extendía sobre el espacio que le correspondía al panel de filtros. La
referencia de la dueña (Syscom) deja claro que el banner va únicamente
sobre la columna de productos, a la derecha del panel — nunca de ancho
completo. Se movió `<BannerCatalogo>` de ser hermano de la rejilla de
dos columnas a ser el primer elemento dentro de la columna derecha
(arriba de "Ordenar por"). Verificado con captura del servidor de
desarrollo real: el banner ahora empieza exactamente donde empieza la
columna de productos, alineado con "Categorías" a su izquierda.

### Corrección (2026-09-22): banners reales por categoría + causa raíz de
por qué ninguna imagen se veía en desarrollo

La dueña compartió 3 imágenes reales (Videovigilancia, Control de
Acceso, Automatización e Intrusión) para los banners de esas
categorías. Al agregarlas se encontró la causa raíz de por qué
**ninguna** imagen se había visto correctamente en todo este entorno de
desarrollo, ni banners ni fotos de producto: `.env.local` tenía
`NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.example.com`, un dominio de
ejemplo que nunca resuelve. El propio `server/config/env.ts` exige
`z.url()` para esa variable (no puede quedar vacía), así que la
corrección real es apuntarla al propio servidor de desarrollo
(`http://localhost:3000`, donde Next.js ya sirve `public/` tal cual) —
`.env.local` es local y no se sube al repo, así que este arreglo no
afecta producción (ahí sí debe ser el dominio real de R2).

**Qué se hizo:**
1. Las 3 imágenes se guardaron en `public/uploads/banners/` (mismo
   patrón que las imágenes del demo — no hay todavía un proyecto R2 real
   ni una pantalla de administración de banners).
2. `supabase/seed_dev.sql`: el banner de Videovigilancia (antes apuntaba
   a `hero1.png`, la imagen genérica del demo) se actualizó con la
   imagen real; se agregaron banners nuevos para Control de Acceso y
   Automatización e Intrusión. `brand_label` queda en `null` en los 3 —
   las imágenes ya traen su propio texto integrado, pintar una etiqueta
   encima sería redundante. Energía y Climatización sigue con las
   imágenes del demo (`hero2.png`/`hero3.png`) porque todavía no hay
   banners reales para ese grupo.
3. Aplicado también directo a la base de datos local para verlo de
   inmediato, no solo dejado en el script de semilla.

**Validado con el servidor de desarrollo real**: los 3 banners se ven
completos (sin recortar, gracias al `object-fit: contain` de la
corrección anterior), dentro de la columna de productos. Se confirmó
además que el carrusel de la portada (`BannerHero`, que lee la misma
tabla `banners`) sigue funcionando con la imagen real de Videovigilancia
sin romperse. `npx tsc --noEmit`, `npm run build` y `npm run lint`
limpios (mismos 14 warnings preexistentes).

### Corrección (2026-09-22): el banner de catálogo cambiaba también el
carrusel de la portada

Error real: la tanda anterior actualizó la fila de banner de
Videovigilancia (y agregó las de Control de Acceso y Automatización e
Intrusión) reutilizando la misma tabla `banners` que ya leía
`BannerHero` (el carrusel de la portada, `obtenerBannersActivos()` sin
distinguir destino) — nunca se pidió tocar el hero, solo los banners del
catálogo, pero al ser la misma fila el cambio se filtró a los dos
lugares.

**Corrección**: `supabase/migrations/0021_banners_placement.sql` agrega
`banners.placement` (`'home' | 'catalogo'`, default `'home'` para no
romper filas existentes). `obtenerBannersActivos()` (portada) ahora
filtra `placement = 'home'`; `obtenerBannerDeGrupo()` (catálogo) filtra
`placement = 'catalogo'` — dos consultas separadas, nunca la misma franja
reutilizada. Se restauró el banner original de la portada para
Videovigilancia (`hero1.png`, "Tu tranquilidad, nuestra prioridad",
`placement: 'home'`) como fila aparte, y los 3 banners reales de
categoría (2026-09-22) quedaron marcados `placement: 'catalogo'`.
`seed_dev.sql` actualizado para reflejar el mismo esquema en cualquier
entorno nuevo.

Validado con el servidor de desarrollo real: la portada vuelve a mostrar
el carrusel original de 3 slides (Videovigilancia/Energía×2) y el
catálogo de cada categoría sigue mostrando su banner real, sin mezclarse
entre sí. `npx tsc --noEmit`, `npm run build` y `npm run lint` limpios
(mismos 14 warnings preexistentes).

### Corrección (2026-09-22): espacio muerto arriba del banner + letterbox
a los lados

La dueña marcó con una captura un espacio vacío arriba del banner de
"Control de Acceso" y pidió aprovecharlo, más un contenedor "muy grande
a nivel de width". Dos causas distintas, confirmadas midiendo píxeles
de su captura (color de fondo exacto en cada zona, no a ojo):

1. **Espacio muerto arriba**: migas + `<h1>` + "N resultados" estaban
   sueltos ARRIBA de las dos columnas (filtros | productos), no dentro
   de ninguna. Como ese bloque es angosto (texto corto, alineado a la
   izquierda), dejaba vacía la franja a su derecha — justo el ancho de
   la columna de productos — antes de que el banner arrancara, ya que
   el banner sí estaba bien alineado con "Categorías" (su vecino de
   columna), solo que mucho más abajo de lo necesario. **Aprendizaje
   permanente**: en un layout de dos columnas, cualquier encabezado que
   se quiera "compartir fila" con una de las columnas debe vivir DENTRO
   de esa columna (o de un grid con `grid-template-areas`), nunca como
   hermano suelto arriba de la rejilla completa — si no, dejará vacía
   la franja de la columna que no lo necesita.
2. **Letterbox a los lados** (el "container muy grande a nivel width"):
   `BannerCatalogo.tsx` fijaba una altura en `clamp(…vw…)` independiente
   del ancho real de la columna, así que en viewports anchos el
   contenedor terminaba con una proporción (~3.8:1) más ancha que la
   imagen real (2000×667 = 3:1 exacto en los 3 banners subidos). Con
   `object-fit: contain` eso deja bandas del color `gradient_from` a los
   lados — casi invisibles aquí porque ese color es una variante muy
   cercana al panel navy de la propia imagen, pero espacio muerto real
   medible en píxeles. **Aprendizaje permanente**: una caja de banner
   nunca debe fijar alto y ancho por separado (uno en `vw`, el otro al
   100% del contenedor) cuando se espera que el contenido tenga una
   proporción conocida — `aspect-ratio` en el contenedor +
   `object-fit: cover` en la imagen es la combinación que garantiza cero
   espacio muerto sin importar el ancho real de la columna en cada
   viewport.

**Corrección**: `ListadoCatalogo.tsx` — la rejilla de dos columnas pasó a
usar `grid-template-areas` (`"titulo banner" "filtros banner" "filtros
contenido"`); migas/título/conteo (y el disparador móvil de filtros que
vive con ellos) ahora son el primer elemento dentro del área "titulo"
(columna izquierda), así que el banner (área "banner") arranca en la
misma fila que el título, no varias filas después. El orden en el DOM no
cambió (sigue siendo migas → título → conteo → filtros → banner → resto)
para no alterar la lectura por teclado/lector de pantalla ni el apilado
en móvil, que ahora tiene su propio `grid-template-areas` bajo el
`@media (max-width: 900px)` (`"titulo" "banner" "contenido"`).
`BannerCatalogo.tsx` cambió de `height: clamp(140px, 22vw, 280px)` +
`object-fit: contain` a `aspect-ratio: 3 / 1` + `object-fit: cover`.

**Cómo se validó** (con una salvedad importante frente a las
correcciones anteriores): este entorno de ejecución no tenía
`node_modules` instalado ni credenciales de Supabase, así que no se pudo
levantar `next dev` como en incrementos previos. En su lugar se midieron
los píxeles exactos de la captura de la dueña (Python/Pillow) para
confirmar la causa raíz, y se construyó una réplica estática del mismo
layout/CSS con la imagen real del banner, renderizada con Chromium vía
Playwright en 1895×877 (escritorio, viewport de la captura original) y
420×900 (móvil) — confirmando visualmente que el banner arranca alineado
con el título sin espacio muerto y llena su caja sin bandas a los lados,
y que el apilado móvil no cambió. **Pendiente**: confirmar en un entorno
con el servidor de desarrollo real corriendo contra Supabase antes de
darlo por cerrado con la misma certeza que las correcciones anteriores.

**Nota (2026-09-22)**: la dueña sí lo validó contra el servidor de
desarrollo real y funcionó — el 404 que reportó después era caché vieja
de Turbopack (`.next`) de una sesión anterior, no un bug de este cambio;
se confirmó comparando el mismo entorno en el commit anterior (200 ahí)
contra este commit con caché corrupta (404), y quedó resuelto al borrar
`.next` y volver a levantar `next dev`.

### Corrección (2026-09-22): hueco vacío debajo del banner al entrar a
una categoría hoja (tercer nivel, sin hijas)

La restructuración anterior (mover el título a la columna izquierda del
grid) usaba `grid-template-areas` con el banner ocupando 2 filas
("titulo" + "filtros") para que arrancara alineado con el título. Esas
2 filas son PISTAS DE GRID COMPARTIDAS entre ambas columnas — CSS Grid
reserva ese alto combinado sin importar cuál de las dos columnas lo
necesita. Funcionaba bien en una categoría o subcategoría con hijas
(el panel de filtros, con su sección "Categorías" poblada, ya era lo
bastante alto). Pero en una categoría hoja (tercer nivel, sin hijas:
"Categorías" se oculta sola, ver decimonoveno incremento) el panel de
filtros queda corto — y el grid igual reservaba el alto que pedía el
banner en esas 2 filas, dejando un hueco vacío entre el panel de
filtros corto y "Ordenar por"/la cuadrícula de productos (que recién
arrancaban después de que esas filas "oficialmente" terminaran).
**Aprendizaje permanente**: `grid-template-areas` con un ítem que
abarca varias filas fuerza esas filas a un alto mínimo compartido con
TODAS las columnas que las cruzan — nunca usarlo para "alinear el tope
de dos bloques de alto independiente"; para eso alcanza con que cada
columna sea un solo hijo del grid con su propio flujo interno normal
(`alignItems: "start"` ya alinea los topes sin acoplar los altos).

**Corrección**: se quitó `gridTemplateAreas` por completo. El grid
vuelve a ser de 2 columnas simples; el primer hijo agrupa migas + título
+ conteo + panel de filtros (antes repartidos en 2 divs con área
propia), el segundo agrupa banner + resto del contenido — cada uno un
bloque de flujo normal, así que el alto de una columna nunca fuerza el
de la otra. Mismo orden en el DOM, mismo comportamiento en móvil.

Validado con una réplica estática (Playwright/Chromium, mismo método que
la corrección anterior — este entorno sigue sin Supabase real) tanto con
panel de filtros alto (con "Categorías") como corto (sin ella, como en
"Cámaras IP y NVRs"): en ambos casos "Ordenar por" y la cuadrícula
arrancan justo debajo del banner, sin hueco. `npx tsc --noEmit` limpio.

### Corrección (2026-09-22): el degradado del encabezado no coincidía con
el slide del hero al volver a la portada (bug preexistente, no de los
incrementos anteriores)

La dueña notó que, navegando al catálogo y regresando a la portada, a
veces el color de fondo del encabezado (el degradado que imita el color
del slide activo del hero, punto 1 del comentario de cabecera de
`EncabezadoSitio.tsx`) no coincidía con el banner que realmente se veía
debajo. Pasaba "a veces" porque depende de cuánto tiempo estuvo fuera de
la portada.

**Causa raíz**: dos relojes independientes que debían quedar
sincronizados por casualidad, no por diseño:
1. `BannerHero.tsx` (dentro del árbol de la página de inicio, se
   desmonta al salir de `/` y se vuelve a montar al volver) reiniciaba
   su `indice` en `0` cada vez que se montaba.
2. `EncabezadoSitio.tsx` (vive en el layout raíz, nunca se desmonta)
   apaga su intervalo de 5 s mientras `!esHome` — su `heroSlideIdx` se
   quedaba **congelado** en lo que fuera que hubiera alcanzado antes de
   salir de la portada, en vez de seguir avanzando o resincronizarse al
   volver.

Con eso, al regresar a `/`: el hero siempre arrancaba en el slide 0
(verde, Videovigilancia), mientras el encabezado mostraba el color en
el que se congeló (podía ser cualquiera de los 3) — coincidían solo si
la persona pasó un múltiplo exacto de 5 s fuera de la portada.
**Aprendizaje permanente**: dos componentes que se desmontan en momentos
distintos (uno vive en el layout raíz, el otro dentro del árbol de una
página) nunca deben sincronizar un ciclo con temporizador incrementando
desde un estado local (`setInterval(() => setX((i) => i+1))`) — ese
patrón solo se mantiene sincronizado mientras ninguno de los dos se
desmonta jamás. Para que dos relojes independientes muestren siempre lo
mismo hay que calcular el índice desde una fuente de verdad compartida
que no dependa de cuándo se montó cada uno — aquí, `Date.now()`.

**Corrección**: en ambos componentes, el índice del slide se calcula
como `Math.floor(Date.now() / CICLO_MS) % N` (mismo período de 5000 ms
en los dos) en vez de incrementar desde el estado anterior. Para no
arriesgar un mismatch de hidratación (`Date.now()` corre distinto en
servidor y cliente), el `useState` inicial se queda en `0` — igual en
servidor y cliente — y la sincronización real ocurre en el `useEffect`
(cliente only), que llama a `sincronizar()` inmediatamente al montar/
entrar a la portada y luego cada `CICLO_MS` con `setInterval`.

Validado por lectura del código y la matemática (ambos calculan el
mismo `Math.floor(t/5000) % 3` para el mismo instante `t`, así que
coinciden sin importar cuál se montó primero o hace cuánto) — no se
pudo probar contra el servidor de desarrollo real en este entorno (sin
Supabase). `npx tsc --noEmit` limpio. **Pendiente**: confirmar
navegando catálogo → portada varias veces con distintos tiempos de
espera contra el servidor real antes de darlo por cerrado con la misma
certeza que las correcciones anteriores.

### Refactor (2026-09-22): un solo reloj compartido para el degradado del
encabezado y el carrusel del hero, en vez de dos `Date.now()` separados

La dueña, al ver la corrección anterior, propuso algo mejor: en vez de
que el encabezado y el hero calculen cada uno por su cuenta (aunque sea
con la misma fórmula), que haya un solo punto que controle el timing.
Tenía razón — dos cálculos independientes que solo coinciden porque
comparten la misma fórmula es frágil (cualquiera que cambie el período
en un solo lado, o el largo de un arreglo, rompe la sincronía otra vez
sin que el compilador avise). Se evaluó meterlos dentro de un mismo
contenedor visual (`<div>`), pero el encabezado vive en `SitioConChrome`
(la raíz de cada grupo de rutas — `(public)`, `(auth)`, `(cuenta)` — para
persistir sin desmontarse al navegar entre pantallas) mientras el hero
vive únicamente dentro del árbol de la página de inicio: envolverlos en
un mismo nodo del DOM habría exigido sacar el encabezado de la raíz y
renderizarlo solo desde la portada, perdiendo esa persistencia (el menú
móvil, la animación del carrito y la barra flotante se reiniciarían en
cada navegación, no solo al entrar/salir de la portada).

**Solución**: `CicloHeroProvider` (`src/components/providers/
CicloHeroProvider.tsx`), un Context nuevo con el mismo patrón que
`CarritoProvider`/`ToastProvider`, montado en `SitioConChrome` (junto al
encabezado, envolviendo también `{children}` — así cubre tanto
`EncabezadoSitio` como `BannerHero` cuando este último existe). Lleva
un único `setInterval` de 5 s que incrementa un contador (`paso`) desde
que carga el sitio, sin reiniciarse ni congelarse nunca — no vuelve a
haber "cuál se desmontó y cuál no" porque ya no hay dos relojes que
puedan desincronizarse entre sí. El Provider no sabe nada de banners ni
de colores: expone el `paso` crudo (sin aplicar el módulo), y cada
consumidor aplica `paso % <su propio largo>` (el encabezado, contra sus
3 colores fijos; el hero, contra sus banners reales de la base de
datos) — así ambos quedan atados al mismo reloj sin que el Provider
necesite conocer sus arreglos.

Con esto, `BannerHero` deja de necesitar un `useState`/`useEffect`
propios para el ciclo automático — solo le queda `indiceManual` (un
estado local mínimo para el clic en los puntos del carrusel, que se
limpia solo en el siguiente "paso" del reloj compartido para retomar el
auto-avance, igual que antes). `EncabezadoSitio` perdió por completo su
`useState`/`useEffect` del degradado.

**Aprendizaje permanente**: cuando dos componentes en árboles distintos
(uno persistente, otro que se monta/desmonta) necesitan quedar
sincronizados en algo que cambia con el tiempo, la solución correcta no
es "que ambos calculen lo mismo por su cuenta" (frágil, se rompe en
silencio si algo cambia de un solo lado) ni "meterlos en el mismo nodo
del DOM" (a veces imposible sin sacrificar la arquitectura de layouts
persistentes de Next.js) — es un Context/Provider colocado en el
ancestro común más alto que YA es persistente frente al remount del
componente más profundo, exponiendo el dato crudo (aquí, el contador de
pasos) para que cada consumidor lo traduzca a su propio dominio.

Validado con `npx tsc --noEmit` y `npm run build` (compila y tipa
limpio; el build se detiene después solo por variables de entorno
ausentes en este sandbox, igual que en incrementos anteriores) —
seguía sin ser posible probar contra Supabase real en este entorno.
**Pendiente**: la misma validación visual pendiente de la corrección
anterior (navegar catálogo → portada con distintos tiempos de espera
contra el servidor real).

### Datos (2026-09-22): bulk de 43 productos, uno por cada subcategoría
raíz que todavía no tenía ninguno

La dueña pidió un bulk de inserts para "la mayoría de las categorías,
al menos 1 producto", para empezar a ver "Para Ti" (`ParaTi.tsx`,
sección de la portada con pestañas por subcategoría y riel horizontal
que se desplaza solo) con contenido real y poder navegar entre
productos de categorías distintas. `obtenerParaTi()` arma hasta 8
pestañas a partir de las subcategorías RAÍZ (D7, `parent_id` nulo) que
tengan al menos un producto activo — de las 54 raíces reales
(`seed.sql`), solo 11 tenían alguno antes de este incremento (la
mayoría de los datos de muestra existentes se concentraban en
videovigilancia).

**Qué se hizo**: se agregaron los 43 productos que faltaban a
`seed_dev.sql`, uno por cada subcategoría raíz sin cubrir — Videovigilancia
(7), Control de Acceso (12), Automatización e Intrusión (9), Energía y
Climatización (7), Cableado Estructurado (8). El grupo GPS/Telemática
tiene una sola raíz y ya estaba cubierta, así que no se tocó. Precio,
stock y atributos son de relleno razonable (PA-11 sigue abierta, no es
catálogo real); cada foto reutiliza la misma URL de Pexels ya asignada
arriba para su GRUPO (no hay foto real por subcategoría todavía), para
no introducir URLs nuevas sin poder verificar que resuelven.

**Validación** (sin Supabase real en este entorno, igual que las
correcciones anteriores): se verificó por script que los 43 pares
(grupo, slug de subcategoría) usados en los `join` existen exactamente
como subcategoría raíz en `seed.sql` — un slug con typo aquí insertaría
0 filas sin dar ningún error, porque el `insert ... select ... join`
simplemente no encuentra coincidencia. También se verificó que no hay
SKU ni slug duplicado entre los 57 productos totales del archivo (14
previos + 43 nuevos), que los paréntesis del archivo cierran parejo, y
que los 57 `jsonb_build_object(...)` tienen número par de argumentos
(pares clave/valor completos). **Pendiente**: correr `supabase db
reset` (o el equivalente) contra un Postgres real y confirmar en el
navegador que "Para Ti" ahora muestra varias pestañas con productos
distintos — la validación de arriba descarta errores de sintaxis y de
referencia por slug, pero no reemplaza correr el script de verdad.

### Corrección (2026-09-22): "cuenta creada pero no pudimos guardar tu
dirección" + login que no funciona aunque el usuario existe en Auth

La dueña reportó el mensaje de dirección no guardada al registrarse, y
por separado que ve sus usuarios de prueba en Authentication → Users de
Supabase pero no puede iniciar sesión con ellos. Es el mismo bug,
encontrado leyendo `RegistroWizard.tsx` y `cuenta.ts`:

1. **`registrarCliente()`** regresa `requiereVerificacion: true` cuando
   Supabase Auth no entrega sesión activa al hacer `signUp()` — pasa
   cuando el proyecto exige confirmar el correo (por defecto en un
   proyecto de Supabase alojado; en local lo desactiva
   `supabase/config.toml` `[auth.email] enable_confirmations = false`,
   pero solo si el contenedor de Auth arrancó con esa configuración).
2. **`RegistroWizard.tsx`** entonces intentaba un login automático con la
   contraseña recién creada (`iniciarSesion(...)`) para no obligar a la
   persona a confirmar antes de comprar (§9.9) — pero **nunca revisaba
   si ese login funcionó**. Si la cuenta sigue sin confirmar, ese login
   también falla (silenciosamente, el resultado se descartaba), y el
   código seguía de largo llamando a `guardarDireccion()`/
   `guardarDatosFiscales()` sin ninguna sesión real — esas acciones
   exigen sesión (`conSesion()`, `_guard.ts`) y fallan con "Necesitas
   iniciar sesión para continuar.", que el wizard traducía al mensaje
   genérico "no pudimos guardar tu dirección" sin explicar la causa.
3. **`iniciarSesion()`** en `cuenta.ts` mapeaba CUALQUIER error de
   `signInWithPassword` (`error.code`) al mismo mensaje "Correo o
   contraseña incorrectos" — incluido `email_not_confirmed`, que es una
   cuenta real con la contraseña correcta, simplemente bloqueada por
   falta de confirmación. Por eso el login manual posterior "no
   funcionaba" sin ninguna pista de que el problema era la confirmación,
   no la contraseña.

**Corrección**:
- `cuenta.ts`: `iniciarSesion()` ahora distingue `error.code ===
  'email_not_confirmed'` y da un mensaje específico y accionable ("tu
  correo todavía no está confirmado...") en vez de mezclarlo con
  credenciales incorrectas.
- `RegistroWizard.tsx`: el resultado del login automático post-registro
  ahora SÍ se revisa. Si no hay sesión real, ya no intenta guardar
  dirección/facturación (fallarían igual, sin sesión) — muestra de una
  vez el mensaje correcto explicando que falta confirmar el correo, en
  vez del mensaje engañoso de "no pudimos guardar tu dirección".

**Para desatorar las cuentas de prueba que ya quedaron así** (creadas
pero sin confirmar): en Supabase Studio → SQL Editor,
`update auth.users set email_confirmed_at = now() where email = '...';`
las confirma manualmente sin necesidad de que llegue un correo real. Si
el entorno es Supabase local, alternativamente `supabase stop` +
`supabase start` para asegurar que Auth arranque con
`enable_confirmations = false` de `config.toml`. **Pendiente**:
confirmar con la dueña si está en Supabase local o en un proyecto
alojado — en un proyecto alojado, `enable_confirmations = false` de
`config.toml` NO aplica (ese archivo solo gobierna el CLI local); ahí la
confirmación se desactiva desde el dashboard del proyecto
(Authentication → Providers → Email → "Confirm email"), o si se prefiere
mantenerla activa, hay que configurar un proveedor SMTP real para que el
correo de confirmación sí llegue. `npx tsc --noEmit` limpio.

### Corrección (2026-09-22): un error del canal de notificaciones hacía
parecer que el pedido no se había creado, aunque sí

La dueña reportó `Module not found: Can't resolve 'resend'` (falta
`npm install` en su máquina — no es bug de código, `resend` sigue en
`package.json`) justo al completar una compra, y con razón hizo notar el
problema de fondo: "los errores no deben bloquear otros procesos ni
tirar la app, si algo falla se loguea y se muestra el error mas no
afecta otros procesos".

**Causa real**: `crearPedido()` (`mutations/pedidos.ts`) llama a
`despacharPendientes()` justo DESPUÉS de que `crear_pedido()` (función
SQL) ya hizo commit del pedido — a propósito, según el comentario ya
existente ahí citando C3.2: "el envío real es un efecto de red, no algo
que deba bloquear ni revertir un cambio de estado ya confirmado". El
comentario decía la intención correcta, pero el código no la cumplía:
`despacharPendientes()` no tenía ningún `try/catch` — cualquier falla en
esa franja (canal de correo mal configurado, red caída, hasta un error
de import como `resend` faltante) se propagaba hacia arriba y hacía que
la Server Action completa reportara error al cliente, **aunque el
pedido ya estuviera guardado**. Mismo patrón en otras 10 llamadas a
`despacharPendientes()` (confirmar comprobante, aprobar/rechazar
devolución, marcar enviado/entregado, etc. — `grep` confirmó 11 sitios,
ninguno con guarda).

**Corrección**: se envolvió el cuerpo de `despacharPendientes()` en un
`try/catch` que solo hace `console.error` y regresa — nunca propaga.
Arreglarlo en un solo lugar (el despachador) cubre los 11 sitios que lo
llaman, en vez de parchar cada `mutation` por separado. Las filas de
`notification_outbox` que no se lograron enviar se quedan en
`pendiente`/`fallido` tal como ya estaban diseñadas para quedar — el
cron de reintentos (`reintentarNotificacionesVencidas`, que si se deja
reventar en el endpoint del cron, sin cambios, porque ahí sí es
razonable que un 500 quede en el log de Vercel Cron) las recoge después,
así que ningún correo/WhatsApp se pierde, solo se retrasa.

Validado por lectura del código (no fue posible instalar `resend` ni
correr el flujo de compra real contra Supabase en este entorno) y
`npx tsc --noEmit` limpio. **Pendiente**: confirmar en el servidor real,
una vez que `npm install` esté al corriente, que completar una compra ya
no muestra error aunque el canal de correo falle.

### Corrección (2026-09-22): botón deshabilitado se seguía viendo activo
(color sólido) en vez de gris — bug del átomo `Boton`, no de una sola
pantalla

La dueña reportó que "Generar pedido" (en `/pagar`) se veía con el color
cian sólido de siempre aunque debiera estar deshabilitado sin dirección,
y por separado que el botón no reaccionaba a pesar de ya tener una
dirección guardada — sospechando que el toggle "Quiero factura" fuera
obligatorio.

**Causa real** (`Boton.tsx`, el átomo compartido de todo el sitio):
`estiloVariante(variante)` decidía el color SOLO a partir de la prop
`variante` (con default `"primaria"`, el cian sólido) — nunca miraba si
el botón estaba realmente deshabilitado vía la prop nativa `disabled`.
El atributo HTML `disabled` sí se calculaba bien (`variante ===
"deshabilitada" || boton.disabled`, así que el clic sí quedaba
bloqueado), pero el ESTILO seguía siendo el de `variante="primaria"`
mientras quien llamaba no pasara TAMBIÉN `variante="deshabilitada"` a
mano — cosa que `CheckoutForm.tsx` (y otras ~20 pantallas que usan
`Boton` con `disabled`: login, formularios de dirección/datos
fiscales/comprobante, "Agregar al carrito", etc., confirmado por
`grep`) nunca hacía. El botón se veía activo mientras estaba
funcionalmente apagado, en todo el sitio, no solo en pago.

**"Quiero factura" no es obligatorio** (confirmado leyendo
`CheckoutForm.tsx`): arranca en `false` y no forma parte de la condición
que deshabilita el botón (`disabled={!agree || enviando ||
!addressId}`). Lo que sí es obligatorio, y fácil de pasar por alto
porque es un checkbox chico junto al total, es "Entiendo que mi pedido
se confirma al subir mi comprobante de pago." (`agree`) — sin verlo gris
cuando falta, no había forma de saber que ESE era el paso pendiente.

**Corrección**: `Boton.tsx` ahora calcula `estaDeshabilitado =
variante === "deshabilitada" || disabled` una sola vez, y usa ese valor
tanto para el atributo HTML `disabled` como para elegir el estilo visual
(`estiloVariante(estaDeshabilitado ? "deshabilitada" : variante)`) — así
cualquier botón del sitio que use `disabled={condicion}` se ve gris
automáticamente en cuanto la condición es verdadera, sin que cada
pantalla tenga que acordarse de sincronizar las dos props a mano.

Validado por lectura del código (mismo estilo `"deshabilitada"` ya
existente y probado — `background: var(--bg-hover)`, `color:
var(--text-disabled)`, `cursor: not-allowed` — solo cambia CUÁNDO se
aplica) y `npx tsc --noEmit` limpio. No se pudo confirmar visualmente
contra el servidor real en este entorno.

### Corrección (2026-09-22): el checkbox obligatorio de "Generar pedido"
era casi invisible — bug de contraste, no solo de descubribilidad

Con el botón ya mostrándose gris de verdad (corrección anterior), la
dueña marcó una dirección y preguntó por qué seguía bloqueado — el
checkbox "Entiendo que mi pedido se confirma al subir mi comprobante de
pago." (`agree`, la condición que faltaba) no se veía en absoluto en su
captura. Se midieron los píxeles exactos de la imagen: el borde del
cuadrito sin marcar caía en `(22,40,58)` contra un fondo de tarjeta en
`(15,29,43)` — coincide con `--border-subtle` (`#16283A`) sobre
`--bg-card` (`#0F1D2B`), dos azules casi idénticos. No era una cuestión
de que el checkbox no se notara por su tamaño o posición: literalmente
no hay contraste suficiente para distinguir el borde del fondo.

El mismo patrón exacto (mismo bloque de estilo, copiado) vive en
`RegistroWizard.tsx` → `CasillaVisual` (la casilla "Acepto el aviso de
privacidad y los términos y condiciones" del paso 3 de "Crear cuenta"),
que gatea el mismo `disabled` del botón "Crear cuenta" — mismo bug,
mismo riesgo de que alguien se quede atorado sin saber por qué.

**Corrección**: en los dos, el borde del cuadrito SIN marcar cambió de
`var(--border-subtle)` a `var(--border-input)` (`#52708F` — el mismo
tono ya usado en los campos de formulario reales del sitio, pensado
para contrastar contra `--bg-card`/`--bg-surface`). El estado marcado
no cambia (sigue siendo `--accent` sólido).

**Aprendizaje permanente**: `--border-subtle` está pensado para
elementos pasivos/decorativos (separadores, el indicador de un paso ya
completado, un borde que no necesita llamar la atención) — nunca para
el borde de un control interactivo que la persona necesita VER para
saber que existe y debe usarlo (checkbox, radio, campo). Para esos,
`--border-input` es el token correcto.

Validado midiendo los valores hex exactos de los tokens en
`globals.css` (`--border-input: #52708f` vs `--bg-card: #0f1d2b` — salto
de contraste real, contra `--border-subtle: #16283a`, casi el mismo tono
que el fondo) y `npx tsc --noEmit` limpio. No se pudo confirmar
visualmente contra el servidor real en este entorno.

### Corrección (2026-09-22): "function gen_random_bytes(integer) does not
exist" al generar un pedido — bug de `search_path`, específico de
proyectos de Supabase alojados

Con el checkbox ya visible, la dueña marcó dirección + checkbox y le
salió este error de Postgres al darle "Generar pedido".

**Causa raíz**: `generar_folio()` (`0008_funciones_transaccionales.sql`,
la función que arma el folio corto de cada pedido/devolución) es
`security definer` con `set search_path = public` — correcto, evita que
alguien secuestre el search_path de una función con privilegios
elevados. Llama a `gen_random_bytes()`, de la extensión `pgcrypto`, que
`0001_extensiones.sql` instala con `create extension if not exists
pgcrypto with schema public`. En Supabase LOCAL (`supabase start`) eso
efectivamente la deja en `public`. Pero en un proyecto de Supabase
ALOJADO (el caso real de la dueña), pgcrypto ya viene preinstalada por
la plataforma en el schema `extensions`, no en `public` — así que el
`create extension if not exists` de 0001 no hace nada (ya existe) y
`gen_random_bytes()` se queda fuera del `search_path` de la función.
Por eso el bug nunca apareció en las pruebas contra Supabase local de
incrementos anteriores, solo contra el proyecto real.

**Corrección**: `0022_generar_folio_search_path.sql` — una migración
nueva (no se edita 0008, ya aplicada) que agrega `extensions` al
`search_path` de la función: `alter function
public.generar_folio(text, int) set search_path = public, extensions;`.
No hace falta reescribir el cuerpo de la función, solo esa
configuración. `grep` confirmó que `generar_folio()` es el ÚNICO sitio
de todas las migraciones que llama a una función de `pgcrypto`
(`gen_random_bytes`) — el fix cubre también a `crear_pedido()` (0010/
0011) y a la creación de folios de devoluciones (0012), que llaman a
`generar_folio()` internamente y por ser `security definer` corren con
el `search_path` que declara la función, no el de quien la llama.

**Pendiente, acción de la dueña**: esta migración vive en el repo pero
NO se aplica sola a un proyecto alojado — hay que correrla ahí (`supabase
db push` con la CLI apuntando al proyecto remoto, o pegar el contenido
de `0022_generar_folio_search_path.sql` directo en Supabase Studio → SQL
Editor → Run). No se pudo aplicar ni probar en este entorno (sin acceso
al proyecto real).

**RESUELTO (2026-09-23, confirmado por la dueña):** migración 0022
aplicada en el proyecto de Supabase alojado.

### Incremento (2026-09-22): vista previa del comprobante, monto con
separador de miles, y el `NetworkError` al subir es CORS de R2 sin
configurar (no es bug de código)

La dueña, ya con un pedido de prueba generado, pidió tres cosas sobre
`FormularioComprobante.tsx` ("Subir comprobante"):

1. **Vista previa del archivo elegido** — antes solo se mostraba el
   nombre del archivo, sin forma de confirmar que la foto/captura
   subida se ve legible antes de mandarla. Se agregó una miniatura real
   (`URL.createObjectURL`, con su `revokeObjectURL` en cada cambio para
   no acumular memoria) para JPG/PNG — HEIC y PDF no los renderiza un
   `<img>` en el navegador, así que esos se quedan con un ícono
   genérico "Sin vista previa para este tipo de archivo" en vez de
   fingir una miniatura que no existe.
2. **"Monto transferido" sin separador de miles** — el campo era
   `type="number"` nativo, que ningún navegador formatea con comas.
   Nueva utilidad compartida `formatearMontoInput()` (`src/lib/
   formato.ts`) que solo cambia lo que se VE: el estado
   (`datos.amount`) se queda siempre como texto plano sin comas (lo que
   espera `z.coerce.number()` al enviar), y el separador de miles
   (mismo criterio que `formatearPrecio`, `toLocaleString('es-MX')`)
   solo se aplica mientras el campo NO tiene el foco — reformatear en
   cada tecleo movería el cursor de lugar mientras la persona todavía
   está escribiendo, así que se muestra sin formato mientras se edita y
   con comas en cuanto se sale del campo.
3. **`NetworkError when attempting to fetch resource` al subir** — el
   `PUT` del paso 2 (arquitectura §7.1: el navegador sube directo a R2
   con una URL firmada, el archivo nunca pasa por el servidor de
   Next.js) es una petición **cross-origin real** desde el dominio del
   sitio hacia `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com` — y R2
   no trae ninguna política CORS configurada por defecto. Sin ella, el
   navegador bloquea el `PUT` (y el preflight `OPTIONS` que dispara por
   llevar `Content-Type`) antes de que llegue ninguna respuesta —
   exactamente el mensaje genérico y poco útil que muestran los
   navegadores para un bloqueo CORS, nunca un error específico de R2/S3.
   No es un bug de la aplicación: es una configuración pendiente del
   bucket, que no vivía documentada en ningún lado de este repo (ni
   `.env.example`, ni `arquitectura.md` §7.1 la mencionan). **Pendiente,
   acción de la dueña**: configurar la política CORS del bucket
   `R2_BUCKET_PRIVATE` (Cloudflare dashboard → R2 → el bucket → Settings
   → CORS Policy) permitiendo el origen del sitio (`http://localhost:3000`
   en desarrollo + el dominio real de producción), método `PUT`, y el
   header `Content-Type`. No se pudo aplicar ni probar contra el bucket
   real en este entorno (sin acceso a la cuenta de Cloudflare).

**RESUELTO (2026-09-23, confirmado por la dueña):** el permiso de R2
para subir comprobantes ya funciona. Hizo una carga de prueba y el
comprobante aparece en el bucket privado.

Validado por lectura del código y `npx tsc --noEmit` limpio; la lógica
de `formatearMontoInput()` se probó aparte con casos de borde (entero
solo, con punto final, con decimales, vacío) fuera de React. No se pudo
probar la vista previa ni la subida real contra R2 en este entorno.

### Corrección (2026-09-22): rediseño completo de "Mi cuenta" en móvil, a partir de mockup provisto por la dueña

**Contexto**: la dueña reportó que el panel de "Mi cuenta" en móvil no se
veía adaptable — `mi-cuenta/layout.tsx` usaba un grid fijo de
`220px 1fr` sin ningún `@media`, y encima la navbar completa del sitio
(buscador + chips "Para Ti/Novedades/Servicios/...") seguía ocupando
espacio arriba. Primero se construyó un mockup en Artifacts (Design
canvas) para acordar el enfoque; luego la dueña compartió un archivo
`.dc.html` (`Panel_Usuario_Movil.dc.html`) con el diseño final a seguir
"al pie de la letra" — este incremento lo traduce a código real.

**Alcance**: solo la versión móvil (`max-width: 760px`, mismo punto de
quiebre que ya usa `EncabezadoSitio.tsx` para `esMovil`). Escritorio no
cambió una sola línea de estilo visible — cada bloque nuevo va en un
`<div>`/`<h1>`/etc. hermano con `className="cuenta-movil-solo"`, oculto
por default y mostrado solo bajo el `@media` que vive en
`mi-cuenta/layout.tsx`; lo inverso (`cuenta-escritorio-solo`) oculta el
contenido de escritorio en móvil. Mismo patrón que ya usaban
`ListadoCatalogo`/`BarraFiltrosMovil` para el catálogo, aplicado aquí a
toda la sección de cuenta.

**Cambios**:
1. `EncabezadoSitio.tsx` — ahora `return null` cuando `esMovil &&
   pathname.startsWith("/mi-cuenta")`: la navbar del sitio (buscador,
   chips, logo) desaparece por completo en móvil dentro de "Mi cuenta",
   no solo el buscador. El `return` temprano va DESPUÉS de todos los
   hooks del componente (`barraFlotanteVisible`, `flash`) — ponerlo
   antes rompía las Reglas de los Hooks al entrar/salir de la sección
   en móvil (distinto número de hooks entre renders).
2. `EncabezadoCuentaMovil.tsx` (nuevo) — header sticky con botón
   volver, título dinámico por ruta (mapa de `pathname` → título +
   href de vuelta, incluye el caso `pedidos/[folio]` y
   `pedidos/[folio]/comprobante`) y acceso rápido a "Mis pedidos" con
   contador real de pedidos `pendiente_pago` (no el `2` fijo del mock).
3. `TabsCuentaMovil.tsx` (nuevo) — reemplaza al `<aside>` de escritorio
   en móvil: mismas 6 secciones como fila horizontal con scroll,
   estado activo por `pathname`.
4. `mi-cuenta/layout.tsx` — agrega el `<style>` con las reglas
   `@media (max-width: 760px)` que gobiernan `cuenta-movil-solo` /
   `cuenta-escritorio-solo` / `cuenta-grid` / `cuenta-contenido` para
   toda la sección; fila de usuario (iniciales, nombre, correo, saldo)
   igual al mock; botón "Cerrar sesión" al final del contenido en
   móvil (en escritorio sigue solo en el `<aside>`).
5. Cada página de la sección gana su bloque móvil siguiendo el mockup:
   `pedidos` (tarjetas + chips de filtro — el filtro es un
   `searchParams` real, `?estado=`, no `state` de React, para que cada
   chip sea un link normal sin duplicar la consulta a la base de
   datos), `pedidos/[folio]` (solo se ocultan el título y el link
   "Volver" duplicados — el mock no diseña esta pantalla, así que el
   resto de escritorio se deja tal cual), `pedidos/[folio]/comprobante`
   + `FormularioComprobante.tsx` (dropzone con "Elegir archivo" y
   "Tomar foto" — este último con `capture="environment"` real, no
   decorativo — la vista previa REAL ya existente en vez del texto
   genérico del mock, que ahí es un dato inventado por no tener
   archivos reales en una maqueta estática), `datos`, `direcciones`,
   `datos-fiscales`, `saldo` y `devoluciones` (tarjetas de política +
   la lista real de "Tus solicitudes", que no está en el mock, se deja
   visible en ambas versiones).
6. **Acciones del mock sin equivalente real** (confirmado con la
   dueña antes de implementar): el mock muestra "Editar" por tarjeta de
   dirección/dato fiscal y "Usar por defecto" — la app real solo tenía
   Agregar y Eliminar, nunca edición in situ (tampoco en escritorio).
   Se implementó "Usar por defecto" de verdad (`marcarDireccionPredeterminada`/
   `marcarDatosFiscalesPredeterminados` en `mutations/cuenta.ts` +
   acciones `marcarComoPredeterminada`/`marcarDatosFiscalesComoPredeterminados`,
   mismo patrón "una sola por defecto a la vez" que ya usaba
   `crearDireccion`/`crearDatosFiscales` al guardar) y se omitió
   "Editar" en vez de simularlo con un botón que no hace nada.

**Validación**: `npx tsc --noEmit` limpio. `npm run build` compila
TypeScript sin errores y falla después, al recolectar datos de página,
por falta de variables de entorno reales (Supabase/R2/Resend/etc.) —
limitación ya conocida de este entorno (sin conexión a un proyecto real),
no relacionada con este cambio. No se pudo probar visualmente contra la
app corriendo ni contra un viewport real de teléfono en este entorno.

### Corrección (2026-09-22): "Mis pedidos" en móvil se desbordaba horizontalmente (grid blowout)

Probado en un teléfono real: todas las pantallas del incremento
anterior se veían bien excepto "Mis pedidos", donde toda la página
—incluido el encabezado fijo arriba— se podía arrastrar horizontalmente
más allá del viewport, aunque la fila de chips de filtro ya tenía su
propio `overflow-x:auto`.

**Causa**: `.cuenta-contenido` (donde vive `{children}`, o sea el
contenido de cada página) es un *grid item* dentro de `.cuenta-grid`
(`mi-cuenta/layout.tsx`). Un grid item mide por default
`min-width: auto`, que en la práctica equivale al ancho de su
contenido más ancho que no se pueda partir en varias líneas — en este
caso, la fila de 6 chips de filtro de "Mis pedidos" (`flex:"0 0 auto"`
cada uno, "Comprobante recibido" es el más largo). Aunque esa fila
tenía su propio scroll interno, el TRACK del grid se agrandaba igual
para "caber" ese contenido, y arrastraba a toda la sección — encabezado
fijo incluido, porque comparte el mismo ancho de página — en un scroll
horizontal fantasma. El resto de las pantalla no tiene una fila tan
ancha sin partir, por eso no se notaba ahí.

**Fix**: en el `<style>` de `mi-cuenta/layout.tsx`, el track del grid
en móvil pasa de `grid-template-columns: 1fr` a
`minmax(0, 1fr)` (el `0` es lo que faltaba — sin él, `1fr` solo no
cambia el mínimo automático del track) y se agrega `min-width: 0` +
`overflow-x: hidden` explícitos a `.cuenta-contenido` como respaldo.
Es el fix estándar para este bug clásico de CSS Grid (el mismo
problema que existe en Flexbox con `min-width:auto` en los hijos).

Validado con `npx tsc --noEmit` limpio. No se pudo volver a probar en
un teléfono real desde este entorno — pendiente que la dueña confirme
que ya no se desborda.

### Corrección (2026-09-22): más productos por pestaña en "Para Ti", para que el riel se vea como carrusel

**Contexto**: tras el bulk de 43 productos de un incremento anterior
(uno por cada subcategoría raíz que no tenía ninguno), `obtenerParaTi()`
(`src/server/db/queries/catalogo.ts`) elige sus hasta 8 pestañas por la
subcategoría con MÁS productos — pero casi todas tenían exactamente 1,
así que cada pestaña mostraba un solo producto: el riel (`ParaTi.tsx`)
no tenía nada que desplazar y la sección se veía estática en vez de una
pasarela.

**No fue necesario tocar código**: `ParaTi.tsx` y `obtenerParaTi()` ya
leen lo que haya en la base de datos — es puramente un problema de
datos de muestra insuficientes, no de lógica. Nuevo script
`supabase/seed_dev_bulk_para_ti.sql` (mismo criterio que
`seed_dev_bulk_43_productos.sql`: standalone, `begin`/`commit` propio,
un solo uso, para aplicar sobre una base ya sembrada) que agrega 6
productos más a 6 subcategorías raíz ya existentes, repartidas en 5
grupos distintos para que "Para Ti" siga mostrando variedad de
departamentos: Videovigilancia · Cámaras IP y NVRs (llega a 8),
Control de acceso · Biométricos (llega a 7), Control de acceso ·
Cerraduras (llega a 7), Automatización e intrusión · Cercas eléctricas
(llega a 7), Energía y climatización · Respaldo de energía (llega a 7),
Cableado estructurado · Cable - Bobinas (llega a 8) — todas por debajo
del tope real de 9 por pestaña. SKU en el rango 0200-0299 por prefijo
para no chocar con los ya usados (0001-0099 y 0100-0111); fotos
reutilizan la misma URL ya asignada a cada grupo en `seed_dev.sql` (no
hay foto real por producto todavía, PA-11 sigue abierta).

**Pendiente, acción de la dueña**: correr `seed_dev_bulk_para_ti.sql`
en el SQL Editor de Supabase Studio del proyecto hosteado (no se pudo
aplicar ni probar contra la base real desde este entorno). Verificado
por lectura: 36 productos (6 × 6 subcategorías), sin SKU ni slug
duplicados contra los ya existentes en `seed_dev.sql` y
`seed_dev_bulk_43_productos.sql`.

Nota aparte sobre ese mismo script: la dueña reportó
`ERROR: 42P01: missing FROM-clause entry for table "g"` al correrlo, y
después `ERROR: 42601: syntax error at or near "from"` en el mismo
punto al reintentar. Se validó el archivo dos veces con un parser real
de Postgres (`pglast`, instalado en este entorno) — parsea sin errores,
43 sentencias — y el segundo mensaje de error (una consulta que
EMPIEZA en `from`, sin su `select`) confirma que la causa era el
copiado incompleto hacia el SQL Editor de Supabase Studio (un archivo
de ~200 líneas es fácil de cortar a medias al seleccionar/pegar a
mano), no un bug del script.

### Corrección (2026-09-22): marcas reales con logo, PA-13 cerrada

**Contexto**: la dueña compartió `marcas_syscom.xlsx` (30 marcas, nombre
+ URL de logo, tomadas de la página de marcas de su proveedor Syscom) y
pidió reemplazar la franja "Marcas que distribuimos" de la portada, que
hoy solo mostraba el NOMBRE de la marca en una caja de texto — nunca
hubo logos reales (PA-13, `modelo-datos.md` §7, seguía abierta). Con
esta lista, PA-13 queda cerrada.

**Cambios**:
1. `CintaMarcas.tsx` — cuando `brands.logo_url` existe, se pinta la
   imagen (`next/image`, vía `urlImagenPublica()` para respetar URLs
   externas absolutas tal cual, mismo criterio que las fotos de muestra
   de productos); si una marca no tiene logo cargado, se conserva el
   texto de respaldo que ya existía (nunca una caja vacía).
2. `next.config.ts` — se agrega `ftp3.syscom.mx` a `images.remotePatterns`;
   sin esto `next/image` rechaza la imagen en tiempo de ejecución. Es un
   hotlink directo al CDN del proveedor (a pedido explícito de la
   dueña, que compartió las URLs ya armadas) — igual que Pexels para las
   fotos de muestra, mientras no se copien a R2 propio.
3. `supabase/seed.sql` — las 30 marcas reales se agregan aquí (no a
   `seed_dev.sql`): dejaron de ser un dato pendiente/dummy (PA-13), son
   contenido real de producción, igual que grupos y subcategorías.
4. `supabase/seed_dev.sql` — las 6 marcas de relleno (Nortvision,
   Axelock, etc., que los productos de muestra usan como `brand_id`)
   pasan a `active: false`: siguen existiendo para no romper esas
   referencias, pero ya no se mezclan con las reales en la franja ni en
   el filtro de marca del catálogo (ambos leen `obtenerMarcasActivas()`,
   que filtra `active = true`).
5. `supabase/seed_marcas_reales.sql` (nuevo) — script standalone para
   aplicar HOY sobre la base hosteada ya sembrada, sin resetear nada:
   apaga las 6 marcas de relleno e inserta/actualiza las 30 reales.
   A diferencia de los scripts de bulk anteriores, este SÍ usa
   `on conflict (slug) do update` — es seguro correrlo más de una vez
   (relevante después de la confusión de copiado del script de "Para
   Ti" de arriba).

**Decisión no consultada explícitamente, documentada por transparencia**:
se interpretó "vamos a cambiar la sección de marcas" como reemplazo
completo (apagar las de relleno), no como agregar las 30 reales
encima de las 6 de mentira. Si la dueña prefiere verlas combinadas,
basta con volver a poner `active = true` en esas 6 filas.

**Validación**: `npx tsc --noEmit` limpio. Los 3 archivos `.sql`
tocados se validaron con `pglast` (parser real de Postgres) sin
errores. No se pudo probar contra la base real ni ver el resultado
visual (logos de terceros, tamaño/proporción real en la marquesina)
desde este entorno — pendiente que la dueña corra
`seed_marcas_reales.sql` y confirme cómo se ven.

### Pendientes resueltos (2026-09-23, confirmado por la dueña)
1. Migración `0022_generar_folio_search_path.sql` aplicada en Supabase
   alojado.
2. Permiso/CORS de Cloudflare R2 para comprobantes funcionando (carga
   de prueba visible en el bucket privado).

Con esto ya se puede probar el flujo de compra completo de punta a
punta.

### Incremento (2026-09-23): historial no mostraba la cancelación, y el
motivo de cancelación no llegaba al cliente en el sitio

Dos hallazgos de la dueña probando el panel real:

1. **"Historial" (detalle de pedido, panel admin) no registraba un
   pedido cancelado.** La lista de pasos (`PASOS_HISTORIAL`) solo tenía
   los del flujo normal (generado → comprobante → listo envío → enviado
   → entregado); "cancelado" nunca estaba ahí, aunque el evento sí se
   guarda en `order_status_history`. Ahora, si el pedido está cancelado,
   se agrega ese paso a la lista con un punto rojo.
2. **El cliente no podía ver el motivo que el admin escribe al
   cancelar.** Ese motivo solo vivía en `order_status_history.note`,
   tabla que el cliente no puede leer por RLS (solo admin) — sí llegaba
   por correo (`construirPedidoCancelado`), pero no en el sitio.
   **Pendiente, acción de la dueña**: correr en Supabase Studio → SQL
   Editor el contenido de
   `supabase/migrations/0023_motivo_cancelacion_visible_cliente.sql`.
   Agrega la columna `orders.cancellation_reason` y actualiza
   `liberar_apartado()` para copiar ahí el motivo al cancelar. No se
   pudo aplicar ni probar en este entorno (sin acceso al proyecto real).
   Mientras no se aplique, `/mi-cuenta/pedidos/[folio]` simplemente no
   muestra el bloque de motivo (columna inexistente → siempre nula), no
   truena.

Validado por lectura del código; no se pudo correr `npx tsc --noEmit`
en este entorno (`node_modules` no está instalado aquí) ni probar
contra Postgres real.

### Incremento (2026-09-23): navegación lenta y sin retroalimentación

La dueña reportó que al cambiar de sección "no se sabe si está cargando"
y la pantalla aparece de golpe. No es un límite de Next.js; eran dos
causas del proyecto:

1. **Cero `loading.tsx` en 27 páginas dinámicas.** Sin él, Next espera a
   que el servidor termine TODO el render antes de mostrar algo. Se
   agregaron esqueletos con la forma real del contenido (diseño.md
   §12.3) en `(public)`, `(public)/catalogo`, `(public)/producto/[slug]`,
   `mi-cuenta` y `admin/(protegido)`, más una barra de progreso superior
   (`BarraNavegacion`, diseño.md §7.1) para las esperas que un
   `loading.tsx` no cubre: layouts que consultan datos al entrar a otra
   sección y la compilación bajo demanda de `next dev`.
2. **Consultas repetidas a Supabase Auth.** `getUser()` va a la red en
   cada llamada, y se llamaba en el proxy (cada request, prefetch
   incluido) y de nuevo en el marco del sitio, el layout y la página:
   hasta 4 viajes en serie al entrar a "Mi cuenta". Ahora
   `obtenerSesionActual` usa `cache()` de React (una sola vez por
   request) y tanto ella como el proxy usan `getClaims()`, que valida
   el JWT localmente con llaves asimétricas (con llaves HS256 heredadas
   cae solo a `getUser()`, igual que antes — nunca empeora).
   Contrapartida conocida de `getClaims()`: una sesión cerrada desde
   otro dispositivo sigue siendo válida hasta que vence su JWT (1 h por
   default); el rol se sigue leyendo de `profiles` en cada request.

Validado: `tsc --noEmit` y `eslint` limpios, `next build` exitoso, y
prueba en Chromium contra `next start` con rutas temporales (ya
eliminadas): el esqueleto aparece <250 ms tras el clic en una página
de 3 s; la barra no aparece en navegaciones <120 ms, avanza de forma
gradual en una espera de 2.5 s y desaparece al llegar; sin scroll
horizontal a 390 px.

**Recomendación a la dueña**: medir la velocidad con `npm run build &&
npm start`, no con `npm run dev` (en desarrollo cada pantalla se compila
la primera vez que se visita y el prefetch está apagado). **Pendiente
de revisar en Supabase**: Project Settings → JWT Keys; si el proyecto
sigue con la llave HS256 heredada, migrar a llaves asimétricas para que
`getClaims()` deje de ir a la red.

### Incremento (2026-09-23): todos los botones de acción muestran que
están trabajando

Pedido explícito de la dueña: "todos los botones, incluyendo admin y
cliente" necesitan un mecanismo de carga. Se auditaron los 22 componentes
cliente de todo el sitio que hacen `await` dentro de un manejador (Server
Action, `fetch`, o el carrito) — la lista completa, sin excepción, ya
tiene alguna forma de aviso.

**Base reutilizable (diseño.md §12.3: "Spinner dentro + verbo en
gerundio; el ancho no cambia")**:
- `Spinner` ahora acepta `color`, para que se vea sobre cualquier fondo
  (antes tenía un solo color fijo — invisible sobre un botón del mismo
  tono).
- `Boton` (átomo del sitio) gana `cargando`/`textoCargando`: deshabilita,
  muestra el spinner y, si se da, cambia el texto — **sin ponerse gris**,
  porque "ocupado" no es lo mismo que "no disponible" (eso sigue siendo
  `disabled`/`variante="deshabilitada"`).
- `BotonAdmin`, componente nuevo con el mismo contrato para las clases
  `.btn .btn-*` que usa todo el panel admin (no comparte átomos con el
  sitio público — arquitecturas de CSS separadas desde el inicio del
  proyecto). Se le agregó a `admin.css` el estado `:disabled` que no
  existía.

**Aplicado en cliente**: login, recuperar contraseña, registro (3 pasos),
dirección, datos fiscales, subir comprobante (escritorio y móvil), nueva
devolución, checkout ("Generar pedido"), agregar al pedido/comprar ahora
(ficha de producto y tarjeta de catálogo), solicitud de servicio. También
"Eliminar"/"Usar por defecto" en direcciones y datos fiscales de Mi
cuenta (antes sin ningún aviso).

**Aplicado en admin**: login del panel, las 5 acciones de un pedido
(validar pago, rechazar comprobante, cancelar, marcar enviado, marcar
entregado), aprobar/rechazar devolución, marcar solicitud en
seguimiento/cerrada, datos bancarios/contacto/plazos de Configuración,
guardar producto, crear/editar/eliminar categoría y subcategoría,
"Revisar archivo" del importador CSV.

**Hallazgo aparte, con arreglo específico (no genérico)**: el carrito con
sesión iniciada no actualiza la cantidad ni quita un producto hasta que
el servidor responde — sin optimismo, a diferencia del carrito de
invitado (`localStorage`), que sí se sentía instantáneo. Por eso +/- y
"Quitar" parecían no hacer nada. Se le agregó a `SelectorCantidad` un
`cargando` opcional (deshabilita +/- y muestra el spinner en vez de la
cifra) y al carrito un aviso por renglón — **no se tocó la falta de
actualización optimista en sí**, que es un cambio de arquitectura más
grande y más riesgoso que agregar un aviso de espera.

**Casos revisados y dejados igual, a propósito**:
- `FormularioContacto` no llama a ningún backend (documentado así desde
  antes — el propio `index.html` tampoco lo hace): no hay nada que
  "cargar".
- Copiar CLABE/cuenta en `DatosTransferencia` usa el portapapeles, que
  resuelve en menos de 1 ms — un spinner ahí solo parpadearía.
- La edición de precio en línea de `TablaCatalogoAdmin` (doble clic) ya
  deshabilita el campo mientras guarda; no es un botón.
- `BarraNavegacion` (del incremento anterior) ahora también arranca con
  formularios `method="get"` (los filtros de Pedidos/Solicitudes/
  Catálogo en admin), no solo con clics en `<a>` — antes esos filtros
  navegaban sin ningún aviso.

Validado: `tsc --noEmit` y `eslint` limpios (el único error de ESLint
que reporta el repo, en `FormularioComprobante.tsx`, es preexistente a
este incremento — no relacionado con botones); `next build` exitoso;
capturas en Chromium contra `next start` confirmando que el spinner
conserva el color de cada variante (no se pone gris) y que sí gira al
hacer clic real.

### Incremento (2026-09-23): aviso por WhatsApp al admin, con Twilio Sandbox

PA-5 (proveedor de WhatsApp) quedaba pendiente — la dueña decidió Twilio
en vez de Meta Cloud API directo (evita el trámite de verificación de
negocio de Meta por ahora) y ya probó su Sandbox con éxito: le llegó un
mensaje de prueba al número que dio de alta.

Se implementó `crearCanalWhatsapp()` (`src/server/notifications/canales/
whatsapp.ts`) contra la API REST de Twilio (`POST /Messages.json` con
autenticación básica `accountSid:authToken`), mandando texto libre
(`Body`), no una plantilla de contenido aprobada (`ContentSid`): en el
Sandbox de Twilio el texto libre llega sin restricción a cualquier
número que ya se haya unido, así que no hace falta crear/aprobar ninguna
plantilla en la consola — es un aviso interno, solo lo ve la dueña.
Cubre el único evento que hoy se encola por WhatsApp: `comprobante.
recibido` (`apartar_pedido()`, 0008/0013) — folio, total y aviso de
entrar al panel.

`env.ts` gana `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_WHATSAPP_FROM` (separadas de `WHATSAPP_PHONE_NUMBER_ID`/
`WHATSAPP_ACCESS_TOKEN`, que son de Meta) y la app ya no arranca con
`WHATSAPP_PROVIDER=twilio` si falta cualquiera de las tres — mismo
criterio de "falla temprano con un mensaje claro" que ya tenía Meta.

El campo "WhatsApp para avisos" de Configuración ahora trae un
`placeholder` (`+5214420000000`) y una nota exigiendo formato E.164 con
"+" — el canal ya rechazaba explícitamente (en vez de fallar en
silencio contra Twilio) un número sin "+" antes de este cambio de
copy, pero el campo seguía sin decirlo.

**Pendiente, acción de la dueña**: agregar en Vercel (Project Settings
→ Environment Variables) las tres variables de Twilio — `Account SID` y
`Auth Token` están en el Twilio Console → Account → API keys & tokens;
`TWILIO_WHATSAPP_FROM=whatsapp:+14155238886` mientras siga en Sandbox
(el número que usó en su prueba) — y cambiar `WHATSAPP_PROVIDER=none` a
`WHATSAPP_PROVIDER=twilio`. Después, confirmar en Configuración → Mi
cuenta admin que su número de WhatsApp está guardado en formato
`+52...`. No se pudo probar un envío real en este entorno (sin acceso a
la cuenta de Twilio ni a un proyecto de Supabase real).

Validado: `tsc --noEmit` y `eslint` limpios; `next build` exitoso con
`WHATSAPP_PROVIDER=twilio` y las tres variables presentes; y por
separado, el build falla con el mensaje esperado si `WHATSAPP_PROVIDER=
twilio` se deja sin las credenciales — confirma que la validación de
arranque funciona en ambos sentidos.

**Advertencia que se le explicó a la dueña**: el Sandbox de Twilio está
pensado para pruebas, no trae garantía de servicio a largo plazo. Es una
elección razonable para un solo número (ella misma) y avisos internos,
pero si en algún momento quiere algo con garantía real necesitaría un
número de WhatsApp Business propio — eso sigue requiriendo verificación
de negocio ante Meta, aunque Twilio acompaña el trámite. Mientras tanto
el correo (ya activo) sigue siendo el respaldo si el WhatsApp fallara.

### Incremento (2026-09-23): subir comprobante/fotos de devolución se
quedaba en "Enviando…" para siempre, sin ningún error

La dueña reportó que subir un comprobante ya no funcionaba: el botón se
quedaba cargando, la barra de progreso terminaba y no pasaba nada — sin
ningún mensaje de error, y el pedido seguía en "pendiente de pago" al
regresar a Mis pedidos. Al inicio se sospechó de la configuración de
Twilio (coincidió en el tiempo), pero se descartó: el resto del sitio
seguía funcionando con normalidad, lo cual no pasaría si `env.ts`
hubiera fallado al arrancar (esa validación revienta TODO el servidor,
no solo WhatsApp).

**Causa real, encontrada por lectura del código — bug preexistente, no
introducido en este incremento**: `enviar()` en `FormularioComprobante.
tsx` (y el mismo patrón en `FormularioNuevaDevolucion.tsx`) no tenía
ningún `try/catch`. El `fetch(...)` que sube el archivo directo del
navegador a R2 (arquitectura §7.1) puede **rechazar** la promesa en vez
de resolver con `ok: false` — típicamente por un bloqueo de CORS del
bucket, o la red caída. Sin `try/catch`, ese rechazo nunca llegaba al
`if (!subida.ok)` que sí mostraba un error: la función completa se
interrumpía en silencio, `estado` se quedaba en `"subiendo"` para
siempre (botón pegado) y no había ningún aviso — exactamente lo que
describió la dueña.

Se envolvió el cuerpo de `enviar()` en `try/catch`, y el `fetch` a R2 en
su propio `try/catch` con un mensaje específico (incluye el motivo del
error y una pista sobre CORS) en vez de uno genérico. En
`FormularioNuevaDevolucion.tsx` cada foto se sube dentro de su propio
`try/catch` en el ciclo — una foto que falla no debe tirar la solicitud
completa, que ya quedó registrada antes de intentar las fotos.

**Pendiente, acción de la dueña**: con este cambio ya desplegado, subir
un comprobante de nuevo — si el problema sigue siendo CORS de R2, ahora
sí va a aparecer un mensaje de error explícito en pantalla (en vez de
quedarse pegado en silencio) que dice el motivo exacto; si dice algo
relacionado con CORS o "Failed to fetch", hay que revisar en Cloudflare
→ R2 → el bucket `R2_BUCKET_PRIVATE` → Settings → CORS Policy que el
origen `https://qro-security.vercel.app` siga permitido con método
`PUT` y el header `Content-Type` (documentado también en
arquitectura.md §7.1 y en el incremento del 22 de septiembre de este
mismo archivo). No se pudo reproducir el fallo original ni confirmar la
causa exacta en este entorno (sin acceso al bucket real ni al
navegador de la dueña).

Validado: `tsc --noEmit` y `eslint` limpios (mismo único error
preexistente de siempre en este archivo, no relacionado). No se pudo
correr `next build` en este intento — el entorno no tuvo salida a
Google Fonts en este momento, sin relación con este cambio (`tsc` ya
había pasado limpio, que es la validación que de verdad cubre este
código).

### Incremento (2026-09-23): paso 3 del importador CSV — "Aplicar" ya
escribe de verdad al catálogo

Última pieza pendiente del panel admin (F2.3, arquitectura.md §9.5).
Antes: la vista previa (paso 2) ya validaba de verdad, pero el botón
"Aplicar N productos" estaba deshabilitado a propósito, con una nota
explicando que la escritura por lotes era la siguiente pieza — nunca
fingió aplicar algo que no aplicaba.

**Diseño (igual al de arquitectura.md §9.5 y diseño.md §11.8, con una
simplificación real documentada abajo)**: tabla nueva `import_jobs`
(migración `0024_import_jobs.sql`) que guarda las filas ya validadas
(`ok: true` únicamente — las filas con error del paso 2 nunca llegan
aquí) y un cursor de avance. El navegador aplica de a 200 filas por
llamada (`procesarLoteImportacionAction`), cada lote en su propia
transacción por fila (reutiliza `crearProductoAdmin()`/
`actualizarProductoAdmin()`, las mismas funciones del alta/edición
individual — mismo `crear_producto()`/`actualizar_producto()` de
0016_catalogo_admin.sql, sin funciones SQL nuevas), y repite hasta
terminar — con una barra de progreso que se actualiza en cada vuelta.
Una fila que falla (p. ej. una categoría borrada entre el paso 2 y el
lote que la procesa) no detiene a las demás (F2.4): se cuenta aparte y
sigue con la siguiente.

**Simplificación real frente al diseño, documentada en el propio
archivo de la migración**: el avance de lote a lote lo dispara el
navegador de quien importa mientras la pestaña sigue abierta — NO es
un trabajo en segundo plano de verdad en el servidor (sin cron). Por
eso no existe el aviso "puedes cerrar esta pestaña, te avisamos por
correo cuando termine" que describe diseño.md §11.8 — se quitó de la
UI en vez de dejarlo prometiendo algo que no pasa. Sí se conserva lo
importante de esa idea: el trabajo persiste en la base, así que si se
cierra la pestaña o se corta internet a medio camino, al volver a
entrar a "Importar catálogo" se reanuda solo desde donde se quedó
(estado.md §11.8 "Interrumpido") — nada más hay que dejar la pestaña
abierta mientras corre. "Detener la importación" si conserva lo ya
aplicado y cancela el resto, como pide el diseño.

**Resolución de marca/grupo/subcategoría por nombre**: el paso 2 nunca
exigió que existieran para actualizar un producto YA existente (solo
para uno nuevo) — se respetó ese mismo criterio aquí: en una
actualización, un nombre que ya no resuelve a nada simplemente no
toca ese campo (el producto conserva su marca/categoría actual) en vez
de tronar la fila entera.

**Pendiente, acción de la dueña**: correr en Supabase Studio → SQL
Editor el contenido de `supabase/migrations/0024_import_jobs.sql`
antes de usar el paso 3 (crea la tabla `import_jobs` que no existe
todavía). No se pudo aplicar la migración ni probar un lote real
contra Postgres en este entorno (sin acceso a un proyecto real);
tampoco crear un producto de verdad para confirmar el resultado —
validado por lectura del código, `tsc --noEmit`/`eslint` limpios,
`next build` exitoso, y la sintaxis de la migración confirmada válida
con `pglast` (parser real de Postgres, sin conexión a una base).

### Corrección (2026-09-23): la migración 0024 chocaba con una tabla
`import_jobs` que ya existía desde el día 1

La dueña corrió `0024_import_jobs.sql` y Supabase respondió `relation
"import_jobs" already exists` — se me había pasado por completo que
`import_jobs` ya estaba definida desde `0003_catalogo.sql` (adición de
arquitectura §9.5, prevista desde el arranque del proyecto aunque nada
la usaba todavía) y con su RLS desde `0007_rls_policies.sql`, con un
diseño de columnas real y bien pensado (`file_url`, `mode`, `status`,
`total_rows`, `valid_rows`, `error_rows`, `processed_rows`,
`errors_report`) que nunca revisé antes de escribir la migración del
incremento anterior — hice una tabla nueva con nombres inventados
(`filas`, `total`, `modo`, `siguiente_indice`, `fallas`) que duplicaba
la existente en vez de completarla.

Como el `CREATE TABLE` fue la primera línea del script, nunca llegó a
crear nada — no hubo que deshacer nada en Supabase. Se reescribió
`0024_import_jobs.sql` para **completar** la tabla original en vez de
reemplazarla: agrega `filas`/`nuevos`/`actualizados` (lo único que de
verdad le faltaba — dónde guardar las filas ya validadas del paso 2 y
los contadores del resumen) y suma `'detenido'` al check de `status`
(el diseño original no contemplaba que alguien detuviera la
importación a medias). `file_url` ahora guarda el NOMBRE del archivo,
no una clave de R2 — el CSV no se sube a R2 en esta implementación
(documentado en el propio comentario de la columna), simplificación ya
explicada en el incremento anterior.

El código de `src/server/db/mutations/admin/importador.ts` se
reescribió para hablar el vocabulario real de la tabla
(`mode`/`status` en inglés con sus propios valores) traduciéndolo en
la frontera con la base — el resto del código (Server Actions, UI)
sigue exactamente igual, sin tocar, porque se conservaron los mismos
nombres de campo que ya usaban (`total`, `siguiente_indice`,
`aplicados`, `fallidos`, etc.).

**Pendiente, acción de la dueña**: correr el `0024_import_jobs.sql`
corregido en Supabase Studio → SQL Editor (ahora son solo `ALTER
TABLE`, no debería toparse con el mismo error). No se pudo probar
contra un Postgres real en este entorno — validado con `tsc --noEmit`/
`eslint`/`next build` limpios y la sintaxis de la migración confirmada
con `pglast`.
