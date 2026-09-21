import { SitioConChrome } from "@/components/templates/SitioConChrome";

export default async function LayoutAuth({ children }: { children: React.ReactNode }) {
  return <SitioConChrome>{children}</SitioConChrome>;
}
