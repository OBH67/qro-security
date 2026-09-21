import type { Metadata } from "next";
import { RegistroWizard } from "@/components/organisms/RegistroWizard";

export const metadata: Metadata = { title: "Crear cuenta — SG Querétaro" };

export default function PaginaRegistro() {
  return <RegistroWizard />;
}
