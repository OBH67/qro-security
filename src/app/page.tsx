// Placeholder de andamiaje. La portada real (hero, grupos, destacados,
// reseñas) se construye en el incremento de "catálogo público" — ver
// `.devsquad/estado.md`. Este archivo solo confirma que el proyecto
// compila y que los tokens de `globals.css` se aplican correctamente.
export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "var(--space-4)",
        padding: "var(--space-8)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "28px" }}>SG Querétaro</h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: 480 }}>
        Andamiaje del proyecto en construcción. El catálogo público se
        implementa en el siguiente incremento.
      </p>
    </main>
  );
}
