/**
 * Reglas de negocio del comprobante de pago (C2). Código puro — no importa
 * React, Next ni Supabase (arquitectura.md §4, regla de dependencia #2),
 * para poder probarse sin infraestructura.
 */

export const TIPOS_COMPROBANTE_ACEPTADOS = ["jpg", "png", "heic", "pdf"] as const;
export type TipoComprobante = (typeof TIPOS_COMPROBANTE_ACEPTADOS)[number];

export const TAMANO_MAXIMO_COMPROBANTE_BYTES = 5 * 1024 * 1024; // 5 MB — index.html:1408

const CONTENT_TYPE_POR_TIPO: Record<TipoComprobante, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  pdf: "application/pdf",
};

export function contentTypePermitido(contentType: string): TipoComprobante | null {
  const entrada = Object.entries(CONTENT_TYPE_POR_TIPO).find(([, ct]) => ct === contentType);
  return (entrada?.[0] as TipoComprobante) ?? null;
}

/**
 * Detecta el tipo REAL de un archivo por sus primeros bytes (magic
 * numbers), no por la extensión ni el `Content-Type` que declaró el
 * navegador (criterio C2.2 — arquitectura §7.1 paso 5). Regresa `null` si
 * no coincide con ninguno de los tipos aceptados.
 */
export function detectarTipoPorMagicBytes(bytes: Buffer): TipoComprobante | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-") {
    return "pdf";
  }
  // HEIC/HEIF: caja ISOBMFF "ftyp" en el byte 4, con marca heic/heix/mif1/heim/heis/hevc.
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString("latin1") === "ftyp") {
    const marca = bytes.subarray(8, 12).toString("latin1");
    if (["heic", "heix", "mif1", "heim", "heis", "hevc", "heid"].includes(marca)) {
      return "heic";
    }
  }
  return null;
}

export interface ResultadoValidacionComprobante {
  ok: boolean;
  motivo?: string;
}

/** Valida tamaño + tipo declarado + tipo real, en ese orden (mensajes de
 * error entendibles, criterio C2.1). */
export function validarComprobante(params: {
  tamanoBytes: number;
  contentTypeDeclarado: string;
  primerosBytes: Buffer;
}): ResultadoValidacionComprobante {
  if (params.tamanoBytes > TAMANO_MAXIMO_COMPROBANTE_BYTES) {
    return { ok: false, motivo: "El archivo pesa más de 5 MB. Sube una imagen más ligera o un PDF." };
  }
  const tipoDeclarado = contentTypePermitido(params.contentTypeDeclarado);
  if (!tipoDeclarado) {
    return { ok: false, motivo: "Solo se aceptan imágenes JPG, PNG, HEIC o PDF." };
  }
  const tipoReal = detectarTipoPorMagicBytes(params.primerosBytes);
  if (!tipoReal) {
    return {
      ok: false,
      motivo: "El archivo no parece ser una imagen o PDF válido. Sube el comprobante original, sin editar.",
    };
  }
  // HEIC comparte contenedor ISOBMFF con otros formatos de video/imagen no
  // aceptados; validamos que declarado y real coincidan en familia
  // jpg/png/pdf estrictamente, y que heic declarado siga siendo heic real.
  if (tipoDeclarado !== tipoReal) {
    return {
      ok: false,
      motivo: "El tipo real del archivo no coincide con su extensión. Sube el comprobante original.",
    };
  }
  return { ok: true };
}
