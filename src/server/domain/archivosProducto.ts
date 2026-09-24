/**
 * Reglas de negocio de las fotos y documentos de producto (F1.4,
 * diseño.md §11.7, pestañas "Fotos" y "Documentos"). Mismo patrón de
 * `comprobantes.ts` (tipo declarado + magic bytes + tamaño), sobre el
 * bucket PÚBLICO en vez del privado — estos archivos sí se muestran en la
 * tienda.
 */

export const TIPOS_FOTO_PRODUCTO_ACEPTADOS = ["jpg", "png", "webp"] as const;
export type TipoFotoProducto = (typeof TIPOS_FOTO_PRODUCTO_ACEPTADOS)[number];

export const TAMANO_MAXIMO_FOTO_PRODUCTO_BYTES = 5 * 1024 * 1024; // 5 MB, mismo tope que C2.1

const CONTENT_TYPE_POR_TIPO_FOTO: Record<TipoFotoProducto, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function contentTypeFotoPermitido(contentType: string): TipoFotoProducto | null {
  const entrada = Object.entries(CONTENT_TYPE_POR_TIPO_FOTO).find(([, ct]) => ct === contentType);
  return (entrada?.[0] as TipoFotoProducto) ?? null;
}

/** Magic bytes de jpg/png/webp — no HEIC: a diferencia del comprobante
 * (que solo ve el admin), esta foto se sirve directo en la tienda y HEIC
 * no lo renderiza casi ningún navegador. */
export function detectarTipoFotoPorMagicBytes(bytes: Buffer): TipoFotoProducto | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
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
  // WebP: contenedor RIFF ("RIFF" en 0-3, tamaño en 4-7, "WEBP" en 8-11).
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") {
    return "webp";
  }
  return null;
}

export interface ResultadoValidacionArchivo {
  ok: boolean;
  motivo?: string;
}

export function validarFotoProducto(params: { tamanoBytes: number; contentTypeDeclarado: string; primerosBytes: Buffer }): ResultadoValidacionArchivo {
  if (params.tamanoBytes > TAMANO_MAXIMO_FOTO_PRODUCTO_BYTES) {
    return { ok: false, motivo: "La foto pesa más de 5 MB. Sube una versión más ligera." };
  }
  const tipoDeclarado = contentTypeFotoPermitido(params.contentTypeDeclarado);
  if (!tipoDeclarado) {
    return { ok: false, motivo: "Solo se aceptan fotos JPG, PNG o WebP." };
  }
  const tipoReal = detectarTipoFotoPorMagicBytes(params.primerosBytes);
  if (!tipoReal || tipoReal !== tipoDeclarado) {
    return { ok: false, motivo: "El archivo no parece ser una foto JPG, PNG o WebP válida." };
  }
  return { ok: true };
}

export const TAMANO_MAXIMO_DOCUMENTO_PRODUCTO_BYTES = 10 * 1024 * 1024; // 10 MB — fichas técnicas/manuales

export function detectarSiEsPdf(bytes: Buffer): boolean {
  return bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-";
}

/** Solo PDF (modelo-datos.md §6: `productos/{sku}/docs/{archivo}.pdf`) —
 * cualquier otro formato de documento abre la puerta a HTML/scripts
 * servidos desde el bucket público con el Content-Type equivocado. */
export function validarDocumentoProducto(params: { tamanoBytes: number; contentTypeDeclarado: string; primerosBytes: Buffer }): ResultadoValidacionArchivo {
  if (params.tamanoBytes > TAMANO_MAXIMO_DOCUMENTO_PRODUCTO_BYTES) {
    return { ok: false, motivo: "El documento pesa más de 10 MB." };
  }
  if (params.contentTypeDeclarado !== "application/pdf") {
    return { ok: false, motivo: "Solo se aceptan documentos en PDF." };
  }
  if (!detectarSiEsPdf(params.primerosBytes)) {
    return { ok: false, motivo: "El archivo no parece ser un PDF válido." };
  }
  return { ok: true };
}
