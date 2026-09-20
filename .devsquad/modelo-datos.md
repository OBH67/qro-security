# Modelo de datos — SG Querétaro

Fecha: 2026-09-20
Stack objetivo: Next.js (full-stack) + Supabase (Postgres + Auth + RLS) + Cloudflare R2 (archivos)

## Cómo se construyó este modelo

Se derivó de una revisión a fondo de `index.html` (el demo de Claude Design), que
contiene toda la dummy data con la que debe operar el sitio, cruzada contra
`docs/contexto-negocio.md` y `.devsquad/requerimientos.md`.

El demo es la fuente más confiable de la **estructura** del modelo porque muestra
campos que el documento de negocio no menciona pero que la UI ya está usando. La
sección 2 lista esos hallazgos: son la razón por la que valía la pena revisar el
HTML antes de diseñar tablas.

> ### ⚠️ La data del demo es dummy, no es verídica
>
> Todo lo que aparece en `index.html` es data de relleno para que el demo se vea
> completo. **No representa el catálogo real de SG Querétaro y no se puede usar
> para estimar volúmenes, valores ni contenidos.**
>
> Lo que el demo sí prueba es **qué campos necesita la interfaz**: si la pantalla
> de producto muestra una galería, el modelo necesita soportar varias fotos. Eso
> es una conclusión válida sobre la estructura.
>
> Lo que el demo **no** prueba: cuántas fotos tiene realmente cada producto, cuáles
> son las marcas, cuántas subcategorías existen, qué atributos se filtran, si hay
> fichas técnicas en PDF, ni si el cliente tiene reseñas reales.
>
> Regla de lectura de este documento: donde aparezca un número o un nombre
> tomado del demo (5 fotos, "Marca Demo A", 7 subcategorías de Cableado), léase
> como **capacidad de la interfaz pendiente de confirmar con el cliente**, nunca
> como un hecho del catálogo. Cada uno de esos puntos tiene su pregunta abierta
> en la sección 7.

Ubicación de la data en el demo: `index.html` líneas 1875–2753 (clase
`Component`), principalmente `products` (1935), `groups` (1926), `state.orders`
(1884), `servicesData` (1968), `reviewsData` (1961), `faqData` (1974), y los
generadores de formularios `regFields` (2580), `srvFields` (2474) y
`uploadFields` (2729).

---

## 1. Decisiones de negocio confirmadas por la dueña (2026-09-20)

Estas tres respuestas cambian el modelo y quedan reflejadas en él:

1. **El inventario tiene dos momentos distintos**, aclarados por la dueña:
   - **Al generar el pedido no pasa nada**: si el cliente arma un pedido pero no
     manda comprobante, la pieza sigue disponible para todos los demás.
   - **Al subir el comprobante, la pieza sale de disponibilidad** (queda
     apartada para ese pedido).
   - **Al marcar "Enviado", baja el stock físico** del almacén.

   Adicionalmente, la validación del pago puede hacerse desde un **enlace simple
   en el correo** que recibe el administrador, sin entrar al panel.
2. **Dos roles:** `admin` (acceso total) e `inventario` (solo carga y edición de
   productos/stock, sin acceso a pedidos, clientes ni analítica).
3. **El envío lo confirma el asesor al momento de enviar**, y en ese mismo acto
   marca el pedido como "Enviado". El costo de envío no se calcula en línea.

### Cómo se traduce esa regla al modelo

Se manejan dos números distintos, nunca uno solo:

- **`products.stock`** — piezas físicas en el almacén. Solo baja cuando el pedido
  se marca "Enviado".
- **Stock disponible** (calculado, no almacenado) — `stock` menos las piezas
  apartadas. Es lo que el cliente ve en el catálogo.

Una pieza está **apartada** cuando pertenece a un pedido en estado
`comprobante_recibido` o `listo_envio`: ya hay un comprobante subido, pero el
producto todavía no sale del almacén.

```
stock_disponible = products.stock
                 − SUM(order_items.qty)
                   de pedidos en estado comprobante_recibido o listo_envio
```

Recorrido de una pieza única (stock = 1):

| Momento | Stock físico | Apartado | Disponible en catálogo |
|---|---|---|---|
| Nadie la ha pedido | 1 | 0 | **1** |
| Un cliente genera el pedido, sin comprobante | 1 | 0 | **1** (sigue a la venta) |
| El cliente sube su comprobante | 1 | 1 | **0** (sale de disponibilidad) |
| El admin valida el pago (listo para envío) | 1 | 1 | **0** |
| El admin marca "Enviado" | 0 | 0 | **0** |

**Liberación de piezas apartadas.** El apartado se suelta solo en dos casos:
cuando el administrador **rechaza** el comprobante, y cuando el pedido se
**cancela**. Ambos devuelven la pieza al catálogo automáticamente, porque el
disponible es un cálculo, no un contador que alguien tenga que corregir a mano.

Trade-off asumido: entre que el cliente genera el pedido y sube su comprobante,
la pieza sigue a la venta, así que dos clientes pueden llegar a comprometerla. Es
la decisión correcta para este negocio —apartar inventario por pedidos que quizá
nunca se paguen congelaría el catálogo—, pero implica que el administrador puede
toparse ocasionalmente con dos comprobantes para la última pieza. El panel debe
mostrarle el disponible real al validar para que lo detecte antes de aceptarlo.

### Consecuencia importante del enlace de confirmación por correo

Un enlace que cambia el estado de un pedido con un solo clic es, en la práctica,
una llave. Si se filtra el correo o alguien adivina la URL, un tercero podría
confirmar pagos. El modelo incluye la tabla `payment_confirmation_tokens` con
token de un solo uso, con vencimiento y guardado como hash — nunca un enlace
predecible tipo `/confirmar?pedido=SGQ-00248`.

---

## 2. Hallazgos: lo que el demo tiene y el documento de negocio no

Esto es lo que justifica haber revisado el HTML primero.

Cada hallazgo se lee como **"la interfaz necesita soportar esto"**, no como
"el catálogo real es así". Los valores concretos del demo son de relleno y están
listados como preguntas abiertas en la sección 7.

| # | Hallazgo en el demo | Impacto en el modelo |
|---|---|---|
| 1 | **El demo rellenó las subcategorías de Cableado Estructurado y GPS** (7 y 6, `index.html:1931-1932`), que el documento de negocio marca como "pendiente, el cliente enviará". Son inventadas, no vienen del cliente. | Sirven como borrador para que el cliente confirme o corrija. No asumir que son las correctas. |
| 2 | **Marca aparece como filtro y en la ficha técnica, pero no existe como campo** en `products` (usa el texto fijo "Marca Demo"). | Requiere tabla `brands` y `products.brand_id`. El documento de negocio sí la pide. |
| 3 | **La ficha de producto tiene galería**, no una sola foto (el demo dibuja 5 miniaturas de relleno, `index.html:2357`). | Tabla `product_images` con orden y foto principal, sin fijar cuántas. Cuántas fotos existen de verdad por SKU está en PA-20. |
| 4 | **La ficha ofrece documentos descargables**: ficha técnica y manual en PDF (`index.html:2352`). No se mencionan en el documento de negocio. | Tabla `product_documents`, archivos en R2. Si el cliente no los tiene, la pestaña simplemente va vacía (PA-19). |
| 5 | **La ficha técnica es tabla llave/valor** (SKU, Marca, Especificación principal, Secundaria, Terciaria, Garantía, Peso), no una lista plana de strings como sugiere `specs:['4 MP','IR 30 m','IP67']`. | Atributos estructurados en JSONB, más `warranty_months` y `weight_kg` como campos propios. |
| 6 | **"Qué incluye"**: lista de contenido de la caja (`index.html:2356`). | Campo `includes` en productos. |
| 7 | **Los filtros son por faceta y dependen de la categoría**: Resolución (2/4/8 MP), Tipo (Bala/Domo/PTZ), Uso (Interior/Exterior) sirven para cámaras, pero no para cable ni paneles solares (`index.html:2316-2321`). | Atributos flexibles en JSONB + tabla que define qué atributos se filtran en cada categoría. Ver decisión D1. |
| 8 | **La subida del comprobante captura 4 datos extra** que el documento de negocio no menciona: fecha de la transferencia, monto transferido, banco de origen y clave de rastreo SPEI (`index.html:2729`). | Columnas en `payment_proofs`. La clave SPEI es lo que permite rastrear un pago dudoso. |
| 9 | **El cliente tiene varias direcciones** ("Casa", "Oficina") y elige una al pagar (`index.html:2621`). El documento de negocio sugiere una sola dirección en la cuenta. | Tabla `addresses` con etiqueta y predeterminada, no campos en el perfil. |
| 10 | **El saldo a favor es un historial de movimientos**, no un número (`saldoMovs`, `index.html:2700`): muestra abonos por devolución y aplicaciones a pedidos. | Tabla `credit_movements` tipo libro contable. Ver decisión D2. |
| 11 | **Hay reseñas de clientes en la portada** con calificación, categoría, título y texto (`reviewsData`, `index.html:1961`). No aparecen en ningún lado del documento de negocio. | Requiere decisión: ¿reseñas reales de clientes o contenido curado por el admin? Ver pregunta abierta PA-14. |
| 12 | **Hay banners/hero rotativos** con imagen, etiqueta, título y enlace a grupo (`heroSlidesData`, `index.html:1955`). | Tabla `banners` si el dueño los va a editar; si no, constantes en código. Ver PA-15. |
| 13 | **Hay contenido editorial**: FAQs generales, FAQs de servicios, FAQs de devoluciones, pasos de "Cómo comprar", páginas legales (privacidad, términos). | Tablas `faqs` y `legal_pages`, o archivos en código. Ver PA-16. |
| 14 | **Los datos bancarios están en la UI** (Banco, Beneficiario, CLABE, número de cuenta, `index.html:2660`). | Tabla `settings`: el dueño debe poder cambiarlos sin tocar código. |
| 15 | **El estado "Pedido generado" es un paso del flujo visual**, pero no un estado real: los estados reales son 5 (`statusIndex`, `index.html:1895`). | El enum tiene 5 estados + cancelado; "Pedido generado" es la fecha de creación. |
| 16 | **La solicitud de servicio tiene campos extra**: tipo de cliente, horario preferido de contacto, y para financiamiento monto aproximado y plazo deseado (`index.html:2474`). | Columnas en `service_requests`. |
| 17 | **El SKU codifica el grupo**: `SGQ-VV-0012` (VV = Videovigilancia). | Riesgo: si un producto cambia de categoría, el SKU miente. Ver decisión D4. |
| 18 | **Reglas de etiqueta de stock** (`index.html:2037`): 0 = "Agotado", 1–3 = "Últimas N piezas", 4+ = "N disponibles". | Regla de presentación, no de datos. Se implementa en el frontend. |
| 19 | **Ordenamiento del catálogo incluye "Más vendidos"** (`index.html:1879`). | Requiere contador de ventas por producto, que además alimenta la analítica del panel. |
| 20 | **Búsqueda por nombre y SKU** con sugerencias en vivo (`index.html:2210`). | Índice de texto completo en Postgres. |

---

## 3. Decisiones de modelado (con su trade-off)

### D1 · Atributos de producto: JSONB en vez de columnas fijas

Un panel solar, una bobina de cable y una cámara PTZ no comparten
características. Tres caminos posibles:

- **Columnas fijas por atributo:** rápido de consultar, pero cada atributo nuevo
  ("caudal", "lúmenes") exige cambiar la base de datos. Inviable con 6 grupos tan
  distintos.
- **Tabla llave/valor (EAV):** flexible, pero cada consulta del catálogo necesita
  varios `JOIN` y se vuelve lenta con filtros combinados.
- **JSONB (elegido):** los atributos viven en un solo campo, con un índice GIN.
  Agregar un atributo nuevo no toca el esquema.

Trade-off: se gana flexibilidad total y se pierde la validación automática que da
una columna tipada. Se compensa con la tabla `category_attributes`, que declara
qué atributos son válidos y filtrables por categoría, y valida en la aplicación
antes de guardar.

### D2 · Saldo a favor: libro de movimientos, no un campo `saldo`

Guardar `profiles.saldo = 450` invita a dos problemas: si dos procesos lo
actualizan a la vez uno pisa al otro, y no queda rastro de por qué el cliente
tiene ese saldo.

El modelo guarda cada movimiento (`+450 por devolución del pedido SGQ-00219`,
`−180 aplicado al pedido SGQ-00205`) y el saldo es la suma. El demo ya muestra
exactamente esta pantalla.

Trade-off: calcular la suma cuesta un poco más que leer un número. A esta escala
es imperceptible, y si algún día pesa se agrega una vista materializada.

### D3 · Los pedidos congelan precio y dirección

`order_items` guarda el precio unitario y el nombre **al momento de la compra**, y
`orders` guarda una copia de la dirección de envío y de los datos fiscales usados.

Razón: si el dueño sube el precio de una cámara, o el cliente edita su dirección,
los pedidos viejos no deben cambiar. Un pedido es un documento histórico, no una
consulta en vivo.

Trade-off: se duplica información. Es duplicación deliberada y estándar en
cualquier sistema de ventas.

### D4 · El SKU es un dato del negocio, no la llave primaria

El SKU (`SGQ-VV-0012`) se usa como identificador visible y de búsqueda, pero cada
tabla usa un `id` interno. Si un producto cambia de categoría o el cliente
renumera su catálogo, nada se rompe.

Trade-off: una columna más por tabla, a cambio de que el catálogo sea
reorganizable sin migraciones dolorosas.

### D5 · Dinero en `numeric(12,2)`, nunca en decimales flotantes

Los precios ya vienen con IVA incluido (regla del negocio). Se guarda
`price` con IVA y `tax_rate` para poder desglosar en la factura más adelante.

---

## 4. El esquema

Notación: `PK` llave primaria, `FK` llave foránea, `·` campo obligatorio.

### 4.1 Identidad y roles

```
user_role        ENUM('cliente', 'admin', 'inventario')
```

**`profiles`** — extiende `auth.users` de Supabase
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | FK → `auth.users.id` |
| first_name · | text | "Mariana" |
| last_name · | text | "López Ríos" |
| email · | text | espejo de auth, para búsquedas |
| phone · | text | 10 dígitos, validado |
| role · | user_role | default `cliente` |
| created_at · | timestamptz | |

El rol `inventario` solo puede leer/escribir `products`, `product_images`,
`product_documents`, `brands`, `subcategories`. Todo lo demás le queda cerrado
por RLS.

**`addresses`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| user_id · | uuid FK → profiles | |
| label · | text | "Casa", "Oficina" |
| street · | text | Calle |
| ext_number · | text | Número exterior |
| int_number | text | Número interior (opcional) |
| postal_code · | text | Autocompleta estado y municipio |
| neighborhood · | text | Colonia |
| municipality · | text | |
| state · | text | |
| recipient_name · | text | Quien recibe |
| directions | text | Referencias para el repartidor |
| is_default · | boolean | |

**`billing_profiles`** — datos fiscales
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| user_id · | uuid FK → profiles | |
| rfc · | text | 12 o 13 caracteres |
| legal_name · | text | Nombre o razón social |
| tax_regime · | text | Clave SAT: 601, 605, 612, 626… |
| cfdi_use · | text | Clave SAT: G01, G03, I08… |
| postal_code · | text | CP fiscal, distinto del de envío |
| is_default · | boolean | |

### 4.2 Catálogo

**`groups`** — los 6 grupos principales
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| code · | text | "CH-01" … "CH-06" |
| slug · | text | "videovigilancia" (para URLs) |
| name · | text | |
| description · | text | Texto de la tarjeta de grupo |
| image_url | text | R2 |
| position · | int | Orden de despliegue |
| active · | boolean | |

**`subcategories`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| group_id · | uuid FK → groups | |
| slug · | text | |
| name · | text | "Cámaras IP y NVRs" |
| position · | int | |
| active · | boolean | |

**`brands`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| name · | text | |
| slug · | text | |
| logo_url | text | R2 |
| active · | boolean | |

**`products`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| sku · | text UNIQUE | "SGQ-VV-0012" |
| slug · | text UNIQUE | URL amigable |
| name · | text | |
| description | text | Descripción larga de la pestaña "Descripción" |
| brand_id | uuid FK → brands | |
| group_id · | uuid FK → groups | |
| subcategory_id · | uuid FK → subcategories | |
| price · | numeric(12,2) | **Con IVA incluido** |
| tax_rate · | numeric(4,3) | default 0.160 |
| stock · | int | Piezas físicas. Baja al marcar "Enviado" |
| warranty_months | int | default 12 |
| weight_kg | numeric(8,3) | |
| includes | text[] | "Qué incluye" |
| attributes | jsonb | Ficha técnica y facetas (ver D1) |
| status · | text | `activo` / `agotado` / `descontinuado` |
| sales_count · | int | Alimenta "Más vendidos" y la analítica |
| created_at · | timestamptz | |
| updated_at · | timestamptz | |

Índices: `sku`, `slug`, `(group_id, subcategory_id)`, GIN sobre `attributes`, y
un índice de texto completo sobre `name || sku` para la búsqueda con sugerencias.

**`product_images`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| product_id · | uuid FK → products | |
| url · | text | Clave del objeto en R2 |
| alt | text | Accesibilidad |
| position · | int | 0 = principal |

**`product_documents`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| product_id · | uuid FK → products | |
| kind · | text | `ficha_tecnica` / `manual` / `otro` |
| name · | text | |
| url · | text | R2 |
| size_bytes | bigint | Para mostrar "PDF · 1.2 MB" |

**`category_attributes`** — define los filtros por categoría (ver D1)
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| group_id | uuid FK → groups | nulo = aplica a todos |
| subcategory_id | uuid FK → subcategories | opcional, más específico |
| key · | text | "resolucion" |
| label · | text | "Resolución" |
| data_type · | text | `text` / `number` / `boolean` |
| options | text[] | Valores permitidos: 2 MP, 4 MP, 8 MP |
| filterable · | boolean | ¿Aparece en el panel de filtros? |
| position · | int | |

### 4.3 Pedidos

```
order_status  ENUM('pendiente_pago', 'comprobante_recibido',
                   'listo_envio', 'enviado', 'entregado', 'cancelado')
```

**`orders`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| folio · | text UNIQUE | "SGQ-00248" |
| user_id · | uuid FK → profiles | |
| status · | order_status | default `pendiente_pago` |
| payment_method · | text | `transferencia` / `saldo_completo` (ver nota RN-11 abajo) |
| subtotal · | numeric(12,2) | Suma de partidas |
| credit_applied · | numeric(12,2) | Saldo a favor usado, default 0 |
| shipping_cost | numeric(12,2) | **Nulo hasta que el asesor lo confirma** |
| total · | numeric(12,2) | Importe exacto a transferir. **$0 si `payment_method = saldo_completo`** |
| wants_invoice · | boolean | |
| shipping_address · | jsonb | Copia congelada (ver D3) |
| billing_data | jsonb | Copia congelada, nulo si no pidió factura |
| notes | text | Notas internas del asesor |
| created_at · | timestamptz | El paso "Pedido generado" del flujo visual |
| paid_at | timestamptz | Cuando el admin valida el comprobante |
| shipped_at | timestamptz | Cuando se marca "Enviado" → baja el stock |
| delivered_at | timestamptz | |

**`order_items`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| order_id · | uuid FK → orders | |
| product_id · | uuid FK → products | |
| sku · | text | Copia congelada |
| name · | text | Copia congelada |
| unit_price · | numeric(12,2) | Precio al momento de comprar (ver D3) |
| qty · | int | |
| subtotal · | numeric(12,2) | |

**`order_status_history`** — auditoría y base de la analítica
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| order_id · | uuid FK → orders | |
| from_status | order_status | nulo en la creación |
| to_status · | order_status | |
| changed_by | uuid FK → profiles | nulo si vino del enlace por correo |
| source · | text | `panel` / `correo` / `sistema` |
| note | text | |
| changed_at · | timestamptz | |

**`payment_proofs`** — comprobantes de transferencia
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| order_id · | uuid FK → orders | |
| file_url · | text | Imagen o PDF en R2 |
| transfer_date · | date | Capturado por el cliente |
| amount · | numeric(12,2) | Monto transferido declarado |
| origin_bank | text | Opcional |
| spei_tracking_key | text | Clave de rastreo, opcional |
| status · | text | `pendiente` / `validado` / `rechazado` |
| reviewed_by | uuid FK → profiles | |
| reviewed_at | timestamptz | |
| rejection_reason | text | |
| uploaded_at · | timestamptz | |

El panel debe mostrar `orders.total` junto a `payment_proofs.amount` para que el
administrador compare de un vistazo — es la única defensa contra comprobantes
alterados en la versión 1.

**Caso sin comprobante — saldo a favor cubre el 100% (RN-11).** Cuando
`payment_method = 'saldo_completo'`, no existe fila en `payment_proofs`: no hay
nada que transferir, así que no hay nada que subir. Pero el pedido **igual entra
a `comprobante_recibido`** — el mismo punto de revisión que cualquier otro
pedido — porque ningún pedido avanza de estado sin que el administrador lo
confirme explícitamente. La pantalla de revisión, en este caso, no muestra una
imagen: muestra el desglose del saldo aplicado (`credit_applied`) contra el
total original, para que el administrador confirme que la operación es
legítima antes de pasar a `listo_envio`. Es una decisión de la dueña del
proyecto (2026-09-20), no una limitación técnica: valida el mismo criterio
humano que un comprobante, aplicado parejo sin importar el método de pago.

**`payment_confirmation_tokens`** — el enlace de confirmación por correo
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| order_id · | uuid FK → orders | |
| token_hash · | text | Solo el hash, nunca el token en claro |
| expires_at · | timestamptz | Sugerido: 7 días |
| used_at | timestamptz | Un solo uso |
| created_at · | timestamptz | |

### 4.4 Saldo a favor y devoluciones

**`credit_movements`** — el libro de saldo (ver D2)
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| user_id · | uuid FK → profiles | |
| amount · | numeric(12,2) | Positivo abona, negativo aplica |
| kind · | text | `devolucion` / `aplicado` / `ajuste` |
| order_id | uuid FK → orders | Si se aplicó a un pedido |
| return_id | uuid FK → returns | Si vino de una devolución |
| description · | text | "Devolución pedido SGQ-00219 · producto sellado" |
| created_by | uuid FK → profiles | Nulo si lo generó el sistema |
| created_at · | timestamptz | |

Saldo del cliente = `SUM(amount) WHERE user_id = ?`

**`returns`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| folio · | text UNIQUE | |
| order_id · | uuid FK → orders | |
| user_id · | uuid FK → profiles | |
| status · | text | `solicitada` / `en_revision` / `aprobada` / `rechazada` |
| reason · | text | Motivo del cliente |
| credit_amount | numeric(12,2) | Saldo aprobado, se llena al resolver |
| reviewed_by | uuid FK → profiles | |
| reviewed_at | timestamptz | |
| resolution_note | text | |
| created_at · | timestamptz | |

**`return_items`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| return_id · | uuid FK → returns | |
| order_item_id · | uuid FK → order_items | |
| qty · | int | |
| condition · | text | `sellado` (100%) / `abierto` (70%) / `otro` (manual) |
| percentage · | numeric(5,2) | 100.00 / 70.00 / lo que decida el asesor |
| credit_amount · | numeric(12,2) | |

**`return_photos`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| return_id · | uuid FK → returns | |
| url · | text | R2 |

### 4.5 Servicios

**`service_requests`**
| Campo | Tipo | Notas |
|---|---|---|
| id · | uuid PK | |
| folio · | text UNIQUE | |
| service_type · | text | `monitoreo` / `guardias` / `financiamiento` |
| client_type · | text | `particular` / `negocio` / `empresa` |
| full_name · | text | |
| phone · | text | |
| email · | text | |
| state · | text | Catálogo de 32 estados |
| municipality · | text | |
| neighborhood | text | Colonia |
| address_reference | text | Dirección o referencia |
| property_type · | text | Casa / Local / Oficina / Bodega / Industria / Otro |
| preferred_time | text | Horario para contactar |
| amount | numeric(12,2) | Solo financiamiento |
| term_months | int | Solo financiamiento: 3, 6, 12 |
| message | text | |
| status · | text | `nueva` / `contactada` / `cerrada` |
| assigned_to | uuid FK → profiles | |
| created_at · | timestamptz | |

### 4.6 Configuración y contenido

**`settings`** — llave/valor, editable por el admin sin tocar código
Contiene al menos: `bank_name`, `beneficiary`, `clabe`, `account_number`,
`admin_whatsapp`, `admin_email`, `order_folio_prefix`, `return_window_days`,
`credit_expiry_days`.

**`banners`** — el hero rotativo
`id`, `title`, `brand_label`, `image_url`, `group_id`, `gradient_from`,
`gradient_to`, `position`, `active`, `starts_at`, `ends_at`.

**`reviews`** — reseñas de la portada (sujeto a PA-14)
`id`, `product_id`, `user_id`, `author_name`, `rating` (1–5), `category`,
`title`, `body`, `published`, `created_at`.

**`faqs`**
`id`, `scope` (`general` / `servicios` / `devoluciones` / `como_comprar`),
`topic`, `question`, `answer`, `position`, `active`.

**`legal_pages`**
`slug` (`privacidad` / `terminos`), `title`, `body`, `updated_at`.

---

## 5. Seguridad de acceso a datos (RLS desde el inicio)

Row Level Security activado en **todas** las tablas, no como paso posterior.

| Tabla | Cliente | Rol `inventario` | Rol `admin` |
|---|---|---|---|
| `products`, `groups`, `subcategories`, `brands`, imágenes, documentos | lectura de activos | lectura y escritura | total |
| `profiles`, `addresses`, `billing_profiles` | solo lo propio | sin acceso | total |
| `orders`, `order_items`, `payment_proofs` | solo lo propio; puede crear e subir comprobante | sin acceso | total |
| `credit_movements` | lectura de lo propio | sin acceso | total |
| `returns`, `return_items`, `return_photos` | crear y leer lo propio | sin acceso | total |
| `service_requests` | crear (incluso sin cuenta) | sin acceso | total |
| `settings`, `banners`, `faqs`, `legal_pages` | lectura pública | sin acceso | total |
| `order_status_history`, `payment_confirmation_tokens` | sin acceso | sin acceso | lectura; escritura solo del servidor |

Los cambios de estado de pedido, la baja de stock y los movimientos de saldo
**nunca** se escriben desde el navegador: van por el servidor de Next.js, que es
el único que usa la llave con privilegios de Supabase.

---

## 6. Archivos en Cloudflare R2

| Qué | Ruta sugerida | Acceso |
|---|---|---|
| Fotos de producto | `productos/{sku}/{n}.webp` | Público |
| Documentos de producto | `productos/{sku}/docs/{archivo}.pdf` | Público |
| Imágenes de grupo y banners | `contenido/{slug}.webp` | Público |
| **Comprobantes de pago** | `comprobantes/{folio}/{uuid}.{ext}` | **Privado**, solo por URL firmada temporal |
| **Fotos de devolución** | `devoluciones/{folio}/{uuid}.{ext}` | **Privado**, solo por URL firmada temporal |

Un comprobante bancario trae datos personales del cliente: nunca debe quedar en
una URL pública adivinable.

---

## 7. Preguntas abiertas nuevas que salieron de esta revisión

Se suman a las 11 que ya están en `.devsquad/requerimientos.md`.

- **PA-12 · Subcategorías de Cableado Estructurado y GPS:** el demo ya propone 7 y
  6. ¿El cliente las valida o manda las suyas?
- **PA-13 · Marcas reales:** el demo usa "Marca Demo A/B/C". ¿Cuál es el catálogo
  real de marcas que distribuye SG Querétaro?
- **PA-14 · Reseñas:** ¿se van a habilitar reseñas reales de clientes (requiere
  moderación) o son testimonios curados que el dueño edita?
- **PA-15 · Banners:** ¿el dueño los va a cambiar por su cuenta (tabla y pantalla
  de administración) o son fijos por ahora?
- **PA-16 · Contenido editorial:** FAQs, páginas legales y "Cómo comprar",
  ¿editables desde el panel o fijos en código en la versión 1?
- **PA-17 · Atributos por categoría:** ¿qué características se filtran en cada uno
  de los 6 grupos? El demo solo definió las de cámaras.
- **PA-18 · Vigencia del saldo a favor:** el propio demo lo marca como "dato por
  confirmar con el cliente".
- **PA-19 · Documentos de producto:** ¿el cliente tiene fichas técnicas y manuales
  en PDF para sus SKU, o eso se llena después?
- **PA-20 · Volumen real de imágenes:** ¿cuántas fotos hay por producto en
  promedio, y en qué formato/resolución vienen? Es lo que determina el tamaño
  real del almacenamiento en R2 y el esfuerzo de la carga inicial. El demo no
  aporta ningún dato confiable sobre esto.

---

## 8. Qué habilita este modelo

- **Catálogo:** navegación por grupo y subcategoría, filtros por faceta,
  ordenamiento (incluido "Más vendidos"), búsqueda por nombre y SKU, paginación.
- **Compra:** carrito, cuenta con varias direcciones y datos fiscales, pedido con
  folio, datos bancarios, comprobante con sus 4 campos, aplicación de saldo.
- **Operación del dueño:** bandeja de pedidos filtrable, validación de comprobante
  desde el panel o desde el enlace del correo, avance de estados, baja de stock al
  enviar, bandeja de devoluciones y de solicitudes de servicio.
- **Analítica:** más y menos vendidos vía `sales_count`, y a partir de
  `order_status_history` los tiempos entre estados (cuánto tarda un cliente en
  pagar, cuánto tarda el dueño en enviar).
