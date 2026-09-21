import { SitioConChrome } from "@/components/templates/SitioConChrome";

export default async function LayoutPublico({ children }: { children: React.ReactNode }) {
  return <SitioConChrome>{children}</SitioConChrome>;
}
