import "server-only";

/**
 * Única fuente de las rutas de objetos en R2 (`arquitectura.md` §7.1:
 * "centralizadas en `src/server/storage/rutas.ts` — un solo lugar que las
 * construye, para que nunca se escriban a mano en dos sitios distintos").
 * Rutas exactas de `.devsquad/modelo-datos.md` §6.
 */

function idAleatorio(): string {
  return crypto.randomUUID();
}

/** `comprobantes/{folio}/{uuid}.{ext}` — bucket privado. */
export function rutaComprobante(folio: string, extension: string): string {
  return `comprobantes/${folio}/${idAleatorio()}.${extension.replace(/^\./, "")}`;
}

/** `devoluciones/{folio}/{uuid}.{ext}` — bucket privado. Reservada para la
 * Épica D (fuera de este incremento), documentada aquí porque la ruta ya
 * es parte del contrato de `modelo-datos.md` §6. */
export function rutaFotoDevolucion(folio: string, extension: string): string {
  return `devoluciones/${folio}/${idAleatorio()}.${extension.replace(/^\./, "")}`;
}

/** `productos/{sku}/{n}.webp` en `modelo-datos.md` §6 — aquí `{n}` se
 * cambia por un uuid (mismo criterio que el resto de las rutas de este
 * archivo: evita colisiones al reemplazar/reordenar fotos) y la
 * extensión real del archivo subido en vez de forzar siempre `.webp`
 * (convertir a WebP requeriría una librería de procesamiento de imágenes
 * — `sharp` — que este proyecto no tiene; documentado como límite real,
 * igual que `.xlsx` en el importador). Bucket público. */
export function rutaFotoProducto(sku: string, extension: string): string {
  return `productos/${sku}/${idAleatorio()}.${extension.replace(/^\./, "")}`;
}

/** `productos/{sku}/docs/{archivo}.pdf` — bucket público. */
export function rutaDocumentoProducto(sku: string, extension: string): string {
  return `productos/${sku}/docs/${idAleatorio()}.${extension.replace(/^\./, "")}`;
}
