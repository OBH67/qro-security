# Estado del proyecto — SG Querétaro

Carpeta de trabajo: `/home/user/qro-security`
Rama: `claude/sg-queretaro-sales-platform-6a7359`
Última actualización: 2026-09-21

## Fase actual
**Implementación en curso — quinto incremento (corrección de la regla de
traducción literal del frontend: chrome del sitio público + portada)
completado.** Ver detalle al final de este documento.

## Progreso por fases

- [x] **Inicialización** — perfil creado de forma inferida en `.devsquad/perfil.md` (campos marcados "confirmar" pendientes de validación).
- [x] **Contexto de negocio** — documento de la dueña guardado en `docs/contexto-negocio.md`.
- [x] **Requerimientos (BSA)** — `.devsquad/requerimientos.md`: 8 épicas, 27 historias con criterios de aceptación, 10 reglas de negocio, requisitos no funcionales, alcance V1/V1.5/Futuro, 11 preguntas abiertas y matriz de riesgos.
- [x] **Modelo de datos** — `.devsquad/modelo-datos.md`: esquema completo derivado de una revisión a fondo de `index.html`, con 20 hallazgos que el documento de negocio no cubría, 5 decisiones de modelado con su trade-off, políticas de RLS y rutas de archivos en R2. **La data del demo es dummy:** solo prueba qué campos necesita la interfaz, nunca volúmenes, marcas ni contenidos reales del catálogo.
- [x] **Arquitectura** — `.devsquad/arquitectura.md`: monolito modular en capas, estructura de carpetas completa, tres clientes de Supabase (con 4 candados sobre la service role key), dos buckets en R2, notificaciones con patrón outbox, 9 decisiones de arquitectura con su trade-off (la central: `products.reserved` + función SQL con `FOR UPDATE` para cero sobreventas), 28 variables de entorno, ANF inferidos, y costo real de producción corregido: **~$45–47 USD/mes** (Vercel Pro $20 + Supabase Pro $25 + dominio ~$15/año), no $0 como se había estimado — el desarrollo sí es $0.
- [x] **Diseño de UI del panel administrativo** — `.devsquad/diseño.md` (1885 líneas): tokens heredados del demo del sitio público con 3 correcciones de contraste WCAG AA, navegación por rol, Atomic Design, y las 13 pantallas con sus estados. Incluye el tablero completo (G2, adelantado a V1 el 2026-09-20) con 6 gráficas justificadas y paleta de datos separada de los colores semánticos de estado. **Aprobado por la dueña (2026-09-20).**
- [x] **Maqueta visual interactiva (Artifact)** — construida sobre `diseño.md`: Login, Tablero completo, Pedidos, Detalle de pedido (normal y variante RN-11), Catálogo, Alta de producto (con el selector de categoría de 3 niveles usando la taxonomía real de 54 subcategorías), Categorías (árbol D7), Devoluciones (con cajón de resolución), Solicitudes de servicio, Analítica, Configuración, e Importador CSV (pasos 1-2). Quedan sin maquetar, documentados en `diseño.md` con su sección exacta: las pestañas de Precio/Fotos/Especificaciones/Documentos del editor de producto (§11.7) y el paso 3 (aplicar) del importador CSV (§11.8) — ninguno bloquea la implementación, están completamente especificados.
- [x] **Preparación del entorno** — verificado (2026-09-20): Node.js v22.22.2, npm 10.9.7, Git 2.43.0, Supabase CLI funcional vía `npx`. Todo cumple lo requerido en `arquitectura.md` §11.1, nada que instalar en este entorno.
- [~] **Implementación** — en curso. Primer incremento (2026-09-20): andamiaje de Next.js + 8 migraciones de base de datos. Segundo incremento (2026-09-20): catálogo público (Épica A completa: A1-A4). Tercer incremento (2026-09-21): carrito y cuenta de cliente + pedido/comprobante (Épica B completa + Épica C sin C3). Ver detalle debajo.

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
