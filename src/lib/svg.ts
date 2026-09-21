/** panel-admin-maqueta.html:1300-1303 (`buildPoints`) — traducción
 * literal: convierte una serie de valores en puntos "x,y" de un
 * `<polyline>`, escalados a un ancho/alto/máximo dados. */
export function construirPuntosSvg(datos: number[], ancho: number, alto: number, maximo: number): string {
  if (datos.length <= 1) return "";
  const paso = ancho / (datos.length - 1);
  return datos.map((v, i) => `${(i * paso).toFixed(1)},${(alto - (v / maximo) * alto).toFixed(1)}`).join(" ");
}
