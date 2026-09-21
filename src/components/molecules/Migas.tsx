import Link from "next/link";

export interface MigaItem {
  label: string;
  href?: string;
}

/** index.html:521-525 — breadcrumb, el último elemento nunca es enlace. */
export function Migas({ items }: { items: MigaItem[] }) {
  return (
    <nav
      aria-label="Ruta de navegación"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        fontSize: 13,
        color: "var(--text-muted)",
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {i > 0 && <span style={{ color: "var(--border)" }}>/</span>}
          {item.href ? (
            <Link href={item.href} style={{ color: "var(--text-muted)" }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: "var(--text-primary)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
