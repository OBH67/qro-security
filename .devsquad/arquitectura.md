# Arquitectura técnica — Plataforma de ventas SG Querétaro

Fase: **Arquitectura** · Fecha: 2026-09-20
Insumos: `.devsquad/perfil.md` (stack ya decidido) · `.devsquad/requerimientos.md` ·
`.devsquad/modelo-datos.md` (esquema aprobado) · `.devsquad/estado.md` (decisiones 1–12) ·
`docs/contexto-negocio.md`

> Este documento **no reabre** el stack ni el modelo de datos. Los da por dados y define
> lo que faltaba: cómo se organiza el código, en qué capas, cómo se garantizan los
> invariantes del negocio bajo concurrencia, qué variables de entorno hacen falta y qué
> hay que instalar antes de escribir la primera línea.

---

## 0. Resumen ejecutivo (versión corta, sin tecnicismos)

Se construye **una sola aplicación** (no varias piezas sueltas) que contiene la tienda
pública y el panel del dueño. Por dentro está dividida en capas bien separadas para que
crecer no duela: pantallas por un lado, reglas del negocio por otro, base de datos por
otro.

Las reglas que cuestan dinero si fallan —qué pieza está apartada, cuánto saldo tiene un
cliente, cuánto hay que transferir— **corren solo en el servidor**, nunca en el navegador
del cliente. El navegador puede mentir; el servidor no.

Hay **tres cosas nuevas que sí cuestan dinero** y que antes se habían estimado en $0/mes.
Están en la sección 11 y necesitan tu visto bueno: Vercel cobra $20 USD/mes para sitios
comerciales (su plan gratis prohíbe explícitamente el uso comercial), Supabase conviene
subirlo a $25 USD/mes antes de salir a producción porque el plan gratis no hace respaldos
y apaga el proyecto tras 7 días sin tráfico, y hace falta un dominio propio (~$15 USD/año).
Total realista: **~$45–50 USD/mes**, no $0.

---

## 1. Stack (ya decidido — se formaliza, no se discute)

| Capa | Tecnología | Origen de la decisión |
|---|---|---|
| Frontend + backend | **Next.js (App Router)**, un solo proyecto full-stack | Declarado en `perfil.md` por la dueña (2026-09-20) |
| Lógica de servidor | Server Components + Server Actions + Route Handlers | Consecuencia directa del punto anterior |
| Base de datos | **Supabase / Postgres** | Declarado en `perfil.md` |
| Autenticación | **Supabase Auth** (cookies, `@supabase/ssr`) | Declarado en `perfil.md` |
| Autorización a nivel de fila | **RLS en todas las tablas** | `modelo-datos.md` §5 + decisión 11 de `estado.md` |
| Archivos | **Cloudflare R2** (no Supabase Storage) | Declarado en `perfil.md` |
| Lenguaje | TypeScript en modo estricto | Estándar DevSquad AI (ver §12) |
| Validación de datos | Zod, compartido entre formulario y servidor | Decisión de esta fase (§9.7) |
| Correo transaccional | **Resend** | Decisión de esta fase (§7.2) |
| Anti-spam | **Cloudflare Turnstile** | Decisión de esta fase (§9.8) |
| Despliegue | **Vercel** | Estaba "a confirmar" en `perfil.md` → **se formaliza aquí** (§1.1) |

### 1.1 Despliegue: se confirma Vercel, con una advertencia de costo

Vercel es el destino natural de un proyecto Next.js: es quien mantiene el framework, el
despliegue es `git push`, y no hay servidor que administrar (importa: no hay nadie de
sistemas en este proyecto). **Se confirma Vercel.**

La advertencia es de costo, no de tecnología:

| Concepto | Realidad verificada (sept. 2026) | Consecuencia |
|---|---|---|
| Plan Hobby de Vercel | Gratis, pero **restringido a uso personal no comercial** por sus términos de uso | Una tienda que vende equipo **no** califica |
| Plan Pro | **$20 USD/mes por asiento**, incluye $20 de crédito de uso | Es el plan mínimo legal para este proyecto |
| Cron jobs en Hobby | 2 tareas, 1 vez al día | Insuficiente: se necesitan reintentos de notificación y liberación de pedidos vencidos |

**Costo:** $20 USD/mes. **Impacto:** cumplimiento de términos, despliegues sin fricción,
tareas programadas frecuentes, logs y protección DDoS incluidos. **Impacto a futuro:**
ninguno negativo; si el negocio crece, el mismo plan escala sin migrar.
**Alternativas si $20/mes es un problema:** un VPS (Hetzner/DigitalOcean, ~$6 USD/mes)
corriendo Next.js en Docker — más barato, pero **te compra un servidor que alguien tiene
que actualizar, respaldar y vigilar**, y en este proyecto no hay quien lo haga.
Recomendación: pagar los $20.

---

## 2. Atributos no funcionales (ANF) objetivo

La dueña no dio números; **los siguientes son inferidos** a partir del perfil del negocio
(distribuidor regional en Querétaro, ~1,050 SKU, validación manual de pagos, un dueño
operando el panel) y de la sección 6 de `requerimientos.md`. Se declaran explícitamente
para que puedan corregirse, no para darlos por hechos.

| Atributo | Objetivo v1 | Cómo se mide / base de la inferencia |
|---|---|---|
| **Concurrencia** | 5–30 visitantes simultáneos en pico; 1–3 usuarios del panel | Negocio regional sin campañas masivas. Un pico por promoción podría llegar a 100; la arquitectura lo aguanta sin cambios |
| **Volumen transaccional** | 5–50 pedidos/día; 1 comprobante por pedido | Venta B2C/B2B con asesor humano de por medio ("te contactamos en 24 h") |
| **Tiempo de respuesta — catálogo** | p95 < 1.5 s hasta contenido visible; TTFB < 500 ms | Criterio A2.3 de requerimientos (búsqueda < 1 s) |
| **Tiempo de respuesta — búsqueda** | < 300 ms del lado del servidor, < 1 s percibido | Índice GIN + trigram sobre 1,050 filas: sobra capacidad |
| **Tiempo de respuesta — panel admin** | < 2 s por pantalla; tolerante a más | Lo usa una persona, no el público |
| **Disponibilidad** | **99% en horario comercial** (L–V 9:00–19:00, S 9:00–14:00, hora centro) | `requerimientos.md` §6: "una caída nocturna es tolerable" |
| **RTO** (cuánto puede estar caído) | 4 horas en horario comercial | Proporcional a un negocio que vende por transferencia con asesor |
| **RPO** (cuántos datos se pueden perder) | **24 horas** | Exige respaldos diarios → el plan gratis de Supabase **no los tiene** (ver §11.2) |
| **Integridad de inventario** | **0 sobreventas** por condición de carrera | Es un invariante duro, no una métrica: ver §9.1 |
| **Integridad de saldo a favor** | Saldo nunca negativo, toda operación atómica | RN-7 |
| **Almacenamiento (R2)** | < 2 GB el primer año (~1,050 SKU × ~5 imágenes optimizadas) | Cabe holgado en los 10 GB gratis de R2. ⚠ Depende de PA-20 (volumen real de fotos) |
| **Base de datos** | < 300 MB el primer año | El plan gratis de Supabase da 500 MB: alcanza, pero sin margen para bitácoras |
| **Seguridad** | HTTPS obligatorio; comprobantes nunca públicos; LFPDPPP (aviso de privacidad) | `requerimientos.md` §6 |
| **Mantenibilidad** | Un desarrollador nuevo entiende dónde va cada cosa en < 1 hora | Es la razón de ser de la estructura de la §4 |
| **Operabilidad** | El panel lo usa una persona no técnica sin manual | `requerimientos.md` §6 |

> **Lo que estos números NO son:** un compromiso contractual. Son el criterio con el que
> se dimensiona la arquitectura. Si la dueña dice "esperamos 500 personas el Buen Fin",
> lo único que cambia es el plan de Vercel/Supabase, no el diseño.

---

## 3. Patrón de arquitectura: monolito modular en capas

**Elegido: monolito modular** — una sola aplicación desplegable, dividida por dentro en
módulos de negocio con fronteras explícitas y tres capas (presentación → dominio →
acceso a datos).

### Por qué, contra las alternativas reales

| Alternativa | Por qué **no** |
|---|---|
| **Microservicios** (catálogo, pedidos, notificaciones por separado) | Multiplica por 3–5 el costo operativo (despliegues, redes, observabilidad, transacciones distribuidas) para un sistema que corre en un servidor lógico y atiende decenas de usuarios. Además, la regla de inventario de `estado.md` #9 exige **transacciones atómicas entre pedidos y productos**: partirlos en servicios distintos convertiría un `BEGIN/COMMIT` trivial en una saga compensatoria. Es la peor decisión posible aquí |
| **Backend separado** (Python/FastAPI + frontend Next.js) | Ya descartado por la dueña en `perfil.md`. Técnicamente además duplicaría validaciones y tipos |
| **Arquitectura por eventos** (cola de mensajes entre etapas) | Fuera del límite de alcance de DevSquad AI y desproporcionada. Se toma **solo la parte útil**: un patrón *outbox* para notificaciones (§7.3), que es una tabla, no una infraestructura |
| **Monolito sin módulos** (lógica dentro de los componentes de React) | Es lo que pasa por default si no se documenta una estructura. Vuelve imposible probar las reglas de negocio y tienta a calcular el stock en el cliente — exactamente lo que `estado.md` prohíbe |

### Trade-off, dicho en voz alta (ATAM)

> **A favor:** simplicidad operativa, transacciones atómicas gratis, un solo despliegue,
> un solo juego de tipos, costo mínimo, velocidad de desarrollo.
> **En contra:** todo el sistema escala junto (si el catálogo recibe un pico, el panel
> admin comparte los mismos recursos) y no se puede desplegar el panel sin desplegar la
> tienda. Un error grave en una parte puede tumbar todo.
> **Por qué se acepta:** con 5–30 usuarios simultáneos, escalar por partes no resuelve
> ningún problema real, y el riesgo de "tumbar todo" se mitiga con pruebas y despliegues
> con vista previa (Vercel los da por rama). **Si algún día hiciera falta separar**, la
> frontera ya está trazada: cada módulo de `src/server/domain/` puede extraerse a un
> servicio sin reescribir la lógica, porque no depende de React ni de Next.

### Los módulos de negocio

`catalogo` · `pedidos` · `inventario` · `pagos` · `devoluciones` · `saldo` ·
`servicios` (leads) · `contenido` (banners, FAQs, legales) · `analitica` ·
`identidad` (perfiles, direcciones, datos fiscales) · `configuracion` (settings).

Regla de acoplamiento: un módulo puede llamar a otro **solo a través de su función
pública exportada**, nunca alcanzando sus consultas internas. `pedidos` le pide a
`inventario` "aparta estas piezas"; no toca `products` por su cuenta.

---

## 4. Estructura de carpetas

```
qro-security/
├── index.html · support.js · uploads/     ← PROTEGIDOS: referencia visual, no se tocan
├── docs/ · .devsquad/                     ← documentación del proyecto
├── supabase/
│   ├── migrations/                        ← esquema versionado (SQL, una migración por cambio)
│   │   ├── 0001_extensiones.sql           ← pg_trgm, unaccent, pgcrypto
│   │   ├── 0002_identidad_y_roles.sql
│   │   ├── 0003_catalogo.sql
│   │   ├── 0004_pedidos.sql
│   │   ├── 0005_devoluciones_y_saldo.sql
│   │   ├── 0006_servicios_y_contenido.sql
│   │   ├── 0007_rls_policies.sql          ← RLS de TODAS las tablas, desde el día uno
│   │   └── 0008_funciones_transaccionales.sql  ← apartar/liberar/enviar (§9.1)
│   └── seed.sql                           ← grupos, subcategorías, settings iniciales
├── public/                                ← estáticos del sitio real (favicon, logo)
└── src/
    ├── app/                               ═══ CAPA DE PRESENTACIÓN ═══
    │   ├── (public)/                      ← sitio público (respeta el diseño del demo)
    │   │   ├── layout.tsx                 ← header, nav de grupos, footer
    │   │   ├── page.tsx                   ← portada: hero, grupos, destacados, reseñas
    │   │   ├── catalogo/[grupo]/[subcategoria]/page.tsx
    │   │   ├── producto/[slug]/page.tsx
    │   │   ├── buscar/page.tsx
    │   │   ├── carrito/page.tsx
    │   │   ├── pagar/page.tsx             ← genera pedido + instrucciones de transferencia
    │   │   ├── servicios/[tipo]/page.tsx
    │   │   └── legal/[slug]/page.tsx      ← privacidad, términos, devoluciones
    │   ├── (cuenta)/mi-cuenta/            ← requiere sesión de cliente
    │   │   ├── pedidos/page.tsx · pedidos/[folio]/page.tsx
    │   │   ├── devoluciones/ · saldo/ · direcciones/ · datos-fiscales/
    │   ├── (auth)/ingresar/ · registro/ · recuperar/
    │   ├── (admin)/admin/                 ← panel: layout hace guard de rol (§6.4)
    │   │   ├── layout.tsx                 ← ⛔ corta aquí a cualquiera sin rol admin/inventario
    │   │   ├── page.tsx                   ← tablero
    │   │   ├── pedidos/ · pedidos/[folio]/
    │   │   ├── catalogo/ · catalogo/[id]/ · catalogo/importar/
    │   │   ├── devoluciones/ · solicitudes/ · analitica/
    │   │   ├── contenido/                 ← banners, FAQs, legales
    │   │   └── configuracion/             ← datos bancarios, correo/WhatsApp del admin
    │   ├── api/
    │   │   ├── uploads/firmar/route.ts    ← genera URL firmada de subida a R2
    │   │   ├── archivos/[...key]/route.ts ← sirve archivo privado tras autorizar
    │   │   ├── confirmar-pago/[token]/route.ts  ← enlace de un solo uso del correo
    │   │   └── cron/
    │   │       ├── reintentar-notificaciones/route.ts
    │   │       ├── cancelar-pedidos-vencidos/route.ts
    │   │       └── recalcular-apartados/route.ts   ← conciliación (§9.1)
    │   ├── layout.tsx · error.tsx · not-found.tsx
    │   └── globals.css
    │
    ├── components/                        ═══ PRESENTACIÓN REUTILIZABLE — Atomic Design ═══
    │   ├── atoms/                         ← Boton, Campo, Etiqueta, Icono, Badge, Spinner…
    │   │                                     no saben nada del negocio: reciben props, no SKUs
    │   ├── molecules/                     ← CampoConError, TarjetaProducto, ChipFiltro,
    │   │                                     LineaPedido, IndicadorStock, PasoDeFlujo…
    │   │                                     combinan 2-3 átomos con una responsabilidad
    │   ├── organisms/                     ← GaleriaProducto, ResumenCarrito, TablaPedidos,
    │   │                                     FormularioDireccion, VisorComprobante,
    │   │                                     ImportadorCSV, FiltrosCatalogo…
    │   │                                     una sección completa de pantalla, con estado propio
    │   ├── templates/                     ← LayoutTienda, LayoutCuenta, LayoutAdmin
    │   │                                     el esqueleto de una pantalla, sin datos reales
    │   └── admin/                         ← organismos exclusivos del panel que no aplican
    │                                         al sitio público (ImportadorCSV, EditorProducto)
    │
    ├── server/                            ═══ SOLO SERVIDOR — nunca llega al navegador ═══
    │   │                                     (todo archivo aquí importa 'server-only')
    │   ├── config/
    │   │   └── env.ts                     ← lee y VALIDA variables de entorno con Zod
    │   ├── supabase/
    │   │   ├── server.ts                  ← cliente con la sesión del usuario (respeta RLS)
    │   │   ├── admin.ts                   ← ⚠ cliente service role (salta RLS) — ver §6.2
    │   │   └── middleware.ts              ← refresco de cookies de sesión
    │   ├── db/                            ═══ CAPA DE ACCESO A DATOS ═══
    │   │   ├── queries/                   ← solo SELECT: productos.ts, pedidos.ts, saldo.ts…
    │   │   └── mutations/                 ← INSERT/UPDATE y llamadas a funciones SQL
    │   ├── domain/                        ═══ CAPA DE LÓGICA DE NEGOCIO (pura) ═══
    │   │   ├── inventario.ts              ← disponible, apartar, liberar, descontar
    │   │   ├── folio.ts                   ← generación de folios (§9.2)
    │   │   ├── precios.ts                 ← subtotales, IVA, congelado de precio
    │   │   ├── saldo.ts                   ← aplicar saldo, calcular disponible, RN-6/7
    │   │   ├── pedidos.ts                 ← máquina de estados y transiciones válidas
    │   │   ├── devoluciones.ts            ← 100% / 70% / revisión manual (RN-6)
    │   │   ├── importacion.ts             ← validación fila a fila del CSV
    │   │   └── analitica.ts
    │   ├── actions/                       ← Server Actions: entrada del mundo exterior
    │   │   ├── pedidos.ts · comprobantes.ts · devoluciones.ts
    │   │   ├── catalogo.ts · importacion.ts · servicios.ts · cuenta.ts
    │   │   └── _guard.ts                  ← autenticar + autorizar + validar (§6.4)
    │   ├── storage/                       ═══ ADAPTADOR: Cloudflare R2 ═══
    │   │   ├── r2.ts                      ← cliente S3, subida, borrado
    │   │   ├── firmar.ts                  ← URLs firmadas de subida y de lectura
    │   │   ├── rutas.ts                   ← única fuente de las rutas de modelo-datos §6
    │   │   └── imagenes.ts                ← derivados webp (thumb/card/full) al subir
    │   ├── notifications/                 ═══ ADAPTADOR: correo / WhatsApp ═══
    │   │   ├── tipos.ts                   ← interfaz CanalNotificacion + eventos
    │   │   ├── despachador.ts             ← decide canales, encola, reintenta
    │   │   ├── plantillas/                ← un archivo por correo transaccional (H3)
    │   │   └── canales/
    │   │       ├── correo.ts              ← Resend — activo desde el día 1
    │   │       ├── whatsapp.ts            ← se conecta después, sin tocar nada más
    │   │       └── nulo.ts                ← no-op: el default cuando no hay proveedor
    │   └── auth/
    │       ├── sesion.ts · roles.ts · limites.ts   ← rate limiting (§9.8)
    │
    ├── lib/                               ═══ COMPARTIDO cliente + servidor (código puro) ═══
    │   ├── supabase/cliente.ts            ← cliente de navegador (solo anon key)
    │   ├── esquemas/                      ← Zod: un esquema por formulario, usado en ambos lados
    │   ├── formato.ts                     ← moneda MXN, fechas, etiquetas de stock
    │   └── constantes.ts                  ← estados de pedido, condiciones de devolución
    │
    ├── types/                             ← tipos generados de Supabase + tipos de dominio
    └── middleware.ts                      ← refresco de sesión + candado de /admin
```

### Las tres reglas de dependencia (lo que mantiene las capas separadas)

1. **`app/` y `components/` nunca importan de `src/server/db/mutations/` ni de
   `src/server/supabase/admin.ts`.** Toda escritura pasa por `src/server/actions/`, que
   a su vez llama a `src/server/domain/`.
2. **`src/server/domain/` no importa nada de React, Next ni Supabase.** Recibe datos y
   devuelve decisiones. Eso lo hace probable con pruebas unitarias sin base de datos —
   y es la frontera que permitiría extraerlo a un servicio si el proyecto creciera.
3. **`src/lib/` es el único lugar que ambos lados pueden importar**, y por eso no puede
   contener secretos ni lógica de negocio sensible.

### 4.1 `components/` sigue Atomic Design (skill `estandares-frontend`)

La regla de dependencia dentro de `components/` va en un solo sentido: **átomo → molécula
→ organismo → template**. Un átomo nunca importa una molécula; un organismo puede combinar
varias moléculas y átomos, pero dos organismos no se combinan entre sí (esa composición ya
es responsabilidad de una página en `app/`).

| Nivel | Qué es | Ejemplo de este proyecto | Sabe de negocio? |
|---|---|---|---|
| **Átomo** | La pieza más chica con sentido propio | `Boton`, `Campo`, `Badge`, `Spinner` | No — ni un SKU ni un estado de pedido |
| **Molécula** | 2–3 átomos con una responsabilidad | `CampoConError` (Campo + mensaje), `IndicadorStock` (Badge + texto), `TarjetaProducto` | Solo la mínima para renderizarse (recibe `producto` ya resuelto, no lo consulta) |
| **Organismo** | Una sección completa de pantalla, con su propio estado de interacción | `GaleriaProducto`, `ResumenCarrito`, `TablaPedidos`, `ImportadorCSV`, `VisorComprobante` | Sí, pero solo de presentación — sigue sin llamar a Supabase directamente |
| **Template** | El esqueleto de una pantalla sin datos reales | `LayoutTienda`, `LayoutAdmin` | No — define dónde va cada organismo, no qué contiene |
| **Página** | Vive en `app/`, no en `components/` | `app/(public)/producto/[slug]/page.tsx` | Sí — aquí es donde se leen datos reales (Server Component) y se arma la página con el template + organismos |

**Por qué el sitio público también lo sigue, aunque ya tenga diseño aprobado.** El demo
(`index.html`) es la referencia visual, no la referencia de estructura de código — es un
único archivo de más de 2,700 líneas con toda la lógica mezclada, típico de un prototipo de
diseño. Traducirlo a Atomic Design es precisamente lo que evita reproducir ese problema en
el código real: la paleta, tipografía y espaciado que definió el demo se capturan **una vez**
en los átomos (vía los tokens del Diseñador) y de ahí se heredan hacia arriba, en vez de
repetirse pantalla por pantalla como pasa en el HTML de referencia.

> **Trade-off (ATAM):** cuatro niveles con reglas de importación agregan una decisión extra
> cada vez que se crea un componente ("¿esto es molécula u organismo?"), fricción que un
> proyecto muy pequeño podría no necesitar. Se acepta porque este proyecto tiene **dos
> superficies** (tienda y panel) que van a compartir átomos y moléculas (un `Badge` de stock
> se ve igual en la ficha de producto que en la tabla del admin) — sin esta disciplina, el
> panel terminaría con su propio botón ligeramente distinto al de la tienda, que es
> exactamente la inconsistencia que la skill `estandares-frontend` pide evitar. La carpeta
> `admin/` es la única excepción deliberada: organismos que de verdad no tienen sentido fuera
> del panel (`ImportadorCSV`) no se fuerzan a un nivel genérico solo por seguir la regla.

Lectura: los Server Components **sí** pueden llamar directamente a
`src/server/db/queries/` (son solo lecturas, ya filtradas por RLS). Exigir que toda
lectura pase por el dominio sería ceremonia sin beneficio.

---

## 5. Modelo de datos

**Ya está definido y aprobado en `.devsquad/modelo-datos.md`. No se rediseña aquí.**
Esta fase agrega tres elementos de infraestructura que el modelo no podía anticipar
porque son consecuencia de decisiones de arquitectura, no de negocio:

| Adición | Motivo | Sección |
|---|---|---|
| `products.reserved int NOT NULL DEFAULT 0` con `CHECK (reserved >= 0 AND reserved <= stock)` | Convierte "no sobrevender" en una garantía de la base de datos, no una esperanza del código | §9.1 |
| Tabla `notification_outbox` | Que una falla de WhatsApp/correo nunca impida que un pedido cambie de estado (criterio C3.2) | §7.3 |
| Tablas `carts` / `cart_items` | Criterio B1.2: el carrito sobrevive al cambio de dispositivo con sesión iniciada | §9.6 |
| Tabla `import_jobs` | Criterio F2.2/F2.4: vista previa, reporte de errores por fila y proceso por lotes | §9.5 |

> **Acción para el Coder:** agregar estas cuatro entradas a `modelo-datos.md` al crear las
> migraciones, marcadas como "origen: arquitectura". La fórmula de stock disponible del
> modelo (`stock − SUM(qty) de pedidos apartados`) **sigue siendo la fuente de verdad**:
> se usa en la conciliación nocturna para verificar que `reserved` no se desvió (§9.1).

---

## 6. Capa de acceso a Supabase

### 6.1 Tres clientes, tres propósitos, tres niveles de privilegio

| Cliente | Archivo | Llave que usa | Respeta RLS | Dónde puede usarse |
|---|---|---|---|---|
| **Navegador** | `src/lib/supabase/cliente.ts` | `anon` (pública) | **Sí** | Componentes `'use client'`: login, logout, suscripciones en vivo |
| **Servidor con sesión** | `src/server/supabase/server.ts` | `anon` + cookie del usuario | **Sí** | Server Components y Server Actions. **Es el default.** |
| **Servicio (privilegiado)** | `src/server/supabase/admin.ts` | `service_role` (**secreta**) | **No — salta RLS** | Solo operaciones que el usuario no puede hacer por sí mismo |

Regla: **usar siempre el cliente con sesión.** El cliente `service_role` está permitido
únicamente en cinco lugares, y cada uno lleva un comentario que justifica por qué:

1. Cambios de estado de pedido y baja de stock (§9.1).
2. Escritura en `order_status_history` y `credit_movements` (bitácoras inmutables).
3. El enlace de confirmación por correo (`/api/confirmar-pago/[token]`): quien hace clic
   no tiene sesión iniciada, la autorización la da el token.
4. Tareas programadas (`/api/cron/*`), que corren sin usuario.
5. Importación masiva de catálogo por lotes.

### 6.2 Cómo se garantiza que la llave privilegiada nunca llegue al navegador

Esto es obligatorio, no una buena práctica opcional. Cuatro candados, en orden de
"imposible de saltarse" a "avisa temprano":

1. **El nombre.** `SUPABASE_SERVICE_ROLE_KEY` **no** lleva el prefijo `NEXT_PUBLIC_`.
   Next.js solo inyecta al bundle del navegador las variables con ese prefijo; sin él, la
   variable es físicamente inaccesible desde el cliente. Es el candado real.
2. **`import 'server-only'`** como primera línea de `src/server/supabase/admin.ts` y de
   todo archivo bajo `src/server/`. Si alguien lo importa desde un componente de cliente,
   **la compilación falla** con un error explícito — no se descubre en producción.
3. **Regla de ESLint de frontera de importación** (`no-restricted-imports`): `src/app/**`
   y `src/components/**` no pueden importar `src/server/supabase/admin` ni
   `src/server/db/mutations/**`. Falla en CI.
4. **Revisión de seguridad antes del primer despliegue**: `grep` del repo buscando que
   ninguna llave secreta aparezca en texto plano ni con prefijo `NEXT_PUBLIC_`.

> **Trade-off (ATAM):** cuatro candados agregan fricción — un desarrollador nuevo va a
> chocar con el linter cuando intente el atajo. **Esa es exactamente la intención.** La
> llave `service_role` da acceso de lectura y escritura a los datos personales y fiscales
> de todos los clientes, y filtrarla es un incidente reportable bajo la LFPDPPP. Se
> sacrifica comodidad de desarrollo por seguridad, conscientemente.

### 6.3 RLS: red de seguridad, no el único control

RLS se activa en **todas** las tablas desde la primera migración (`0007_rls_policies.sql`),
con las políticas exactas de `modelo-datos.md` §5. Pero hay que ser honestos sobre qué
protege:

- **RLS protege las lecturas y escrituras hechas con la sesión del usuario.** Es la
  defensa contra un cliente curioso que abre la consola del navegador.
- **RLS NO protege las operaciones con `service_role`**, porque las salta por diseño.
  Esas dependen de que `src/server/actions/_guard.ts` verifique quién es el usuario y si
  tiene derecho.

Por eso el orden en toda Server Action es siempre el mismo, sin excepciones:

```
1. autenticar()      ← ¿hay sesión? si no → 401
2. autorizar(rol)    ← ¿este rol puede hacer esto? si no → 403
3. validar(esquema)  ← ¿los datos tienen forma válida? si no → 400 con mensaje usable
4. dominio(...)      ← aplicar la regla de negocio
5. registrar(...)    ← bitácora: quién, qué, cuándo
```

### 6.4 Roles y candado del panel

Dos roles (`admin`, `inventario`) según `estado.md` #11, más `cliente` por default. El rol
vive en `profiles.role` y se replica como **custom claim en el JWT** mediante un Auth Hook
de Supabase, para que las políticas RLS puedan leerlo sin hacer un `SELECT` extra por fila
(un `SELECT` dentro de una política se ejecuta por cada fila evaluada: a 1,050 productos,
eso se nota).

Tres candados sobre `/admin`, en capas:
1. `middleware.ts` — redirige a `/ingresar` sin sesión. Barato y temprano.
2. `app/(admin)/admin/layout.tsx` — verifica el rol en el servidor antes de renderizar.
3. Cada Server Action del panel revalida el rol. **Nunca se confía en que la UI ya filtró.**

El rol `inventario` no ve siquiera los enlaces de Pedidos/Clientes/Analítica, y si escribe
la URL a mano recibe 403 en el paso 2.

Sesión administrativa más corta que la del cliente (criterio H2): se implementa comparando
la antigüedad de la sesión contra `ADMIN_SESSION_MAX_AGE_MINUTES` en el guard del layout,
porque Supabase Auth no ofrece duraciones distintas por rol de forma nativa.

---

## 7. Capas de infraestructura

### 7.1 Cloudflare R2 — archivos

**Dos buckets, no uno.** La separación es lo que hace imposible un error de configuración
que exponga un comprobante bancario:

| Bucket | Contenido | Acceso |
|---|---|---|
| `sgq-publico` | Fotos y documentos de producto, imágenes de grupo, banners | Público, servido por `cdn.<dominio>` (dominio propio sobre Cloudflare) |
| `sgq-privado` | **Comprobantes de pago, fotos de devolución** | Sin acceso público. Solo URL firmada temporal |

Rutas: exactamente las de `modelo-datos.md` §6, centralizadas en
`src/server/storage/rutas.ts` — un solo lugar que las construye, para que nunca se
escriban a mano en dos sitios distintos.

**Qué se guarda en la base de datos:** la **clave del objeto** (`comprobantes/SGQ-00248/
a3f…​.jpg`), **nunca una URL firmada**. Una URL firmada caduca; guardarla produciría
enlaces rotos en semanas.

#### Subida: URL firmada directa navegador → R2

El archivo **no pasa por el servidor de Next.js**. El flujo es:

```
1. Navegador  → POST /api/uploads/firmar   { tipo: 'comprobante', orderId, mime, bytes }
2. Servidor   → autentica, autoriza (¿este pedido es tuyo?), valida mime y tamaño,
                GENERA la clave del objeto (el cliente nunca elige la ruta),
                devuelve una URL firmada de PUT con vigencia de 5 minutos
3. Navegador  → PUT directo a R2 con esa URL (con barra de progreso)
4. Navegador  → POST /server-action confirmarComprobante({ key, monto, fecha, banco, spei })
5. Servidor   → HEAD del objeto en R2: verifica que existe, su tamaño y su tipo REAL
                (magic bytes, no la extensión — criterio C2.2),
                inserta en payment_proofs y dispara la transición de estado (§9.1)
```

> **Trade-off (ATAM):** subir directo a R2 evita el límite de ~4.5 MB de cuerpo de las
> funciones serverless y no consume tiempo de cómputo facturable — con fotos de
> comprobante tomadas con celular (3–8 MB), pasar por el servidor **fallaría**. El costo
> es que por 5 minutos existe una credencial de escritura acotada en el navegador. Se
> acota con: vigencia corta, clave generada por el servidor, restricción de
> `content-length` y `content-type` en la firma, y **verificación posterior del servidor**
> antes de dar el archivo por bueno. Más seguro que la alternativa simple, a costa de un
> paso más de código.

#### Lectura de archivos privados

`/api/archivos/[...key]` verifica sesión y propiedad (el cliente dueño del pedido, o
`admin`), genera una URL firmada de GET con **15 minutos** de vigencia y redirige. El
panel y "Mis pedidos" nunca reciben una URL permanente. Las URLs firmadas **no se
cachean** (`Cache-Control: private, no-store`).

#### Imágenes de producto: derivados al subir, no al servir

Al subir una foto desde el panel, el servidor genera tres versiones WebP
(`thumb` 200 px, `card` 600 px, `full` 1600 px) y las guarda en R2. El sitio las consume
directo del CDN, sin pasar por la optimización de imágenes de Vercel.

> **Trade-off (ATAM):** Vercel factura la optimización de imágenes por imagen de origen
> transformada; con ~1,050 SKU × ~5 fotos × varios tamaños, eso es un costo recurrente
> evitable y difícil de predecir. Generarlas una vez al subir cuesta **más trabajo en la
> carga inicial del catálogo** y **más espacio en R2** (~3× por foto), pero R2 no cobra
> egress y el almacenamiento entra en los 10 GB gratis. Se cambia costo variable
> impredecible por costo fijo casi nulo. Contra: cambiar los tamaños después obliga a
> regenerar el catálogo (script de una sola corrida, ya previsto).

### 7.2 Correo transaccional — Resend, activo desde el día 1

Se elige **Resend**: API simple, plantillas en React, y su plan gratis (3,000 correos/mes,
**tope de 100/día**, 1 dominio verificado) alcanza para 5–50 pedidos diarios con ~4 correos
por pedido. Si el negocio crece, el plan de pago arranca en ~$20 USD/mes.

**Requisito externo que no depende del código:** un dominio propio con SPF, DKIM y DMARC
configurados. Sin eso, los correos con datos bancarios caen en spam — y en este negocio
**el correo con los datos de la transferencia es el producto**. Ya está listado como
dependencia externa en `requerimientos.md` §8.3.

Correos de la v1 (criterio H3): verificación de cuenta · recuperación de contraseña ·
pedido generado con datos de pago · comprobante recibido (al cliente) · **comprobante
recibido con enlace de confirmación (al admin)** · pago validado · pago rechazado con
motivo · enviado · entregado · devolución resuelta · nueva solicitud de servicio.

### 7.3 Notificaciones: una interfaz, varios canales, cero bloqueo

Cumple `estado.md` #7 y el criterio C3.2 ("la falla de WhatsApp nunca impide que el pedido
cambie de estado").

```ts
// src/server/notifications/tipos.ts
export type EventoNotificable =
  | { tipo: 'comprobante.recibido'; orderId: string }
  | { tipo: 'pedido.pago_validado'; orderId: string }
  | { tipo: 'pedido.enviado';       orderId: string }
  | { tipo: 'devolucion.resuelta';  returnId: string }
  | { tipo: 'servicio.solicitado';  requestId: string }
  // …

export interface CanalNotificacion {
  readonly nombre: 'correo' | 'whatsapp';
  disponible(): boolean;                      // ¿hay credenciales configuradas?
  soportaAdjuntos(): boolean;
  enviar(evento: EventoNotificable, destino: Destino): Promise<ResultadoEnvio>;
}
```

**Cómo se despacha, en dos tiempos:**

1. **Dentro de la misma transacción** que cambia el estado del pedido, se inserta una fila
   en `notification_outbox` (`evento`, `canal`, `destino`, `intentos`, `estado`). Si la
   transacción se revierte, la notificación desaparece con ella: nunca se avisa de un pago
   que no se registró.
2. **Después del commit**, el despachador intenta enviar de inmediato (el admin recibe su
   aviso en segundos). Si falla, no pasa nada grave: la fila queda pendiente y el cron
   `/api/cron/reintentar-notificaciones` la reintenta con espera creciente, hasta 5 veces.

**Conectar WhatsApp después no toca nada más que un archivo.** `canales/whatsapp.ts`
implementa la misma interfaz; `despachador.ts` lo incluye solo si
`WHATSAPP_PROVIDER !== 'none'` y `disponible()` devuelve `true`. Mientras tanto,
`canales/nulo.ts` registra el intento en la bitácora sin enviar nada. **No hay que
rediseñar el sistema cuando Meta apruebe el número** — es lo que pide PA-5.

> **Trade-off (ATAM):** el patrón outbox agrega una tabla, un cron y complejidad de
> depuración frente al simple `await enviarCorreo()` después de guardar. Se acepta porque
> el evento "subieron un comprobante" **es** la operación central del negocio: perderlo
> significa un cliente que ya transfirió y a quien nadie atiende. La alternativa barata
> falla exactamente en el peor momento — cuando el proveedor de correo tiene una caída.

---

## 8. Estrategia de caché y frescura de datos

Next.js cachea de forma agresiva por default, y con un catálogo eso es deseable... hasta
que el stock cambia.

| Contenido | Estrategia | Frescura |
|---|---|---|
| Portada, páginas legales, FAQs | Estático con revalidación | 1 hora |
| Listados de catálogo | Revalidación por etiqueta (`catalogo`, `producto:{id}`) | 5 min, o inmediato al editar |
| Ficha de producto | Cacheada, pero **el bloque de disponibilidad se renderiza dinámico** | Cada visita |
| Carrito, cuenta, panel admin, búsqueda | Sin caché (`dynamic`) | Siempre en vivo |

Al guardar un producto desde el panel se llama `revalidateTag('producto:{id}')` y
`revalidateTag('catalogo')`: el cambio se ve de inmediato, no en 5 minutos.

> **Trade-off (ATAM):** cachear el catálogo lo hace rápido y barato (menos consultas a
> Supabase, menos cómputo en Vercel), pero durante unos segundos un producto recién
> apartado puede seguir apareciendo como disponible. **Se acepta porque la frescura de la
> vista nunca es la que decide**: la verificación autoritativa ocurre dentro de la
> transacción del paso 5 de §7.1, y ahí el cliente recibe un mensaje claro
> ("otro cliente apartó la última pieza mientras completabas tu pago") en vez de una
> sobreventa silenciosa. Optimizar para que el catálogo nunca se equivoque costaría
> rendimiento en el 99.9% de las visitas para evitar un aviso en el 0.1%.

---

## 9. Decisiones de arquitectura no triviales (con su trade-off)

### 9.1 Consistencia del inventario bajo concurrencia ⭐ (la decisión más importante)

**El escenario concreto:** queda 1 pieza de una cámara. Dos clientes que ya generaron su
pedido suben su comprobante con 300 ms de diferencia. Según `estado.md` #9, subir el
comprobante **aparta** la pieza. Sin protección, ambos procesos leen "disponible = 1",
ambos concluyen "sí alcanza", y ambos apartan: quedan 2 piezas apartadas de 1 existente.
El sistema le prometió a dos clientes, que ya transfirieron, un producto que no existe.

**Alternativas evaluadas:**

| Opción | Cómo funciona | Por qué se descarta / acepta |
|---|---|---|
| Calcular disponible al vuelo en cada escritura | `SELECT stock − SUM(qty)…` y luego `UPDATE` | ❌ Ventana de carrera entre el SELECT y el UPDATE. Es precisamente el bug |
| Transacción `SERIALIZABLE` | Postgres aborta una de las dos | ✅ Correcto, pero obliga a lógica de reintento en cada punto y degrada bajo carga |
| **Bloqueo de fila + contador con `CHECK`** | La pieza apartada se materializa en `products.reserved`, con la restricción en la base | ✅ **Elegido** |

**Implementación.** Toda transición que mueve inventario ocurre dentro de una **función
de Postgres** (`supabase/migrations/0008_funciones_transaccionales.sql`), invocada por RPC
desde `src/server/db/mutations/`. Nunca en TypeScript, nunca en varios pasos sueltos:

```sql
-- apartar_pedido(p_order_id uuid)  → se llama al confirmar el comprobante
BEGIN;
  -- 1. bloquear las filas de producto, SIEMPRE ordenadas por id (evita interbloqueos
  --    cuando dos pedidos comparten varios productos en distinto orden)
  SELECT id, stock, reserved FROM products
   WHERE id IN (SELECT product_id FROM order_items WHERE order_id = p_order_id)
   ORDER BY id
   FOR UPDATE;
  -- 2. sumar lo pedido a reserved; el CHECK (reserved <= stock) aborta si no alcanza
  UPDATE products p SET reserved = p.reserved + oi.qty FROM order_items oi …;
  -- 3. cambiar el estado del pedido + escribir order_status_history
  -- 4. encolar la notificación en notification_outbox  (§7.3)
COMMIT;
```

Funciones hermanas, con el mismo patrón: `liberar_apartado()` (rechazo de comprobante o
cancelación → `reserved -= qty`), `marcar_enviado()` (`stock -= qty` **y**
`reserved -= qty` en el mismo commit, más `sales_count += qty`), `aplicar_saldo()`
(bloquea el renglón de saldo del cliente y verifica que la suma nunca quede negativa,
RN-7).

El segundo cliente recibe un error de negocio limpio —"otro cliente apartó la última
pieza; tu pedido sigue pendiente y puedes elegir otro producto o solicitar que te
devolvamos tu transferencia"— en vez de una promesa imposible.

**La red de seguridad.** `CHECK (reserved >= 0 AND reserved <= stock)` vive en la base de
datos: aunque un día alguien escriba código equivocado, **Postgres rechaza la operación**.
Y el cron `/api/cron/recalcular-apartados` compara cada noche `products.reserved` contra
la fórmula original de `modelo-datos.md`
(`SUM(order_items.qty)` de pedidos en `comprobante_recibido` o `listo_envio`) y reporta
cualquier desviación al admin. La fórmula del modelo sigue siendo la fuente de verdad.

> **Trade-off (ATAM) — se dice completo:**
> **Se gana:** cero sobreventas garantizadas por la base de datos, no por disciplina del
> programador; y lecturas de catálogo baratas (`stock − reserved` es una resta en la misma
> fila, sin `JOIN` contra `order_items` en cada listado de 1,050 productos — a 30
> visitantes simultáneos, esa diferencia es medible).
> **Se pierde:** un dato duplicado que puede desviarse si alguien escribe una ruta de
> código nueva que olvide actualizarlo. Se mitiga con tres capas: **una sola** función SQL
> puede tocarlo, el `CHECK` lo acota, y la conciliación nocturna lo audita.
> **Se pierde también:** las transacciones con `FOR UPDATE` serializan las confirmaciones
> de comprobante del *mismo* producto. A este volumen (decenas de pedidos al día) es
> irrelevante; a miles de pedidos por minuto sería un cuello de botella — y ahí haría
> falta otro diseño, que este negocio no necesita.

### 9.2 Generación del folio: legible en el banco, no enumerable

El folio es la referencia de la transferencia (RN-3) y el glosario pide "corto, único y no
adivinable en secuencia obvia".

**Decisión:** `SGQ-` + 6 caracteres de un alfabeto base32 sin ambigüedades (sin `0`, `O`,
`1`, `I`, `L`) → `SGQ-7K4M2X`. Se genera **dentro de la misma transacción** que crea el
pedido, mediante `gen_random_bytes` de `pgcrypto`, con `UNIQUE` sobre la columna y
reintento en caso de colisión (probabilidad despreciable con ~1 mil millones de
combinaciones).

> **Trade-off (ATAM):** un folio secuencial (`SGQ-00248`, como el demo) es más fácil de
> dictar por teléfono y le dice al dueño cuántos pedidos lleva. Pero se puede enumerar: un
> tercero podría estimar el volumen de ventas del negocio, y un cliente podría probar
> folios ajenos. **La seguridad real no depende del folio** (la protegen RLS y el token de
> confirmación), así que esto es protección de información comercial, no de datos. Se
> pierde un poco de legibilidad; se gana no publicar el ritmo de ventas de SG Querétaro en
> cada referencia bancaria. **Si la dueña prefiere el formato secuencial del demo, es un
> cambio de una línea** — es su decisión, no un requisito técnico.

### 9.3 El enlace de confirmación de pago por correo

Según `estado.md` #10 y `modelo-datos.md` §4.3, es un token de un solo uso, con
vencimiento, guardado como hash. Arquitectónicamente:

- El token se genera con `crypto.randomBytes(32)` → 43 caracteres en base64url. Solo el
  hash **SHA-256 con pepper** (`PAYMENT_TOKEN_PEPPER`, variable secreta) se guarda en
  `payment_confirmation_tokens.token_hash`. Quien lea la base de datos no puede confirmar
  pagos.
- Vigencia: 7 días. Un solo uso (`used_at`), verificado **dentro de la transacción** que
  confirma el pago, con `FOR UPDATE` sobre el renglón del token: dos clics simultáneos en
  el mismo enlace no confirman dos veces.
- El enlace **no confirma con un solo clic**: lleva a una página que muestra el folio, el
  monto esperado, el monto declarado y el comprobante, y pide confirmar con un botón
  (petición `POST`).

> **Trade-off (ATAM):** un solo clic desde el correo sería más rápido para el dueño —que es
> justo el objetivo de la función. Pero los clientes de correo y los antivirus corporativos
> **pre-visitan los enlaces** para escanearlos: un `GET` que confirma pagos se dispararía
> solo, sin que nadie hiciera clic. El paso intermedio cuesta 2 segundos al dueño y evita
> pagos confirmados por un escáner de spam. También es la pantalla donde se le muestra la
> disponibilidad real del producto antes de aceptar (el riesgo que `modelo-datos.md` §1
> pide vigilar).

### 9.4 Búsqueda: Postgres, no un motor dedicado

`unaccent` + `pg_trgm` + índice GIN sobre `name`, `sku` y marca. Resuelve coincidencias
parciales, tolerancia a acentos y mayúsculas, y tolerancia a errores de dedo (criterios
A2.1–A2.3) en **menos de 20 ms sobre 1,050 filas**.

> **Trade-off (ATAM):** un motor dedicado (Typesense, Algolia, Meilisearch) daría
> sinónimos, ranking configurable y sugerencias más finas — a cambio de **$0–30 USD/mes**,
> un servicio más que mantener, y un índice que se puede desincronizar del catálogo.
> Postgres no necesita sincronización porque los datos ya están ahí. A 1,050 SKU no hay
> problema que resolver. **Punto de reevaluación:** si el catálogo pasa de ~20,000 SKU o
> el cliente pide búsqueda semántica.

### 9.5 Carga masiva del catálogo: por lotes, con vista previa

F2 es V1 (decisión `estado.md` #6). El riesgo técnico: procesar 1,050 filas en una sola
petición choca contra el tiempo máximo de una función serverless, y un fallo a la mitad
deja el catálogo en un estado indeterminado.

**Diseño en tres pasos**, con estado en `import_jobs`:
1. **Subir** el CSV/Excel a R2 (mismo mecanismo de URL firmada de §7.1).
2. **Analizar**: el servidor lee el archivo, valida fila por fila con Zod
   (SKU único, precio numérico, grupo/subcategoría existentes, stock entero ≥ 0) y guarda
   el resultado. La vista previa muestra "980 correctas · 70 con error" con el motivo de
   cada una (criterio F2.2).
3. **Aplicar** en lotes de 200 filas, cada lote en su propia transacción, avanzando un
   contador de progreso. Una fila mala no detiene a las demás (F2.4); al final se ofrece
   un CSV con las filas rechazadas para corregirlas y reintentar.

> **Trade-off (ATAM):** tres pasos con estado persistido es bastante más código que "lee el
> archivo y haz un `INSERT`". Se acepta porque **cargar el catálogo es el primer momento
> real de verdad del proyecto** (riesgo #1 de `requerimientos.md` §9): si esa pantalla
> falla o es opaca, el dueño se queda sin plataforma. Además permite reanudar tras un
> corte de internet a media carga.

### 9.6 Carrito: local para visitantes, en base de datos para clientes

El criterio B1.2 pide que el carrito sobreviva a recargas **y al cambio de dispositivo con
sesión iniciada**.

- **Sin sesión:** `localStorage`. Cero infraestructura, cero registros de usuarios que
  nunca compran.
- **Con sesión:** tabla `carts` / `cart_items`, sincronizada. Al iniciar sesión, el
  carrito local se **fusiona** con el del servidor (se suman cantidades y se acota al
  stock disponible), no se pisa.
- Los precios y la disponibilidad se **recalculan siempre en el servidor** al entrar a
  pagar. Lo que el carrito guarda es la *intención* (SKU + cantidad), nunca el precio
  (B1.3 y RN-10).

> **Trade-off (ATAM):** la fusión de carritos es una de esas funciones que se ven triviales
> y tienen casos raros (producto desactivado desde la última visita, stock que bajó, precio
> que cambió). Cuesta un día de trabajo bien hecho. La alternativa —solo `localStorage`—
> sería más simple, pero rompe un criterio de aceptación de V1 y confunde a un cliente que
> arma su pedido en el celular y lo cierra en la computadora, que es un comportamiento
> común en venta de equipo técnico.

### 9.7 Un solo esquema de validación para el formulario y el servidor

Cada formulario tiene un esquema Zod en `src/lib/esquemas/`, usado por el componente
(retroalimentación inmediata) **y** por la Server Action (verdad autoritativa). El mismo
archivo, importado dos veces.

> **Trade-off:** acopla ligeramente cliente y servidor al mismo esquema. A cambio, es
> **imposible** que la validación del navegador y la del servidor se desincronicen — el
> origen clásico de "en mi pantalla se veía bien y se guardó mal". La validación del
> cliente es conveniencia; la del servidor es la que cuenta, y nunca se omite.

### 9.8 Protección contra abuso de formularios públicos

El formulario de servicios (E1.4) y el registro son puertas abiertas a internet.

- **Cloudflare Turnstile** (gratis, sin resolver rompecabezas, respetuoso de la privacidad)
  en solicitudes de servicio y registro.
- **Límite por IP y por correo** en una tabla de Postgres (`rate_limits`): 5 solicitudes de
  servicio por hora por IP, 5 intentos de login por 15 minutos por correo (H2).

> **Trade-off (ATAM):** un limitador en Postgres agrega una escritura por intento, frente a
> un Redis (Upstash) que sería más rápido y no toca la base. A 5–30 usuarios simultáneos la
> diferencia es imperceptible, y evita **un servicio más, una cuenta más y una llave más
> que cuidar**. Se reevalúa solo si el tráfico crece un orden de magnitud.

### 9.9 Verificación de correo: después del registro, no antes del primer pedido

Pregunta que `requerimientos.md` B2.3 dejó explícitamente a la arquitectura.

**Decisión:** se envía el correo de verificación al registrarse, pero **no se bloquea la
generación del pedido**. El pedido se puede crear sin verificar; lo que se marca es el
perfil (`email_verified`), y el panel muestra el indicador al admin.

> **Trade-off (ATAM):** exigir verificación antes de comprar da leads más limpios y menos
> pedidos basura. Pero en este flujo el cliente **ya va a transferir dinero real** —
> ninguna prueba de intención supera esa— y meter un "revisa tu correo" entre el carrito y
> los datos bancarios es el punto exacto donde se abandonan las compras. Se prioriza
> conversión sobre limpieza del padrón, y el filtro real lo hace el comprobante de pago.
> Es reversible con un `if`: si el dueño ve pedidos falsos, se activa el bloqueo.

---

## 10. Variables de entorno

Archivo `.env.local` en desarrollo (en `.gitignore`, **nunca** en el repositorio) y
variables del proyecto en Vercel para producción. `src/server/config/env.ts` las valida
con Zod **al arrancar**: si falta una, la aplicación no levanta y dice cuál — en vez de
fallar en producción cuando alguien sube un comprobante.

**Regla del prefijo:** `NEXT_PUBLIC_` significa "esto viaja al navegador y cualquiera puede
leerlo". Todo lo demás vive solo en el servidor.

### 10.1 Base y Supabase

| Variable | Para qué sirve | ¿Secreta? |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL base del sitio; construye los enlaces de los correos | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Dirección del proyecto Supabase | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública del cliente; **su seguridad la da RLS** | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave privilegiada: salta RLS. Cambios de estado, stock, crons | **SÍ — crítica** |
| `SUPABASE_DB_URL` | Conexión directa para migraciones con la CLI (solo local/CI) | **SÍ** |

### 10.2 Cloudflare R2

| Variable | Para qué sirve | ¿Secreta? |
|---|---|---|
| `R2_ACCOUNT_ID` | Identificador de la cuenta de Cloudflare | No (pero no se publica) |
| `R2_ACCESS_KEY_ID` | Usuario de acceso a los buckets | **SÍ** |
| `R2_SECRET_ACCESS_KEY` | Contraseña de acceso a los buckets | **SÍ — crítica** |
| `R2_BUCKET_PUBLIC` | Nombre del bucket público (fotos de producto) | No |
| `R2_BUCKET_PRIVATE` | Nombre del bucket privado (comprobantes, devoluciones) | No |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Dominio del CDN de imágenes (`https://cdn.<dominio>`) | No |

### 10.3 Correo

| Variable | Para qué sirve | ¿Secreta? |
|---|---|---|
| `RESEND_API_KEY` | Enviar los correos transaccionales | **SÍ** |
| `EMAIL_FROM` | Remitente verificado (`pedidos@<dominio>`) | No |
| `EMAIL_REPLY_TO` | Correo al que responde el cliente | No |

> El **correo del administrador** que recibe los avisos **no** es variable de entorno: vive
> en la tabla `settings` (`admin_email`), para que el dueño lo cambie desde el panel sin
> necesidad de un despliegue.

### 10.4 WhatsApp (se llenan cuando Meta apruebe el número; hasta entonces, `none`)

| Variable | Para qué sirve | ¿Secreta? |
|---|---|---|
| `WHATSAPP_PROVIDER` | `none` \| `meta` \| `twilio`. Con `none`, el canal simplemente no se registra | No |
| `WHATSAPP_PHONE_NUMBER_ID` | Identificador del número emisor en Meta Cloud API | No |
| `WHATSAPP_ACCESS_TOKEN` | Credencial de envío | **SÍ — crítica** |
| `WHATSAPP_TEMPLATE_NAME` | Nombre de la plantilla aprobada por Meta para el aviso de comprobante | No |

> El **número destino** tampoco es variable de entorno: es `settings.admin_whatsapp`
> (criterio C3.4).

### 10.5 Seguridad y operación

| Variable | Para qué sirve | ¿Secreta? |
|---|---|---|
| `PAYMENT_TOKEN_PEPPER` | Sal secreta para hashear los tokens de confirmación (§9.3) | **SÍ — crítica** |
| `CRON_SECRET` | Autentica las llamadas a `/api/cron/*`; sin esto cualquiera las dispara | **SÍ** |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Widget anti-spam en el navegador | No |
| `TURNSTILE_SECRET_KEY` | Verificación del widget del lado del servidor | **SÍ** |
| `ADMIN_SESSION_MAX_AGE_MINUTES` | Expiración más corta de la sesión del panel (H2). Sugerido: 120 | No |
| `ORDER_AUTO_CANCEL_DAYS` | Días para cancelar un pedido no pagado (PA-7). Sugerido: 5 | No |
| `RETURN_WINDOW_DAYS` | Plazo para solicitar devolución (PA-3). Sugerido: 30 | No |

> Los tres últimos son parámetros de negocio con valor por default en el código. Si la
> dueña quiere cambiarlos sin desplegar, se mueven a `settings` — el modelo ya contempla
> `return_window_days`. Se mantienen en entorno solo mientras no haya pantalla para
> editarlos.

**Se entrega un `.env.example`** en el repositorio con todos los nombres, sin ningún valor,
como contrato entre el código y quien lo despliega.

---

## 11. Herramientas locales y costos reales

### 11.1 Qué hay que tener instalado antes de escribir código

Esto es el insumo para la fase de **preparación de entorno** (skill `preparar-entorno`, que
se ejecuta aparte — aquí solo se enumera para poder avisar con tiempo):

| Herramienta | Versión | Para qué | Obligatoria |
|---|---|---|---|
| **Node.js** | Línea LTS vigente: **24.x** (22.x también funciona) | Ejecutar Next.js | **Sí** |
| **npm** | 10+ (viene con Node) | Instalar dependencias | **Sí** |
| **Git** | 2.40+ | Control de versiones (ya en uso en este repo) | **Sí** |
| **Supabase CLI** | Última | Crear y aplicar migraciones, generar los tipos de TypeScript. Se usa vía `npx`, sin instalación global | **Sí** |
| Editor con soporte de TypeScript | — | VS Code o equivalente | Recomendada |
| **Docker Desktop** | — | Solo si se quiere una base de datos local. **Se puede evitar** trabajando contra un proyecto Supabase de desarrollo en la nube | **No** |

> **Nota para `preparar-entorno`:** si la dueña trabaja en una computadora de la empresa con
> restricciones, instalar Node.js puede requerir permiso de TI. Docker casi siempre lo
> requiere — por eso se deja como opcional y se recomienda el proyecto Supabase de
> desarrollo en la nube, que evita ese trámite por completo.

### 11.2 Costo real mensual — corrección importante a la estimación previa

`perfil.md` estimaba "$0/mes en operación normal". **Esa estimación no se sostiene para un
sitio comercial.** Números verificados en septiembre de 2026:

| Servicio | Plan gratis | ¿Sirve para producción? | Costo recomendado |
|---|---|---|---|
| **Vercel** | Hobby | ❌ **No: sus términos prohíben el uso comercial**, y solo permite 2 crons diarios | **Pro: $20 USD/mes** |
| **Supabase** | 500 MB · 5 GB egress · 50k usuarios activos | ⚠️ Técnicamente alcanza, **pero no hace respaldos y pausa el proyecto tras 7 días sin tráfico** | **Pro: $25 USD/mes** antes de salir a producción |
| **Cloudflare R2** | 10 GB · 1M escrituras · 10M lecturas · **egress gratis** | ✅ **Sí**, con margen amplio | **$0** |
| **Resend** | 3,000 correos/mes, tope 100/día, 1 dominio | ✅ Sí para 5–50 pedidos/día | **$0** (≈$20/mes si crece) |
| **Cloudflare Turnstile** | Ilimitado | ✅ Sí | **$0** |
| **Dominio** | — | Indispensable para el CDN de imágenes y para que los correos no caigan en spam | **~$15 USD/año** |
| **Total realista** | | | **≈ $45–47 USD/mes** |

**Impacto de no pagar:** el plan gratis de Vercel es un incumplimiento de sus términos
(pueden suspender el sitio sin aviso). El plan gratis de Supabase **no tiene respaldos**:
un borrado accidental del catálogo de 1,050 SKU sería irrecuperable, lo que contradice el
RPO de 24 h declarado en §2.

**Recomendación:** desarrollar todo en los planes gratis (no hay uso comercial mientras no
haya clientes) y **subir ambos a plan de pago la semana antes de salir a producción.**
Costo durante el desarrollo: $0 más el dominio.

---

## 12. Estándares de calidad aplicados

Marco de referencia, proporcional al tamaño del proyecto (no se impone un proceso formal):

- **ISO/IEC 25010** — revisión de que ninguna dimensión quedó huérfana: *fiabilidad* (§9.1,
  §7.3), *seguridad* (§6.2, §7.1, §9.3), *eficiencia* (§8, §9.4), *mantenibilidad* (§3, §4),
  *usabilidad y operabilidad* (§9.5, panel autoexplicativo), *portabilidad* (el dominio no
  depende de Next.js ni de Supabase, §4 regla 2).
- **ISO/IEC 5055** — expectativa que se le pasa al Coder: TypeScript estricto sin `any`,
  cero secretos en el repositorio, manejo explícito de errores en todo punto de entrada,
  validación de toda entrada externa. Se conecta con la rúbrica de `estandares-backend`.
- **Atomic Design** (skill `estandares-frontend`) — organización obligatoria de
  `src/components/` en átomos, moléculas, organismos y templates (§4.1). Aplica tanto al
  panel admin como a la traducción a código del sitio público, para que ambas superficies
  compartan una sola fuente de verdad de paleta, tipografía y componentes base en vez de
  reimplementarlos por separado.
- **Pruebas mínimas de v1**: unitarias sobre `src/server/domain/` (inventario, saldo,
  folios, porcentajes de devolución, máquina de estados) y **una prueba de concurrencia**
  que dispare dos apartados simultáneos sobre la última pieza y verifique que solo uno
  gana. Es la prueba que justifica §9.1.
- **CMMI / IEEE 730**: se mencionan como referencia. **No se adoptan** — su costo de
  proceso es desproporcionado para un equipo de este tamaño. Si SG Querétaro llegara a
  exigirlos por contrato, se replantea.

---

## 13. Fuera de alcance (decisión explícita, no olvido)

**Fuera del límite operativo de DevSquad AI** — si llegaran a pedirse, hay que decirlo:
- Kubernetes, service mesh, o cualquier orquestación distribuida multinodo.
- Colas de mensajería de alto volumen (Kafka, RabbitMQ, SQS) entre etapas. El patrón
  outbox de §7.3 es una tabla de Postgres y un cron: cubre la misma necesidad a esta
  escala, sin infraestructura.
- Alta disponibilidad multi-región, réplicas de lectura, autoescalado por métricas.
- Microservicios (justificado en §3).

**Fuera de alcance por decisión de negocio** (ya en `requerimientos.md` §7): pasarela de
pago en línea, facturación automática vía PAC, app móvil nativa, WhatsApp bidireccional,
motor de búsqueda dedicado (§9.4), y precios diferenciados por tipo de cliente.

---

## 14. Lo que necesita decisión de la dueña

Solo se listan cosas **nuevas**, surgidas al diseñar la arquitectura. No se repite nada ya
decidido en `perfil.md` o `estado.md`.

| # | Decisión | Por qué importa | Recomendación | ¿Bloquea? |
|---|---|---|---|---|
| **AR-1** | **Vercel Pro, $20 USD/mes.** El plan gratis prohíbe el uso comercial | Cumplimiento de términos + crons frecuentes | Aceptar. Alternativa: VPS a ~$6/mes, pero alguien tiene que administrarlo | No bloquea el desarrollo; **sí el lanzamiento** |
| **AR-2** | **Supabase Pro, $25 USD/mes antes de producción.** El plan gratis no hace respaldos y pausa el proyecto tras 7 días sin tráfico | Sin respaldos no se cumple el RPO de 24 h de §2 | Desarrollar en el plan gratis; subir a Pro la semana previa al lanzamiento | No bloquea el desarrollo; **sí el lanzamiento** |
| **AR-3** | **Dominio propio** (~$15 USD/año) con DNS en Cloudflare | Necesario para el CDN de imágenes **y** para que los correos con datos bancarios no caigan en spam | Contratarlo ya: la propagación de DNS y la verificación de correo tardan días | **Sí** — el correo transaccional es parte del flujo central |
| ~~AR-4~~ | **Formato del folio.** **Confirmado por la dueña (2026-09-20): aleatorio corto** (`SGQ-7K4M2X`, §9.2), tal como se recomendó | — | — | Cerrado |
| **AR-5** | **Verificación de correo no bloquea la compra** (§9.9) | Se decidió priorizar conversión; la dueña puede preferir el filtro | Dejar como está; activar el bloqueo si aparecen pedidos falsos | No |

Las preguntas **PA-1 a PA-20** de `requerimientos.md` y `modelo-datos.md` siguen vigentes
y no se repiten aquí. Ninguna bloquea el inicio de la implementación: todas tienen una
recomendación por default ya documentada.

---

## 15. Qué sigue

1. **Diseño de UI — solo panel administrativo.**
   El sitio público **ya tiene diseño** (`index.html`, archivo protegido) y no se rediseña:
   se traduce a componentes conservando paleta, tipografía y lenguaje visual (H1).
   Lo que el diseñador tiene que producir es el panel: bandeja de pedidos con filtros,
   detalle con **comprobante y monto esperado lado a lado** (§9.3 y riesgo de fraude),
   editor de productos, importador CSV con su pantalla de vista previa y errores por fila
   (§9.5), bandejas de devoluciones y solicitudes, analítica y configuración.
   Dos restricciones que vienen de esta fase: **verificar contraste** al llevar el tema
   oscuro del demo al panel (riesgo ya identificado), y diseñar las pantallas para una
   persona **no técnica** —confirmaciones antes de acciones destructivas, mensajes de error
   en español de negocio, nunca códigos.

2. **Preparación del entorno** (skill `preparar-entorno`): verificar Node.js, npm, Git y la
   CLI de Supabase con la lista de §11.1. **Antes** de esa fase conviene que la dueña
   resuelva AR-3 (dominio) y cree las cuentas de Supabase, Cloudflare y Resend, porque son
   trámites con tiempos externos.

3. **Implementación**, en este orden sugerido (cada bloque deja algo usable):
   migraciones + RLS → catálogo público → cuenta y carrito → pedido y comprobante →
   panel de pedidos → importación masiva → devoluciones y saldo → servicios → analítica.
   La importación masiva se adelanta apenas exista el editor de productos: es lo que
   permite empezar a cargar los ~1,050 SKU en paralelo al resto del desarrollo, y es el
   riesgo #1 del calendario.
