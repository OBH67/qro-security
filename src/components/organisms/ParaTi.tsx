"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PestanaParaTi } from "@/server/db/queries/catalogo";
import type { ProductoTarjeta } from "@/lib/producto";

/**
 * index.html:340-372 — sección "Para Ti": pestañas por subcategoría con un
 * riel horizontal que se desplaza solo (`ptAuto`, cada 2.6 s, pausado al
 * pasar el mouse) y flechas para moverlo a mano. La tarjeta del riel es un
 * marcado distinto al de `TarjetaProducto` (imagen centrada `contain`,
 * pie con "Acceder a mi cuenta") — se traduce aparte porque el demo así lo
 * pinta (index.html:349-364), no se reutiliza `TarjetaProducto` para no
 * inventar un híbrido que no está en ninguno de los dos.
 *
 * El avance automático usa `scrollBy({behavior:'smooth'})` nativo en vez
 * del `requestAnimationFrame` a mano del demo (index.html:2090-2101): el
 * resultado visible —el riel se desliza suave, cíclicamente— es el mismo;
 * cambia solo el mecanismo interno de la animación.
 */
export function ParaTi({
  pestañas,
  mapaProductos,
}: {
  pestañas: PestanaParaTi[];
  mapaProductos: Map<string, ProductoTarjeta>;
}) {
  const [pestañaActiva, setPestañaActiva] = useState(0);
  const rielRef = useRef<HTMLDivElement>(null);
  const pausadoRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausadoRef.current) return;
      const el = rielRef.current;
      if (!el) return;
      const maximo = el.scrollWidth - el.clientWidth;
      const siguiente = el.scrollLeft + 278;
      el.scrollTo({ left: siguiente >= maximo - 12 ? 0 : siguiente, behavior: "smooth" });
    }, 2600);
    return () => clearInterval(id);
  }, [pestañaActiva]);

  if (pestañas.length === 0) return null;

  const activa = pestañas[Math.min(pestañaActiva, pestañas.length - 1)];
  const items = activa.productos.map((p) => mapaProductos.get(p.id)).filter((p): p is ProductoTarjeta => !!p);

  function desplazar(dir: 1 | -1) {
    const el = rielRef.current;
    if (!el) return;
    const maximo = el.scrollWidth - el.clientWidth;
    let destino = el.scrollLeft + 278 * dir;
    if (dir > 0 && el.scrollLeft >= maximo - 12) destino = 0;
    else if (dir < 0 && el.scrollLeft <= 4) destino = maximo;
    el.scrollTo({ left: Math.max(0, Math.min(maximo, destino)), behavior: "smooth" });
  }

  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "clamp(40px,4.5vw,64px) clamp(14px,2.4vw,32px) 0" }}>
      <h2 style={{ margin: "0 0 18px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,2.6vw,40px)", lineHeight: 1.15, color: "#EAF2F8" }}>
        Para Ti
      </h2>

      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "2px 2px 4px" }}>
        {pestañas.map((t, i) => (
          <button
            key={t.subcategoriaId}
            type="button"
            onClick={() => setPestañaActiva(i)}
            style={{
              flex: "0 0 auto",
              minHeight: 40,
              padding: "9px 15px",
              borderRadius: 9,
              background: i === pestañaActiva ? "rgba(60,231,255,.14)" : "#16283A",
              border: `1px solid ${i === pestañaActiva ? "#3CE7FF" : "#1F3244"}`,
              fontFamily: "'Chakra Petch',sans-serif",
              fontWeight: 500,
              fontSize: 14.5,
              whiteSpace: "nowrap",
              color: i === pestañaActiva ? "#3CE7FF" : "#EAF2F8",
            }}
          >
            {t.nombre}
          </button>
        ))}
      </div>

      <div
        style={{ position: "relative", marginTop: 20 }}
        onMouseEnter={() => (pausadoRef.current = true)}
        onMouseLeave={() => (pausadoRef.current = false)}
      >
        <div ref={rielRef} style={{ display: "flex", gap: 0, overflowX: "auto", borderLeft: "1px solid #1F3244" }}>
          {items.map((p) => (
            <div
              key={p.id}
              style={{
                flex: "0 0 278px",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid #1F3244",
                borderTop: "1px solid #1F3244",
                borderBottom: "1px solid #1F3244",
                background: "#0B1622",
              }}
            >
              <Link href={`/producto/${p.slug}`} style={{ display: "grid", placeItems: "center", width: "100%", height: 258, padding: 22, position: "relative" }}>
                {p.imagenUrl ? (
                  <Image src={p.imagenUrl} alt="" fill sizes="278px" style={{ objectFit: "contain", padding: 22 }} />
                ) : (
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#7E93A6" }}>{p.sku}</span>
                )}
              </Link>
              <Link href={`/producto/${p.slug}`} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9, padding: "0 20px 18px", textAlign: "left" }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: 1.3, color: "#7E93A6" }}>{p.marca ?? p.sku}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#EAF2F8" }}>{p.name}</span>
                <span style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: "#9FB2C3" }}>
                  {p.sku}
                </span>
              </Link>
              <Link
                href="/ingresar"
                style={{ padding: "14px 12px", borderTop: "1px solid #1F3244", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 14.5, color: "#3CE7FF", textAlign: "center" }}
              >
                Acceder a mi cuenta
              </Link>
            </div>
          ))}
        </div>
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => desplazar(-1)}
          style={{
            position: "absolute",
            left: -8,
            top: 118,
            width: 42,
            height: 42,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: "#16283A",
            border: "1px solid #2C4560",
            color: "#EAF2F8",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 17, height: 17 }}>
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          onClick={() => desplazar(1)}
          style={{
            position: "absolute",
            right: -8,
            top: 118,
            width: 42,
            height: 42,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: "#16283A",
            border: "1px solid #2C4560",
            color: "#EAF2F8",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 17, height: 17 }}>
            <path d="m10 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
