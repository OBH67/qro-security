import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Tipografías definidas en `.devsquad/diseno.md` §2.2. Ninguna otra familia
// (ni Geist, que trae `create-next-app` por defecto) debe usarse en el proyecto.
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SG Querétaro",
  description:
    "Plataforma de ventas en línea de Seguridad General Querétaro (SG Querétaro).",
};

// Modo de color único, oscuro, declarado (`diseno.md` §4): sin alternador de
// tema, sin depender de `prefers-color-scheme` del sistema operativo.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`dark ${chakraPetch.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body>{children}</body>
    </html>
  );
}
