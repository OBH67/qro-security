/** `Salto` (diseño.md §7.1): bloque de esqueleto. Sin texto propio — quien
 * anuncia "Cargando" a lectores de pantalla es `ContenedorCarga`. */
export function Salto({
  ancho = "100%",
  alto = 14,
  style,
}: {
  ancho?: number | string;
  alto?: number | string;
  style?: React.CSSProperties;
}) {
  return <span className="sg-salto" aria-hidden style={{ width: ancho, height: alto, ...style }} />;
}
