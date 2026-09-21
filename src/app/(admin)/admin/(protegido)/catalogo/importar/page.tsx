import type { Metadata } from "next";
import { ImportadorCatalogo } from "@/components/organisms/admin/ImportadorCatalogo";

export const metadata: Metadata = { title: "Importar catálogo — Panel SG Querétaro" };

export default function PaginaImportarCatalogoAdmin() {
  return <ImportadorCatalogo />;
}
