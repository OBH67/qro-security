import type { Metadata } from "next";
import { LoginStaffForm } from "@/components/organisms/LoginStaffForm";

export const metadata: Metadata = { title: "Ingresar — Panel SG Querétaro" };

/** H2 — login del panel, público (fuera del candado de `(protegido)`). */
export default function PaginaIngresarStaff() {
  return <LoginStaffForm />;
}
