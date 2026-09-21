"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearGrupoAction, crearSubcategoriaAction, actualizarCategoriaAction, eliminarSubcategoriaAction } from "@/server/actions/admin/categorias";
import type { NodoGrupo, NodoSubcategoria } from "@/server/db/queries/admin/categorias";

type Seleccion = { tipo: "grupo"; nodo: NodoGrupo; padre: string } | { tipo: "subcategoria"; nodo: NodoSubcategoria; padre: string };

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** panel-admin-maqueta.html:711-774 (`isCategorias`) — traducción
 * literal: árbol expandible a la izquierda, panel de edición a la
 * derecha. F3: crear/renombrar, ocultar en vez de eliminar cuando hay
 * productos (el servidor lo rechaza; aquí se muestra el motivo). */
export function ArbolCategorias({ grupos }: { grupos: NodoGrupo[] }) {
  const router = useRouter();
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [nombreEdit, setNombreEdit] = useState("");
  const [activeEdit, setActiveEdit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formNuevaSub, setFormNuevaSub] = useState<{ groupId: string; parentId: string | null } | null>(null);
  const [nombreNueva, setNombreNueva] = useState("");
  const [formNuevoGrupo, setFormNuevoGrupo] = useState(false);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [codigoGrupo, setCodigoGrupo] = useState("");

  function toggle(id: string) {
    setAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function seleccionarGrupo(g: NodoGrupo) {
    setSeleccion({ tipo: "grupo", nodo: g, padre: "(ninguna — primer nivel)" });
    setNombreEdit(g.name);
    setActiveEdit(g.active);
    setError(null);
  }

  function seleccionarSub(s: NodoSubcategoria, nombrePadre: string) {
    setSeleccion({ tipo: "subcategoria", nodo: s, padre: nombrePadre });
    setNombreEdit(s.name);
    setActiveEdit(s.active);
    setError(null);
  }

  function guardar() {
    if (!seleccion) return;
    setError(null);
    startTransition(async () => {
      const resultado = await actualizarCategoriaAction(seleccion.tipo, seleccion.nodo.id, { name: nombreEdit, active: activeEdit });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    });
  }

  function eliminar() {
    if (!seleccion || seleccion.tipo !== "subcategoria") return;
    setError(null);
    startTransition(async () => {
      const resultado = await eliminarSubcategoriaAction(seleccion.nodo.id);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setSeleccion(null);
      router.refresh();
    });
  }

  function crearGrupo() {
    if (!nombreGrupo.trim() || !codigoGrupo.trim()) return;
    setError(null);
    startTransition(async () => {
      const resultado = await crearGrupoAction(nombreGrupo, codigoGrupo.toUpperCase());
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setFormNuevoGrupo(false);
      setNombreGrupo("");
      setCodigoGrupo("");
      router.refresh();
    });
  }

  function crearSub() {
    if (!formNuevaSub || !nombreNueva.trim()) return;
    setError(null);
    startTransition(async () => {
      const resultado = await crearSubcategoriaAction(formNuevaSub.groupId, nombreNueva, formNuevaSub.parentId);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setFormNuevaSub(null);
      setNombreNueva("");
      router.refresh();
    });
  }

  function renderSub(sub: NodoSubcategoria, groupId: string, nombrePadre: string, profundidad: number) {
    const abierto = abiertos.has(sub.id);
    const sel = seleccion?.tipo === "subcategoria" && seleccion.nodo.id === sub.id;
    return (
      <div key={sub.id}>
        <button
          onClick={() => seleccionarSub(sub, nombrePadre)}
          style={{
            width: "100%",
            textAlign: "left",
            background: sel ? "var(--bg-card)" : "transparent",
            border: "none",
            borderLeft: `2px solid ${sel ? "var(--accent)" : "transparent"}`,
            padding: `7px 14px 7px ${36 + profundidad * 20}px`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: sel ? "var(--accent)" : "var(--text-secondary)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              toggle(sub.id);
            }}
            style={{ color: "var(--text-muted)", width: 10 }}
          >
            {sub.hijos.length > 0 ? (abierto ? "▾" : "▸") : "·"}
          </span>
          {sub.name}
          {!sub.active && <span style={{ fontSize: 11, color: "var(--text-dim)" }}>(oculta)</span>}
          <span className="mono" style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 11 }}>
            {sub.conteoProductos}
          </span>
        </button>
        {abierto && sub.hijos.map((h) => renderSub(h, groupId, sub.name, profundidad + 1))}
        {abierto && (
          <button
            onClick={() => {
              setFormNuevaSub({ groupId, parentId: sub.id });
              setNombreNueva("");
            }}
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: `6px 14px 6px ${56 + profundidad * 20}px`, color: "var(--accent)", fontSize: 12 }}
          >
            + Agregar dentro de &ldquo;{sub.name}&rdquo;
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          className="btn btn-fantasma cut cut-10"
          onClick={() => {
            setFormNuevoGrupo(true);
            setFormNuevaSub(null);
            setSeleccion(null);
          }}
        >
          Nuevo grupo
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
      <div className="tarjeta" style={{ padding: "10px 0", maxHeight: 640, overflow: "auto" }}>
        {grupos.map((g) => {
          const abierto = abiertos.has(g.id);
          const sel = seleccion?.tipo === "grupo" && seleccion.nodo.id === g.id;
          return (
            <div key={g.id}>
              <button
                onClick={() => seleccionarGrupo(g)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, color: sel ? "var(--accent)" : "var(--text-primary)", fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(g.id);
                  }}
                  style={{ color: "var(--text-muted)", width: 12 }}
                >
                  {abierto ? "▾" : "▸"}
                </span>
                {g.name}
                {!g.active && <span style={{ fontSize: 11, color: "var(--text-dim)" }}>(oculto)</span>}
                <span className="mono" style={{ marginLeft: "auto", color: "var(--text-muted)", fontSize: 12 }}>
                  {g.code} · {g.conteoProductos}
                </span>
              </button>
              {abierto && g.subcategorias.map((s) => renderSub(s, g.id, g.name, 0))}
              {abierto && (
                <button
                  onClick={() => {
                    setFormNuevaSub({ groupId: g.id, parentId: null });
                    setNombreNueva("");
                  }}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "6px 14px 6px 36px", color: "var(--accent)", fontSize: 12 }}
                >
                  + Nueva subcategoría en &ldquo;{g.name}&rdquo;
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="tarjeta" style={{ padding: 20, height: "fit-content" }}>
        {formNuevoGrupo ? (
          <>
            <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Nuevo grupo</div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Nombre *</label>
            <input className="campo" value={nombreGrupo} onChange={(e) => setNombreGrupo(e.target.value)} placeholder="Nombre del grupo" style={{ marginBottom: 14 }} autoFocus />
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Código *</label>
            <input className="campo mono" value={codigoGrupo} onChange={(e) => setCodigoGrupo(e.target.value)} placeholder="CH-07" style={{ marginBottom: 14 }} />
            {error && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 14 }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-fantasma cut cut-10" onClick={() => setFormNuevoGrupo(false)}>
                Cancelar
              </button>
              <button className="btn btn-primario cut cut-10" onClick={crearGrupo} disabled={isPending || !nombreGrupo.trim() || !codigoGrupo.trim()}>
                {isPending ? "Creando…" : "Crear"}
              </button>
            </div>
          </>
        ) : formNuevaSub ? (
          <>
            <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>Nueva subcategoría</div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Nombre *</label>
            <input className="campo" value={nombreNueva} onChange={(e) => setNombreNueva(e.target.value)} placeholder="Nombre de la subcategoría" style={{ marginBottom: 14 }} autoFocus />
            {error && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 14 }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-fantasma cut cut-10" onClick={() => setFormNuevaSub(null)}>
                Cancelar
              </button>
              <button className="btn btn-primario cut cut-10" onClick={crearSub} disabled={isPending || !nombreNueva.trim()}>
                {isPending ? "Creando…" : "Crear"}
              </button>
            </div>
          </>
        ) : !seleccion ? (
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Elige una categoría del árbol para editarla.</div>
        ) : (
          <>
            <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 }}>
              Editando {seleccion.tipo === "grupo" ? "grupo" : "subcategoría"}
            </div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Nombre *</label>
            <input className="campo" value={nombreEdit} onChange={(e) => setNombreEdit(e.target.value)} style={{ marginBottom: 14 }} />
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Dirección web (slug)</label>
            <div className="campo mono" style={{ marginBottom: 14, display: "flex", alignItems: "center", color: "var(--text-dim)", background: "var(--bg-surface)" }}>
              {slugify(nombreEdit)}
            </div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Está dentro de</label>
            <div className="mono" style={{ fontSize: 13, color: "var(--text-secondary)", background: "var(--bg-inset)", border: "1px solid var(--border)", padding: "10px 12px", marginBottom: 14 }}>
              {seleccion.padre}
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 14, marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input type="radio" name="visib" checked={activeEdit} onChange={() => setActiveEdit(true)} /> Visible en la tienda
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input type="radio" name="visib" checked={!activeEdit} onChange={() => setActiveEdit(false)} /> Oculta
              </label>
            </div>
            {seleccion.tipo === "subcategoria" && seleccion.nodo.conteoProductos > 0 && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Tiene {seleccion.nodo.conteoProductos} producto(s) activo(s) — no se puede eliminar sin reasignarlos.</p>
            )}
            {error && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 14 }}>{error}</p>}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {seleccion.tipo === "subcategoria" ? (
                <button className="btn btn-peligro cut cut-10" onClick={eliminar} disabled={isPending}>
                  Eliminar
                </button>
              ) : (
                <span />
              )}
              <button className="btn btn-primario cut cut-10" onClick={guardar} disabled={isPending || !nombreEdit.trim()}>
                {isPending ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
