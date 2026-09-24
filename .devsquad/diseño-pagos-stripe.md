# Diseño UI — Épica P (Pagos con Stripe + "Quedan X" + porcentaje de devolución)

> Anexo a `.devsquad/diseño.md`. Versión 1 — 2026-09-24. Fase: **Diseño UX/UI**.
> Insumos: `perfil.md` · `requerimientos-pagos-stripe.md` v2 · `arquitectura-pagos-stripe.md` v2 ·
> `diseño.md` (tokens §2, contraste §5, estados §8, responsividad §9, accesibilidad §10) ·
> `index.html` y `panel-admin-maqueta.html` (lenguaje visual, **archivos protegidos, no se tocan**).
>
> **Estado: PROPUESTA pendiente de aprobación de la dueña.** Ninguna de estas pantallas existe en
> `index.html` ni en `panel-admin-maqueta.html`. Por la "Regla de traducción a código" de
> `perfil.md`, el coder **no implementa nada de este documento hasta que la dueña lo apruebe**.
> Una vez aprobado, este documento es la fuente de verdad para estas pantallas con el mismo
> estatus que las secciones de `diseño.md`: el coder implementa desde aquí, no reinterpreta
> valores. Si encuentra algo no cubierto, regresa la pregunta al Diseñador vía Orquestador — no lo
> decide por su cuenta.

---

## 0. Principio y personalidad

**En una frase:** pagar se siente como el resto del sitio — un centro de control oscuro y
ordenado — pero con **una sola regla emocional nueva: el cliente nunca debe dudar de si su dinero
llegó**. Cada pantalla de pago responde, en este orden: *¿qué tengo que hacer?*, *¿cuánto?*,
*¿hasta cuándo?* y *¿qué pasa después?*.

No se inventa estilo nuevo. Se reutilizan los tokens de `diseño.md` §2 y los patrones ya
presentes en `index.html`:

| Patrón existente | Origen | Se reutiliza en |
|---|---|---|
| Tarjeta de opción de pago con radio cian (`border:1px solid #3CE7FF; background:rgba(60,231,255,.05)`, radio con `box-shadow: inset 0 0 0 4px #07111C, inset 0 0 0 10px #3CE7FF`) | `index.html` l. 1060–1066 | Selector de método (§2) |
| Tarjeta "Datos para transferir" con corte de 16 px y glow `0 0 22px rgba(60,231,255,.18)` | l. 1123 | Datos SPEI (§4) y ficha OXXO (§3) |
| CLABE en grupos, Mono `clamp(20px,2.4vw,28px)`, `letter-spacing:1px` + botón "Copiar" contorno cian | l. 1134–1146 | CLABE SPEI (§4) |
| Importe exacto, Chakra Petch 600 30 px `#3CE7FF` | l. 1158–1159 | Monto OXXO/SPEI |
| Banner ámbar con cuadrito de 8 px (`border:1px solid #FFB547; background:rgba(255,181,71,.06)`) | l. 1171–1174 | Avisos de plazo |
| Banner de error rojo con cuadrito (`#FF4D5E`, `rgba(255,77,94,.07)`) | l. 1417–1420 | Errores de pago |
| Línea de tiempo `signal()` | l. 1894–1919 | `PasosPedido` con el paso nuevo (§5) |
| Barras de stock + etiqueta `stockLabel` | l. 2030–2041 | "Quedan X" (§7) |
| Pantalla de éxito con círculo verde de 76 px | l. 1386–1396 | Confirmación de tarjeta (§2.6) |

---

## 1. Tokens nuevos (solo dos) y contraste

Todo lo demás sale de `diseño.md` §2. Se agregan exactamente estos tokens:

| Token | Valor | Propósito | Por qué hace falta |
|---|---|---|---|
| `--processing` | `#9085E9` (violeta) | Estado **"Pago en proceso"** | El brief exige que se distinga de "Pendiente de pago" (ámbar) y de "Comprobante recibido" (cian lleno). Cian contorno ya lo usan "Listo" y "Enviado"; verde y rojo significan éxito/error. Un quinto tono es la única forma de no mentir con el color. Se elige el violeta de la ranura 7 de la paleta de datos (§2.8.2), que el tablero **no usa** (tope de 6 series), así que no choca con ninguna gráfica. |
| `--processing-tint` | `rgba(144,133,233,.07)` | Fondo de banner "pago en proceso" | Misma fórmula que `--danger-tint` |
| `--voucher-paper` | `#FFFFFF` | Fondo **solo** del recuadro del código de barras OXXO | Los lectores de la caja OXXO necesitan barras oscuras sobre fondo claro. Es la **única** superficie clara del sitio y se limita al recuadro del código (ver §3). |
| `--voucher-ink` | `#07111C` | Barras y dígitos dentro de ese recuadro | — |

**Contraste verificado (WCAG 2.2 AA, cálculo de luminancia relativa):**

| Texto / elemento | Sobre | Ratio | Resultado |
|---|---|---|---|
| `#9085E9` texto | `#07111C` | 6.07 | ✅ AA |
| `#9085E9` texto | `#0F1D2B` | 5.46 | ✅ AA |
| `#9085E9` texto | `#16283A` (hover) | ≈ 4.75 | ✅ AA |
| `#07111C` texto | `#9085E9` (badge lleno, si se usa) | 6.07 | ✅ AA |
| `#07111C` barras/dígitos | `#FFFFFF` | 19.6 | ✅ (y legible por escáner) |
| `#EAF2F8` | `rgba(144,133,233,.07)` sobre `#07111C` (≈ `#0F1422`) | ≈ 16 | ✅ |
| `#9085E9` borde de badge | `#0F1D2B` | 5.46 | ✅ ≥ 3 (1.4.11) |
| `#FFB547` "Quedan X" | `#0F1D2B` (tarjeta) | 9.71 | ✅ |
| `#FFB547` "Quedan X" | `#07111C` | 10.81 | ✅ |

Las combinaciones prohibidas de `diseño.md` §5.3 siguen prohibidas aquí (en particular: nada de
`#5D7080` como texto; los bordes de campo son `#52708F`).

**Mapa de estados actualizado** (añadir a `diseño.md` §8 al aprobarse):

| Estado | Etiqueta cliente | Etiqueta admin | Color | Badge |
|---|---|---|---|---|
| `pendiente_pago` | Pendiente de pago | Pendiente de pago | `#FFB547` | Contorno |
| **`pago_en_proceso`** | **Pago en proceso** | **Pago en proceso** | **`#9085E9`** | **Contorno + ícono de reloj** |
| `comprobante_recibido` (vía comprobante) | Comprobante recibido | Comprobante recibido | `#3CE7FF` | Lleno |
| `comprobante_recibido` (vía Stripe) | **Pago recibido, en revisión** | Comprobante recibido + chip de método | `#3CE7FF` | Lleno |

"Pago en proceso" **nunca va lleno**: no exige acción del admin (RN-15, no está en su bandeja).
Siempre lleva ícono + texto, nunca color solo.

---

## 2. Checkout — selector de método de pago (P1, P2)

Se reemplaza el bloque de **una sola** opción de pago de `index.html` l. 1060–1066 por un grupo de
cuatro. El resto del checkout (columnas, `aside` "Tu pedido" sticky, banner de saldo l. 1069–1074)
no cambia.

### 2.1 Layout (escritorio)

```
┌─ Checkout ───────────────────────────────────────────────────────────────────────────┐
│ … dirección, facturación (sin cambios) …                  ┌── Tu pedido ───────────┐ │
│                                                           │ ×1 Cámara IP bala …    │ │
│ ¿CÓMO QUIERES PAGAR?            Chakra Petch 600 · 20 px  │ ×1 NVR 8 canales …     │ │
│ ┌──────────────────────────────────────────────────────┐  │ ────────────────────── │ │
│ │ ◉ Tarjeta de crédito o débito     [VISA][MC][AMEX]   │  │ Subtotal   $5,879.00   │ │
│ │   Confirmación inmediata                             │  │ Saldo a favor −$450.00 │ │
│ │  ┌────────────────────────────────────────────────┐  │  │ ────────────────────── │ │
│ │  │ [ Stripe Payment Element: número, venc., CVC ] │  │  │ Total a pagar          │ │
│ │  └────────────────────────────────────────────────┘  │  │ $5,429.00  ← 28 px     │ │
│ └──────────────────────────────────────────────────────┘  │ IVA incluido …         │ │
│ ┌──────────────────────────────────────────────────────┐  │ ☐ Entiendo que …       │ │
│ │ ○ Efectivo en OXXO                                   │  │ ┌────────────────────┐ │ │
│ │   Se confirma hasta 1 día hábil después de pagar     │  │ │ Pagar $5,429.00  ▟ │ │ │
│ └──────────────────────────────────────────────────────┘  │ └────────────────────┘ │ │
│ ┌──────────────────────────────────────────────────────┐  │ 🔒 Pago procesado por  │ │
│ │ ○ Transferencia SPEI (CLABE única para tu pedido)    │  │   Stripe. No guardamos │ │
│ │   Se confirma en minutos, sin subir comprobante      │  │   los datos de tu      │ │
│ └──────────────────────────────────────────────────────┘  │   tarjeta.             │ │
│ ┌──────────────────────────────────────────────────────┐  └────────────────────────┘ │
│ │ ○ Transferencia con comprobante                      │                             │
│ │   Nos transfieres y subes la captura. Lo revisa una  │                             │
│ │   persona (hasta 24 h hábiles)                       │                             │
│ └──────────────────────────────────────────────────────┘                             │
│ [ banner de saldo a favor — sin cambios, l. 1069 ]                                   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Especificación de la tarjeta de opción (`OpcionMetodoPago`, molécula)

| Parte | Seleccionada | No seleccionada | Hover (no sel.) | Deshabilitada |
|---|---|---|---|---|
| Contenedor | `padding:18px; border:1px solid #3CE7FF; background:rgba(60,231,255,.05)` (l. 1060) | `border:1px solid #1F3244; background:#0F1D2B` | `border-color:#2C4560; background:#16283A` | `border:1px dashed #2C4560; background:#0B1622; cursor:not-allowed` |
| Radio 16 px | `border:1px solid #3CE7FF; box-shadow:inset 0 0 0 4px #07111C, inset 0 0 0 10px #3CE7FF` (l. 1061) | `border:1px solid #52708F`, sin relleno | `border-color:#9FB2C3` | `border:1px solid #2C4560` |
| Título | Chakra Petch 500 16 px `#EAF2F8` (l. 1063) | igual | igual | `#8DA2B5` (§5.3 C-2) |
| Tiempo de confirmación | IBM Plex Sans 400 14 px/1.55 `#9FB2C3` (l. 1064) | igual | igual | Reemplazado por el motivo (ver P1.6) en `#FFB547` 14 px con ícono ⚠ |

- Separación entre tarjetas: `gap:12px`. Alto mínimo de cada tarjeta: 64 px (objetivo táctil ≥ 44).
- **Toda la tarjeta es el área de clic** (Fitts), no solo el radio.
- Logos de marcas de tarjeta: SVG monocromos `#9FB2C3` de 24×16 px, a la derecha del título
  **solo en la opción Tarjeta**. Se obtienen del kit de marcas oficial de cada red; no se dibujan
  a mano. Si no se consiguen, se omiten (no se sustituyen por íconos genéricos).
- **Orden fijo** (Hick: la opción recomendada primero, la más lenta al final): Tarjeta · OXXO ·
  SPEI · Transferencia con comprobante. Tarjeta viene preseleccionada (RN-1).
- Textos exactos de la segunda línea (P1.5):
  - Tarjeta: **"Confirmación inmediata"**
  - OXXO: **"Pagas en efectivo en cualquier OXXO. Se confirma hasta 1 día hábil después de pagar"**
  - SPEI: **"Te damos una CLABE única para este pedido. Se confirma en minutos, sin subir comprobante"**
  - Comprobante: **"Nos transfieres y subes la captura. La revisa una persona"**
- **Solo la opción seleccionada se expande.** Tarjeta expande el Payment Element dentro de su
  propia tarjeta (debajo del texto, `margin-top:16px`). OXXO y SPEI expanden una nota de dos líneas
  con lo que pasará al pulsar el botón ("Al continuar te mostramos tu ficha de pago. Tienes 2 días
  para pagar; mientras tanto apartamos tus productos."). Comprobante expande el texto actual de
  l. 1064. Así nunca hay dos formularios visibles a la vez.

### 2.3 Diferencia entre SPEI de Stripe y transferencia con comprobante

Son dos cosas que el cliente puede confundir. Se diferencian **por el beneficio, no por la
tecnología**: SPEI dice "sin subir comprobante / se confirma en minutos"; comprobante dice "subes
la captura / la revisa una persona". No se menciona "Stripe" en las opciones.

### 2.4 El botón principal del `aside` cambia con el método

| Método | Etiqueta del botón (l. 1097, mismo estilo `genOrderStyle`) | Casilla de acuerdo (l. 1093–1096), texto |
|---|---|---|
| Tarjeta | **"Pagar $5,429.00"** | "Entiendo que mi pedido se revisa antes de enviarse." |
| OXXO | **"Generar ficha de pago OXXO"** | "Entiendo que tengo 2 días para pagar en OXXO o mi pedido se libera." |
| SPEI | **"Ver datos para transferir"** | "Entiendo que tengo 2 días para transferir o mi pedido se libera." |
| Comprobante | **"Generar pedido"** (sin cambio) | Sin cambio |

El botón **siempre nombra el importe** cuando cobra en ese momento (tarjeta). Los "2 días" se leen
de la configuración H4 (`oxxo_expires_days` / `spei_expires_days`), nunca se escriben fijos.

Bajo el botón, solo con tarjeta/OXXO/SPEI: línea de confianza 12.5 px `#9FB2C3` con candado SVG
de trazo 1.5 `currentColor`: **"Pago procesado por Stripe. Nosotros nunca vemos ni guardamos los
datos de tu tarjeta."** (en OXXO/SPEI: "Pago procesado por Stripe.").

### 2.5 Saldo a favor (P1.3, P1.4)

- Con saldo aplicado, el `aside` muestra tres renglones en Mono `tabular-nums`: Subtotal · Saldo a
  favor `−$450.00` en `#45E39A` · **Total a pagar** (Chakra 600 28 px, igual que l. 1090). Todos
  los botones y fichas usan el **Total a pagar**, nunca el subtotal.
- **Si el saldo cubre el 100 %**: el grupo de métodos desaparece y en su lugar va un banner verde
  (`#45E39A`, `rgba(69,227,154,.05)`): **"Tu saldo a favor cubre todo este pedido. No tienes que
  pagar nada; lo confirmamos en cuanto lo revisemos."** Botón: "Confirmar pedido". (Flujo RN-11
  actual.)

### 2.6 Estados del checkout

| Estado | Diseño |
|---|---|
| **Cargando el formulario de tarjeta** | Dentro de la tarjeta expandida: tres rectángulos de esqueleto de 44 px (número; vencimiento + CVC en dos columnas), fondo `#16283A`. El botón "Pagar" deshabilitado con texto "Preparando el pago…" |
| **Apartando inventario** (al pulsar el botón, cualquier método) | Botón con spinner + "Apartando tus productos…", ancho fijo; opciones de pago en solo lectura |
| **Procesando tarjeta** | Botón con spinner + "Procesando pago…". Si Stripe abre 3-D Secure, se muestra su ventana; debajo del botón: "Tu banco puede pedirte confirmar la compra." |
| **Éxito tarjeta** (P2.5) | Pantalla completa con el patrón de l. 1386–1396: círculo verde 76 px ✓, título **"Recibimos tu pago"**, texto **"Tu pago del pedido SGQ-7K4M2X por $5,429.00 fue aceptado por tu banco. Ahora lo revisamos y te avisamos cuando tu pedido esté listo para envío (normalmente en menos de 24 horas)."** Botones: "Ver mi pedido" (primario) · "Seguir comprando". Nunca se dice "pedido confirmado": el estado real depende del webhook y de la revisión humana |
| **Tarjeta rechazada** | Banner rojo (l. 1417) **dentro** de la tarjeta de pago, arriba del Payment Element: **"Tu banco rechazó el pago. No se hizo ningún cargo. Revisa los datos o prueba con otra tarjeta u otro método."** El mensaje específico que devuelve Stripe (fondos insuficientes, tarjeta vencida) se muestra en la segunda línea, traducido por Stripe al español. Foco al banner. El apartado sigue vigente: se muestra "Tus productos siguen apartados hasta las 11:42." |
| **Apartado vencido** (30 min sin pagar, P2.6) | Banner ámbar arriba del selector: **"Pasaron 30 minutos y liberamos tus productos para otros clientes. Si aún los quieres, vuelve a intentar el pago."** + botón "Reintentar". Si algún producto ya no hay: se aplica el estado siguiente |
| **Sin inventario** (P7.2) | Banner rojo arriba del selector: **"Alguien acaba de comprar la última pieza de «Torniquete trípode de acero inoxidable». No se hizo ningún cargo."** + "Quitar del pedido y continuar" (primario) / "Volver al carrito". Nunca se genera voucher ni CLABE |
| **OXXO no disponible por monto** (P1.6) | La tarjeta OXXO queda deshabilitada (estilo §2.2) con el motivo: **"No disponible: OXXO acepta pagos de hasta $10,000.00 y tu pedido es de $24,900.00."** El tope se toma de la configuración/Stripe vigente, nunca fijo en el texto de diseño |
| **Stripe no carga** (red, bloqueador) | En la tarjeta seleccionada: **"No pudimos cargar el formulario de pago. Revisa tu conexión o desactiva el bloqueador de anuncios e inténtalo de nuevo."** + "Reintentar". **La opción "Transferencia con comprobante" sigue disponible**, y el banner lo sugiere: "También puedes pagar por transferencia con comprobante." |
| **Error del servidor al iniciar** | Banner rojo: **"No pudimos iniciar tu pago. No se hizo ningún cargo. Inténtalo de nuevo en un momento."** Decir que no hubo cargo es obligatorio en todo error de pago |
| **Pedido con un pago ya en proceso** (el cliente vuelve atrás) | En lugar del selector: banner violeta (§1) **"Ya tienes un pago en proceso para este pedido."** + "Ver mis datos de pago" (primario) + "Cambiar de método de pago" (texto). Cambiar de método cancela el intento anterior, con confirmación: **"¿Cambiar de método? Tu ficha de OXXO actual dejará de ser válida. No pagues con ella."** |

### 2.7 Apariencia del Payment Element (Stripe Appearance API)

El Payment Element se dibuja dentro de un iframe de Stripe; solo se puede ajustar con estas
variables. Valores exactos (todos tokens de `diseño.md` §2):

| Variable / regla | Valor | Token |
|---|---|---|
| `theme` | `'night'` (base oscura, se sobrescribe abajo) | — |
| `colorPrimary` | `#3CE7FF` | `--accent` |
| `colorBackground` | `#0B1622` | `--bg-inset` |
| `colorText` | `#EAF2F8` | `--text-primary` |
| `colorTextSecondary` | `#9FB2C3` | `--text-muted` |
| `colorTextPlaceholder` | `#7E93A6` | `--text-dim` (placeholder a 16 px) |
| `colorDanger` | `#FF7A86` | `--danger-text` |
| `colorSuccess` | `#45E39A` | `--success` |
| `colorWarning` | `#FFB547` | `--warning` |
| `fontFamily` | `'IBM Plex Sans', sans-serif` (cargar con `fonts: [{ cssSrc: Google Fonts IBM Plex Sans 400;500 }]`) | — |
| `fontSizeBase` | `16px` (evita zoom automático en iOS) | — |
| `borderRadius` | `4px` | `--radius-input` |
| `spacingUnit` | `4px` | escala de §2.6 |
| `.Input` | `border: 1px solid #52708F; padding: 12px 14px; box-shadow: none` | `--border-input` (C-3) |
| `.Input:focus` | `border-color: #3CE7FF; box-shadow: 0 0 0 1px #3CE7FF` | foco |
| `.Input--invalid` | `border-color: #FF4D5E` | `--danger` |
| `.Label` | `font-size: 13px; font-weight: 500; color: #9FB2C3` | etiqueta de campo |
| `.Error` | `font-size: 13px; color: #FF7A86` | — |
| `.Tab`, `.Block` | no se usan (un solo método por Payment Element, arquitectura §1) | — |

Contraste dentro del iframe: mismos pares ya verificados en `diseño.md` §5 (`#EAF2F8` / `#9FB2C3`
/ `#FF7A86` sobre `#0B1622`). **No se usa ningún color default de Stripe** (su azul `#0570DE` no
debe aparecer).

---

## 3. "Tu ficha de pago OXXO" (P3)

Ruta propuesta: la misma pantalla "Pedido generado" (`isOrder`, l. 1103) en su variante OXXO.
Máximo 820 px de ancho (como l. 1385) para que la ficha se lea como un documento.

```
┌──────────────────────────────────────────────────────────────────┐
│ ◷  Pedido SGQ-7K4M2X · pago en proceso        Chakra 600 clamp   │
│ [ PasosPedido: Generado ● ─ Pago en proceso ◉ ─ … ]  (§5)        │
│                                                                  │
│ ┌─ Tu ficha de pago OXXO ─────────────────────────────── corte ▟┐│  tarjeta l. 1123
│ │ MONTO A PAGAR EN CAJA          FECHA LÍMITE                   ││
│ │ $5,429.00  ← Chakra 600 30 px  Viernes 26 sep, 23:59          ││
│ │   #3CE7FF                      Mono 20 px #FFB547 + ⚠         ││
│ │ ───────────────────────────────────────────────────────────── ││
│ │ ┌───────────────────────────────────────────────────────────┐ ││
│ │ │ ▌▌▌ ▌ ▌▌ ▌▌▌ ▌ ▌▌ ▌▌▌ ▌ ▌▌▌ ▌▌ ▌▌  (código de barras)     │ ││  fondo #FFFFFF
│ │ │ 9300 0123 4567 8901 2345 67      Mono 18 px #07111C       │ ││  padding 20 px
│ │ └───────────────────────────────────────────────────────────┘ ││
│ │ Referencia  9300 0123 4567 8901 2345 67          [ Copiar ]   ││
│ └───────────────────────────────────────────────────────────────┘│
│ [ Descargar / imprimir ficha ▟ ]  [ Ver mi pedido ]  Ir a Mis …  │
│                                                                  │
│ ■ Tus productos quedan apartados hasta el viernes 26 sep a las   │  banner violeta
│   23:59. Si no pagas antes, se liberan y el pedido se cancela.   │
│                                                                  │
│ ┌ 01 ───────────┐ ┌ 02 ───────────┐ ┌ 03 ─────────────────────┐   │  tarjetas l. 1178
│ │ Ve a cualquier│ │ Paga el monto │ │ Te avisamos             │   │
│ │ OXXO          │ │ exacto        │ │ OXXO nos confirma tu    │   │
│ │ Muestra el    │ │ En efectivo.  │ │ pago hasta 1 día hábil  │   │
│ │ código o dicta│ │ OXXO cobra una│ │ después. Luego lo       │   │
│ │ la referencia.│ │ comisión      │ │ revisamos y te avisamos │   │
│ │               │ │ aparte.       │ │ por correo.             │   │
│ └───────────────┘ └───────────────┘ └─────────────────────────┘   │
│ [ Resumen del pedido — sin cambios, l. 1186 ]                    │
└──────────────────────────────────────────────────────────────────┘
```

- **Jerarquía (Hick):** monto y fecha límite arriba (lo que el cliente necesita en la caja), luego
  el código, luego una sola acción primaria: **"Descargar / imprimir ficha"** (primario con corte
  12 px y glow — el único glow de la pantalla). Abre la ficha oficial de Stripe
  (`hosted_voucher_url`) en pestaña nueva; esa ficha ya trae formato para imprimir y guardar como
  PDF. No se construye un PDF propio.
- **Recuadro del código de barras:** única superficie clara del sitio (`--voucher-paper`), sin
  `clip-path`, `padding:20px`, código centrado a ancho completo con alto 64 px, dígitos debajo en
  IBM Plex Mono 400 18 px `#07111C`, agrupados de 4 en 4 con `letter-spacing:1px` (mismo criterio
  que `clabeGroups`). Justificación: los escáneres de caja fallan con barras claras sobre fondo
  oscuro. La imagen del código es la que entrega Stripe; si no se entrega imagen, se muestran solo
  los dígitos grandes y la cajera los teclea.
- **La fecha límite** va en ámbar `#FFB547` con ícono ⚠ (ya significa "plazo" en el sitio,
  l. 1613) y **con día de la semana y hora**, nunca solo "2 días".
- La comisión de OXXO al cliente: **confirmado por la dueña (D-P4) — OXXO sí le cobra una comisión
  aparte al cliente al pagar en tienda.** El paso 02 debe decirlo en modo afirmativo, no
  condicional: **"OXXO cobra una comisión aparte al cliente."** (ya no "puede cobrarte"). Esta
  comisión la paga el cliente en caja, es distinta de la comisión de Stripe que absorbe el negocio
  (`arquitectura-pagos-stripe.md` §Costos).
- La misma tarjeta de ficha se muestra en el **detalle del pedido** en Mis pedidos (P3.2), en el
  lugar donde hoy va "Sube tu comprobante" (l. 1339–1347).

| Estado | Diseño |
|---|---|
| **Generando la ficha** | Tarjeta con esqueleto: dos cifras y un bloque blanco atenuado (`opacity:.15`). Texto "Generando tu ficha de pago…". Nunca pantalla en blanco |
| **Ficha lista** | Como el diagrama. `aria-live="polite"`: "Tu ficha de pago está lista" |
| **Copiado** | Toast (patrón l. 1921–1924): "Referencia copiada" |
| **Vence en menos de 6 h** | El banner violeta pasa a ámbar: **"Tu ficha vence hoy a las 23:59. Paga antes o tus productos se liberarán."** |
| **Pagada, esperando confirmación** (el cliente vuelve tras pagar) | No podemos saberlo antes del webhook, así que el texto del paso 03 queda siempre visible. Además, en Mis pedidos: "¿Ya pagaste? No tienes que hacer nada más. Te avisaremos en cuanto OXXO nos confirme." |
| **Vencida** | La ficha se muestra atenuada (`opacity:.4`) con una franja roja encima: **"Esta ficha venció el 26 sep y ya no se puede pagar. No la uses."** + "Elegir otro método de pago" (primario), si el pedido sigue vigente; si se canceló: "Hacer un nuevo pedido". Nunca se muestra un código vencido sin esa franja |
| **Pagada tarde (ya liberada)** (arquitectura §4.1) | En Mis pedidos, banner cian: **"Recibimos tu pago después de la fecha límite. Lo estamos revisando y te contactaremos en menos de 24 horas."** — nunca se le dice que perdió su dinero |
| **Error al generar** | Banner rojo: **"No pudimos generar tu ficha de OXXO. No se apartaron tus productos ni se hizo ningún cargo."** + "Reintentar" / "Elegir otro método" |
| **Error al abrir la ficha para imprimir** | Toast rojo no, banner: "No pudimos abrir la ficha para imprimir. Puedes pagar dictando la referencia en caja." La referencia sigue visible en pantalla |

---

## 4. "Datos para tu pago SPEI" (P4)

Reutiliza **literalmente** la estructura de "Datos para transferir" (l. 1123–1162), que el cliente
ya conoce. Cambian solo los datos y los textos: la CLABE es la que genera Stripe para este pedido.

```
┌─ Datos para tu transferencia SPEI ──────────────────────────── corte 16 ▟┐
│ Banco            STP (ejemplo, el que devuelva Stripe)     Mono 15 px     │  filas l. 1127
│ Beneficiario     (el que devuelva Stripe)                                 │
│ ─────────────────────────────────────────────────────────────────────── │
│ CLABE interbancaria (única para este pedido)                              │
│ 646 180 1234 5678 901 2        Mono clamp(20px,2.4vw,28px)  [ Copiar ]    │  l. 1140
│ ─────────────────────────────────────────────────────────────────────── │
│ Referencia                          Importe exacto a transferir           │
│ 1234567  [ Copiar ]                 $5,429.00   Chakra 600 30 #3CE7FF     │
│                                     [ Copiar monto ]                      │
│ Transfiere antes del  viernes 26 sep, 23:59   Mono #FFB547 ⚠             │
└───────────────────────────────────────────────────────────────────────────┘
[ Copiar todos los datos ▟ ]  [ Ver mi pedido ]   Ir a Mis pedidos

■ Transfiere el importe exacto. Si envías una cantidad distinta, tu pedido
  no avanza hasta que lo revisemos.                         ← banner ámbar l. 1171

┌ 01 Copia la CLABE ┐ ┌ 02 Transfiere desde tu banco ┐ ┌ 03 Te avisamos ─────────┐
│ Es solo para este │ │ Por el importe exacto, antes │ │ SPEI se confirma en     │
│ pedido.           │ │ de la fecha límite.          │ │ minutos. No tienes que  │
│                   │ │                              │ │ subir comprobante.      │
└───────────────────┘ └──────────────────────────────┘ └─────────────────────────┘
```

- **Diferencias con el bloque de comprobante actual** (explícitas, para que el coder no copie de
  más): se quita el badge "DEMO" (l. 1137); se quita "Subir comprobante ahora" (l. 1165) porque con
  SPEI de Stripe no se sube nada; **"Copiar todos los datos" pasa a ser la acción primaria** (con
  corte 12 px y glow); se agrega **"Copiar monto"** (P4.2) junto al importe, mismo estilo que el
  "Copiar" de la referencia (l. 1154).
- La CLABE y la referencia se agrupan igual que `clabeGroups`. Al copiar, se copian **sin
  espacios**.
- Toasts: "CLABE copiada" · "Monto copiado" · "Datos copiados".
- Los mismos datos quedan en el detalle del pedido de Mis pedidos (P4.2), en lugar del bloque
  "Datos bancarios" de l. 1375–1379.

| Estado | Diseño |
|---|---|
| **Generando la CLABE** | Esqueleto de las filas + "Generando tu CLABE…" |
| **Lista** | Como el diagrama |
| **Vence en menos de 6 h** | Mismo cambio a ámbar que OXXO: "Tu CLABE vence hoy a las 23:59." |
| **Pago parcial o de más** (P4.4) | En Mis pedidos, banner ámbar: **"Recibimos $5,000.00 y tu pedido es de $5,429.00. Lo estamos revisando; te contactaremos para resolverlo."** (o "…recibimos $5,600.00…"). Nunca se le pide que "transfiera la diferencia" automáticamente: lo resuelve el admin |
| **Vencida** | Bloque atenuado + franja roja: **"Esta CLABE venció el 26 sep. No transfieras a ella."** + "Elegir otro método de pago" |
| **Error al generar** | Igual que OXXO: "No pudimos generar tus datos de transferencia. No se apartaron tus productos." + "Reintentar" / "Elegir otro método" |
| **Error al copiar** (navegador sin portapapeles) | El texto se selecciona automáticamente y toast: "Selecciona y copia manualmente" |

---

## 5. "Pago en proceso" en Mis pedidos y en `PasosPedido` (P3.3, P4.3, RN-15)

### 5.1 Línea de tiempo (`PasosPedido` / `LineaTiempoEstado`)

Se basa en `signal()` (l. 1894–1919) con la corrección de `diseño.md` (inactivo `#7E93A6`, no
`#5D7080`). Los pasos dependen del método del pedido:

| Método | Pasos |
|---|---|
| Comprobante (sin cambios) | Pedido generado · Pendiente de pago · Comprobante recibido · Listo para envío · Enviado · Entregado |
| **Tarjeta / OXXO / SPEI** | Pedido generado · **Pago en proceso** · **Pago recibido** · Listo para envío · Enviado · Entregado |

Colores del punto actual:

| Estado actual | Punto (14 px) | Animación | Etiqueta |
|---|---|---|---|
| `pendiente_pago` | `#FFB547` | `sgPulse` (ya existe) | `#EAF2F8` |
| **`pago_en_proceso`** | **anillo** 14 px: `border:2px solid #9085E9`, centro `#07111C`, con un arco que gira (`sgSpin`, ver abajo) | giro, no pulso | `#EAF2F8` + segunda línea 11 px `#9085E9`: "OXXO · vence 26 sep" / "SPEI · vence 26 sep" / "Tarjeta" |
| `comprobante_recibido` vía Stripe ("Pago recibido") | `#3CE7FF` | `sgPulse` | `#EAF2F8` |

Por qué anillo que gira y no un color más: el pulso ya significa "te toca a ti"
(pendiente de pago); el giro significa "estamos esperando a alguien más". Distinto en **forma y
movimiento**, no solo en color (accesible para daltonismo).

```css
@keyframes sgSpin { to { transform: rotate(360deg) } }
/* anillo: border:2px solid #9085E9; border-top-color:transparent; animation:sgSpin 1.4s linear infinite */
```
Con `prefers-reduced-motion: reduce` el anillo queda quieto (regla global ya existente).

### 5.2 Tarjeta del pedido en Mis pedidos (l. 1227–1248)

- Chip de estado (patrón `chipStyle`, l. 1898–1901) con color `#9085E9` y **ícono de reloj**
  SVG 12 px trazo 1.5 en lugar del punto: "◷ Pago en proceso".
- Debajo de la fecha, línea 12.5 px `#9FB2C3`: **"OXXO · paga antes del vie 26 sep, 23:59"** /
  **"SPEI · transfiere antes del vie 26 sep, 23:59"** / **"Tarjeta · confirmando con tu banco"**.
- Botón de acción (`o.actionStyle`): **"Ver ficha de pago"** (OXXO) · **"Ver datos para
  transferir"** (SPEI) · **"Completar pago"** (tarjeta, dentro de los 30 min). Contorno cian con
  corte 10 px, como "Subir comprobante".
- Chips de filtro de Mis pedidos (l. 1220–1224): se agrega **"Pago en proceso"** entre "Pendiente"
  y "Comprobante".

### 5.3 Detalle del pedido (l. 1320–1381)

Con `pago_en_proceso`, el banner ámbar "Sube tu comprobante" (l. 1339) se sustituye por la ficha
OXXO (§3) o los datos SPEI (§4) completos. Con tarjeta, por el banner violeta:
**"Estamos confirmando tu pago con tu banco. Esto suele tardar unos segundos; puedes cerrar esta
página."**

Con "Pago recibido" (Stripe): banner cian **"Recibimos tu pago con tarjeta terminada en 4242. Lo
estamos revisando y te avisaremos cuando tu pedido esté listo para envío."** (o "…tu pago en
OXXO…", "…tu transferencia SPEI…").

| Estado | Diseño |
|---|---|
| **Vacío** (sin pedidos) | Sin cambios respecto al actual |
| **Filtro "Pago en proceso" vacío** | "No tienes pagos en proceso." |
| **Error al cargar la ficha/CLABE en el detalle** | Banner rojo dentro del bloque: "No pudimos cargar tus datos de pago. Inténtalo de nuevo." + "Reintentar". El resto del detalle sigue visible |
| **Pago vencido y pedido de vuelta en pendiente** | Chip ámbar "Pendiente de pago" + línea "Tu ficha de OXXO venció. Elige cómo pagar." + botón "Pagar ahora" (lleva al selector del §2) |

---

## 6. Admin — detalle del pago de Stripe en la bandeja de revisión (P6)

### 6.1 En la bandeja de pedidos (`diseño.md` §11.3)

- Nueva columna **MÉTODO** entre TOTAL y SALDO, con un chip neutro (`#9FB2C3` contorno, Mono 11 px
  mayúsculas): `TARJETA` · `OXXO` · `SPEI` · `COMPROBANTE`. No se colorea: el color de la fila lo
  lleva el estado.
- Nuevo chip de filtro "Pago en proceso (n)" con punto violeta, **sin** pulso y **sin** contador
  en la barra lateral (no es trabajo del admin, RN-15). Sirve para consultar, no para actuar.
- Filas con bandera de revisión (SPEI con monto distinto, "pagado sin inventario"): ícono ⚠ ámbar
  junto al folio y texto en segunda línea "Monto distinto" / "Pagado sin inventario".
- Móvil: el chip de método va junto al badge de estado en la tarjeta.

### 6.2 En el detalle de pedido (`diseño.md` §11.5)

Mismo principio que §11.5.1 (saldo): el `VisorComprobante` se sustituye por un organismo nuevo
**`DetallePagoStripe`**, en el mismo lugar y con el mismo peso visual. La columna derecha
(`PanelComparacionPago`) conserva su forma.

```
┌─ ‹ Pedidos · SGQ-7K4M2X ───────────── [TARJETA] [Comprobante recibido] ──────┐
│ ┌── PAGO CON TARJETA ─────────────────┐ ┌── IMPORTE ESPERADO ──────────────┐ │
│ │ Estado en Stripe                    │ │ $5,429.00        ← Mono 30 px    │ │
│ │ ● Pagado          (badge verde)     │ │ ──────────────────────────────── │ │
│ │ Consultado hace 2 min               │ │ COBRADO POR STRIPE               │ │
│ │ [ Consultar estado en Stripe ]      │ │ $5,429.00        ← Mono 30 px    │ │
│ │ ─────────────────────────────────── │ │ ✓ Los montos coinciden           │ │
│ │ Tarjeta       VISA •••• 4242        │ │ ──────────────────────────────── │ │
│ │ Fecha de pago 24 sep 2026 · 10:42   │ │ CLIENTE … ENVÍO … (sin cambios)  │ │
│ │ Monto         $5,429.00 MXN         │ │ ┌──────────────────────────────┐ │ │
│ │ ID de pago    pi_3Q…8xZ  [Copiar]   │ │ │ Validar pago               ▟ │ │ │
│ │ Ver este pago en Stripe ↗           │ │ └──────────────────────────────┘ │ │
│ │ ─────────────────────────────────── │ │ [ Rechazar pago ]                │ │
│ │ ⓘ Stripe ya cobró este pago. Si lo  │ │ [ Cancelar pedido ]              │ │
│ │   rechazas, el monto se abona al    │ │                                  │ │
│ │   cliente como saldo a favor.       │ │                                  │ │
│ └─────────────────────────────────────┘ └──────────────────────────────────┘ │
│ [ PRODUCTOS DEL PEDIDO … ]  [ HISTORIAL … incluye "Pago en proceso" ]         │
└───────────────────────────────────────────────────────────────────────────────┘
```

Contenido del bloque por método (etiquetas 13 px `#9FB2C3`, valores Mono 13–14 px `#EAF2F8`,
como `<dl>`):

| Dato | Tarjeta | OXXO | SPEI |
|---|---|---|---|
| Título del bloque | PAGO CON TARJETA | PAGO EN OXXO | TRANSFERENCIA SPEI |
| Estado en Stripe (badge) | sí | sí | sí |
| Identificador | Marca + `•••• 4242` | Referencia OXXO (agrupada de 4) | CLABE asignada + referencia |
| Fecha de pago | sí | sí | sí |
| Fecha límite que tenía | — | sí | sí |
| Monto recibido | sí | sí | sí (puede diferir, §6.3) |
| ID de pago Stripe + copiar | sí | sí | sí |
| Enlace "Ver este pago en Stripe ↗" | sí (pestaña nueva, `rel="noopener"`) | sí | sí |

**Badge "Estado en Stripe"** (traducción obligatoria, nunca el valor técnico):

| `payments.status` | Texto | Color |
|---|---|---|
| `pagado` | Pagado | `#45E39A` contorno |
| `procesando` / `requiere_accion` / `iniciado` | En proceso | `#9085E9` contorno |
| `revision` | Requiere revisión | `#FFB547` lleno (texto `#07111C`) |
| `fallido` | Falló | `#FF7A86` contorno |
| `vencido` | Venció | `#FF7A86` contorno |
| `cancelado` | Cancelado | `#9FB2C3` contorno |

- **"Consultar estado en Stripe"** (P6.2): botón secundario `sm` (36 px). Al pulsar: spinner +
  "Consultando…"; al terminar, actualiza el badge y la línea "Consultado hace un momento", y
  anuncia en `aria-live="polite"`: "Estado en Stripe: Pagado". Si el estado consultado **no**
  coincide con el que teníamos, banner ámbar: **"Stripe dice «Falló», pero aquí teníamos
  «Pagado». No valides este pago hasta aclararlo."** y "Validar pago" se deshabilita.
- **Botón "Rechazar pago"** (antes "Rechazar comprobante") — modal (§12.2 de `diseño.md`):
  **"¿Rechazar el pago de SGQ-7K4M2X?"** · "Stripe ya cobró **$5,429.00**. Al rechazarlo, ese monto
  se abona a Mariana López como **saldo a favor** (no se devuelve a su tarjeta). El pedido se
  cancela y se liberan los productos. No se puede deshacer." · motivo obligatorio ·
  `[Cancelar] [Rechazar y abonar $5,429.00]` (rojo lleno). RN-16.
- **Validar pago**: mismo modal de §11.5 ("Se apartan las piezas…" se cambia por "Las piezas ya
  están apartadas; el pedido pasa a *Listo para envío*").
- En la **cabecera** del detalle, el chip de método (`TARJETA`) va a la izquierda del badge de
  estado.
- **Historial**: se agrega el renglón "Pago en proceso · OXXO" con su hora, y "Pago confirmado por
  Stripe" con fuente "Stripe" (arquitectura §6, `source = 'stripe'`).

### 6.3 Casos de revisión especiales (banner arriba de la columna izquierda, ámbar)

| Caso | Banner | Acción primaria |
|---|---|---|
| SPEI monto distinto (arq. §4.3) | **"El cliente transfirió $5,000.00 y el pedido es de $5,429.00 — faltan $429.00. El dinero quedó en su cuenta de Stripe; decide cómo resolverlo."** | "Validar pago" deshabilitado; acciones: "Contactar al cliente" y "Abonar $5,000.00 como saldo y cancelar" |
| Pagado sin inventario (arq. §4.1) | **"Este pago llegó después de que se liberaron los productos y ya no hay existencias de «Torniquete…». Abona el monto como saldo a favor."** | "Abonar $5,429.00 como saldo a favor" (primario) |
| No se pudo cancelar en Stripe (arq. §4.2) | **"Stripe ya había recibido fondos y no se pudo cancelar el cobro. Revisa este pago en Stripe."** | Enlace a Stripe |

### 6.4 Estados del bloque

| Estado | Diseño |
|---|---|
| **Cargando** | Esqueleto con la forma del bloque; el panel de importes no espera |
| **Error al leer datos de pago** | "No pudimos cargar los datos del pago. El pedido no cambió." + "Reintentar"; "Validar pago" deshabilitado con motivo "Necesitas ver los datos del pago antes de validarlo." |
| **Error al consultar Stripe** | Banner rojo local: **"No pudimos comunicarnos con Stripe. El estado mostrado es el último que recibimos (hace 12 min)."** + "Reintentar". Validar sigue habilitado (el webhook ya confirmó) |
| **Pedido en "Pago en proceso"** (admin lo abre desde el filtro) | Bloque con badge "En proceso", fecha límite y texto: **"El cliente aún no termina de pagar. Este pedido llegará a tu bandeja cuando Stripe confirme el pago."** Acciones: solo "Cancelar pedido" (fantasma). Sin "Validar" |

### 6.5 Accesibilidad admin

Datos del pago como `<dl>`; badge de estado con texto; "•••• 4242" con
`aria-label="Tarjeta Visa terminada en 4242"`; enlace externo anuncia "(abre Stripe en una pestaña
nueva)"; banners de revisión con `role="alert"` solo al aparecer tras "Consultar".

---

## 7. Aviso "Quedan X" en catálogo y ficha de producto (P8)

**Conflicto que la dueña debe conocer:** `index.html` ya tiene un indicador de stock en cada
tarjeta (`bars()` + `stockLabel()`, l. 2030–2041) que dice **"Últimas N piezas"** en ámbar cuando
el stock es ≤ 3. P8 pide "Quedan X" para 1–2. Propuesta: **no agregar un segundo aviso**, sino
reutilizar ese mismo lugar y reforzarlo solo para 1–2 piezas. Dos avisos de stock en la misma
tarjeta dirían lo mismo dos veces.

| Disponible | Barras (sin cambio) | Texto (Mono 12.5 px) | Refuerzo nuevo |
|---|---|---|---|
| 0 | vacías | "Agotado" `#9FB2C3` | — |
| **1 – 2** | 1 barra `#FFB547` | **"¡Quedan 2!"** / **"¡Queda 1!"** `#FFB547` | **Etiqueta sobre la foto**, esquina superior izquierda: `QUEDAN 2`, IBM Plex Mono 500 11 px, `letter-spacing:1.2px`, fondo `#FFB547`, texto `#07111C` (10.81:1), `padding:4px 8px`, corte de 8 px (`clip-path` de chip, `diseño.md` §2.4) |
| 3 | 2 barras | "Últimas 3 piezas" (sin cambio) | — |
| ≥ 4 | según `bars()` | "N disponibles" (sin cambio) | — |

- "Disponible" = stock menos apartados (incluye apartados de `pago_en_proceso`), no stock bruto.
- **Ficha de producto (PDP):** mismo texto junto al selector de cantidad, y el selector no permite
  pasar del disponible; al intentarlo: "Solo quedan 2 piezas."
- Sin animación, sin pulso: urgencia informativa, no presión (el sitio ya reserva el pulso para
  estados de pedido).
- **Accesibilidad:** la etiqueta sobre la foto es `aria-hidden="true"` porque el texto de stock ya
  lo dice; el texto de stock está dentro del nombre accesible de la tarjeta ("… quedan 2 piezas").
- **Estados:** si el dato de stock no carga, se oculta el aviso (no se muestra "Quedan 0" ni un
  hueco). Si el producto se agota mientras el cliente mira, el aviso cambia al refrescar; el
  checkout lo resuelve con el estado "Sin inventario" (§2.6).
- Responsivo: la etiqueta mantiene 11 px en móvil; es lo único superpuesto a la foto.

---

## 8. Admin — porcentaje de devolución libre 10 %–100 % (P9, RN-6 modificada)

Sustituye el bloque "SALDO A FAVOR QUE SE OTORGA" del cajón de `diseño.md` §11.10 (los radios fijos
100 % / 70 % / Otro).

```
│ SALDO A FAVOR QUE SE OTORGA                  │  Mono 11 px ls 1.2 #9FB2C3
│ Sugerido por la condición declarada: 100%    │  13 px #9FB2C3
│  [ 100% ] [ 70% ] [ 50% ]   ← atajos (chips) │
│  Porcentaje  [  85 ] %                       │  Campo number 44 px, Mono 16
│  ├──────────────────────●────┤ 10%    100%   │  deslizador, paso 1
│  $2,804.15                ← Mono 30 px       │
│  Precio pagado $3,299.00 × 85%               │  13 px #9FB2C3
│  Saldo actual de Jorge: $0.00                │
│  Quedará con: $2,804.15                      │
│  ⓘ Siempre se abona como saldo a favor.      │  13 px, nunca efectivo
│    Nunca se devuelve en efectivo ni a tarjeta│
```

- **Control principal: campo numérico entero** (`Campo` `number`, `min=10`, `max=100`, `step=1`,
  `inputmode="numeric"`), con el sufijo "%" fuera del campo. **Deslizador** sincronizado debajo
  (pista `#22344A`, relleno `#3CE7FF`, control 20 px con foco visible) para ajuste rápido con
  mouse. **Chips de atajo** 100 % / 70 % / 50 % (`ChipFiltro`, activo en cian) porque son los
  valores habituales (Hick: tres atajos, no una lista).
- Viene **prellenado** con el sugerido según la condición (100 % sellado, 70 % abierto), igual que
  hoy.
- El importe se recalcula en vivo (Mono 30 px), redondeado a centavos; el botón sigue nombrando el
  importe: **"Aprobar y abonar $2,804.15"**.
- Validación (P9, también en servidor/BD): vacío → "Escribe un porcentaje entre 10 y 100." ·
  < 10 o > 100 → "El porcentaje debe estar entre 10% y 100%." · decimal → "Usa un número entero,
  sin decimales." Error en `#FF7A86` 13 px con ícono, borde del campo `#FF4D5E`, botón de aprobar
  deshabilitado.
- Si el valor elegido difiere del sugerido, nota ámbar: "Estás otorgando 85% en lugar del 100%
  sugerido. Se registrará que tú lo elegiste." (registro de quién eligió, P9).
- Modal de confirmación: igual que §11.10, con "Se abonan **$2,804.15** (85%) de saldo a favor…".
- Accesibilidad: `<fieldset>` + `<legend>` "Saldo a favor que se otorga"; campo y deslizador con
  la misma etiqueta y `aria-describedby` al importe calculado; el importe en `aria-live="polite"`;
  chips con `aria-pressed`. (Reemplaza el requisito "radios reales" de `diseño.md` §10.)
- Móvil (cajón a pantalla completa): chips en una fila, campo de ancho completo, deslizador debajo
  con control de 44 px de área táctil.
- **Sitio público:** los textos que hoy dicen "100% sellado / 70% abierto" deberían decir que el
  porcentaje lo decide el equipo según la revisión. Es cambio de texto en un archivo protegido →
  **autorizado por la dueña (D-P6)**. Alcance exacto, sin excepción: **únicamente esas dos frases
  ("100% sellado" y "70% abierto") en `index.html`** — ningún otro texto, estructura o estilo de
  ese archivo se toca. Redacción propuesta: sustituir por una sola frase que no prometa un
  porcentaje fijo, p. ej. **"El porcentaje de tu saldo a favor lo define nuestro equipo al revisar
  tu devolución."**, en los mismos dos lugares donde hoy aparecen esas leyendas.

---

## 9. Componentes (Atomic Design) — solo lo nuevo o modificado

| Nivel | Componente | Nuevo / modificado | Notas |
|---|---|---|---|
| Átomo | `Badge` | + variante `proceso` (`#9085E9`, contorno) | §1 |
| Átomo | `IconoReloj`, `IconoCandado` | nuevos | SVG trazo 1.5 `currentColor`, como el resto |
| Átomo | `AnilloProceso` | nuevo | Punto de línea de tiempo con `sgSpin` |
| Átomo | `ChipMetodoPago` | nuevo | TARJETA/OXXO/SPEI/COMPROBANTE, neutro |
| Molécula | `OpcionMetodoPago` | nuevo | §2.2 |
| Molécula | `DatoCopiable` | nuevo (extrae el patrón l. 1150–1156) | Etiqueta + valor Mono + "Copiar" + toast. Lo usan SPEI, OXXO y admin |
| Molécula | `FechaLimitePago` | nuevo | Ámbar + ícono + día de semana y hora |
| Molécula | `AvisoQuedan` | nuevo | Etiqueta sobre foto de §7 |
| Molécula | `IndicadorStock` | modificado | Texto "¡Quedan X!" para 1–2 |
| Molécula | `CampoPorcentaje` | nuevo | Campo + deslizador + chips + error |
| Molécula | `LineaTiempoEstado` / `PasosPedido` | modificado | Pasos por método + estado `pago_en_proceso` |
| Molécula | `BadgeEstadoPedido` | modificado | + `pago_en_proceso` |
| Organismo | `SelectorMetodoPago` | nuevo | Grupo de 4 opciones + Payment Element + estados |
| Organismo | `FichaPagoOXXO` | nuevo | §3, se reutiliza en confirmación y detalle |
| Organismo | `DatosPagoSPEI` | nuevo | §4, ídem |
| Organismo | `DetallePagoStripe` (admin) | nuevo | §6.2 |
| Organismo | `ResolutorDevolucion` (admin) | modificado | usa `CampoPorcentaje` |

---

## 10. Responsividad (breakpoints de `diseño.md` §9.1: < 760 · 760–1179 · ≥ 1180)

| Pantalla | Móvil | Tablet | Escritorio |
|---|---|---|---|
| **Checkout / selector** | Una columna. Opciones de ancho completo; el `aside` "Tu pedido" se vuelve un resumen plegable arriba ("Total a pagar $5,429.00 ▾") y el botón de pagar va **fijo al pie** (`sticky bottom:0`, fondo `#0B1622`, borde superior `#1F3244`) — Fitts | Una columna, `aside` debajo | Dos columnas, `aside` sticky (sin cambio) |
| **Ficha OXXO** | Monto y fecha apilados; código de barras a ancho completo (mín. 280 px — si la pantalla es menor, solo dígitos grandes); pasos 01–03 apilados; "Descargar" fijo al pie | Monto y fecha lado a lado; pasos en 3 columnas | Igual, máx. 820 px |
| **Datos SPEI** | Cada dato en su fila con "Copiar" a la derecha (44×44); CLABE a 20 px en dos renglones si no cabe, sin cortar grupos; "Copiar todos" fijo al pie | Como escritorio | Como l. 1123 |
| **PasosPedido** | Scroll horizontal con nodos de 104 px (ya en `signal()`); se centra en el paso actual al cargar | Todos visibles | Todos visibles |
| **Mis pedidos** | Tarjeta apilada: folio + chip, línea de fecha límite, botón de ancho completo | Como escritorio | Sin cambio de layout |
| **Admin detalle Stripe** | Una columna: **bloque de pago primero**, importes debajo, acciones fijas al pie (igual que §9.2 de `diseño.md`) | 60/40 | 58/42 |
| **Admin porcentaje** | §8 | Cajón | Cajón lateral |
| **Quedan X** | Igual, 11 px | Igual | Igual |

Se prueba a 320 px sin scroll horizontal de página.

---

## 11. Accesibilidad por pantalla

| Pantalla | Requisitos |
|---|---|
| **Selector de método** | `<fieldset>` + `<legend>` "¿Cómo quieres pagar?"; cada opción es `<input type="radio">` real (visualmente oculto) con `<label>` que envuelve toda la tarjeta; flechas cambian de opción; la opción deshabilitada usa `disabled` + `aria-describedby` al motivo. El Payment Element de Stripe trae su propia accesibilidad; se le da un título: "Datos de tu tarjeta" |
| **Errores de pago** | Banner con `role="alert"` y foco programático; nunca solo borde rojo |
| **Ficha OXXO** | Imagen del código con `alt="Código de barras para pagar en OXXO, referencia 9300 0123 …"`; la referencia también como texto seleccionable; fecha límite como `<time datetime>` |
| **Datos SPEI** | `<dl>`; botones "Copiar" con nombre completo ("Copiar CLABE", "Copiar monto"); confirmación en `aria-live="polite"` |
| **PasosPedido** | `<ol>` con `aria-current="step"` en el paso actual; el anillo que gira es `aria-hidden`, el texto "Pago en proceso" lo dice |
| **Admin Stripe** | §6.5 |
| **Porcentaje** | §8 |
| **Quedan X** | §7 |

Foco visible: `outline:2px solid #3CE7FF; outline-offset:2px`; con `clip-path`, `box-shadow inset`
(`diseño.md` §5.5). Orden de tabulación = orden visual.

---

## 12. Advertencias para el coder

1. **No usar el tema por defecto de Stripe.** Sin `appearance`, el Payment Element sale en blanco
   con azul `#0570DE`: rompería el modo oscuro. Todos los valores de §2.7 son obligatorios.
2. El recuadro blanco del código OXXO es la **única** excepción al modo oscuro; no se generaliza
   a otras tarjetas.
3. Los plazos ("2 días", "30 minutos", tope de OXXO) nunca van escritos en el JSX: salen de
   configuración/Stripe.
4. Ningún mensaje muestra valores técnicos (`requires_action`, `pi_…` solo en el panel admin y
   junto a "ID de pago", `payment_intent`, códigos de decline).
5. El estado nuevo obliga a revisar **todo** lo que enumera estados (`statusIndex`,
   `statusLabel`, `chipStyle`, filtros, tablero, `PasosPedido`) — arquitectura §10.
6. `diseño.md` §4 sigue vigente: sin CSS heredado de `create-next-app`, sin Geist.

---

## 13. Decisiones que la dueña debe aprobar

| # | Pregunta | Propuesta por defecto | Estado |
|---|---|---|---|
| **D-P1** | ¿Usar **violeta** para "Pago en proceso"? Es el único color nuevo del sitio | Sí (§1) | Aprobado por defecto (sin objeción) |
| **D-P2** | Para pedidos pagados con Stripe, el cliente ve **"Pago recibido"** en vez de "Comprobante recibido" (el admin sigue viendo el mismo estado con chip de método) | Sí (§5.1) | Aprobado por defecto (sin objeción) |
| **D-P3** | El código de barras OXXO va en un **recuadro blanco** (necesario para que lo lea el escáner de la caja) | Sí (§3) | Aprobado por defecto (sin objeción) |
| **D-P4** | Mencionar que "OXXO puede cobrar una comisión aparte" — confirmar si aplica | Mencionarlo, pendiente confirmar | **Confirmado por la dueña: sí cobra comisión al cliente.** Texto pasa a afirmativo (§3) |
| **D-P5** | "Quedan X" **reutiliza** el aviso "Últimas N piezas" que ya existe + etiqueta ámbar sobre la foto para 1–2 piezas, en vez de un aviso adicional | Sí (§7) | Aprobado por defecto (sin objeción) |
| **D-P6** | Actualizar en el sitio público los textos "100% sellado / 70% abierto" (archivo protegido) por uno que diga que el porcentaje depende de la revisión | Sí, con su autorización | **Autorizado por la dueña**, alcance: solo esas 2 frases en `index.html` (§8) |
| **D-P7** | Descargar la ficha OXXO = abrir la ficha oficial de Stripe para imprimir/guardar como PDF (no un PDF propio) | Sí (§3) | Aprobado por defecto (sin objeción) |
| **D-P8** | Atajos de porcentaje en devoluciones: 100 % / 70 % / 50 % | Sí (§8) | Aprobado por defecto (sin objeción) |

**Con esto, el diseño de la Épica P queda aprobado en su totalidad** (8/8 decisiones resueltas: 2
confirmadas explícitamente por la dueña — D-P4, D-P6 — y 6 aprobadas por defecto al no objetar los
valores recomendados). Queda listo para pasar a la fase de implementación (`coder`).
