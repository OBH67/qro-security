# Estado del proyecto — SG Querétaro

Carpeta de trabajo: `/home/user/qro-security`
Rama: `claude/sg-queretaro-sales-platform-6a7359`
Última actualización: 2026-09-20

## Fase actual
**Implementación en curso — segundo incremento (catálogo público, Épica A) completado.**

## Progreso por fases

- [x] **Inicialización** — perfil creado de forma inferida en `.devsquad/perfil.md` (campos marcados "confirmar" pendientes de validación).
- [x] **Contexto de negocio** — documento de la dueña guardado en `docs/contexto-negocio.md`.
- [x] **Requerimientos (BSA)** — `.devsquad/requerimientos.md`: 8 épicas, 27 historias con criterios de aceptación, 10 reglas de negocio, requisitos no funcionales, alcance V1/V1.5/Futuro, 11 preguntas abiertas y matriz de riesgos.
- [x] **Modelo de datos** — `.devsquad/modelo-datos.md`: esquema completo derivado de una revisión a fondo de `index.html`, con 20 hallazgos que el documento de negocio no cubría, 5 decisiones de modelado con su trade-off, políticas de RLS y rutas de archivos en R2. **La data del demo es dummy:** solo prueba qué campos necesita la interfaz, nunca volúmenes, marcas ni contenidos reales del catálogo.
- [x] **Arquitectura** — `.devsquad/arquitectura.md`: monolito modular en capas, estructura de carpetas completa, tres clientes de Supabase (con 4 candados sobre la service role key), dos buckets en R2, notificaciones con patrón outbox, 9 decisiones de arquitectura con su trade-off (la central: `products.reserved` + función SQL con `FOR UPDATE` para cero sobreventas), 28 variables de entorno, ANF inferidos, y costo real de producción corregido: **~$45–47 USD/mes** (Vercel Pro $20 + Supabase Pro $25 + dominio ~$15/año), no $0 como se había estimado — el desarrollo sí es $0.
- [x] **Diseño de UI del panel administrativo** — `.devsquad/diseño.md` (1885 líneas): tokens heredados del demo del sitio público con 3 correcciones de contraste WCAG AA, navegación por rol, Atomic Design, y las 13 pantallas con sus estados. Incluye el tablero completo (G2, adelantado a V1 el 2026-09-20) con 6 gráficas justificadas y paleta de datos separada de los colores semánticos de estado. **Aprobado por la dueña (2026-09-20).**
- [x] **Maqueta visual interactiva (Artifact)** — construida sobre `diseño.md`: Login, Tablero completo, Pedidos, Detalle de pedido (normal y variante RN-11), Catálogo, Alta de producto (con el selector de categoría de 3 niveles usando la taxonomía real de 54 subcategorías), Categorías (árbol D7), Devoluciones (con cajón de resolución), Solicitudes de servicio, Analítica, Configuración, e Importador CSV (pasos 1-2). Quedan sin maquetar, documentados en `diseño.md` con su sección exacta: las pestañas de Precio/Fotos/Especificaciones/Documentos del editor de producto (§11.7) y el paso 3 (aplicar) del importador CSV (§11.8) — ninguno bloquea la implementación, están completamente especificados.
- [x] **Preparación del entorno** — verificado (2026-09-20): Node.js v22.22.2, npm 10.9.7, Git 2.43.0, Supabase CLI funcional vía `npx`. Todo cumple lo requerido en `arquitectura.md` §11.1, nada que instalar en este entorno.
- [~] **Implementación** — en curso. Primer incremento (2026-09-20): andamiaje de Next.js + 8 migraciones de base de datos. Segundo incremento (2026-09-20): catálogo público (Épica A completa: A1-A4). Ver detalle debajo y "Próxima sesión".

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

### Próximo incremento: carrito y cuenta de cliente (Épica B)
B1 (carrito: local para visitante, en base de datos con sesión —
arquitectura.md §9.6), B2 (registro/login/recuperación con Supabase Auth)
y B3 (direcciones y datos fiscales). Requiere finalmente activar
`src/server/supabase/server.ts` en flujos de escritura, crear
`src/lib/supabase/cliente.ts` (cliente de navegador, hasta ahora no hizo
falta) y `src/middleware.ts` (refresco de sesión). Los botones "Agregar al
pedido" ya están pintados en el catálogo (ver simplificación #10 arriba):
ese incremento es cablearlos, no rediseñarlos. También es el momento de
resolver PA-13 (marcas reales) si ya hay respuesta, y de decidir si el
selector de cantidad de la PDP pasa a escribir en el carrito real.
