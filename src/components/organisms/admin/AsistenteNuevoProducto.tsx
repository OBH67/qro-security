"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { esquemaProducto } from "@/lib/esquemas/producto";
import { crearProductoAction, actualizarProductoAction } from "@/server/actions/admin/catalogo";
import { obtenerAtributosDeCategoriaAction } from "@/server/actions/admin/productoArchivos";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import { CamposGeneralesProducto, MOTIVOS_POR_CONDICION } from "@/components/organisms/admin/CamposGeneralesProducto";
import { GestorFotosProducto } from "@/components/organisms/admin/GestorFotosProducto";
import { GestorDocumentosProducto } from "@/components/organisms/admin/GestorDocumentosProducto";
import { EditorEspecificacionesProducto } from "@/components/organisms/admin/EditorEspecificacionesProducto";
import type { DatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import type { CondicionProducto, ProductRow, ProductImageRow, CategoryAttributeRow } from "@/types/database";

const PASOS = ["General", "Fotos", "Especificaciones", "Documentos"] as const;

/**
 * Alta de producto como asistente de 4 pasos (en vez de pestañas de
 * navegación libre, ver `FormularioProducto.tsx` para editar uno ya
 * existente): Fotos/Especificaciones/Documentos dependen de que el
 * producto ya exista (FK a `products.id`) y de la categoría elegida en
 * "General" — un wizard hace ese orden explícito en vez de dejar 3
 * pestañas deshabilitadas con un aviso de "guarda primero" (como hacía
 * la versión anterior de esta pantalla).
 *
 * El producto se crea de verdad al terminar el paso 1 ("Siguiente" ==
 * "Crear producto") — los pasos 2-4 ya trabajan sobre un producto real,
 * cada uno guarda lo suyo antes de avanzar (fotos/documentos al
 * subirse, especificaciones al darle "Siguiente"). Volver al paso 1 y
 * cambiar algo actualiza ese mismo producto en vez de crear uno nuevo.
 */
export function AsistenteNuevoProducto({ datosFormulario }: { datosFormulario: DatosFormularioProducto }) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [producto, setProducto] = useState<ProductRow | null>(null);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>("");
  const [includesTexto, setIncludesTexto] = useState("");
  const [brandId, setBrandId] = useState<string | null>("");
  const [groupId, setGroupId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [status, setStatus] = useState<"activo" | "agotado" | "descontinuado">("activo");
  const [price, setPrice] = useState<number | string>("");
  const [stock, setStock] = useState<number | string>("");
  const [condition, setCondition] = useState<CondicionProducto>("nuevo");
  const [conditionDetail, setConditionDetail] = useState(MOTIVOS_POR_CONDICION.usado[0]);
  const [atributos, setAtributos] = useState<CategoryAttributeRow[]>([]);
  const [fotos, setFotos] = useState<ProductImageRow[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>({});

  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const subcategorias = useMemo(() => datosFormulario.subcategoriasPorGrupo.get(groupId) ?? [], [groupId, datosFormulario]);

  function elegirCondicion(nueva: CondicionProducto) {
    setCondition(nueva);
    if (nueva !== "nuevo") {
      setConditionDetail(MOTIVOS_POR_CONDICION[nueva][0]);
      if (!producto && sku && !sku.endsWith("-U1")) setSku(`${sku}-U1`);
    }
  }

  async function elegirSubcategoria(nuevaSubcategoryId: string) {
    setSubcategoryId(nuevaSubcategoryId);
    if (!groupId || !nuevaSubcategoryId) return;
    const resultado = await obtenerAtributosDeCategoriaAction(groupId, nuevaSubcategoryId);
    if (resultado.ok) {
      setAtributos(resultado.data);
      setAttributes({});
    }
  }

  function datosGenerales() {
    return {
      sku,
      name,
      description,
      brandId,
      groupId,
      subcategoryId,
      price,
      stock: condition === "nuevo" ? stock : undefined,
      status,
      condition,
      conditionDetail: condition !== "nuevo" ? conditionDetail : "",
      includes: includesTexto
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }

  /** Paso 1 → crea el producto (o lo actualiza, si ya se había creado y
   * el admin volvió a este paso a corregir algo). */
  async function guardarGeneralYAvanzar() {
    setError(null);
    const datos = datosGenerales();
    // Zod 4 no deja usar `.omit()` sobre un esquema con `.refine()` — se
    // valida siempre el esquema completo; `datosGenerales()` ya manda el
    // sku correcto en los dos casos (el recién escrito, o el mismo que
    // ya tiene el producto una vez creado, porque el campo queda
    // deshabilitado y su valor no cambia).
    const validacion = esquemaProducto.safeParse(datos);
    if (!validacion.success) {
      setError(validacion.error.issues[0]?.message ?? "Revisa los campos obligatorios.");
      return;
    }

    setGuardando(true);
    const resultado = producto ? await actualizarProductoAction(producto.id, datos) : await crearProductoAction(datos);
    setGuardando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setProducto(resultado.data);
    setPaso(2);
  }

  /** Paso 3 → guarda las especificaciones antes de avanzar (mismo botón
   * "Guardar" general que usa la edición, F1.4). */
  async function guardarEspecificacionesYAvanzar() {
    setError(null);
    setGuardando(true);
    const resultado = await actualizarProductoAction(producto!.id, { ...datosGenerales(), attributes });
    setGuardando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setPaso(4);
  }

  function finalizar() {
    router.push("/admin/catalogo");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <Link href="/admin/catalogo" style={{ fontSize: 13 }}>
          ‹ Catálogo
        </Link>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
          Nuevo producto
        </h1>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, flexWrap: "wrap", margin: "18px 0 24px" }}>
        {PASOS.map((etiqueta, indice) => {
          const numero = indice + 1;
          const completado = numero < paso;
          const activo = numero === paso;
          return (
            <span key={etiqueta} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: completado ? "var(--success)" : activo ? "var(--accent)" : "var(--text-dim)", fontWeight: activo ? 600 : 400 }}>
                {completado ? "✓" : `①②③④`[indice]} {etiqueta}
              </span>
              {numero < PASOS.length && <span style={{ color: "var(--border-strong)" }}>────</span>}
            </span>
          );
        })}
      </div>

      {paso === 1 && (
        <CamposGeneralesProducto
          esEdicion={!!producto}
          sku={sku}
          onCambiarSku={setSku}
          name={name}
          onCambiarName={setName}
          description={description}
          onCambiarDescription={setDescription}
          includesTexto={includesTexto}
          onCambiarIncludesTexto={setIncludesTexto}
          brandId={brandId}
          onCambiarBrandId={setBrandId}
          groupId={groupId}
          onCambiarGrupo={(v) => {
            setGroupId(v);
            setSubcategoryId("");
          }}
          subcategoryId={subcategoryId}
          onCambiarSubcategoria={elegirSubcategoria}
          subcategorias={subcategorias}
          status={status}
          onCambiarStatus={setStatus}
          price={price}
          onCambiarPrice={setPrice}
          stock={stock}
          onCambiarStock={setStock}
          condition={condition}
          onElegirCondicion={elegirCondicion}
          conditionDetail={conditionDetail}
          onCambiarConditionDetail={setConditionDetail}
          datosFormulario={datosFormulario}
          mostrarFotoPrincipal={false}
        />
      )}
      {paso === 2 && producto && <GestorFotosProducto productId={producto.id} sku={producto.sku} nombreProducto={name || producto.name} fotos={fotos} onCambiarFotos={setFotos} />}
      {paso === 3 && producto && <EditorEspecificacionesProducto atributos={atributos} valores={attributes} onCambiar={(key, valor) => setAttributes((a) => ({ ...a, [key]: valor }))} />}
      {paso === 4 && producto && <GestorDocumentosProducto productId={producto.id} sku={producto.sku} documentosIniciales={[]} />}

      {error && <p style={{ marginTop: 18, fontSize: 14, color: "var(--danger-text)" }}>{error}</p>}

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg-surface)", borderTop: "1px solid var(--border)", padding: "14px 0", marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        {paso === 1 ? (
          <Link href="/admin/catalogo" className="btn btn-fantasma cut cut-10">
            Cancelar
          </Link>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button type="button" className="btn btn-fantasma cut cut-10" onClick={() => setPaso((p) => p - 1)}>
              ‹ Atrás
            </button>
            <Link href="/admin/catalogo" style={{ fontSize: 13 }}>
              Terminar después — el producto ya quedó guardado
            </Link>
          </div>
        )}

        {paso === 1 && (
          <BotonAdmin type="button" className="cut cut-12" onClick={guardarGeneralYAvanzar} cargando={guardando} textoCargando="Creando…">
            Crear producto y continuar
          </BotonAdmin>
        )}
        {paso === 2 && (
          <BotonAdmin type="button" className="cut cut-12" onClick={() => setPaso(3)}>
            Siguiente ›
          </BotonAdmin>
        )}
        {paso === 3 && (
          <BotonAdmin type="button" className="cut cut-12" onClick={guardarEspecificacionesYAvanzar} cargando={guardando} textoCargando="Guardando…">
            Siguiente ›
          </BotonAdmin>
        )}
        {paso === 4 && (
          <BotonAdmin type="button" className="cut cut-12" onClick={finalizar}>
            Finalizar
          </BotonAdmin>
        )}
      </div>
    </div>
  );
}
