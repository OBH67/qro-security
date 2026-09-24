"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { actualizarProductoAction } from "@/server/actions/admin/catalogo";
import { obtenerAtributosDeCategoriaAction } from "@/server/actions/admin/productoArchivos";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import { CamposGeneralesProducto, MOTIVOS_POR_CONDICION } from "@/components/organisms/admin/CamposGeneralesProducto";
import { GestorFotosProducto } from "@/components/organisms/admin/GestorFotosProducto";
import { GestorDocumentosProducto } from "@/components/organisms/admin/GestorDocumentosProducto";
import { EditorEspecificacionesProducto } from "@/components/organisms/admin/EditorEspecificacionesProducto";
import type { DatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import type { CondicionProducto, ProductRow, ProductImageRow, ProductDocumentRow, CategoryAttributeRow } from "@/types/database";

const PESTAÑAS = ["General", "Fotos", "Especificaciones", "Documentos"] as const;

/** Edición de un producto ya existente (pestañas de navegación libre) —
 * el alta de un producto nuevo usa `AsistenteNuevoProducto.tsx` (wizard
 * de pasos secuenciales), no este componente: crear pide un orden porque
 * Fotos/Especificaciones/Documentos dependen de que el producto exista
 * (FK a `products.id`) y de la categoría elegida en "General"; editar no
 * tiene esa restricción, así que las 4 pestañas quedan libres. */
export function FormularioProducto({
  producto,
  datosFormulario,
  galeriaInicial = [],
  documentosIniciales = [],
  atributosDeCategoria = [],
}: {
  producto: ProductRow;
  datosFormulario: DatosFormularioProducto;
  galeriaInicial?: ProductImageRow[];
  documentosIniciales?: ProductDocumentRow[];
  atributosDeCategoria?: CategoryAttributeRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof PESTAÑAS)[number]>("General");
  const [name, setName] = useState(producto.name);
  const [description, setDescription] = useState(producto.description);
  const [brandId, setBrandId] = useState(producto.brand_id);
  const [groupId, setGroupId] = useState(producto.group_id);
  const [subcategoryId, setSubcategoryId] = useState(producto.subcategory_id);
  const [status, setStatus] = useState<"activo" | "agotado" | "descontinuado">(producto.status);
  const [price, setPrice] = useState<number | string>(producto.price);
  const [stock, setStock] = useState<number | string>(producto.stock);
  const [condition, setCondition] = useState<CondicionProducto>(producto.condition);
  const [conditionDetail, setConditionDetail] = useState(producto.condition_detail ?? MOTIVOS_POR_CONDICION.usado[0]);
  const [atributos, setAtributos] = useState<CategoryAttributeRow[]>(atributosDeCategoria);
  const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>((producto.attributes as Record<string, string | number | boolean>) ?? {});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const subcategorias = useMemo(() => datosFormulario.subcategoriasPorGrupo.get(groupId) ?? [], [groupId, datosFormulario]);

  function elegirCondicion(nueva: CondicionProducto) {
    setCondition(nueva);
    if (nueva !== "nuevo") setConditionDetail(MOTIVOS_POR_CONDICION[nueva][0]);
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

  function guardar() {
    setError(null);
    const datos = {
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
      attributes,
    };
    startTransition(async () => {
      const resultado = await actualizarProductoAction(producto.id, datos);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push("/admin/catalogo");
      router.refresh();
    });
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <Link href="/admin/catalogo" style={{ fontSize: 13 }}>
          ‹ Catálogo
        </Link>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
          Editar {producto.name}
        </h1>
      </div>

      <div style={{ display: "flex", gap: 4, margin: "18px 0", borderBottom: "1px solid var(--border)" }}>
        {PESTAÑAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{ background: "none", border: "none", padding: "10px 16px", fontFamily: "var(--font-title)", fontWeight: 500, fontSize: 14, color: t === tab ? "var(--accent)" : "var(--text-muted)", borderBottom: `2px solid ${t === tab ? "var(--accent)" : "transparent"}`, cursor: "pointer" }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "General" ? (
        <CamposGeneralesProducto
          esEdicion
          sku={producto.sku}
          name={name}
          onCambiarName={setName}
          description={description}
          onCambiarDescription={setDescription}
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
        />
      ) : tab === "Fotos" ? (
        <GestorFotosProducto productId={producto.id} sku={producto.sku} nombreProducto={name || producto.name} galeriaInicial={galeriaInicial} />
      ) : tab === "Documentos" ? (
        <GestorDocumentosProducto productId={producto.id} sku={producto.sku} documentosIniciales={documentosIniciales} />
      ) : (
        <EditorEspecificacionesProducto atributos={atributos} valores={attributes} onCambiar={(key, valor) => setAttributes((a) => ({ ...a, [key]: valor }))} />
      )}

      {error && <p style={{ marginTop: 18, fontSize: 14, color: "var(--danger-text)" }}>{error}</p>}

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg-surface)", borderTop: "1px solid var(--border)", padding: "14px 0", marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Link href="/admin/catalogo" className="btn btn-fantasma cut cut-10">
          Cancelar
        </Link>
        <BotonAdmin type="button" className="cut cut-12" onClick={guardar} cargando={isPending} textoCargando="Guardando…">
          Guardar
        </BotonAdmin>
      </div>
    </div>
  );
}
