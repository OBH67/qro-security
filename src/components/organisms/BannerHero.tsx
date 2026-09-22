"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BannerRow, ReviewRow } from "@/types/database";
import { urlImagenPublica } from "@/lib/imagenes";
import { PanelResenas } from "@/components/organisms/PanelResenas";

/**
 * index.html:276-338 — sección completa del "muro de video" de la
 * portada: capas de degradado por banner, tarjeta con imagen real y
 * puntos, panel de reseñas al lado, y la franja de confianza debajo
 * (envío / factura / asesoría). Traducción literal, colores y medidas
 * exactos del demo.
 *
 * El demo usa 3 slides fijos con colores de degradado codificados en el
 * propio componente (`heroSlidesData`, index.html:1955-1959). Aquí esos
 * colores son datos reales de `banners.gradient_from`/`gradient_to`
 * (columnas ya definidas en `0006_servicios_y_contenido.sql`) para que el
 * administrador pueda cambiar el banner sin tocar código — con un valor
 * de respaldo (`COLOR_DEGRADADO_DEFECTO`) por si un banner viejo no lo
 * trae, en vez de reventar.
 */

const DEGRADADO_A_DEFECTO = "#2E9E5B";
const DEGRADADO_B_DEFECTO = "#0B2A17";
const CICLO_MS = 5000;

export function BannerHero({
  banners,
  grupoSlugPorId,
  reseñas,
}: {
  banners: BannerRow[];
  grupoSlugPorId: Map<string, string>;
  reseñas: ReviewRow[];
}) {
  // Arranca en 0 (igual en servidor y cliente, sin riesgo de mismatch de
  // hidratación) y se resincroniza con el reloj de pared (`Date.now()`) en
  // el efecto de abajo, que solo corre en el cliente. Sin esto, `indice`
  // siempre arrancaba en 0 al montar — y este componente vive dentro del
  // árbol de la portada, así que se desmonta al salir de `/` y se vuelve a
  // montar al regresar. El color de fondo de `EncabezadoSitio` (que vive en
  // el layout raíz, nunca se desmonta, y calcula su propio índice también
  // desde `Date.now()` con el mismo período) casi nunca coincidía con el
  // slide que se veía aquí al volver a la portada.
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (banners.length === 0) return;
    const sincronizar = () => setIndice(Math.floor(Date.now() / CICLO_MS) % banners.length);
    sincronizar();
    if (banners.length < 2) return;
    const id = setInterval(sincronizar, CICLO_MS);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section style={{ position: "relative", zIndex: 0, isolation: "isolate", borderBottom: "1px solid #16283A", background: "#07111C" }}>
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1400,
            margin: "0 auto",
            padding: "clamp(12px,2.2vw,26px) clamp(12px,2.4vw,32px)",
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              flex: "1 1 560px",
              minWidth: 0,
              border: "1px solid #1F3244",
              borderRadius: 14,
              overflow: "hidden",
              background: "#0B1622",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 48,
              textAlign: "center",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,3vw,38px)", color: "#EAF2F8" }}>
                Equipo de seguridad electrónica en Querétaro
              </h1>
              <p style={{ margin: "14px auto 0", maxWidth: "56ch", color: "#9FB2C3" }}>
                Videovigilancia, control de acceso, automatización, energía, cableado y GPS vehicular.
              </p>
            </div>
          </div>
          <PanelResenas reseñas={reseñas} />
        </div>
        <FranjaConfianza />
      </section>
    );
  }

  const activo = banners[indice];
  const grupoSlug = activo.group_id ? grupoSlugPorId.get(activo.group_id) : undefined;

  return (
    <section style={{ position: "relative", zIndex: 0, isolation: "isolate", borderBottom: "1px solid #16283A", background: "#07111C" }}>
      {banners.map((b, i) => {
        const a = b.gradient_from ?? DEGRADADO_A_DEFECTO;
        const c = b.gradient_to ?? DEGRADADO_B_DEFECTO;
        return (
          <span
            key={b.id}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: i === indice ? 1 : 0,
              transition: "opacity 900ms ease",
              background: `radial-gradient(120% 130% at 14% 0%,${a} 0%,rgba(7,17,28,0) 60%),radial-gradient(95% 100% at 92% 6%,${c} 0%,rgba(7,17,28,0) 62%)`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1400,
          margin: "0 auto",
          padding: "clamp(12px,2.2vw,26px) clamp(12px,2.4vw,32px)",
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          alignItems: "stretch",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 560px", minWidth: 0, border: "1px solid #1F3244", borderRadius: 14, overflow: "hidden", background: "#0B1622" }}>
          <Link
            href={grupoSlug ? `/catalogo/${grupoSlug}` : "/catalogo"}
            aria-label={activo.title}
            style={{ position: "relative", display: "block", width: "100%", aspectRatio: "16/9", padding: 0, overflow: "hidden", background: "#07111C" }}
          >
            {banners.map((b, i) => {
              const a = b.gradient_from ?? DEGRADADO_A_DEFECTO;
              const c = b.gradient_to ?? DEGRADADO_B_DEFECTO;
              return (
                <span
                  key={b.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: i === indice ? 1 : 0,
                    transition: "opacity 900ms ease",
                    background: `linear-gradient(112deg,${a} 0%,${c} 58%,#07111C 100%)`,
                  }}
                />
              );
            })}
            {banners.map((b, i) => (
              <Image
                key={b.id}
                src={urlImagenPublica(b.image_url)}
                alt={b.title}
                fill
                sizes="(max-width: 900px) 100vw, 60vw"
                priority={i === 0}
                style={{ objectFit: "contain", opacity: i === indice ? 1 : 0, transition: "opacity 900ms ease" }}
              />
            ))}
          </Link>
          {banners.length > 1 && (
            <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", gap: 8, justifyContent: "center" }}>
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Banner ${i + 1}: ${b.title}`}
                  onClick={() => setIndice(i)}
                  style={{
                    width: i === indice ? 26 : 9,
                    height: 9,
                    borderRadius: 999,
                    transition: "width 300ms ease,background 300ms ease",
                    background: i === indice ? "#3CE7FF" : "rgba(255,255,255,.4)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <PanelResenas reseñas={reseñas} />
      </div>

      <FranjaConfianza />
    </section>
  );
}

/** index.html:324-337 — franja de confianza bajo el hero. */
function FranjaConfianza() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 1400,
        margin: "0 auto",
        padding: "0 clamp(14px,2.4vw,32px) clamp(20px,2.6vw,30px)",
        display: "flex",
        flexWrap: "wrap",
        gap: "clamp(14px,2vw,26px)",
      }}
    >
      <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "#9FB2C3" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#3CE7FF" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
          <path d="M3 7h11v9H3z" />
          <path d="M14 10h4l3 3v3h-7" />
          <circle cx="7" cy="18" r="1.6" />
          <circle cx="17" cy="18" r="1.6" />
        </svg>
        Envío a domicilio desde Querétaro
      </span>
      <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "#9FB2C3" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#3CE7FF" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
          <path d="M6 3h9l4 4v14H6z" />
          <path d="M9 11h7M9 15h7" />
        </svg>
        Factura CFDI
      </span>
      <span style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "#9FB2C3" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#3CE7FF" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
          <path d="M21 12a9 9 0 1 1-3.6-7.2" />
          <path d="M12 7v5l4 2" />
        </svg>
        Asesoría técnica por WhatsApp
      </span>
    </div>
  );
}
