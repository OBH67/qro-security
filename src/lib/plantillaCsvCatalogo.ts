/** F2.1: plantilla descargable del importador de catálogo — código puro
 * (sin `server-only`), la usan tanto el cliente (botón "Descarga la
 * plantilla") como el parser del servidor, para no duplicar la lista de
 * columnas en dos lados. */
export const COLUMNAS_PLANTILLA_CATALOGO = ["sku", "nombre", "marca", "grupo", "subcategoria", "precio", "stock", "estado"] as const;

export function generarPlantillaCsvCatalogo(): string {
  const encabezado = COLUMNAS_PLANTILLA_CATALOGO.join(",");
  const ejemplo = "SGQ-VV-0099,Cámara IP bala 4 MP,Hikvision,Videovigilancia,Cámaras IP y NVRs,1289.00,24,activo";
  return `${encabezado}\r\n${ejemplo}\r\n`;
}
