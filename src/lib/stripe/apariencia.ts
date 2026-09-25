import type { Appearance } from "@stripe/stripe-js";

/**
 * diseño-pagos-stripe.md §2.7 — Stripe Appearance API. El Payment Element
 * se dibuja dentro de un iframe de Stripe: no puede leer las variables CSS
 * de nuestra página (cross-origin), así que estos valores son los
 * literales exactos de los tokens de `diseño.md` §2 que la tabla de §2.7
 * ya resolvió uno por uno — no son colores inventados, cada comentario
 * indica de qué token viene. Advertencia §12.1: sin este objeto, el
 * Payment Element sale con el tema claro por default de Stripe (azul
 * #0570DE) — rompería el modo oscuro del sitio.
 */
export const aparienciaStripe: Appearance = {
  theme: "night",
  variables: {
    colorPrimary: "#3CE7FF", // --accent
    colorBackground: "#0B1622", // --bg-inset
    colorText: "#EAF2F8", // --text-primary
    colorTextSecondary: "#9FB2C3", // --text-muted
    colorTextPlaceholder: "#7E93A6", // --text-dim
    colorDanger: "#FF7A86", // --danger-text
    colorSuccess: "#45E39A", // --success
    colorWarning: "#FFB547", // --warning
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSizeBase: "16px", // evita el zoom automático de iOS
    borderRadius: "4px", // --radius-input
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #52708F", // --border-input
      padding: "12px 14px",
      boxShadow: "none",
    },
    ".Input:focus": {
      borderColor: "#3CE7FF",
      boxShadow: "0 0 0 1px #3CE7FF",
    },
    ".Input--invalid": {
      borderColor: "#FF4D5E", // --danger
    },
    ".Label": {
      fontSize: "13px",
      fontWeight: "500",
      color: "#9FB2C3",
    },
    ".Error": {
      fontSize: "13px",
      color: "#FF7A86",
    },
  },
};

/** Carga IBM Plex Sans dentro del iframe del Payment Element — §2.7,
 * `fonts: [{ cssSrc: ... }]`. Mismo font family que ya usa el resto del
 * sitio (`--font-body` en `globals.css`), pero el iframe no hereda
 * `next/font`: hay que dárselo por URL. */
export const fuentesStripe = [{ cssSrc: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&display=swap" }];
