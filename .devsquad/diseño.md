# Diseño UI — Panel administrativo SG Querétaro

Fase: **Diseño UX/UI** · Fecha: 2026-09-20
Insumos: `.devsquad/perfil.md` · `docs/contexto-negocio.md` · `.devsquad/requerimientos.md` ·
`.devsquad/modelo-datos.md` · `.devsquad/arquitectura.md` (§4.1 y §15) ·
`index.html` (demo de Claude Design — **archivo protegido, referencia visual, no se modifica**)

> **Cambio de alcance (2026-09-20, confirmado por la dueña del proyecto):** la pantalla de
> inicio del panel **ya no es** la bandeja de Pedidos filtrada que describía H6. **G2
> (indicadores de operación) se adelanta de V1.5 a V1** y se convierte en un **tablero
> completo** que abre el rol `admin`. El rol `inventario` sigue entrando directo a Catálogo
> (H5 y H6.2 no cambian). El diseño del tablero está en **§11.2**; su paleta de datos, en
> **§2.8**. `requerimientos.md` debe actualizarse en consecuencia (H6.1 y G2).

---

## 0. Alcance de este documento

**Qué SÍ cubre:** el panel administrativo (`/admin`), que nunca ha tenido diseño de UI.

**Qué NO cubre:** el sitio público. `index.html`, `support.js` y `uploads/` son un demo
visual ya aprobado y protegido. No se rediseña, no se toca. Lo único que esta fase toma de
ahí son **los tokens visuales**, que se extraen tal cual y se documentan en §2 para que el
panel y la tienda se sientan el mismo producto.

**Advertencia de entrada** (riesgo ya identificado en `requerimientos.md` §9): el demo es de
fondo oscuro y usa varios grises azulados como texto secundario. Al llevar ese tema a un
panel denso, **tres combinaciones del demo no cumplen contraste AA y no se pueden copiar**.
Están listadas y corregidas en §5.3. No es opcional.

---

## 1. Personalidad del panel, en una frase

> **Un cuarto de monitoreo:** oscuro, ordenado y silencioso, donde lo único que brilla es
> el dato que hay que revisar y el botón que hay que apretar.

Misma personalidad del sitio público (centro de control: azul casi negro, acento cian,
tipografía técnica), **con el volumen bajo**: en la tienda el cian está en todas partes
porque vende; en el panel se reserva para la acción principal de cada pantalla y para el
dato que se está validando.

**El elemento memorable, heredado del demo:** el corte diagonal en la esquina superior
derecha de botones y tarjetas (`clip-path`, §2.4). Se usa **solo en botones de acción y
tarjetas de resumen**, nunca en filas de tabla ni campos de formulario.

---

## 2. Tokens heredados del demo (valores exactos, con su origen)

Extraídos leyendo `index.html`; se citan las líneas. El coder los implementa **una sola
vez** como variables CSS en `src/app/globals.css`, y de ahí los consumen los átomos de
`src/components/atoms/` (arquitectura §4.1).

### 2.1 Paleta de interfaz

#### Superficies

| Token | Hex | Origen en `index.html` | Uso en el panel |
|---|---|---|---|
| `--bg-base` | `#07111C` | `body{background:#07111C}` (l. 18) | Fondo de la aplicación |
| `--bg-surface` | `#0B1622` | Footer, mega-menú (l. 191, 282, 1814) | Barra lateral, campos de formulario |
| `--bg-card` | `#0F1D2B` | Tarjetas, paneles, inputs (l. 50, 381, 1459) | Tarjetas, contenedores de tabla, **superficie de gráficas** |
| `--bg-elevated` | `#122234` | Tarjetas del mega-menú (l. 181) | Modales, popovers, menús |
| `--bg-hover` | `#16283A` | `style-hover` (l. 87, 361) | Fila en hover, botón secundario en hover |
| `--bg-inset` | `#0B1622` | Inputs (l. 1500) | Campos dentro de una tarjeta |

#### Texto

| Token | Hex | Origen | Uso |
|---|---|---|---|
| `--text-primary` | `#EAF2F8` | `body{color:#EAF2F8}` (l. 18) | Títulos, valores, formularios |
| `--text-secondary` | `#C7D5E0` | Cuerpo de reseñas (l. 316) | Párrafos, descripciones |
| `--text-muted` | `#9FB2C3` | Etiquetas, metadatos, SKU (l. 76, 91, 387) | Etiquetas, encabezados de columna, **ejes de gráfica** |
| `--text-dim` | `#7E93A6` | Marca en tarjeta (l. 357) | **Solo texto ≥ 16 px.** Ver §5.3 |
| ~~`#5D7080`~~ | `#5D7080` | Texto deshabilitado del demo (l. 1914, 2641) | **PROHIBIDO como texto.** No cumple AA. §5.3 |

#### Acento y semánticos de estado

| Token | Hex | Origen | Significado |
|---|---|---|---|
| `--accent` | `#3CE7FF` | `a{color:#3CE7FF}`, botón primario (l. 19, 55, 1522) | Acción principal, foco, "en proceso" |
| `--accent-hover` | `#6FEEFF` | hover (l. 301, 1522) | Hover de botón primario y enlace |
| `--accent-bright` | `#9AF1FF` | `a:hover` (l. 20) | Enlace activo sobre fondo muy oscuro |
| `--accent-wash` | `rgba(60,231,255,.08)` | hover fantasma (l. 1470, 1573) | Relleno de estado activo |
| `--accent-tint` | `rgba(60,231,255,.05)` | aviso informativo (l. 1600) | Fondo de banner informativo |
| `--warning` | `#FFB547` | estado "pendiente", stock bajo (l. 1899, 2032, 1613) | Atención, plazo por vencer, "Usado" |
| `--warning-tint` | `rgba(255,181,71,.06)` | banner de plazo (l. 1613) | Fondo de banner de advertencia |
| `--success` | `#45E39A` | "entregado", abono de saldo (l. 1899, 1478, 2701) | Éxito, aprobado, abono |
| `--success-tint` | `rgba(69,227,154,.05)` | solicitud enviada (l. 1478) | Fondo de banner de éxito |
| `--danger` | `#FF4D5E` | punto de notificación (l. 109) | Error, rechazo, cancelación |
| `--danger-text` | `#FF7A86` | **nuevo** — ver §5.3 | Texto de error sobre `#16283A` |
| `--danger-tint` | `rgba(255,77,94,.07)` | derivado por consistencia | Fondo de banner de error |

> **Regla de frontera (importante para el tablero):** estos cuatro colores —cian, ámbar,
> verde, rojo— **significan estado** en todo el panel. **No se usan como colores de serie
> dentro de una gráfica**, salvo el caso explícitamente autorizado en §2.8.4. Las gráficas
> tienen su propia paleta.

#### Bordes y separadores

| Token | Hex | Origen | Uso |
|---|---|---|---|
| `--border-subtle` | `#16283A` | Separadores internos (l. 137, 299) | Líneas dentro de una tarjeta |
| `--border` | `#1F3244` | Borde estándar (l. 42, 381, 1459) | Borde de tarjeta, sección |
| `--border-strong` | `#2C4560` | Botones del carrusel, hover (l. 365, 381) | Tarjeta en hover, borde de tabla |
| `--border-input` | `#52708F` | **nuevo — corrección obligatoria**, §5.3 | Borde de todo campo de formulario |
| `--track` | `#22344A` | Línea/punto inactivo del flujo (l. 1908, 2034) | Barras de progreso, pistas, **rejilla de gráfica** |

### 2.2 Tipografía

Cargadas en el demo desde Google Fonts (l. 15). En Next.js se cargan con
`next/font/google`, con exactamente los pesos que ya usa el demo.

| Familia | Pesos | Origen | Para qué |
|---|---|---|---|
| **Chakra Petch** | 500, 600 | `h1`–`h3` y botones (l. 75, 341, 1455) | Títulos, encabezados, etiquetas de botón |
| **IBM Plex Sans** | 400, 500 | `body` (l. 18) | Cuerpo, formularios, celdas de tabla |
| **IBM Plex Mono** | 400, 500 | SKU, folio, precios, CLABE (l. 57, 91, 357, 1755) | Todo dato de identidad o dinero, **y toda cifra de gráfica** |

> **Regla heredada, sin excepción:** todo lo que se dicta, se copia o se compara va en IBM
> Plex Mono con `font-variant-numeric: tabular-nums`. Es lo que permite comparar el importe
> esperado contra el declarado de un vistazo.

### 2.3 Escala tipográfica del panel

| Rol | Familia / peso | Tamaño / interlineado | Color |
|---|---|---|---|
| Título de pantalla (H1) | Chakra Petch 600 | 28 px / 1.2 | `--text-primary` |
| Título de sección (H2) | Chakra Petch 600 | 20 px / 1.25 | `--text-primary` |
| Título de tarjeta / gráfica (H3) | Chakra Petch 600 | 16 px / 1.3 | `--text-primary` |
| Etiqueta de botón | Chakra Petch 600 | 15 px / 1 | según variante |
| Cuerpo | IBM Plex Sans 400 | 15 px / 1.55 | `--text-secondary` |
| Cuerpo denso (celda de tabla) | IBM Plex Sans 400 | 14 px / 1.45 | `--text-primary` |
| Etiqueta de campo | IBM Plex Sans 500 | 13 px / 1.3 | `--text-muted` |
| Texto de ayuda | IBM Plex Sans 400 | 13 px / 1.45 | `--text-muted` |
| Encabezado de columna | IBM Plex Mono 500 | 11 px, `ls 1.2px`, MAYÚSCULAS | `--text-muted` |
| **Etiqueta de eje / tick** | IBM Plex Mono 400 | **11 px**, `tabular-nums` | `--text-muted` |
| Dato mono (SKU, folio, fecha) | IBM Plex Mono 400 | 13 px / 1.4 | `--text-primary` |
| Importe en tabla | IBM Plex Mono 500 | 14 px, `tabular-nums` | `--text-primary` |
| **Valor de tarjeta KPI** | IBM Plex Mono 500 | **28 px**, `tabular-nums` | `--text-primary` |
| **Cifra héroe del tablero** | IBM Plex Mono 500 | **40 px**, `tabular-nums` | `--text-primary` |
| **Importe de comparación** | IBM Plex Mono 500 | **30 px**, `tabular-nums` | ver §11.5 |

### 2.4 Forma: el corte diagonal (`clip-path`)

```css
/* Botón grande / tarjeta destacada — 12 px (demo l. 1522, 1600, 1627) */
clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
/* Botón mediano — 10 px (demo l. 1470, 1573, 1774, 2692) */
clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
/* Botón pequeño / chip — 8 px (demo l. 55) */
clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
/* Tarjeta de contenido — 14 px (demo l. 1600) */
clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
```

**Se usa en:** botones de acción, tarjetas de resumen del tablero, banners de aviso,
tarjetas de porcentaje de devoluciones.
**No se usa en:** filas de tabla, campos de formulario, celdas, modales, **ni en el área de
trazado de una gráfica** (recortaría marcas y etiquetas).

> **Advertencia técnica:** `clip-path` recorta el `outline` del foco. En todo elemento con
> corte, el foco se dibuja con `box-shadow: inset`, no con `outline`. Resuelto en §5.5.

### 2.5 Bordes, radios y sombras

| Token | Valor | Origen |
|---|---|---|
| `--radius-input` | `4px` | Inputs del demo (l. 50, 82, 1500) |
| `--radius-card` | `0` | Tarjetas de esquina viva (l. 381, 1459) |
| `--radius-data-end` | `4px` | **nuevo** — extremo redondeado de barras (§2.8.5) |
| `--radius-pill` | `50%` | Avatares, puntos (l. 46, 365) |
| `--shadow-glow-primary` | `0 0 18px rgba(60,231,255,.35)` | Botón primario (l. 1522, 1593, 1627) |
| `--shadow-glow-soft` | `0 0 16px rgba(60,231,255,.3)` | Acción en lista (l. 2692) |
| `--shadow-dropdown` | `0 18px 40px rgba(0,0,0,.5)` | Sugerencias (l. 85) |
| `--shadow-overlay` | `0 26px 50px rgba(0,0,0,.55)` | Mega-menú (l. 191) |
| `--shadow-float` | `0 12px 30px rgba(0,0,0,.5)` | Botón flotante (l. 1860) |

**Regla del glow:** marca **una sola acción por pantalla**. Si dos botones brillan, ninguno
destaca. **Ninguna marca de gráfica lleva glow** — el brillo es lenguaje de acción, no de dato.

### 2.6 Espaciado y rejilla

El demo usa una escala irregular (9, 13, 17, 22, 26…). El panel la normaliza a múltiplos de
4 px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`.

| Contexto | Valor | Origen / razón |
|---|---|---|
| Ancho máximo del contenido | `1400px` | `max-width:1400px` (l. 40, 63, 1454) |
| Padding horizontal (escritorio) | `32px` | Demo l. 1454 |
| Padding horizontal (móvil) | `16px` | Demo `clamp(12px,1.6vw,20px)` (l. 63) |
| Padding interno de tarjeta | `20px` | Demo 18–22 px, normalizado |
| Separación entre tarjetas | `16px` | Demo `gap:18px` (l. 379), normalizado |
| Separación entre bandas del tablero | `32px` | — |
| Altura de fila de tabla | `48px` | Decisión del panel (§3.1) |
| Altura mínima de control táctil | `44px` | Demo `min-height:44px` (l. 101, 231) |
| **Rejilla del tablero (escritorio)** | **12 columnas, `gap:16px`** | — |

### 2.7 Movimiento

Heredado del demo (l. 25–32). El panel usa tres animaciones:

| Nombre | Definición | Uso |
|---|---|---|
| `sgIn` | `opacity 0→1, translateY 8px→0`, `.2s` | Toasts, modales, entrada de tarjetas del tablero |
| `sgPulse` | halo ámbar `1.8s infinite` | **Solo** el punto de "Comprobante recibido" cuando hay pendientes |
| `sgWake` | `opacity 0→1, brightness .3→1` | Aparición de tabla o gráfica tras cargar |

**Obligatorio, ya en el demo (l. 32):**
```css
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }
```
Además: **las gráficas no animan su entrada trazo por trazo** cuando esta preferencia está
activa; aparecen ya dibujadas.

---

### 2.8 Paleta de datos — colores para gráficas

El tablero introduce un problema que el resto del panel no tiene: **los cuatro colores
semánticos del demo ya significan estado** (cian = en proceso, ámbar = atención, verde =
éxito, rojo = error). Si una barra de "Videovigilancia" fuera verde, diría "aprobado" sin
querer. Por eso las gráficas tienen paleta propia, con reglas explícitas de convivencia.

#### 2.8.1 Superficie de las gráficas

Toda gráfica se dibuja sobre `--bg-card` **`#0F1D2B`**. Ese es el fondo contra el que se
verifica todo lo demás en esta sección.

> Dato relevante: la luminancia relativa de `#0F1D2B` (0.0115) es prácticamente idéntica a
> la de la superficie oscura de referencia del estándar de visualización usado
> (`#1a1a19`, 0.0103) — 2 % de diferencia. Por eso los pasos de modo oscuro de la paleta
> categórica documentada se pueden adoptar tal cual: sus contrastes se conservan. Aun así,
> **la validación formal es obligatoria antes de construir la maqueta** (§2.8.7).

#### 2.8.2 Paleta categórica (identidad: qué serie es cuál)

Se adopta la **instancia documentada de modo oscuro**, en su orden fijo. El orden **es** el
mecanismo de seguridad para daltonismo: no se reordena, no se saltan ranuras, no se cicla.

| Ranura | Familia | Hex (modo oscuro) | Contraste vs `#0F1D2B` |
|---|---|---|---|
| 1 | azul | `#3987E5` | **4.69:1** ✅ |
| 2 | naranja | `#D95926` | **4.39:1** ✅ |
| 3 | aqua | `#199E70` | **5.01:1** ✅ |
| 4 | amarillo | `#C98500` | **5.56:1** ✅ |
| 5 | magenta | `#D55181` | **4.32:1** ✅ |
| 6 | verde | `#008300` | **3.45:1** ✅ |
| 7 | violeta | `#9085E9` | **5.46:1** ✅ |
| 8 | rojo | `#E66767` | **5.28:1** ✅ |

Las ocho ranuras superan el mínimo de **3:1** para marcas sobre la superficie del panel
(cálculo propio sobre `#0F1D2B`).

**Reglas de uso, no negociables:**

- Las series se asignan **en orden** desde la ranura 1. Nunca se elige un color "porque
  combina".
- **El color sigue a la entidad, nunca a su posición.** Si el usuario filtra y quedan tres
  grupos, los sobrevivientes conservan su color; no se repinta.
- **Máximo 6 series** en el tablero. Con 7–8 el orden documentado sigue siendo válido para
  barras apiladas y líneas, pero para este público es demasiado: a partir de la séptima, el
  resto se pliega en **"Otros"**.
- En formas donde **cualquier par de marcas puede quedar lado a lado** (dispersión,
  burbujas, mapas, múltiplos pequeños) el tope es de **3 series**. El tablero no usa
  ninguna de esas formas, así que no aplica hoy; queda anotado por si se agregan.
- A partir de **4 series, las etiquetas directas son obligatorias** además de la leyenda
  (la ranura 4 pone amarillo junto a naranja).
- **Con 2 o más series siempre hay leyenda.** Con una sola serie **no hay leyenda**: el
  título de la gráfica la nombra.

#### 2.8.3 Rampa secuencial y ordinal — cian de marca

Para magnitud continua y para escalas ordenadas (etapas de un flujo) se usa **una sola
familia**: el cian de la marca, que es lo que amarra las gráficas al resto del producto.
En modo oscuro **más = más brillante**.

| Paso | Hex | Contraste vs `#0F1D2B` | Uso |
|---|---|---|---|
| 100 | `#0E3A41` | 1.38:1 | Solo mapa de calor, valor cercano a cero |
| 200 | `#124F58` | 1.86:1 | Solo mapa de calor |
| **300** | `#176F7B` | **2.92:1** | **Piso para escalas ordinales** (≥ 2:1) |
| 400 | `#1E93A3` | — | Paso intermedio |
| 500 | `#26B8CC` | — | Paso intermedio |
| 600 | `#3CE7FF` | 11.43:1 | El acento de marca — extremo alto |
| 700 | `#9AF1FF` | — | Énfasis puntual |

Los pasos 600 y 700 son tokens del demo (`--accent` y `--accent-bright`); los pasos 100–500
son **interpolaciones nuevas hacia la superficie** y **requieren validación ordinal**
(monotonía de luminosidad y ΔL ≥ 0.06 entre pasos contiguos) antes de construir la maqueta.

#### 2.8.4 La única excepción autorizada: escalas que significan bien/mal

Cuando una serie **es** un juicio de valor —antigüedad de un pedido que se va a cancelar,
nivel de stock— el estándar dice que debe vestir colores de estado, no de identidad. Es el
único lugar donde los colores semánticos del demo entran a un área de trazado:

| Nivel | Color | Es el token de UI |
|---|---|---|
| Bien / a tiempo | `#45E39A` | `--success` |
| Atención | `#FFB547` | `--warning` |
| Crítico / por vencer | `#FF4D5E` | `--danger` |
| Neutro / sin riesgo | `#7E93A6` | `--text-dim` |

Condición obligatoria: **siempre con ícono + etiqueta de texto**, nunca color solo. Y una
misma gráfica **nunca mezcla** colores de estado con colores categóricos.

#### 2.8.5 Especificación de las marcas

| Elemento | Especificación |
|---|---|
| Grosor de línea | **2 px**, sin sombra, sin glow |
| Extremo de barra | Radio **4 px** solo del lado del dato; el lado de la línea base queda a escuadra |
| Separación entre segmentos apilados y entre barras contiguas | **2 px del color de la superficie** (`#0F1D2B`), para que los segmentos no se fundan |
| Anillo en marcas superpuestas | **2 px** de superficie alrededor de la marca |
| Punto / marcador | **≥ 8 px** de diámetro; se muestra en hover, no permanente |
| Rejilla | **1 px `#22344A`** (`--track`), solo horizontal, detrás de las marcas |
| Línea base y eje | **1 px `#1F3244`** |
| Etiquetas de eje | IBM Plex Mono 400 11 px, `#9FB2C3` |
| Etiquetas directas de valor | IBM Plex Mono 500 12 px, **`#EAF2F8`** — nunca del color de la serie |
| Relleno de área (una sola serie) | Degradado vertical del color de la serie, de 22 % a 0 % de opacidad |

> **El texto nunca se pinta del color de la serie.** Valores, etiquetas y leyendas van en
> tinta (`--text-primary` / `--text-muted`); el cuadrito de color al lado carga la identidad.
> Es lo que mantiene todo legible sobre el fondo oscuro.

#### 2.8.6 Prohibiciones explícitas

- **Nunca dos ejes Y** en una misma gráfica. Dos medidas de escala distinta = dos gráficas.
- **Nunca un arcoíris** en una escala de magnitud: secuencial es una sola familia.
- **Nunca colorear barras nominales según su valor**: eso gasta el canal de identidad en
  repetir lo que la longitud de la barra ya dice. Barras nominales = todas del mismo color
  (ranura 1 o el cian 600).
- **Nunca una gráfica de pastel o dona** para comparar más de dos partes. Con 6 grupos de
  nombres largos, una dona obliga a leer leyenda y ángulos; la barra apilada horizontal
  resuelve lo mismo y se lee de corrido.
- **Nunca un número sobre cada punto** de una serie temporal. Etiqueta directa solo del
  último valor y del máximo.
- **Nunca una gráfica decorativa.** Cada una de §11.2 responde una pregunta escrita.

#### 2.8.7 Pendiente obligatorio antes de construir la maqueta

La validación automática de paleta (bandas de luminosidad y croma, separación bajo
protanopía y deuteranopía, piso de visión normal y contraste) **no se pudo ejecutar en esta
fase por falta de acceso a línea de comandos.** Los contrastes de §2.8.2 y §2.8.3 sí se
calcularon a mano contra `#0F1D2B` y todos pasan.

**Antes de escribir la primera gráfica hay que correr el validador de la skill `dataviz`:**

```
node scripts/validate_palette.js \
  "#3987E5,#D95926,#199E70,#C98500,#D55181,#008300" \
  --mode dark --surface "#0F1D2B"

node scripts/validate_palette.js \
  "#0E3A41,#124F58,#176F7B,#1E93A3,#26B8CC,#3CE7FF,#9AF1FF" \
  --ordinal --mode dark --surface "#0F1D2B"
```

Si la rampa cian falla la monotonía o el salto mínimo entre pasos, se re-escalonan **sus
pasos intermedios** (100–500), nunca los pasos 600/700, que son tokens de marca.

---

## 3. Adaptaciones del lenguaje visual al panel

### 3.1 Densidad de información

| Qué | Tienda (demo) | Panel | Por qué |
|---|---|---|---|
| Título de pantalla | `clamp(28px,3.2vw,48px)` | `28px` fijo | El contenido es la tabla, no el título |
| Padding vertical de sección | 48–72 px | 24–40 px | Más filas visibles |
| Padding de tarjeta | 22–26 px | 20 px | — |
| Cuerpo | 15–17 px | 15 px (14 px en tabla) | **No bajar de 14 px** |
| Fotos de producto | 258 px de alto | miniatura 40×40 px | En lista, la foto identifica, no vende |
| Filas visibles sin scroll (1080p) | — | ≥ 12 | Criterio de aceptación |

**Altura de fila de tabla: 48 px.** Más bajo dificulta acertar con el mouse (Ley de Fitts);
más alto desperdicia pantalla. **No hay modo "compacto" en V1**: es una decisión más que
tomar y la persona que opera no es técnica (Ley de Hick).

### 3.2 El cian se racionaliza

| El cian SÍ se usa para | El cian NO se usa para |
|---|---|
| El botón primario de la pantalla (uno solo) | Encabezados de tabla |
| El elemento de menú activo | Viñetas y decoración |
| El anillo de foco del teclado | Cifras de importe (van en `--text-primary`) |
| El estado "Comprobante recibido" | Texto que no sea enlace |
| Enlaces dentro de texto | Bordes de tarjeta en reposo |
| La serie única de una gráfica (cian 600) | Varias series a la vez en una gráfica |

### 3.3 Interacción pensada para escritorio (sin abandonar el móvil)

| Estado | Especificación |
|---|---|
| **Hover de fila de tabla** | `background:#16283A` + `cursor:pointer` + borde izquierdo `2px solid #3CE7FF` |
| **Hover de botón primario** | `background:#6FEEFF` (heredado, l. 1522) |
| **Hover de botón secundario** | `background:rgba(60,231,255,.08)` (heredado, l. 1470) |
| **Hover de botón peligroso** | `background:rgba(255,77,94,.12)`, borde `#FF4D5E` |
| **Foco de teclado** | `outline:2px solid #3CE7FF; outline-offset:2px` (heredado, l. 23). Con `clip-path`: `box-shadow: inset 0 0 0 2px #3CE7FF` |
| **Fila seleccionada** | `rgba(60,231,255,.08)` + borde izquierdo cian |
| **Presionado** | `transform: translateY(1px)`, sin sombra |
| **Deshabilitado** | `background:#16283A; color:#8DA2B5; cursor:not-allowed` — corregido, §5.3 |
| **Cargando (botón)** | Spinner + verbo en gerundio; el ancho no cambia |
| **Hover en gráfica** | Ver §2.8 y §11.2.7: cruceta + tooltip en líneas, tooltip por marca en barras; el área sensible es mayor que la marca |

**Atajos (escritorio):** `/` enfoca la búsqueda de la pantalla; `Esc` cierra modal o cajón;
`Enter` confirma el modal enfocado. Se documentan en un tooltip de ayuda, nunca como
conocimiento obligatorio.

### 3.4 Un solo idioma: español de negocio

- **Nunca** un código de error ni un nombre técnico en pantalla.
- Todo error dice **qué pasó**, **por qué** y **qué hacer ahora**.
- Toda acción destructiva confirma **nombrando el objeto**: no "¿Confirmar?" sino
  "¿Desactivar el producto SGQ-VV-0012?".
- Las confirmaciones con consecuencia monetaria muestran **el importe dentro del modal**.

---

## 4. Modo de color: **oscuro, único y declarado**

**Decisión: el panel es solo modo oscuro.** Sin alternador de tema en V1.

1. El sitio público es oscuro por diseño aprobado (l. 18); un panel claro rompería la
   continuidad.
2. Un segundo tema duplica la matriz de contraste — y el contraste es el riesgo identificado
   en `requerimientos.md` §9. Con el tablero, además, duplicaría la validación de la paleta
   de datos.
3. Nadie lo pidió.

**Consecuencias obligatorias para el coder** (esto ya causó un bug real en otro proyecto):

1. Declarar `<html lang="es" className="dark">` y `color-scheme: dark` en `globals.css`,
   para que `<select>`, scrollbars y selectores de fecha nativos salgan oscuros.
2. **Eliminar, no comentar, el CSS heredado de `create-next-app`**: el bloque
   `@media (prefers-color-scheme: dark) { :root { --background…; --foreground… } }`, las
   variables `--background`/`--foreground` y la fuente Geist. Si se deja, el panel cambiará
   de color según el sistema operativo de quien lo abra.
3. Quitar la importación de Geist / Geist Mono. Las fuentes son Chakra Petch, IBM Plex Sans
   e IBM Plex Mono, y ninguna otra.
4. Con Tailwind, `darkMode` **no** se configura como `media`: los tokens de §2 son variables
   CSS fijas.
5. La librería de gráficas suele traer su **propio tema claro por defecto** (ejes grises,
   fondo blanco, su propia paleta categórica). Se desactiva por completo y se alimenta con
   los tokens de §2.8. **Ningún color de gráfica puede venir del default de la librería.**
6. Verificación de cierre: buscar en el repositorio `prefers-color-scheme`, `--foreground`,
   `Geist` y `#ffffff`. Si algo aparece fuera de este documento, no se terminó de limpiar.

---

## 5. Contraste verificado (WCAG 2.2 AA)

Mínimo: **4.5:1** texto normal, **3:1** texto grande y bordes/estados de componentes
(criterio 1.4.11).

### 5.1 Texto sobre superficies — aprobadas

| Texto | Sobre | Ratio |
|---|---|---|
| `#EAF2F8` | `#07111C` / `#0F1D2B` / `#16283A` | **16.79** / **15.08** / **13.28** ✅ |
| `#C7D5E0` | `#07111C` / `#0F1D2B` | **12.68** / **11.39** ✅ |
| `#9FB2C3` | `#07111C` / `#0F1D2B` / `#16283A` / `#122234` | **8.71** / **7.82** / **6.89** / **7.39** ✅ |
| `#3CE7FF` | `#07111C` / `#0F1D2B` / `#16283A` | **12.72** / **11.43** / **10.06** ✅ |
| `#FFB547` | `#07111C` / `#0F1D2B` | **10.81** / **9.71** ✅ |
| `#45E39A` | `#07111C` / `#0F1D2B` | **11.49** / **10.32** ✅ |
| `#FF4D5E` | `#07111C` / `#0F1D2B` | **5.85** / **5.26** ✅ |
| `#FF7A86` | `#16283A` | **5.99** ✅ |

**Conclusión sobre el riesgo de `requerimientos.md` §9:** el cian sobre el fondo oscuro
heredado **no es el problema** (12.72:1), ni el texto secundario (8.71:1). El riesgo está en
los tres grises apagados del demo, corregidos abajo.

### 5.2 Texto sobre rellenos de color

| Texto | Sobre | Ratio |
|---|---|---|
| `#07111C` | `#3CE7FF` botón primario | **12.72** ✅ |
| `#07111C` | `#FFB547` badge de atención | **10.81** ✅ |
| `#07111C` | `#45E39A` badge de éxito | **11.49** ✅ |
| `#07111C` | `#FF4D5E` botón de peligro | **5.85** ✅ |

Todos los rellenos llevan texto `#07111C`, nunca blanco — igual que el demo (l. 55, 1522).

### 5.3 Tres correcciones obligatorias al demo

| # | Combinación del demo | Ratio | Corrección |
|---|---|---|---|
| **C-1** | `#5D7080` sobre `#07111C` (etiquetas inactivas, l. 1914) | **3.70** ❌ | Usar `#7E93A6` (**5.98** ✅) |
| **C-2** | Deshabilitado `#5D7080` sobre `#16283A` (l. 2641) | **2.93** ❌ | Usar `#8DA2B5` sobre `#16283A` (**5.70** ✅) |
| **C-3** | Borde de campo `#1F3244` sobre `#0F1D2B` (l. 50, 82, 1500) | **1.30** ❌ | Borde de campo `#52708F` (**3.31** ✅) |

Sobre **C-3**: en la tienda un campo se identifica por su contexto; en un formulario de 12
campos en rejilla, el borde **es** lo que delimita cada campo. `#1F3244` se conserva para
separadores decorativos, donde 1.4.11 no aplica.

`#7E93A6` se restringe a texto de **16 px o mayor** y nunca a información necesaria para
decidir.

### 5.4 Elementos no textuales

| Elemento | Ratio | Requisito |
|---|---|---|
| Anillo de foco `#3CE7FF` vs `#0F1D2B` | 11.43 | ≥ 3 ✅ |
| Borde de campo `#52708F` vs `#0F1D2B` | 3.31 | ≥ 3 ✅ |
| Barra de progreso `#3CE7FF` vs pista `#22344A` | ≈ 8.9 | ≥ 3 ✅ |
| **Las 8 ranuras categóricas vs `#0F1D2B`** | **3.45 – 5.56** | ≥ 3 ✅ (§2.8.2) |
| Rejilla de gráfica `#22344A` vs `#0F1D2B` | 1.25 | Decorativa, exenta |
| Separador `#1F3244` vs `#0F1D2B` | 1.30 | Decorativo, exento |

### 5.5 El foco del teclado

Heredado del demo (l. 23):
```css
*:focus-visible { outline: 2px solid #3CE7FF; outline-offset: 2px }
```
**Excepción para elementos con `clip-path`:**
```css
.con-corte:focus-visible { outline: none; box-shadow: inset 0 0 0 2px #3CE7FF, inset 0 0 0 4px #07111C }
```
**Ningún elemento interactivo del panel puede quedar sin foco visible** — incluidos los
puntos y barras enfocables de las gráficas.

---

## 6. Navegación del panel: qué ve cada rol

Requisito H5: el rol `inventario` **no ve los enlaces**.

```
┌──────────────────────────────┐   ancho 248 px · fondo #0B1622
│ ◉  Seguridad General         │   logo 32 px + Chakra Petch 600 15 px
│    QUERÉTARO · PANEL         │   Mono 10 px · ls 2px · #9FB2C3
├──────────────────────────────┤
│  ▸ Inicio                    │   ← tablero (§11.2) · solo admin
│  ▸ Pedidos              (7)  │   ← contador de "Comprobante recibido"
│  ▸ Catálogo                  │
│  ▸ Devoluciones         (2)  │
│  ▸ Solicitudes          (4)  │
│  ▸ Analítica                 │
│  ▸ Configuración             │
├──────────────────────────────┤
│  MB  Mariana Balanzar        │   ← H5.3: nombre y rol siempre visibles
│      Administrador           │
│      Cerrar sesión           │
└──────────────────────────────┘
```

| Elemento | Especificación |
|---|---|
| Ítem en reposo | `#9FB2C3`, Chakra Petch 500 15 px, padding `12px 16px`, alto 44 px |
| Ítem en hover | `#EAF2F8`, fondo `#16283A` |
| Ítem activo | `#3CE7FF`, fondo `#0F1D2B`, borde izquierdo `2px solid #3CE7FF` (patrón del demo, l. 2675) |
| Contador | Fondo `#FFB547`, texto `#07111C`, Mono 500 11 px, píldora 18 px. Solo si > 0 |
| Pulso | El contador de Pedidos usa `sgPulse` solo si hay "Comprobante recibido" |

| Sección | `admin` | `inventario` |
|---|---|---|
| **Inicio (tablero)** | ✅ | ❌ **no aparece** |
| Pedidos | ✅ | ❌ **no aparece** |
| Catálogo (productos, importador, categorías) | ✅ | ✅ |
| Devoluciones · Solicitudes · Analítica · Configuración | ✅ | ❌ **no aparecen** |

Para `inventario` la barra muestra **solo tres entradas** (Productos, Importar, Categorías),
como menú plano sin agrupación: con tres opciones, agrupar es ruido (Hick).

El pie muestra siempre iniciales, nombre y **el rol en texto legible** — "Administrador" o
"Inventario", nunca `admin` ni `inventario`.

**Acceso denegado (H5.2)** — cuando `inventario` escribe a mano una URL fuera de su alcance:

```
┌────────────────────────────────────┐
│            ⬤ (ámbar)               │
│   Esta sección no es parte de      │  Chakra Petch 600 · 24 px
│   tu acceso                        │
│   Tu cuenta tiene permiso para     │  15 px · #C7D5E0
│   administrar el catálogo. Si      │
│   necesitas ver pedidos, pídeselo  │
│   al administrador.                │
│   [ Ir a Catálogo ]                │  ← primario con corte
└────────────────────────────────────┘
```
Sin números de error, sin "403", sin "Forbidden".

---

## 7. Componentes reutilizables (Atomic Design)

Se respeta la estructura obligatoria de `arquitectura.md` §4.1 y su regla de dependencia
**átomo → molécula → organismo → template**, en un solo sentido.

### 7.1 Átomos (`src/components/atoms/`)

| Componente | Variantes |
|---|---|
| `Boton` | `primario` (cian + glow + corte 12 px) · `secundario` (borde cian, corte 10 px) · `fantasma` · `peligro` · `peligroLleno` · tamaños `sm 36` / `md 44` / `lg 52` · `cargando`, `deshabilitado` |
| `Campo` | `text`/`number`/`email`/`password`/`textarea`/`select`/`date`/`search`. Fondo `#0B1622`, borde `#52708F`, radio 4 px, alto 44 px |
| `Etiqueta` · `Texto` · `TextoMono` | Escala de §2.3; `TextoMono` con `tabular-nums` |
| `Badge` | `neutro`/`info`/`atencion`/`exito`/`peligro`, formas `contorno` y `lleno` |
| `Icono` · `Spinner` · `Separador` · `Salto` (skeleton) | SVG trazo 1.5 `currentColor`; spinner con `role="status"` |
| `Casilla` · `Interruptor` | Heredados del demo (l. 2640, 2609–2610) |
| `BarraProgreso` · `AnilloProgreso` | Pista `#22344A`, relleno `#3CE7FF` |
| **`Delta`** | Variación porcentual con flecha e ícono: verde si sube y subir es bueno, rojo si baja. **Nunca color solo** |
| **`MuestraColor`** | Cuadrito 10×10 px de color de serie, para leyendas y tooltips |

### 7.2 Moléculas (`src/components/molecules/`)

| Componente | Composición / uso |
|---|---|
| `CampoConError` | `Etiqueta` + `Campo` + ayuda + error (`#FF7A86`, 13 px, con ícono) |
| `BadgeEstadoPedido` · `BadgeCondicion` | Mapa de colores de §8; "Usado" en ámbar (D6) |
| `IndicadorStock` | Barras escalonadas + etiqueta, heredado del demo (l. 2030–2041) |
| `CeldaFolio` · `CeldaImporte` · `CeldaCliente` | Mono + copiar; importe a la derecha con `tabular-nums`; nombre + correo en dos líneas |
| `ChipFiltro` | Píldora seleccionable, heredada (l. 2683); activo = borde y texto cian |
| `BuscadorTabla` | `Campo` search + lupa + limpiar + `debounce` 300 ms |
| `SelectorRangoFechas` | Presets "7 días / 30 días / Este mes / Personalizado" + dos `Campo` date |
| `MiniaturaProducto` · `EstadoVacio` · `BannerAviso` | Respaldo con iniciales del SKU; ícono + titular + explicación + acción; variantes info/atención/éxito/error |
| `LineaTiempoEstado` | Flujo del pedido, heredado (`signal()`, l. 1903–1919), con el inactivo corregido a `#7E93A6` |
| `FilaSubcategoria` · `ItemNavegacion` | Sangría por nivel y contador; ítem de barra lateral con badge |
| **`TarjetaAtencion`** | Tarjeta de acción del tablero: cifra + etiqueta + enlace a la vista filtrada. Estados "pendiente" y "al día" (§11.2.2) |
| **`TarjetaKPI`** | Valor (Mono 28 px) + etiqueta + `Delta` + minigráfica de línea |
| **`LeyendaGrafica`** | `MuestraColor` + nombre por serie; horizontal, arriba a la derecha del título |
| **`TooltipGrafica`** | Fondo `#122234`, borde `#2C4560`, sombra `--shadow-dropdown`; valores en Mono |
| **`Medidor`** | Razón única contra un límite: pista `#22344A`, relleno del color correspondiente, valor en Mono |
| **`VerLosDatos`** | `<details>` que despliega la tabla equivalente de una gráfica |

### 7.3 Organismos (`organisms/` compartidos · `admin/` exclusivos del panel)

| Componente | Dónde | Responsabilidad |
|---|---|---|
| `TablaDatos` | `organisms/` | Tabla genérica: orden, selección, paginación, estados propios |
| `TablaPedidos` · `TablaProductos` | `admin/` | Columnas y acciones específicas; edición en línea de precio y stock |
| `VisorComprobante` | `admin/` | Imagen o PDF con zoom, rotación, ajuste, descarga. Corazón de la validación |
| `PanelComparacionPago` | `admin/` | Importe esperado vs. declarado con veredicto (§11.5) |
| `DesgloseSaldoAplicado` | `admin/` | Sustituye al visor en el caso RN-11 |
| `EditorProducto` · `GestorImagenesProducto` · `EditorEspecificaciones` | `admin/` | Alta/edición (F1), fotos con orden y principal, atributos JSONB |
| `ImportadorCSV` · `TablaVistaPreviaImportacion` | `admin/` | Las tres etapas de F2 y el detalle de errores por fila |
| `ArbolCategorias` | `admin/` | Árbol de 3+ niveles de D7, reordenar y reasignar |
| `ResolutorDevolucion` | `admin/` | Porcentaje, corrección manual y reclasificación a "Usado" |
| `ModalConfirmacion` · `PanelLateralDetalle` · `AnfitrionToast` | `organisms/` | Confirmación con objeto nombrado; cajón de detalle; toasts (l. 1865–1870) |
| `BarraLateralAdmin` · `EncabezadoPantalla` | `admin/` | Navegación por rol (§6); migas + título + acciones |
| **`MarcoGrafica`** | `organisms/` | Envoltura común: título, subtítulo con la pregunta de negocio, leyenda, área de trazado, `VerLosDatos`, y sus cuatro estados. **Toda gráfica se monta aquí; ninguna se dibuja suelta** |
| **`GraficaLineaTemporal`** | `admin/` | Línea con cruceta y tooltip (§11.2.4 A) |
| **`GraficaBarrasHorizontales`** | `admin/` | Barras horizontales con etiqueta directa (§11.2.4 B, D) |
| **`GraficaColumnasEstado`** | `admin/` | Columnas con colores de estado (§11.2.4 C) |
| **`GraficaBarraApiladaUnica`** | `admin/` | Una barra, N segmentos, para parte-de-todo (§11.2.4 E) |
| **`ListaStockCritico`** | `admin/` | Lista con `Medidor` por renglón (§11.2.5) |
| **`TableroInicio`** | `admin/` | Composición de las tres bandas del tablero |

### 7.4 Templates (`src/components/templates/`)

| Template | Estructura |
|---|---|
| `LayoutAdmin` | Barra lateral fija 248 px + contenido con `EncabezadoPantalla` |
| `LayoutBandeja` | `LayoutAdmin` + filtros + tabla + paginación |
| `LayoutDetalle` | `LayoutAdmin` + dos columnas (contenido / acciones pegajosas) |
| **`LayoutTablero`** | `LayoutAdmin` + rejilla de 12 columnas con `gap:16px` para las tarjetas y gráficas |
| `LayoutAuth` | Pantalla centrada sin barra lateral |

---

## 8. Mapa de colores por estado (única fuente de verdad)

| Estado (`order_status`) | Etiqueta | Color | Badge |
|---|---|---|---|
| `pendiente_pago` | Pendiente de pago | `#FFB547` | Contorno |
| `comprobante_recibido` | **Comprobante recibido** | `#3CE7FF` | **Lleno** (texto `#07111C`) |
| `listo_envio` | Listo para envío | `#3CE7FF` | Contorno |
| `enviado` | Enviado | `#3CE7FF` | Contorno |
| `entregado` | Entregado | `#45E39A` | Contorno |
| `cancelado` | Cancelado | `#FF7A86` | Contorno |

> Solo "Comprobante recibido" va lleno: es el único estado que exige acción del
> administrador, y el relleno lo hace saltar en una tabla de 50 filas sin introducir un
> color nuevo. El resto replica el mapeo del demo (l. 1899), para que cliente y
> administrador hablen de los mismos colores.

| Dominio | Valor | Etiqueta | Color |
|---|---|---|---|
| Devolución | `solicitada` / `en_revision` / `aprobada` / `rechazada` | Pendiente de revisión / En revisión / Aprobada / Rechazada | `#FFB547` lleno / `#3CE7FF` / `#45E39A` / `#FF7A86` |
| Solicitud | `nueva` / `contactada` / `cerrada` | Nueva / En seguimiento / Cerrada | `#FFB547` lleno / `#3CE7FF` / `#9FB2C3` |
| Producto | `activo` / `agotado` / `descontinuado` | — | `#45E39A` / `#FFB547` / `#9FB2C3` |
| Condición | `nuevo` / `usado` | — / **Usado** | sin badge / `#FFB547` contorno + ícono |
| Fila de importación | correcta / con error | — | `#45E39A` / `#FF7A86` |

---

## 9. Responsividad

### 9.1 Breakpoints

| Nombre | Rango | Origen |
|---|---|---|
| **Móvil** | `< 760px` | El corte del demo: `window.innerWidth < 760` (l. 1988) |
| **Tablet** | `760 – 1179px` | — |
| **Escritorio** | `1180 – 1439px` | Barra lateral 248 px + tabla cómoda |
| **Escritorio amplio** | `≥ 1440px` | Contenido centrado `max-width:1400px` (l. 40) |

### 9.2 Cómo se reorganiza cada pantalla

| Pantalla | Móvil (< 760) | Tablet | Escritorio |
|---|---|---|---|
| **Estructura general** | Barra lateral → cajón a pantalla completa desde un botón de 44×44 px (patrón del demo, l. 227–271) | Barra colapsada a 64 px, solo íconos con tooltip | Barra completa 248 px, fija |
| **Tablero (inicio)** | Ver §11.2.8 — **la banda que más se degrada**; reglas propias | Rejilla de 6 columnas | Rejilla de 12 columnas |
| **Bandeja de pedidos** | **Tarjetas, no tabla**: folio + badge arriba, cliente e importe en medio, acción abajo a lo ancho. Filtros en carrusel de chips | Tabla de 4 columnas + "Ver detalle" | Tabla completa de 7 columnas |
| **Detalle de pedido** | Una columna: **comprobante primero**, importes justo debajo, acciones fijas al pie | Dos columnas 60/40 | Dos columnas 58/42, acciones pegajosas |
| **Comparación importe vs. comprobante** | Apilada, con el bloque de importes **fijo bajo la imagen al hacer scroll** | Lado a lado | Lado a lado |
| **Catálogo** | Tarjetas; edición a pantalla completa | Tabla de 5 columnas | Tabla de 8 columnas con edición en línea |
| **Editor de producto** | Pestañas apiladas, un campo por fila, barra de guardar fija | Rejilla de 2 columnas | 2 columnas + columna lateral de imágenes |
| **Importador CSV** | Aviso "funciona mejor en computadora"; vista previa como lista de errores | Tabla con scroll horizontal | Tabla completa |
| **Árbol de categorías** | Navegación por niveles (entrar/volver), como el menú móvil del demo | Árbol con sangría | Árbol + panel de edición |
| **Devoluciones / Solicitudes** | Tarjetas; resolutor a pantalla completa | Tabla de 4 columnas | Tabla + cajón lateral |
| **Analítica** | Una columna; barras horizontales; tabla con scroll | Dos columnas | Rejilla de 12 columnas |
| **Configuración** | Secciones en acordeón | Una columna de 720 px | Columna de 720 px + índice pegajoso |

### 9.3 Reglas transversales

- **Ningún dato se elimina en móvil, solo se reubica.**
- **Toda tabla con scroll horizontal congela la primera columna** (folio o SKU).
- **Objetivos táctiles ≥ 44×44 px** en móvil y tablet (estándar del demo, l. 101, 231).
- **La acción primaria se fija al pie en móvil** (`position: sticky; bottom: 0`) sobre
  `#0B1622` con borde superior — a distancia del pulgar (Fitts).
- Se prueba a **320 px** sin scroll horizontal en el contenedor de la página.

---

## 10. Accesibilidad — requisitos por pantalla

Base común:

- **HTML semántico**: `<nav>`, `<main>`, `<table>` real con `<thead>`/`<th scope="col">`,
  `<button>` para acciones y `<a>` para navegación. Encabezados sin saltos.
- **Enlace "Saltar al contenido"** como primer elemento enfocable.
- **Foco visible siempre** (§5.5) y orden de tabulación igual al orden visual.
- **Nada depende solo del color**: cada badge lleva su texto; cada fila con error lleva
  ícono + texto; **cada serie de gráfica con 2+ series tiene leyenda**, y con 4+ además
  etiqueta directa.
- **`aria-live="polite"`** en toasts; **`assertive`** en errores de formulario tras envío.
- **Idioma declarado**: `<html lang="es">`.

| Pantalla | Requisitos específicos |
|---|---|
| **Login** | `<form>` real con `autocomplete`; error asociado con `aria-describedby` y con foco; botón con `aria-busy` |
| **Tablero** | Ver §11.2.9 — reglas propias, es la pantalla con más riesgo de accesibilidad |
| **Bandeja de pedidos** | `<caption>` oculto ("Pedidos, N resultados"); `aria-sort` en encabezados ordenables; chips en `role="group"` con `aria-pressed`; el conteo se anuncia en `aria-live` al filtrar |
| **Detalle de pedido** | `alt` descriptivo del comprobante; controles de zoom etiquetados; la comparación de importes como `<dl>`; la línea de tiempo como `<ol>` con `aria-current="step"` |
| **Detalle sin comprobante (RN-11)** | El desglose de saldo es una `<table>` con encabezados |
| **Catálogo** | Edición en línea entra con `Enter`, sale con `Esc`; el guardado se anuncia en `aria-live` |
| **Editor de producto** | `role="tablist"/"tab"/"tabpanel"` navegable con flechas; **si al guardar hay errores en una pestaña oculta, el aviso dice en cuál** |
| **Importador CSV** | `<input type="file">` alcanzable por teclado además del arrastre; `role="progressbar"` con `aria-valuenow`; cada motivo asociado a su fila con `<th scope="row">` |
| **Árbol de categorías** | `role="tree"/"treeitem"` con `aria-expanded`, `aria-level`, flechas; **alternativa por teclado obligatoria** al arrastre |
| **Devoluciones** | Porcentaje como radios reales en `<fieldset>`+`<legend>`; "Publicar como Usado" con `aria-expanded`/`aria-controls` |
| **Solicitudes** | Cambio de estado con `<select>` nativo etiquetado |
| **Analítica** | Cada gráfica con su tabla equivalente; nada solo por color |
| **Configuración** | Cada sección `<fieldset>`+`<legend>`; CLABE validada en vivo con error asociado; guardado anunciado |
| **Modales** | `role="dialog"` + `aria-modal` + `aria-labelledby`; foco atrapado; `Esc` cierra; el foco vuelve al disparador |

---

## 11. Pantallas

---

### 11.1 Login del panel (H2)

Template `LayoutAuth`. Tarjeta centrada de 400 px sobre `--bg-card`.

```
┌──────────────────────────────────┐
│           ◉  (logo 48px)         │
│      Seguridad General           │  Chakra Petch 600 · 20px
│      QUERÉTARO · PANEL           │  Mono 10px · ls 2px · #9FB2C3
│   Correo electrónico             │  Etiqueta 13px #9FB2C3
│   [                            ] │  alto 44px
│   Contraseña                     │
│   [                      ] [ 👁 ]│
│   ┌────────────────────────────┐ │
│   │        Entrar              ▟│ │  primario · corte 12px
│   └────────────────────────────┘ │  glow cian · alto 52px
│   ¿Olvidaste tu contraseña?      │  enlace cian 14px
└──────────────────────────────────┘
   Acceso exclusivo del personal      13px · #9FB2C3
   de SG Querétaro
```

Jerarquía (Hick): **dos campos y un botón**. Sin "recordarme", sin registro, sin idioma.

| Estado | Diseño |
|---|---|
| **Inicial** | Foco automático en el campo de correo |
| **Cargando** | Botón con spinner + "Entrando…", campos de solo lectura, ancho fijo |
| **Credenciales incorrectas** | Banner rojo: **"Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo."** Nunca se dice cuál falló. Ambos campos con borde `#FF4D5E`. El banner recibe el foco |
| **Demasiados intentos** (5/15 min, H2) | Banner ámbar: **"Por seguridad bloqueamos el acceso por 15 minutos después de varios intentos fallidos. Vuelve a intentarlo a las 10:42, o pide ayuda al administrador."** Botón deshabilitado con cuenta regresiva |
| **Sesión expirada** | Banner cian: **"Tu sesión se cerró por seguridad. Vuelve a entrar."** |
| **Sin conexión** | Banner rojo: **"No pudimos conectarnos. Revisa tu conexión a internet e inténtalo de nuevo."** + "Reintentar" |
| **Cuenta sin rol de panel** | Se cierra la sesión: **"Esta cuenta no tiene acceso al panel. Si crees que es un error, contacta al administrador."** |

---

### 11.2 Inicio — **Tablero del administrador** (G2 adelantado a V1)

Ruta `/admin`. Template `LayoutTablero`.
**Rol `inventario`:** no ve esta pantalla; `/admin` lo redirige a `/admin/catalogo` (H6.2).

#### 11.2.1 Principio de organización

El dueño abre esto **todos los días**. La pantalla responde, de arriba abajo, tres
preguntas en orden de urgencia:

| Banda | Pregunta que responde | Contenido |
|---|---|---|
| **1 · Lo que necesita tu atención hoy** | "¿Qué tengo que hacer ahora mismo?" | 6 tarjetas de acción, cada una enlaza a su vista ya filtrada |
| **2 · Cómo va el negocio** | "¿Vamos bien o mal?" | 4 KPI con variación + gráfica de ventas + embudo de pedidos |
| **3 · Para decidir** | "¿Qué reabastezco, qué se me va a acabar, de qué vivo?" | Más vendidos, stock crítico, ventas por grupo, antigüedad de pendientes, saldo comprometido |

Lo urgente va arriba porque es lo que se hace; el panorama va después porque es lo que se
consulta. **Nunca al revés**: un tablero que abre con una gráfica bonita y esconde los
comprobantes por validar hace que el dueño tarde más en cobrar.

```
┌─ Inicio ───────────── Periodo: (7 días)(●30 días)(Este mes)(Personalizado) ──┐
│                                                                              │
│  LO QUE NECESITA TU ATENCIÓN HOY                          Martes 20 de sept. │
│ ┌────────────┐┌────────────┐┌────────────┐┌────────────┐┌──────────┐┌───────┐│
│ │     7      ││     3      ││     2      ││     4      ││    2     ││   5   ││
│ │COMPROBANTES││ PEDIDOS    ││DEVOLUCIONES││SOLICITUDES ││ POR      ││PRODUC.││
│ │POR VALIDAR ││POR ENVIAR  ││POR RESOLVER││SIN CONTACT.││VENCER    ││AGOTAD.││
│ │ Revisar →  ││ Ver →      ││ Resolver → ││ Contactar →││ Ver →    ││ Ver → ││
│ └────────────┘└────────────┘└────────────┘└────────────┘└──────────┘└───────┘│
│   cian lleno    cian          ámbar         ámbar         rojo        ámbar  │
│                                                                              │
│  CÓMO VA EL NEGOCIO · últimos 30 días                                        │
│ ┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────────────────┐ │
│ │ $486,230.00  ││     47       ││ $10,345.32   ││        68%               │ │
│ │ VENTAS       ││ PEDIDOS      ││ TICKET PROM. ││ SE PAGAN                 │ │
│ │ ▲ 12% ∿∿∿    ││ ▲ 9%  ∿∿∿    ││ ▲ 3%  ∿∿∿    ││ ▼ 4%  de los pedidos     │ │
│ └──────────────┘└──────────────┘└──────────────┘└──────────────────────────┘ │
│ ┌── Ventas por día ────────────────────────┐┌── ¿Dónde están mis pedidos? ──┐│
│ │ ¿Cómo va este mes contra el anterior?    ││ Pedidos abiertos ahora mismo  ││
│ │  ▬ Este periodo  ┄ Periodo anterior      ││                               ││
│ │ $40k┤                            ╭─╮     ││ Pendiente de pago  ▬▬▬▬▬▬ 12 ││
│ │     │        ╭──╮      ╭───╮    ╱   ╲    ││ Comprobante recib. ▬▬▬▬    7 ││
│ │ $20k┤   ╭───╯   ╰─────╯    ╰───╯     ╲   ││ Listo para envío   ▬▬      3 ││
│ │     │╭─╯┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╲  ││ Enviado            ▬▬▬▬    9 ││
│ │   $0┼─────────────────────────────────── ││                               ││
│ │      1 sep      10 sep      20 sep       ││ [ Ver los datos ]             ││
│ │ [ Ver los datos ]                        ││                               ││
│ └──────────────────────────────────────────┘└───────────────────────────────┘│
│                                                                              │
│  PARA DECIDIR                                                                │
│ ┌── Más vendidos ──────────────┐┌── Se te va a acabar ────────────────────┐ │
│ │ ¿Qué debo reabastecer?       ││ Productos con 3 piezas o menos          │ │
│ │ Cámara IP bala   ▬▬▬▬▬▬▬ 84  ││ SGQ-VV-0045 Kit 4 cám.  ▮▮__  3  ámbar │ │
│ │ Batería 12 V     ▬▬▬▬▬   52  ││ SGQ-CA-0033 Torniquete  ▮___  2  ámbar │ │
│ │ Panel solar      ▬▬▬▬    41  ││ SGQ-AI-0014 Gen. niebla ▮___  1  ámbar │ │
│ │ Cable UTP Cat 6  ▬▬▬     33  ││ SGQ-VV-0090 Body cam    ____  0  rojo  │ │
│ │ No-break 1500    ▬▬      28  ││ … 4 más                                 │ │
│ │ [ Ver los 10 · Ver los datos]││ [ Ver todos en Catálogo ]               │ │
│ └──────────────────────────────┘└─────────────────────────────────────────┘ │
│ ┌── ¿De qué vive el negocio? ─────────────────────────────────────────────┐ │
│ │ Importe validado por grupo · últimos 30 días                            │ │
│ │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬|▬▬▬▬▬▬▬▬▬|▬▬▬▬▬▬|▬▬▬▬|▬▬|▬                            │ │
│ │ ● Videovigilancia 42%  ● Control de Acceso 21%  ● Energía 15%           │ │
│ │ ● Cableado 12%  ● Automatización 7%  ● GPS 3%        [ Ver los datos ]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌── Pedidos por vencer ───────────┐┌── Saldo a favor comprometido ────────┐ │
│ │ Se cancelan solos a los 3 días  ││                                      │ │
│ │   ▮     ▮     ▮     ▮           ││   $18,430.00      ← Mono 40px héroe  │ │
│ │  Hoy   1 día  2 días  3+        ││   de 23 clientes                     │ │
│ │   5     4      2 ⚠    1 ✕       ││   Tasa de devoluciones: 4.2%         │ │
│ │ [ Ver los datos ]               ││   ▬▬▬░░░░░░░░░░░░░░ (medidor)        │ │
│ └─────────────────────────────────┘└──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 11.2.2 Banda 1 — Tarjetas de atención (`TarjetaAtencion`)

No son gráficas: son **cifras sueltas con una acción**. La forma correcta para "un solo
valor actual" es una tarjeta, no una gráfica de una barra.

| # | Tarjeta | Dato exacto | Enlaza a | Color cuando hay pendientes |
|---|---|---|---|---|
| 1 | **Comprobantes por validar** | Pedidos en `comprobante_recibido` | `/admin/pedidos?estado=comprobante_recibido` | **Cian lleno** — es lo más urgente |
| 2 | **Pedidos por enviar** | Pedidos en `listo_envio` | `/admin/pedidos?estado=listo_envio` | Cian contorno |
| 3 | **Devoluciones por resolver** | `returns` en `solicitada` o `en_revision` | `/admin/devoluciones?estado=pendientes` | Ámbar |
| 4 | **Solicitudes sin contactar** | `service_requests` en `nueva` | `/admin/solicitudes?estado=nueva` | Ámbar |
| 5 | **Pedidos por vencer** | `pendiente_pago` con ≥ 2 días de antigüedad (se cancelan al día 3, D2.7) | `/admin/pedidos?estado=pendiente_pago&antiguedad=2` | **Rojo** |
| 6 | **Productos agotados** | Productos activos con **stock disponible** = 0 | `/admin/catalogo?stock=0` | Ámbar |

**Reglas de comportamiento:**

- **Las seis tarjetas están siempre presentes**, aunque estén en cero. El layout no salta de
  un día a otro y el dueño aprende la forma de su pantalla.
- Tarjeta **en cero** → estilo "al día": fondo `--bg-card`, cifra en `#7E93A6`, palomita
  verde pequeña y la leyenda "Al día" en vez del enlace. Sin color de alarma.
- Tarjeta **con pendientes** → borde de 1 px y cifra del color de su fila, con el corte
  diagonal de 10 px. La tarjeta 1, además, con fondo lleno cian y texto `#07111C`.
- **Toda la tarjeta es clickeable** (área grande, Fitts), con el enlace visible como refuerzo.
- Solo la tarjeta 1 puede usar `sgPulse`, y solo si su cifra es > 0. **Una sola cosa pulsa
  en toda la pantalla.**
- Cifra en IBM Plex Mono 500 a 28 px; etiqueta en Chakra Petch 500 a 13 px, mayúsculas.

#### 11.2.3 Banda 2 — KPI (`TarjetaKPI`)

Cuatro tarjetas con valor, variación contra el periodo inmediato anterior y minigráfica de
línea de 7 puntos (sin ejes, 2 px, color cian 600 al 60 % de opacidad).

| KPI | Dato exacto | Regla de la variación |
|---|---|---|
| **Ventas** | Suma de `orders.total + credit_applied` de pedidos con pago validado (`listo_envio` en adelante) dentro del rango | Sube = verde |
| **Pedidos** | Conteo de esos mismos pedidos | Sube = verde |
| **Ticket promedio** | Ventas ÷ Pedidos | Sube = verde |
| **Se pagan** (conversión) | Pedidos validados ÷ pedidos generados en el rango | Sube = verde |

- **Se cuentan solo pedidos con pago validado** (criterio G1.2), y eso se dice en un banner
  permanente bajo el título de la banda — no en un tooltip. Es la fuente número uno de
  confusión en cualquier analítica de ventas.
- **La variación se oculta** si el periodo anterior no tiene datos suficientes (menos de 5
  pedidos). Un "+1200 %" contra una semana vacía es ruido, no información.
- El `Delta` lleva **flecha + signo + porcentaje**, nunca color solo.

#### 11.2.4 Banda 2 y 3 — las gráficas, una por una

Cada gráfica se monta en `MarcoGrafica`, que imprime el título y, debajo, **la pregunta de
negocio que responde**. Si una gráfica no tiene pregunta, no va en el tablero.

---

**A · Ventas por día** — `GraficaLineaTemporal`

| | |
|---|---|
| **Pregunta** | "¿Cómo va este mes contra el anterior?" |
| **Forma** | **Línea** (con relleno de área degradado en la serie principal) |
| **Por qué esta forma** | El trabajo del dato es *tendencia en el tiempo*. Una línea muestra la forma del mes —el pico del quincenal, la caída del domingo— que una barra por día oculta bajo el ruido |
| **Eje X** | Día natural, del inicio al fin del rango. Máximo 8 marcas de eje; el resto sin etiqueta |
| **Eje Y** | Importe validado del día, en MXN. **Empieza en cero, siempre** (una línea que no arranca en cero exagera la variación) |
| **Rango** | El selector del tablero; por defecto **30 días** |
| **Series** | 2 — "Este periodo" (cian 600 `#3CE7FF`, línea sólida 2 px) y "Periodo anterior" (`#7E93A6`, línea punteada 2 px, sin relleno). Misma medida, mismo eje |
| **Color** | Serie única de marca + gris de contexto. **No es categórico**: la segunda serie es contexto, no identidad |
| **Leyenda** | Sí (2 series), arriba a la derecha |
| **Etiquetas directas** | Solo el **último valor** y el **máximo** del periodo. Nunca un número por punto |
| **Interacción** | Cruceta vertical + tooltip con fecha, importe de ambas series y número de pedidos |

> **Un solo eje.** Si algún día se quiere ver "ventas" y "número de pedidos" juntos, son
> **dos gráficas**, no dos ejes Y. Un eje doble es el error más común de los tableros y
> permite contar cualquier historia moviendo las escalas.

---

**B · ¿Dónde están mis pedidos?** — `GraficaBarrasHorizontales` (ordinal)

| | |
|---|---|
| **Pregunta** | "¿En qué etapa están atorados mis pedidos ahora mismo?" |
| **Forma** | **Barras horizontales, en el orden del flujo** |
| **Por qué esta forma** | Es el embudo de la operación. Horizontal porque las etiquetas son frases ("Comprobante recibido"), y en orden de flujo porque el orden **es** la información |
| **Eje X** | Número de pedidos |
| **Eje Y** | Etapa: Pendiente de pago → Comprobante recibido → Listo para envío → Enviado |
| **Rango** | **Ninguno: es una foto del ahora**, no del periodo. Se dice explícitamente en el subtítulo ("Pedidos abiertos ahora mismo") |
| **Alcance** | Solo pedidos abiertos. `entregado` y `cancelado` se excluyen: dominarían la escala y no son accionables |
| **Color** | **Rampa ordinal cian**, del paso 300 `#176F7B` al 600 `#3CE7FF` según avanza la etapa. El color codifica la etapa, no la cantidad |
| **Leyenda** | No (una sola familia; las etiquetas del eje nombran todo) |
| **Etiquetas directas** | Sí, el conteo al final de cada barra, en `#EAF2F8` |
| **Interacción** | Clic en una barra → bandeja de pedidos ya filtrada por ese estado |

---

**C · Pedidos por vencer** — `GraficaColumnasEstado`

| | |
|---|---|
| **Pregunta** | "¿Cuántos pedidos se me van a cancelar solos en los próximos días?" |
| **Forma** | **Columnas**, 4 cubetas |
| **Por qué esta forma** | Pocas categorías ordenadas y de nombre corto; en vertical se comparan alturas de inmediato. El dato es una cuenta regresiva, y leerla de izquierda a derecha refuerza el paso del tiempo |
| **Eje X** | Antigüedad: "Hoy" · "1 día" · "2 días" · "3+ días" |
| **Eje Y** | Número de pedidos en `pendiente_pago` |
| **Rango** | Foto del ahora |
| **Color** | **Escala de estado** (§2.8.4), que es el caso autorizado porque el dato *significa* riesgo: Hoy `#7E93A6` · 1 día `#45E39A`… → en realidad: Hoy y 1 día `#7E93A6` (sin riesgo), 2 días `#FFB547` (se cancela mañana), 3+ `#FF4D5E` (vencido) |
| **Refuerzo obligatorio** | Ícono sobre las columnas de 2 días (⚠) y 3+ (✕) y etiqueta de texto. **Nunca color solo** |
| **Etiquetas directas** | Conteo sobre cada columna |
| **Interacción** | Clic en una columna → pedidos de esa antigüedad. La columna "2 días" enlaza además a "Enviar recordatorio" |

---

**D · Más vendidos** — `GraficaBarrasHorizontales` (nominal)

| | |
|---|---|
| **Pregunta** | "¿Qué debo reabastecer?" |
| **Forma** | **Barras horizontales, top 5** |
| **Por qué esta forma** | Nombres de producto largos; en horizontal se leen sin rotar el texto. Cinco es lo que cabe sin que el tablero se vuelva un reporte |
| **Eje X** | Unidades vendidas en el rango (pedidos validados) |
| **Eje Y** | Nombre del producto + SKU en Mono 11 px debajo |
| **Rango** | El selector del tablero |
| **Color** | **Todas las barras del mismo color** (cian 600). Son categorías nominales: colorearlas distinto gastaría el canal de identidad en repetir lo que la longitud ya dice |
| **Leyenda** | No (serie única) |
| **Etiquetas directas** | Unidades al final de cada barra; el importe en el tooltip |
| **Interacción** | Clic → ficha del producto. Enlace "Ver los 10" → Analítica (§11.12) |

> Los **menos vendidos** no van en el tablero: no son una decisión diaria. Viven en
> Analítica, junto a los más vendidos.

---

**E · ¿De qué vive el negocio?** — `GraficaBarraApiladaUnica`

| | |
|---|---|
| **Pregunta** | "¿Qué línea de producto sostiene las ventas?" |
| **Forma** | **Una sola barra horizontal apilada**, 6 segmentos |
| **Por qué esta forma** | Es parte-de-todo con seis categorías de nombres largos. **Una dona obligaría a comparar ángulos y leer una leyenda**; la barra apilada se lee de corrido, ocupa una franja y deja ver de inmediato quién domina |
| **Eje X** | Porcentaje del importe validado (0–100 %) |
| **Segmentos** | Los 6 grupos del catálogo, ordenados de mayor a menor |
| **Rango** | El selector del tablero |
| **Color** | **Paleta categórica de §2.8.2, ranuras 1 a 6 en orden.** El color sigue al grupo: si se filtra, los grupos que quedan conservan su color |
| **Leyenda** | **Sí, obligatoria** (6 series), bajo la barra, con `MuestraColor` + nombre + porcentaje |
| **Etiquetas directas** | **Obligatorias** (≥ 4 series): el porcentaje dentro del segmento cuando quepa; si no, solo en la leyenda |
| **Separación** | **2 px del color de la superficie entre segmentos** — sin ese respiro, dos colores contiguos se leen como uno |
| **Interacción** | Hover resalta el segmento y atenúa el resto; clic → Analítica filtrada por ese grupo |

---

**F · Saldo a favor comprometido** — cifra héroe + `Medidor`

| | |
|---|---|
| **Pregunta** | "¿Cuánto dinero tengo comprometido con mis clientes y qué tanto se me devuelve?" |
| **Forma** | **Cifra héroe** (40 px) + medidor, **no una gráfica** |
| **Por qué esta forma** | Es un solo número con su contexto. Una gráfica de una barra sería una gráfica de adorno |
| **Dato 1** | Suma de `credit_movements` con saldo positivo vivo, y el número de clientes que lo tienen |
| **Dato 2** | **Tasa de devoluciones**: pedidos entregados con devolución aprobada ÷ pedidos entregados, en el rango |
| **Medidor** | Pista `#22344A`; relleno verde `#45E39A` bajo 5 %, ámbar `#FFB547` de 5 a 10 %, rojo `#FF4D5E` arriba de 10 %, con ícono + etiqueta |
| **Por qué importa** | El saldo a favor es **pasivo**: dinero que el negocio ya debe en mercancía. Es el número que nadie mira hasta que sorprende |

#### 11.2.5 Banda 3 — "Se te va a acabar" (`ListaStockCritico`)

**No es una gráfica: es una lista.** Con más de siete elementos que además necesitan SKU,
una tabla comunica mejor que cualquier forma gráfica.

- Ocho productos activos con **stock disponible ≤ 3**, ordenados por unidades vendidas en el
  rango (primero lo que se vende y se está acabando).
- Cada renglón: SKU (Mono) · nombre · `IndicadorStock` (las barras escalonadas heredadas del
  demo, l. 2030–2041) · cifra · badge.
- Color por nivel, con texto: 1–3 → ámbar "Últimas N piezas"; 0 → rojo "Agotado".
- Enlace "Ver todos en Catálogo" → `/admin/catalogo?stock=bajo`.

#### 11.2.6 Selector de periodo

Una sola fila arriba de todo, que gobierna **todas** las tarjetas y gráficas marcadas con
"rango": `(7 días) (30 días) (Este mes) (Personalizado)`. La selección se refleja en la URL
para poder compartirla y para que al volver de una vista filtrada el tablero conserve el
periodo.

**Lo que NO depende del selector**: la banda 1 (siempre es el ahora), el embudo de pedidos y
la lista de stock crítico. Cada uno lo dice en su subtítulo, para que nadie crea que está
viendo el último mes.

#### 11.2.7 Interacción de las gráficas

- **Línea/área** → cruceta vertical + tooltip único con todas las series del punto.
- **Barras/columnas/segmentos** → tooltip por marca al pasar encima; la marca se resalta y
  el resto baja a 55 % de opacidad.
- **Área sensible mayor que la marca**: una barra de 8 px tiene una zona de hover de al
  menos 24 px (Fitts).
- **Tooltip** (`TooltipGrafica`): fondo `#122234`, borde `#2C4560`, sombra
  `--shadow-dropdown`, nombre en Sans 13 px, cifras en Mono 14 px `tabular-nums`, y el
  `MuestraColor` de la serie a la izquierda. Aparece en 100 ms, desaparece en 200 ms.
- **Toda marca clickeable navega a la vista detallada correspondiente.** Un tablero cuyos
  números no llevan a ningún lado obliga a buscar a mano lo que acaba de ver.
- En táctil, el tooltip se activa con un toque y se cierra tocando fuera; **no se depende del
  hover** para leer ningún valor (por eso todas las gráficas tienen etiquetas directas o
  `VerLosDatos`).

#### 11.2.8 Responsividad del tablero

Es la pantalla que más se rompe en pantallas chicas, así que tiene reglas propias.

| Bloque | Móvil (< 760) | Tablet (760–1179) | Escritorio (≥ 1180) |
|---|---|---|---|
| Selector de periodo | Carrusel horizontal de chips, fijo al hacer scroll | Fila completa | Fila completa, a la derecha del título |
| **Banda 1 (atención)** | **2 columnas × 3 filas**, tarjetas compactas (cifra 24 px). **Las tarjetas en cero se pliegan al final** y, si todas lo están, se colapsan en una sola línea "Todo al día ✓" | 3 columnas × 2 filas | 6 columnas × 1 fila |
| **KPI** | 2 columnas × 2 filas, sin minigráfica (no se lee a ese tamaño) | 4 columnas, con minigráfica | 4 columnas, con minigráfica |
| **A · Ventas por día** | Alto 180 px; **máximo 5 marcas de eje X**; se oculta la serie "periodo anterior" (dos líneas en 320 px son una maraña) y queda disponible en `VerLosDatos` | Alto 220 px, ambas series | Alto 260 px, ambas series |
| **B · Embudo** | Sin cambios: las barras horizontales funcionan igual de bien en estrecho | Igual | Igual |
| **C · Por vencer** | Las 4 columnas caben; etiquetas de eje a 10 px | Igual | Igual |
| **D · Más vendidos** | Top **3** en vez de 5; el nombre se recorta a 2 líneas | Top 5 | Top 5 |
| **E · Ventas por grupo** | **Se convierte en lista**: una fila por grupo con `MuestraColor`, nombre, porcentaje y una barra individual. Una barra apilada de 6 segmentos bajo 360 px es ilegible | Barra apilada + leyenda en 2 columnas | Barra apilada + leyenda en 1 fila |
| **F · Saldo y devoluciones** | Ancho completo, cifra héroe a 32 px | Media | Media |
| **Stock crítico** | Lista de tarjetas; 5 renglones + "ver todos" | Tabla, 8 renglones | Tabla, 8 renglones |

**Reglas duras:** ninguna gráfica baja de **160 px de alto**; ninguna etiqueta de eje se
rota; si una etiqueta no cabe, **se reduce el número de marcas de eje**, nunca el tamaño de
la letra por debajo de 10 px; y **ninguna gráfica genera scroll horizontal** — si no cabe,
cambia de forma (como E).

#### 11.2.9 Accesibilidad del tablero

- Cada bloque es una `<section>` con su `<h2>`/`<h3>` real; las tres bandas son encabezados
  de nivel 2 y cada gráfica de nivel 3.
- **Cada gráfica tiene su tabla equivalente** en un `<details>` "Ver los datos", con
  encabezados de fila y columna. Es requisito, no cortesía.
- El SVG de cada gráfica lleva `role="img"` y un `aria-label` que **resume el dato, no la
  forma**: "Ventas por día del 1 al 20 de septiembre; máximo $38,400 el 15 de septiembre;
  total $486,230".
- Las series se distinguen **además del color**: línea sólida vs. punteada en A; etiqueta
  directa en B, C, D; leyenda + porcentaje en E.
- Las tarjetas de atención son enlaces (`<a>`) con texto completo accesible: "7 comprobantes
  por validar, ir a pedidos", no solo el número.
- El orden de tabulación recorre banda 1 → banda 2 → banda 3, en el orden visual.
- Con `prefers-reduced-motion`, las gráficas aparecen dibujadas, sin animación de trazo.

#### 11.2.10 Estados del tablero

Este es el punto más importante del diseño del tablero: **el negocio arranca de cero**. Los
primeros días no habrá historial, y un tablero lleno de ceros y gráficas vacías se siente
roto. No es un caso hipotético.

**Estado global — Día 0 (sin catálogo y sin pedidos):**
el tablero **se reemplaza por una pantalla de puesta en marcha**, no por gráficas vacías.

```
┌─ Bienvenida ─────────────────────────────────────────────────────────────────┐
│  Vamos a poner tu tienda en marcha                     Chakra Petch 600 28px │
│  Tu tablero se va a llenar solo conforme empieces a operar.                  │
│                                                                              │
│  ① Carga tu catálogo                                           ○ pendiente   │
│     Tienes ~1,050 productos por subir. Lo más rápido es                      │
│     cargarlos todos juntos desde un archivo.     [ Importar catálogo ▟ ]     │
│                                                                              │
│  ② Configura tus datos bancarios                               ○ pendiente   │
│     Sin ellos, tus clientes no pueden pagarte.   [ Ir a Configuración ]      │
│                                                                              │
│  ③ Recibe tu primer pedido                                     ○ pendiente   │
│     Cuando llegue, aparecerá aquí para que lo revises.                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

Cada paso completado se marca con palomita verde. **Cuando los tres están listos, la
pantalla de bienvenida desaparece sola** y queda el tablero normal. La bienvenida se puede
volver a abrir desde un enlace discreto en Configuración.

**Estado global — arranque parcial (hay catálogo, menos de 5 pedidos validados):**
el tablero normal se muestra, con un banner informativo permanente arriba:
**"Llevas 2 pedidos validados. Las gráficas de tendencia empiezan a ser útiles a partir de
unas dos semanas de operación."** Y con estas reglas:

- Las **variaciones de los KPI se ocultan** (no hay periodo anterior con qué comparar).
- Las gráficas **A** y **E** muestran su estado de "pocos datos" (abajo).
- La banda 1 y el embudo funcionan normal desde el primer pedido: no necesitan historial.

**Por bloque:**

| Bloque | Cargando | Vacío | Error |
|---|---|---|---|
| **Tarjetas de atención** | Seis esqueletos del mismo tamaño; el layout no salta | Estilo "al día": cifra en `#7E93A6` + palomita verde + "Al día". Si las seis están en cero: una franja verde discreta **"Todo al día. No tienes nada pendiente hoy."** con ícono | Tarjeta con borde rojo, guion en vez de cifra y texto "No disponible" + enlace "Reintentar". **Las demás tarjetas siguen funcionando** |
| **KPI** | Esqueleto de valor + etiqueta | `$0.00` / `0` con la leyenda "Sin ventas en este periodo" — **no se oculta la tarjeta**, el cero es información | Guion + "No disponible" |
| **A · Ventas por día** | Esqueleto del área de trazado con ejes ya dibujados | **Sin ventas en el periodo:** ejes dibujados, línea base en cero y mensaje centrado **"No hubo ventas validadas entre el 1 y el 20 de septiembre"** + botón "Ver los últimos 90 días". **Sin ventas nunca:** **"Aquí verás tus ventas día por día en cuanto valides tu primer pago."** |  Área en blanco con banner rojo **"No pudimos cargar esta gráfica."** + "Reintentar". El resto del tablero sigue en pie |
| **A · pocos datos** | — | Con menos de 7 días con ventas, se dibujan los puntos existentes **sin la línea de periodo anterior** y con la nota "Todavía hay pocos días con ventas para ver una tendencia" | — |
| **B · Embudo** | Cuatro barras de esqueleto | **"No tienes pedidos abiertos en este momento."** + "Todos tus pedidos están entregados o cancelados." (con palomita verde — es una buena noticia, no un hueco) | Banner rojo local |
| **C · Por vencer** | Esqueleto de 4 columnas | **"Ningún pedido está por vencerse."** con palomita verde | Banner rojo local |
| **D · Más vendidos** | Cinco barras de esqueleto | **"Todavía no hay ventas que ordenar."** + "Cuando valides tus primeros pagos, aquí verás qué se vende más." | Banner rojo local |
| **E · Por grupo** | Barra de esqueleto + leyenda gris | **"Sin ventas validadas en este periodo."** Si solo hay un grupo con ventas, se muestra igual, con la nota "Por ahora todas tus ventas son de un solo grupo." | Banner rojo local |
| **F · Saldo** | Esqueleto de cifra | **`$0.00`** + "Ningún cliente tiene saldo a favor." — es el estado normal y deseable al arrancar, así que se muestra en tono neutro, nunca como alerta | Guion + "No disponible" |
| **Stock crítico** | Cinco renglones de esqueleto | **"Ningún producto está por agotarse."** con palomita verde. Si el catálogo está vacío: "Todavía no has cargado productos." + botón "Importar catálogo" | Banner rojo local |

**Regla transversal de error:** un bloque que falla **no tumba el tablero**. Cada bloque
carga y falla por su cuenta; el resto sigue siendo útil. Si fallan todos, se muestra un
único banner: **"No pudimos cargar tu tablero. Puede ser un problema temporal de
conexión."** + "Reintentar", y la barra lateral sigue navegable.

**Actualización:** el tablero trae un botón discreto de "Actualizar" con la hora del último
corte ("Actualizado 11:04"). **No se recarga solo cada X segundos**: un número que cambia
mientras alguien lo lee es desconcertante, y este negocio no necesita tiempo real.

---

### 11.3 Bandeja de Pedidos (C5.1)

Template `LayoutBandeja`.

```
┌─ Pedidos ───────────────────────────────────────────────── [ Exportar CSV ] ─┐
│  ┌─ Búsqueda ────────────────────────┐   Ordenar por: [ Más recientes  ▾ ]  │
│  │ 🔍 Folio, cliente o correo        │                                       │
│  └───────────────────────────────────┘                                       │
│  (Todos 84) (Pendiente de pago 12) (●Comprobante recibido 7) (Listo 3)       │
│  (Enviado 9) (Entregado 51) (Cancelado 2)          ← chips; activo en cian   │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ FOLIO       FECHA      CLIENTE          PRODS  TOTAL      SALDO  ESTADO  │ │  ← mono 11px
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ SGQ-7K4M2X  16 sep 26  Mariana López     2    $5,879.00     —   [Compr.] │ │  ← 48px
│ │             10:42      mariana@correo.com                        lleno   │ │
│ │ SGQ-9P2R7T  16 sep 26  Jorge Cruz         1    $3,299.00  −$450  [Compr.]│ │
│ │ SGQ-3H8N5Q  15 sep 26  Ana Salinas        3        $0.00  −$2,1k [Compr.]│ │  ← RN-11
│ └──────────────────────────────────────────────────────────────────────────┘ │
│  Mostrando 1–25 de 84            ‹ 1 2 3 4 ›        Filas: [ 25 ▾ ]          │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Filtros como chips con contador**, no `<select>`: el contador convierte el filtro en
  información y ahorra un clic. El chip "Comprobante recibido" lleva punto ámbar con
  `sgPulse` cuando su contador es > 0.
- **La columna SALDO** hace reconocible el caso RN-11 desde la lista: total `$0.00` con
  saldo aplicado no es un error, es un pedido pagado con saldo. Se refuerza con un ícono.
- **Toda la fila es clickeable** y además aparece un botón "Revisar" en hover.
- Al llegar desde el tablero con un filtro aplicado, banner cian: **"Te mostramos solo los
  pedidos que esperan tu revisión."** + "Ver todos los pedidos". Un filtro invisible es el
  error clásico que hace pensar que faltan datos.

| Estado | Diseño |
|---|---|
| **Cargando (primera vez)** | 8 filas de esqueleto de 48 px; chips con forma pero sin contador |
| **Cargando (cambio de filtro)** | Tabla al 60 % de opacidad + spinner junto al conteo. **La tabla anterior no desaparece** |
| **Vacío — sin pedidos** | **"Todavía no hay pedidos"** + "Cuando un cliente genere su primer pedido, aparecerá aquí." Sin botón: no hay nada que hacer |
| **Vacío — filtro** | **"Ningún pedido con el estado «Comprobante recibido»"** + "Ya revisaste todo lo pendiente." + "Ver todos los pedidos" |
| **Vacío — búsqueda** | **"No encontramos «SGQ-000»"** + "Revisa el folio o busca por el correo del cliente." + "Limpiar búsqueda" |
| **Error** | Banner rojo en lugar de la tabla + "Reintentar". Los filtros siguen usables |

---

### 11.4 (reservado — ver 11.5)

---

### 11.5 Detalle de pedido — la pantalla crítica (C5.2)

Todo el layout está subordinado a una pregunta: **¿el monto del comprobante coincide con el
que esperamos?** (riesgo de fraude, `requerimientos.md` §9).

```
┌─ ‹ Pedidos  ·  SGQ-7K4M2X ───────────────────── [Comprobante recibido] ──────┐
│ ┌────────────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ COMPROBANTE DE PAGO                │ │  IMPORTE ESPERADO                 │ │
│ │ ┌────────────────────────────────┐ │ │  $5,879.00          ← Mono 30px   │ │
│ │ │   [ imagen del comprobante ]   │ │ │  ────────────────────────────     │ │
│ │ │        altura 520 px           │ │ │  DECLARADO POR EL CLIENTE         │ │
│ │ └────────────────────────────────┘ │ │  $5,879.00          ← Mono 30px   │ │
│ │  [−] [100%] [+]  [↻]  [⤢]  [↓]    │ │  ✓ Los montos coinciden           │ │ verde
│ │  Subido 16 sep 2026 · 10:42        │ │  Fecha transferencia  16 sep 2026 │ │
│ └────────────────────────────────────┘ │  Banco de origen      Banco Demo  │ │
│ ┌────────────────────────────────────┐ │  Clave SPEI  2026091640044200000  │ │
│ │ PRODUCTOS DEL PEDIDO               │ │  ────────────────────────────     │ │
│ │ ▣ Cámara IP bala 4 MP              │ │  CLIENTE                          │ │
│ │   SGQ-VV-0012 · 1 × $1,289.00      │ │  Mariana López Ríos               │ │
│ │   Disponible: 23 pzas              │ │  mariana@correo.com · 442 000 0000│ │
│ │ ▣ NVR 8 canales 4K                 │ │  ⚠ Correo sin verificar           │ │
│ │   SGQ-VV-0031 · 1 × $4,590.00      │ │  ENVÍO                            │ │
│ │ ──────────────────────────────     │ │  Av. Ejemplo 123, Col. Centro     │ │
│ │ Subtotal            $5,879.00      │ │  C.P. 76000, Querétaro, Qro.      │ │
│ │ Saldo aplicado         −$0.00      │ │  Recibe: Mariana López Ríos       │ │
│ │ TOTAL A TRANSFERIR  $5,879.00      │ │  FACTURA  Sí · RFC XAXX010101000  │ │
│ └────────────────────────────────────┘ │  ┌─────────────────────────────┐  │ │
│ ┌────────────────────────────────────┐ │  │  Validar pago             ▟ │  │ │ primario
│ │ HISTORIAL                          │ │  └─────────────────────────────┘  │ │ 52px glow
│ │ ● Pedido generado   16 sep · 09:58 │ │  [ Rechazar comprobante ]         │ │ peligro
│ │ ● Comprobante       16 sep · 10:42 │ │  [ Cancelar pedido ]              │ │ fantasma
│ │ ○ Listo para envío                 │ │                                   │ │
│ └────────────────────────────────────┘ └───────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Por qué así:**

1. **Comprobante y los dos importes a la misma altura, en el primer viewport.** Sin scroll
   para comparar. Es el requisito literal de C5.2.
2. **Los dos importes se apilan verticalmente**, en Mono 30 px con `tabular-nums`: apilados,
   los dígitos quedan uno encima de otro y `$5,879.00` vs `$5,879.90` salta de inmediato.
   Lado a lado, no.
3. **El veredicto automático es una ayuda, nunca una decisión.** Comparando `orders.total`
   con `payment_proofs.amount`: coinciden → `✓ Los montos coinciden` verde; no coinciden →
   `⚠ Diferencia de $120.00 — el cliente declaró menos de lo esperado` ámbar. El botón
   **sigue habilitado** en ambos casos; lo que cambia es el modal.
4. **La disponibilidad real junto a cada producto** (`modelo-datos.md` §1): si está por
   validar el último ejemplar ya apartado para otro pedido, lo ve antes de aceptar.
5. **Jerarquía de acciones (Hick):** una primaria grande con glow, una de peligro con
   contorno, una terciaria en texto plano.

**Confirmaciones** (requisito de `arquitectura.md` §15):

| Acción | Modal |
|---|---|
| Validar (montos coinciden) | **"¿Validar el pago del pedido SGQ-7K4M2X?"** · "Se apartan las piezas y el pedido pasa a *Listo para envío*. El cliente recibe un correo." · `[Cancelar] [Sí, validar el pago]` |
| Validar (no coinciden) | Banner ámbar dentro: **"El comprobante declara $5,759.00 y el pedido es de $5,879.00 — faltan $120.00."** · **nota obligatoria** · `[Cancelar] [Validar de todos modos]` |
| Rechazar comprobante | **"¿Rechazar el comprobante de SGQ-7K4M2X?"** · "El pedido vuelve a *Pendiente de pago*, se libera el apartado y el cliente ve el motivo." · **motivo obligatorio** · `[Cancelar] [Rechazar comprobante]` (rojo lleno) |
| Cancelar pedido | **"¿Cancelar el pedido SGQ-7K4M2X por $5,879.00?"** · "No se puede deshacer. Se libera el inventario y, si usó saldo a favor, se le devuelve completo." · **motivo obligatorio** · `[No cancelar] [Sí, cancelar el pedido]` |

| Estado | Diseño |
|---|---|
| **Cargando** | Esqueleto con la forma final; la estructura no salta |
| **Comprobante cargando** | Spinner dentro del marco. **El panel de importes ya es legible: el dato numérico no espera a la imagen** |
| **Comprobante no carga** (R2 / URL vencida) | **"No pudimos mostrar el comprobante."** + "El enlace seguro pudo haber vencido." + "Reintentar" / "Descargar archivo". **Validar pago se deshabilita**: "Necesitas ver el comprobante antes de validar el pago." |
| **PDF** | Visor embebido + "Abrir en pestaña nueva" |
| **Sin comprobante y sin saldo** (`pendiente_pago`) | `EstadoVacio`: **"Este pedido todavía no tiene comprobante"** + "Se generó hace 2 días. Se cancelará solo el 19 de septiembre si el cliente no paga." + "Enviar recordatorio por correo" |
| **Cancelado / entregado** | Las acciones se **ocultan** (no se deshabilitan) + banner neutro con quién y cuándo |
| **Error al validar** | Modal abierto con banner rojo: **"No pudimos validar el pago. Ya no queda inventario suficiente: la Cámara IP bala 4 MP se apartó para otro pedido."** + "Cerrar" / "Ver el producto" |

#### 11.5.1 Variante RN-11 — pedido cubierto 100 % con saldo

Sin comprobante que mostrar. `VisorComprobante` se sustituye por
`DesgloseSaldoAplicado` **en el mismo lugar y con el mismo peso visual**: el administrador
debe sentir que hace la misma revisión de siempre, porque lo es.

```
┌────────────────────────────────────┐ ┌───────────────────────────────────┐
│ PAGADO CON SALDO A FAVOR           │ │  IMPORTE DEL PEDIDO               │
│ Este pedido no tiene comprobante   │ │  $2,150.00          ← Mono 30px   │
│ porque el saldo a favor del        │ │  ────────────────────────────     │
│ cliente cubrió el 100% del         │ │  SALDO APLICADO                   │
│ importe. Aun así requiere tu       │ │  −$2,150.00         ← Mono 30px   │
│ confirmación.                      │ │  ✓ El saldo cubre el total        │
│ MOVIMIENTOS DE SALDO DEL CLIENTE   │ │  A TRANSFERIR: $0.00              │
│ ┌────────────────────────────────┐ │ │  SALDO DEL CLIENTE                │
│ │ 22 ago  Devolución SGQ-00219   │ │ │  Antes del pedido    $2,600.00    │
│ │         producto sellado       │ │ │  Aplicado aquí      −$2,150.00    │
│ │                      +$2,600.00│ │ │  Disponible ahora      $450.00    │
│ │ 16 sep  Aplicado a SGQ-3H8N5Q  │ │ │  ┌─────────────────────────────┐  │
│ │                      −$2,150.00│ │ │  │  Confirmar pedido         ▟ │  │
│ └────────────────────────────────┘ │ │  └─────────────────────────────┘  │
│ Ver historial completo de saldo →  │ │  [ Rechazar / Cancelar pedido ]   │
└────────────────────────────────────┘ └───────────────────────────────────┘
```

- **El movimiento de origen del saldo es visible y clickeable** — lleva a la devolución que
  lo generó. Es lo que permite juzgar si el saldo es legítimo: el juicio humano que RN-11
  pide preservar.
- El botón dice **"Confirmar pedido"**, no "Validar pago": no hubo pago que validar.
- **Error propio:** si la suma de `credit_movements` no cuadra con `credit_applied`, banner
  rojo **"El saldo aplicado no coincide con el historial de movimientos de este cliente.
  Revisa antes de confirmar."**, botón primario deshabilitado y enlace al libro de saldo.

---

### 11.6 Catálogo — lista de productos (F1)

**Pantalla inicial del rol `inventario`** (H6.2).

```
┌─ Catálogo ────────────────── [ Importar CSV ] [ Nuevo producto ▟ ] ──────────┐
│  🔍 Nombre, SKU o marca   Grupo:[Todos ▾] Subcat:[Todas ▾]                   │
│                           Estado:[Todos ▾] Condición:[Todas ▾]               │
│                           ☐ Solo stock bajo (≤ 3)                            │
│  ☐ 3 productos seleccionados  [ Cambiar precio ] [ Cambiar stock ] [ ⋯ ]     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ☐  FOTO  SKU            NOMBRE              MARCA   PRECIO  STOCK  EST.  │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │ ☐  [▣]  SGQ-VV-0012    Cámara IP bala 4 MP  Hik   $1,289.00 ▮▮▮▮24 [Act]│ │
│ │ ☐  [▣]  SGQ-VV-0012-U1 Cámara IP bala 4 MP  Hik     $899.00 ▮___ 1 [Act]│ │
│ │          [Usado] Unidad de exhibición                                    │ │  ámbar
│ │ ☐  [▣]  SGQ-VV-0090    Body cam con GPS     Hik   $3,480.00 ____ 0 [Ago]│ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│  Mostrando 1–50 de 1,047        ‹ 1 2 3 … 21 ›        Filas: [ 50 ▾ ]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Precio y stock editables en línea** (doble clic o `Enter`): son los campos que más se
  tocan; abrir un formulario completo para cambiar un número es fricción. `Enter` guarda,
  `Esc` cancela, toast confirma. Todo cambio queda en bitácora (F1.5).
- **La ficha "Usado" se lista junto a su producto original** (orden por SKU base), con badge
  ámbar y `condition_detail` en segunda línea — D6.
- **50 filas por página**: con ~1,050 SKUs, 25 obligaría a demasiada paginación.

| Estado | Diseño |
|---|---|
| **Cargando** | 10 filas de esqueleto con placeholder de miniatura |
| **Vacío — catálogo sin productos** | **"Tu catálogo está vacío"** + "Tienes ~1,050 productos por cargar. Lo más rápido es subirlos todos juntos desde un archivo." + **botón primario "Importar desde CSV"** + "Crear un producto a mano". Es el primer día real del proyecto |
| **Vacío — filtro** | "No encontramos productos con esos filtros." + "Limpiar filtros" |
| **Error** | Banner rojo + "Reintentar", filtros intactos |
| **Guardado en línea fallido** | La celda vuelve a su valor anterior con borde `#FF4D5E` + toast: "No pudimos guardar el precio de SGQ-VV-0012. Inténtalo de nuevo." |

---

### 11.7 Alta y edición de producto (F1, D6)

Formulario por pestañas para no mostrar 20 campos de golpe (Hick).

```
┌─ ‹ Catálogo · Nuevo producto ─────────────────────────────────────────────────┐
│  [ General ] [ Precio y stock ] [ Fotos ] [ Especificaciones ] [ Documentos ] │
│  ┌── General ─────────────────────────────┐ ┌── FOTO PRINCIPAL ─────────────┐ │
│  │ SKU *              Estado *            │ │  ┌─────────────────────────┐  │ │
│  │ [SGQ-VV-0012    ]  [ Activo        ▾]  │ │  │   arrastra o elige      │  │ │
│  │ ✓ SKU disponible                       │ │  └─────────────────────────┘  │ │
│  │ Nombre *                               │ │  [▣][▣][▣][ + ]               │ │
│  │ [Cámara IP bala 4 MP con detección   ] │ └───────────────────────────────┘ │
│  │ Marca *            Grupo *             │ ┌── CONDICIÓN ──────────────────┐ │
│  │ [ Hikvision   ▾]   [Videovigilancia ▾] │ │  ◉ Nuevo    ○ Usado           │ │
│  │ Subcategoría *  (árbol de 3 niveles)   │ │  (si Usado:)                  │ │
│  │ [Videovigilancia › Cámaras IP y NVRs   │ │  Motivo visible al cliente *  │ │
│  │  › Bala                             ▾] │ │  [Unidad de exhibición     ▾] │ │
│  │ Descripción                            │ │  Devolución de origen         │ │
│  │ [                                    ] │ │  [ DEV-00034 · Jorge Cruz  ▾] │ │
│  └────────────────────────────────────────┘ └───────────────────────────────┘ │
│  [ Cancelar ]                    [ Guardar como borrador ] [ Guardar ▟ ]      │ barra fija
└───────────────────────────────────────────────────────────────────────────────┘
```

- **El selector de subcategoría es un buscador en cascada sobre el árbol de D7**, no tres
  `<select>` anidados. Muestra la ruta completa y permite escribir para filtrar. Con 6
  grupos × decenas de subcategorías × 3 niveles, tres selects encadenados serían insufribles.
- **La condición está en la columna derecha, siempre visible** (D6 cambia el significado del
  producto entero). Al elegir "Usado":
  - stock se fija en **1** y queda de solo lectura: "Una pieza usada es única: su existencia
    siempre es 1";
  - `condition_detail` pasa a obligatorio, con sugerencias ("Usado para prueba",
    "Incompleto — faltan piezas", "Unidad de exhibición");
  - el SKU se propone como `<SKU base>-U1`, editable;
  - aviso: **"Esta ficha se publica aparte del producto nuevo, con su propio precio y su
    propia foto real. Sube una foto de la pieza, no la del catálogo."**
- **Validación en vivo del SKU**: `✓ SKU disponible` o `✕ Ya existe un producto con ese SKU`
  con enlace al existente.
- **Barra de guardar fija** con indicador "Cambios sin guardar" en ámbar. Al salir:
  **"Tienes cambios sin guardar en este producto. ¿Salir de todos modos?"**

| Estado | Diseño |
|---|---|
| **Cargando (edición)** | Esqueleto con pestañas ya visibles |
| **Guardando** | Botón con spinner; formulario bloqueado |
| **Guardado** | Toast verde + el indicador de cambios desaparece |
| **Error de validación** | Banner: **"Revisa 3 campos antes de guardar."** con enlaces a cada campo, **indicando su pestaña** si no está visible |
| **Error del servidor** | "No pudimos guardar el producto. Tus cambios siguen en pantalla, inténtalo de nuevo." — **nunca se pierde lo capturado** |
| **Desactivar** (F1.3) | **"¿Desactivar «Cámara IP bala 4 MP»?"** · "Dejará de aparecer en la tienda de inmediato. Los pedidos que ya lo incluyen no cambian. Puedes reactivarlo cuando quieras." **La palabra «eliminar» no aparece nunca para productos** (RN-9) |

---

### 11.8 Importador CSV (F2) — tres etapas

Asistente lineal con indicador de progreso heredado del demo (l. 2571–2578).

**Paso 1 · Subir**

```
┌─ Importar catálogo ──────────────────────────────────────────────────────────┐
│  ① Subir archivo ──── ② Revisar ──── ③ Aplicar                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │        Arrastra aquí tu archivo CSV o Excel                            │  │ borde punteado
│  │                  o [ elige un archivo ]                                │  │ #52708F
│  │        Hasta 10 MB · formatos .csv y .xlsx                             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  ⓘ ¿Primera vez? [ Descarga la plantilla ] con las columnas correctas y      │
│    un ejemplo lleno. Los productos se identifican por su SKU: si ya existe,  │
│    se actualiza; si no, se crea.                                             │
│  Qué quieres actualizar:                                                     │
│   ◉ Todo el producto   ○ Solo precios   ○ Solo existencias                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Paso 2 · Vista previa (F2.2)**

```
┌─ Importar catálogo · Revisar ────────────────────────────────────────────────┐
│  ①───────── ② Revisar ──── ③ Aplicar          catalogo-sept.csv · 1,050 filas│
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐  │
│  │  980   CORRECTAS ✓   │  │  70   CON ERROR ✕    │  │ 312 / 668          │  │ tarjetas
│  │  verde #45E39A       │  │  rojo #FF7A86        │  │ NUEVOS/ACTUALIZAR  │  │ con corte
│  └──────────────────────┘  └──────────────────────┘  └────────────────────┘  │
│  [ Solo con error (70) ] [ Solo correctas (980) ] [ Todas ]                  │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ FILA  SKU            NOMBRE                PRECIO   STOCK  QUÉ PASA      │ │
│ ├──────────────────────────────────────────────────────────────────────────┤ │
│ │  ✕ 14 SGQ-VV-0012   Cámara IP bala 4 MP   "mil"    24    Precio: "mil"  │ │
│ │                                                          no es un número │ │
│ │  ✕ 27 (vacío)       NVR 8 canales         4590     7     Falta el SKU.   │ │
│ │                                                          Es obligatorio  │ │
│ │  ✕ 31 SGQ-VV-0031   NVR 8 canales         4590     7     La subcategoría │ │
│ │                                                          "Cámaras PTZ"   │ │
│ │                                                          no existe.      │ │
│ │                                                          [Crearla]       │ │
│ │  ✓ 32 SGQ-VV-0045   Kit 4 cámaras 1080p   5899     3     Se actualiza   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│  ⓘ Las 70 filas con error se omiten; las 980 correctas sí se aplican.        │
│  [ ‹ Cambiar archivo ]  [ Descargar las 70 filas con error ]                 │
│                                    [ Aplicar 980 productos ▟ ]               │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Los tres contadores son tarjetas grandes** con corte diagonal: son la respuesta a la
  pregunta que trae el usuario ("¿me quedó bien el archivo?"). Cifra en Mono 36 px.
- **El motivo va escrito en español, por fila**, nombrando el valor que falló (`"mil"`),
  nunca un código. Si el error es una categoría inexistente, se ofrece **crearla ahí mismo**.
- **La descarga de filas con error** usa el formato de la plantilla, para corregir y
  reimportar solo esas (F2.4).
- **El botón nombra la cantidad**: "Aplicar 980 productos". Nunca "Continuar".

**Paso 3 · Aplicar** (por lotes, `arquitectura.md` §9.5)

```
│  ████████████████████████░░░░░░░░░░░░░  62%                                  │
│  612 de 980 productos aplicados · lote 4 de 5                                │
│  Tiempo restante aproximado: 40 segundos                                      │
│  ⓘ Puedes cerrar esta pestaña: la carga sigue en el servidor y te avisamos   │
│    por correo cuando termine.            [ Detener la importación ]          │
```

| Estado | Diseño |
|---|---|
| **Analizando** | Barra indeterminada + "Revisando 1,050 filas…"; tras 5 s, "Esto puede tardar en archivos grandes." |
| **Archivo inválido** | **"Ese archivo no es un CSV ni un Excel."** / **"El archivo pesa 14 MB y el máximo son 10 MB. Divídelo en dos."** |
| **Sin las columnas esperadas** | **"No encontramos las columnas «sku» y «nombre» en tu archivo."** + "Descarga la plantilla y copia tus datos ahí." |
| **Todas con error** | Botón "Aplicar" deshabilitado: "Ninguna fila se puede aplicar todavía. Corrige los errores y vuelve a subir el archivo." |
| **Éxito** | `✓ 980 productos aplicados · 312 nuevos · 668 actualizados` + "Ver el catálogo" / "Importar otro archivo" |
| **Fallas parciales** | `⚠ 974 aplicados · 6 fallaron al guardar` + tabla de los 6 + "Descargar las filas que fallaron" |
| **Interrumpido** | Al volver: **"Tu importación de catalogo-sept.csv se quedó en el 62%."** + `[Reanudar desde donde quedó]` `[Empezar de nuevo]` |
| **Detener** | **"¿Detener la importación?"** · "Los 612 productos que ya se aplicaron se conservan; los 368 restantes no se cargarán." |

---

### 11.9 Grupos y subcategorías (F3, árbol de D7)

```
┌─ Categorías ──────────────────────────── [ Nuevo grupo ] [ Nueva subcat. ▟ ]─┐
│ ┌── ÁRBOL ─────────────────────────────┐ ┌── EDITAR ────────────────────────┐│
│ │ 🔍 Buscar categoría                  │ │  Editando subcategoría           ││
│ │ ▾ Videovigilancia        CH-01  247 ⋮│ │  Nombre *                        ││
│ │   ├ Cámaras IP y NVRs          96  ⋮ │ │  [ Cable - Bobinas            ]  ││
│ │   │  ├ Bala                    18  ⋮ │ │  Dirección web (slug)            ││
│ │   │  ├ Domo / Eyeball / Turret 22  ⋮ │ │  [ cable-bobinas              ]  ││
│ │   │  └ PTZ                     11  ⋮ │ │  Está dentro de *                ││
│ │   ├ Cables y Conectores        31  ⋮ │ │  [ Cableado Estructurado      ▾] ││
│ │   └ Energía                    24  ⋮ │ │   └ (ninguna — primer nivel)     ││
│ │ ▾ Cableado Estructurado  CH-05 189 ⋮│ │  Orden                           ││
│ │   ├ Cable - Bobinas ◀ activo   42  ⋮ │ │  [ 1 ]  [↑] [↓]                  ││
│ │   │  ├ Categoría 5e             9  ⋮ │ │  ◉ Visible en la tienda          ││
│ │   │  ├ Categoría 6             14  ⋮ │ │  ○ Oculta                        ││
│ │   │  ├ Categoría 6A            12  ⋮ │ │                                  ││
│ │   │  └ Categoría 7A             7  ⋮ │ │  [ Eliminar ]      [ Guardar ▟ ] ││
│ │   ├ Cableado de Cobre          38  ⋮ │ └──────────────────────────────────┘│
│ │ ▸ Control de Acceso      CH-02 318 ⋮│                                     │
│ └──────────────────────────────────────┘                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Sangría de 20 px por nivel** con guía vertical `1px #1F3244`. El nivel se comunica además
  con `aria-level`, no solo visualmente.
- **El contador es acumulado** (incluye hijos), en Mono. Es lo que permite decidir si se
  puede borrar una categoría.
- **Sin límite de profundidad impuesto por la interfaz** (D7). Del cuarto nivel en adelante
  se activa scroll horizontal en vez de comprimir la sangría.
- **Reordenar**: arrastrar **y también** botones ↑/↓ en el menú `⋮`. La alternativa por
  teclado es obligatoria.
- "Está dentro de" es lo que permite **crear un tercer nivel**: grupo y, opcionalmente,
  subcategoría padre.

| Estado | Diseño |
|---|---|
| **Vacío** | "Todavía no hay categorías" + "Crea tu primer grupo para empezar a organizar el catálogo." |
| **Nada seleccionado** | Columna derecha: "Elige una categoría del árbol para editarla." |
| **Eliminar categoría vacía** | **"¿Eliminar «Categoría 7A»?"** · "No tiene productos. Esta acción no se puede deshacer." |
| **Eliminar con productos** (F3) | **No se permite sin reasignar.** **"«Cable - Bobinas» tiene 42 productos"** · "Para eliminarla, primero indica a qué categoría se mueven." + selector + `[Mover 42 productos y eliminar]`. Si tiene hijas: "También se moverán sus 4 subcategorías." |
| **Slug duplicado** | "Ya existe otra categoría con esa dirección web. Cámbiala por una distinta." |

---

### 11.10 Bandeja de Devoluciones (D2)

```
┌─ Devoluciones ───────────────────────────────────── [ Exportar CSV ] ────────┐
│  🔍 Folio de devolución, pedido o cliente                                    │
│  (Todas 18) (●Pendientes 2) (En revisión 1) (Aprobadas 13) (Rechazadas 2)    │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ FOLIO      FECHA     CLIENTE       PEDIDO      PRODUCTO       SALDO EST. │ │
│ │ DEV-00034  14 sep 26 Jorge Cruz    SGQ-9P2R7T  No-break 1500  $3,299.00  │ │
│ │                                                 Sellado 100%  [Pendiente]│ │
│ │ DEV-00033  12 sep 26 Ana Salinas   SGQ-3H8N5Q  Cámara domo      $342.30  │ │
│ │                                                 Abierto 70%   [Pendiente]│ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Cajón de resolución:**

```
┌─ DEV-00034 ─────────────────────── ✕ ┐
│ Jorge Cruz · pedido SGQ-9P2R7T       │
│ PRODUCTO DEVUELTO                    │
│ No-break 1500 VA con regulador       │
│ SGQ-EC-0003 · 1 pieza · $3,299.00    │
│ MOTIVO DEL CLIENTE                   │
│ "Compré el modelo equivocado, no lo  │
│  abrí."                              │
│ CONDICIÓN DECLARADA                  │
│ [ Sellado de fábrica ]               │
│ FOTOS DEL CLIENTE   [▣][▣]           │
│ ─────────────────────────────────    │
│ SALDO A FAVOR QUE SE OTORGA          │
│  ◉ 100%  — $3,299.00   (propuesto)   │
│  ○  70%  — $2,309.30                 │
│  ○ Otro: [___] %  =  $0.00           │
│  $3,299.00         ← Mono 30px       │
│  Saldo actual de Jorge: $0.00        │
│  Quedará con: $3,299.00              │
│ ─────────────────────────────────    │
│ ¿QUÉ PASA CON LA PIEZA FÍSICA?       │
│  ◉ Regresa al inventario como nueva  │
│    (stock de SGQ-EC-0003: 15 → 16)   │
│  ○ Publicarla aparte como «Usado»    │
│  ○ No revenderla                     │
│ Nota de resolución (opcional)        │
│ ┌──────────────────────────────────┐ │
│ │  Aprobar y abonar $3,299.00    ▟ │ │
│ └──────────────────────────────────┘ │
│ [ Rechazar devolución ]              │
└──────────────────────────────────────┘
```

- **El porcentaje viene propuesto** según la condición declarada (100 % / 70 %, RN-6) pero
  **es corregible** (D2.2). El importe se recalcula en vivo, en Mono 30 px. "Otro" habilita
  el porcentaje libre para el caso de revisión manual.
- **El destino de la pieza es una pregunta explícita** (D2.6 / D6), con la consecuencia
  escrita al lado de cada opción. Viene marcada la que corresponde a la condición, pero
  nunca se aplica sin que el admin la vea.
- Si elige **"Publicarla aparte como Usado"**, al aprobar se abre el `EditorProducto`
  precargado: SKU `SGQ-EC-0003-U1`, condición `usado`, stock 1, mismo grupo/subcategoría,
  **precio y foto vacíos** — el admin debe poner los reales. Ese es el punto de D6.
- **El botón nombra el importe.** El dinero nunca se mueve tras un botón que solo dice
  "Aprobar".

| Estado | Diseño |
|---|---|
| **Vacío — sin devoluciones** | "Todavía no hay devoluciones" + "Aquí aparecerán las solicitudes de tus clientes." |
| **Vacío — pendientes** | "No hay devoluciones esperando tu decisión." + "Ya revisaste todo." (palomita verde) |
| **Sin fotos** | "El cliente no adjuntó fotos." en `#9FB2C3`, en marco punteado |
| **Confirmar aprobación** | **"¿Aprobar la devolución DEV-00034?"** · "Se abonan **$3,299.00** de saldo a favor a Jorge Cruz y se suma 1 pieza al stock de SGQ-EC-0003. El abono queda registrado y no se puede borrar." |
| **Rechazar** | **Motivo obligatorio**: "El cliente verá este motivo, escríbelo con claridad." |
| **Error al aprobar** | "No pudimos registrar el abono. El saldo del cliente no cambió. Inténtalo de nuevo." — **decir que no cambió nada es esencial** para que no se apruebe dos veces |

---

### 11.11 Bandeja de Solicitudes de servicio (E2)

```
┌─ Solicitudes de servicio ────────────────────────── [ Exportar CSV ] ────────┐
│  🔍 Nombre, correo o teléfono      Servicio:[Todos ▾]  Estado:[Todos ▾]      │
│  (Todas 47) (●Nuevas 4) (En seguimiento 8) (Cerradas 35)                     │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ FOLIO     FECHA      NOMBRE        SERVICIO      UBICACIÓN     ESTADO    │ │
│ │ SRV-0112  16 sep 26  Laura Torres  Monitoreo     Querétaro,Qro [Nueva]   │ │
│ │                      Empresa       442 000 0000                          │ │
│ │ SRV-0111  15 sep 26  Ana Salinas   Financiamiento El Marqués   [Segui.]  │ │
│ │                      Negocio       $85,000 · 12 meses                    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

El cajón muestra todos los campos de `service_requests` en tres bloques: **Contacto** ·
**Servicio de interés** · **Ubicación e inmueble**; para financiamiento se suma **Monto y
plazo**. Acciones en orden de peso: `[Marcar en seguimiento]` (primario) ·
`[Marcar cerrada]` (secundario) · `[Llamar] [WhatsApp] [Correo]` que abren `tel:`,
`https://wa.me/` y `mailto:` con el mensaje prellenado. Campo de **notas internas** con
historial (quién y cuándo).

| Estado | Diseño |
|---|---|
| **Vacío — sin solicitudes** | "Todavía no hay solicitudes" + "Cuando alguien llene el formulario de Servicios en la tienda, aparecerá aquí." |
| **Vacío — nuevas** | "No hay solicitudes nuevas." + "Ya contactaste a todos." |
| **Cerrar** | **"¿Marcar SRV-0112 como cerrada?"** · "Puedes reabrirla después si el cliente vuelve a escribir." |

---

### 11.12 Analítica (G1)

El tablero (§11.2) responde el día a día; **Analítica es donde se profundiza**: rangos
arbitrarios, filtro por grupo y subcategoría, más y menos vendidos completos, y exportación.

```
┌─ Analítica ──────────────────────────────────────── [ Exportar CSV ] ────────┐
│  Periodo: (7 días) (30 días) (Este mes) (Personalizado) del [01/09] al [20/09]│
│  Grupo:[Todos ▾]  Subcategoría:[Todas ▾]                                     │
│  ⓘ Solo se cuentan pedidos con pago validado (de «Listo para envío» en       │
│    adelante). Los pedidos pendientes no aparecen aquí.                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 312 PIEZAS   │ │ $486,230.00  │ │ 47 PEDIDOS   │ │ $10,345.32   │        │
│  │              │ │ IMPORTE      │ │              │ │ TICKET PROM. │        │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
│  Ordenar por: (● Unidades) (Importe)                                         │
│ ┌── MÁS VENDIDOS ────────────────┐ ┌── MENOS VENDIDOS ────────────────────┐ │
│ │ Cámara IP bala 4 MP            │ │ Torniquete trípode acero             │ │
│ │ ████████████████████ 84        │ │ ▌ 1                                  │ │
│ │ SGQ-VV-0012 · $108,276         │ │ SGQ-CA-0033 · $24,900                │ │
│ │ Batería 12 V 7 Ah              │ │ Generador de niebla                  │ │
│ │ ███████████ 52                 │ │ ▌ 1                                  │ │
│ │ [ Ver los 10 · Ver los datos ] │ │ [ Ver los 10 · Ver los datos ]       │ │
│ └────────────────────────────────┘ └──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Barras horizontales, no verticales ni circulares**: los nombres de producto son largos y
  en horizontal se leen sin rotar el texto.
- **Un solo color por gráfica**: cian 600 en más vendidos, ámbar `#FFB547` en menos vendidos
  (aquí el ámbar sí significa "atención": son los candidatos a descontinuar, así que va con
  ícono y etiqueta). La longitud codifica la magnitud; el color no repite ese trabajo.
- **"Ver los datos"** despliega la tabla equivalente — accesibilidad, y además es lo que la
  gente usa para copiar cifras.
- El banner de qué se cuenta (G1.2) es **permanente**, no un tooltip.

| Estado | Diseño |
|---|---|
| **Cargando** | Tarjetas y barras con esqueleto |
| **Vacío — sin ventas en el periodo** | **"No hubo ventas validadas entre el 1 y el 20 de septiembre"** + "Prueba con un periodo más amplio." + "Ver los últimos 90 días" |
| **Vacío — sin ventas nunca** | "Todavía no hay ventas que analizar" + "Cuando valides tu primer pago, este tablero empezará a llenarse." |
| **Rango inválido** | "La fecha de inicio tiene que ser anterior a la de fin." El resto conserva el último resultado válido |
| **Pocos datos** (< 5 productos vendidos) | "Con 3 productos vendidos, este ranking todavía no dice mucho. Vuelve cuando tengas más ventas." |
| **Error** | Banner rojo + "Reintentar", filtros conservados |

---

### 11.13 Configuración (H4)

Solo rol `admin`. Columna de 720 px con índice pegajoso. Cada sección es un `<fieldset>` que
**se guarda por separado**, para que un error en los plazos no impida guardar lo bancario.

```
┌─ Configuración ──────────────────────────────────────────────────────────────┐
│ ┌ Índice ─────┐ ┌──────────────────────────────────────────────────────────┐ │
│ │ Datos       │ │  DATOS BANCARIOS                                         │ │
│ │ bancarios ◀ │ │  ⚠ Estos datos se le muestran al cliente al generar su   │ │ banner ámbar
│ │ Contacto    │ │    pedido. Un error aquí significa transferencias a una   │ │
│ │ Plazos      │ │    cuenta equivocada. Revísalos dos veces.                │ │
│ │             │ │  Banco *                    Beneficiario *               │ │
│ │             │ │  [ BBVA México          ]   [ Seguridad General Qro.   ] │ │
│ │             │ │  CLABE interbancaria *      Número de cuenta             │ │
│ │             │ │  [ 012 680 01234567890 1 ]  [ 0123456789             ]  │ │ mono
│ │             │ │  ✓ 18 dígitos · dígito verificador correcto              │ │ verde
│ │             │ │  Vista previa de lo que verá el cliente:                 │ │
│ │             │ │  ┌─────────────────────────────────────────────────────┐ │ │
│ │             │ │  │ Banco          BBVA México                          │ │ │
│ │             │ │  │ Beneficiario   Seguridad General Querétaro          │ │ │
│ │             │ │  │ CLABE          012 680 01234567890 1         [copiar]│ │ │
│ │             │ │  │ Referencia     SGQ-7K4M2X                    [copiar]│ │ │
│ │             │ │  │ Importe        $5,879.00                            │ │ │
│ │             │ │  └─────────────────────────────────────────────────────┘ │ │
│ │             │ │                              [ Guardar datos bancarios ▟]│ │
│ │             │ ├──────────────────────────────────────────────────────────┤ │
│ │             │ │  CONTACTO DEL ADMINISTRADOR                              │ │
│ │             │ │  Correo para avisos *       WhatsApp para avisos         │ │
│ │             │ │  [ ventas@sgqro.mx      ]   [ +52 442 000 0000       ]  │ │
│ │             │ │  Aquí llegan los avisos de comprobante recibido y las    │ │
│ │             │ │  solicitudes de servicio.                                │ │
│ │             │ │  [ Enviarme un correo de prueba ]  [ Guardar contacto ▟] │ │
│ │             │ ├──────────────────────────────────────────────────────────┤ │
│ │             │ │  PLAZOS                                                  │ │
│ │             │ │  Días para solicitar una devolución                      │ │
│ │             │ │  [ 30 ] días desde que se entrega el pedido              │ │
│ │             │ │  Días para cancelar un pedido no pagado                  │ │
│ │             │ │  [  3 ] días desde que se genera el pedido               │ │
│ │             │ │  Se envía un recordatorio por correo el día 2.           │ │
│ │             │ │                              [ Guardar plazos          ▟]│ │
│ └─────────────┘ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **La vista previa de los datos bancarios es el corazón de esta pantalla**: muestra
  exactamente el bloque que verá el cliente, con la CLABE agrupada como en el demo
  (`clabeGroups`, l. 2653). Es lo que evita el error más caro del sistema.
- **CLABE validada en vivo**: 18 dígitos y dígito verificador. Error: **"Esa CLABE no es
  válida: tiene 17 dígitos y deben ser 18."**
- **Cada plazo explica su consecuencia en la misma línea**, no en un tooltip.
- **Botón de correo de prueba**: la única forma de que una persona no técnica compruebe que
  los avisos le van a llegar.

| Estado | Diseño |
|---|---|
| **Sin configurar** (primera vez) | Banner ámbar: **"Falta configurar tus datos bancarios. Sin ellos, tus clientes no pueden pagar."** + foco en "Banco" |
| **Guardando** | Solo la sección en curso se bloquea |
| **Guardado** | Toast verde + "Última modificación: hoy 11:04 por Mariana Balanzar" (bitácora H4.3) |
| **Cambio de datos bancarios** | **"¿Cambiar la cuenta donde reciben los pagos?"** · "A partir de ahora, los pedidos nuevos mostrarán la CLABE terminada en **8901**. Los pedidos ya generados conservan los datos con los que se crearon." |
| **Error del servidor** | Banner rojo dentro de la sección; los valores capturados se conservan |

---

## 12. Patrones transversales

### 12.1 Toasts

Heredado del demo (l. 1865–1870): fijo abajo al centro, `#0F1D2B`, borde del color de la
variante, glow suave, `sgIn`, 2.6 s. Región `aria-live="polite"`.

**Regla:** un toast informa de algo que **ya pasó y salió bien**. Un error que exige decisión
va en banner o modal, donde no desaparece solo.

### 12.2 Modales de confirmación

Ancho 480 px, fondo `#122234`, **sin corte diagonal** (para no recortar el foco).

1. Pregunta con el objeto nombrado, Chakra Petch 600 20 px.
2. Consecuencia en prosa, 15 px `#C7D5E0`; si hay dinero, el importe en Mono dentro del texto.
3. Campo de motivo/nota si la acción lo exige.
4. Botones: cancelar a la izquierda (fantasma), confirmar a la derecha (primario o
   `peligroLleno`). **El botón de confirmación nunca dice "Aceptar": repite el verbo.**

`Esc` siempre cancela. El foco entra en **cancelar**, no en confirmar — un `Enter`
distraído no debe cancelar un pedido.

### 12.3 Estados de carga

| Situación | Patrón |
|---|---|
| Primera carga | Esqueleto con la forma del contenido final |
| Recarga de datos visibles | Opacidad al 60 % + spinner junto al conteo. **No se borra lo que ya está** |
| Acción en un botón | Spinner dentro + verbo en gerundio; el ancho no cambia |
| Proceso largo | Barra de progreso con porcentaje, conteo real y tiempo estimado |

**Ningún botón puede quedar "sin hacer nada" mientras procesa.**

### 12.4 Plantilla de mensaje de error

> **Qué pasó** — "No pudimos guardar el producto."
> **Por qué** — "El SKU SGQ-VV-0012 ya existe en tu catálogo."
> **Qué hacer** — "Cambia el SKU o edita el producto existente."

Prohibido en pantalla: códigos de error, nombres de tabla o columna, `null`, `undefined`,
stack traces, "error 500", "inválido", "falló la petición".

---

## 13. Checklist de entrega para el Coder

**General**
- [ ] Todos los colores salen de las variables CSS de §2. Cero hex a mano en un componente.
- [ ] Ninguna de las tres combinaciones prohibidas de §5.3 aparece en el código.
- [ ] `globals.css` **no contiene** `prefers-color-scheme`, `--foreground`, `--background`
      ni Geist heredados de `create-next-app` (§4).
- [ ] Las tres fuentes se cargan con `next/font/google` y ninguna otra.
- [ ] Todo SKU, folio, CLABE, clave SPEI e importe en IBM Plex Mono con `tabular-nums`.
- [ ] Cada pantalla tiene sus cuatro estados: cargando, vacío, con datos, error.
- [ ] Todo interactivo alcanzable con `Tab`, con foco visible (§5.5); los elementos con
      `clip-path` usan `box-shadow`, no `outline`.
- [ ] Toda acción destructiva pasa por `ModalConfirmacion` con el objeto nombrado.
- [ ] Ningún mensaje contiene un código técnico.
- [ ] Probado a 320, 760, 1180 y 1440 px y con `prefers-reduced-motion: reduce`.
- [ ] Captura de cada estado revisada para legibilidad real (skill `diseno-ui`).

**Específico del tablero**
- [ ] **El validador de paleta se corrió** para las dos paletas de §2.8.7, en modo oscuro y
      con `--surface "#0F1D2B"`, sin FAIL.
- [ ] El tema por defecto de la librería de gráficas está desactivado; ningún color viene de
      ella (§4.5).
- [ ] Ninguna gráfica tiene **dos ejes Y**.
- [ ] Ninguna gráfica de magnitud empieza su eje Y arriba de cero.
- [ ] Toda gráfica con 2+ series tiene leyenda; con 4+ tiene además etiqueta directa.
- [ ] Toda gráfica tiene su `VerLosDatos` con tabla equivalente y su `aria-label` de resumen.
- [ ] Los segmentos apilados tienen 2 px de separación del color de la superficie.
- [ ] Las etiquetas de valor van en tinta (`#EAF2F8`), nunca del color de la serie.
- [ ] Ningún color de estado (cian/ámbar/verde/rojo) se usa como color de serie salvo el
      caso autorizado de §2.8.4, y ahí va con ícono + etiqueta.
- [ ] El tablero **se probó con la base de datos vacía**: debe mostrar la pantalla de
      bienvenida de §11.2.10, no gráficas rotas.
- [ ] Un bloque que falla no tumba el tablero.

---

## 14. Lo que falta confirmar con la dueña del proyecto

Ninguno bloquea construir la maqueta: todos tienen decisión por defecto.

| # | Pregunta | Decisión por defecto |
|---|---|---|
| **D-1** | El panel es **solo modo oscuro**, sin tema claro. | Sí, oscuro único (§4) |
| **D-2** | El panel **hereda el lenguaje visual de la tienda**. La alternativa sería un panel neutro genérico. | Heredado (§1) |
| **D-3** | Tres colores del demo **se corrigieron** por contraste (§5.3): el panel y la tienda no serán idénticos en esos tres detalles. | Corregidos; se recomienda aplicar lo mismo al sitio público al traducirlo a código (H1.3) |
| **D-4** | Precio y stock se editan **directo en la tabla** del catálogo. | Edición en línea (§11.6) |
| **D-5** | **El tablero sustituye a H6**: el admin ya no abre en la bandeja filtrada. `requerimientos.md` (H6.1 y G2) debe actualizarse. | Tablero (§11.2) |
| **D-6** | **Los 6 indicadores de atención** de §11.2.2 y las **6 gráficas** de §11.2.4 son la selección propuesta. Si prefiere otros, se cambian sin rehacer el diseño. | Los de §11.2 |
| **D-7** | **El tablero no se actualiza solo.** Trae botón de "Actualizar" con la hora del último corte. | Manual (§11.2.10) |
| **D-8** | Los **menos vendidos no van en el tablero** (viven en Analítica): no son una decisión diaria. | Solo más vendidos (§11.2.4 D) |
| **D-9** | Con el negocio recién arrancado, el tablero muestra una **pantalla de puesta en marcha** en vez de gráficas vacías. | Bienvenida (§11.2.10) |
| **D-10** | Paginación: **50 filas** en catálogo, **25** en pedidos. | Ajustable en un minuto |
| **D-11** | El folio en pantalla es `SGQ-7K4M2X` (AR-4 cerrada), no `SGQ-00248` como el demo. | Confirmado en `arquitectura.md` §14 |

---

## 15. Qué sigue

1. **Correr el validador de paleta de datos** (§2.8.7). Es lo único de esta fase que quedó
   pendiente de verificación automática.
2. **Maqueta visual** del panel a partir de esta especificación (la construye la sesión
   principal, no esta fase).
3. **Actualizar `requerimientos.md`**: H6.1 y G2 cambian de alcance (§11.2).
4. **Preparación del entorno** (skill `preparar-entorno`).
5. **Implementación**: los tokens de §2 se capturan primero en `globals.css` y en los átomos
   de `src/components/atoms/`, **antes** de escribir la primera pantalla. Ese orden es lo que
   evita que cada pantalla invente su propio botón.
