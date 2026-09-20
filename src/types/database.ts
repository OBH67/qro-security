/**
 * Tipos de dominio del catálogo, escritos a mano a partir del esquema real
 * en `supabase/migrations/0003_catalogo.sql` y `.devsquad/modelo-datos.md`
 * §4.2. No se generaron con la CLI de Supabase porque este entorno no tiene
 * acceso a un proyecto real (ver `.devsquad/estado.md`, bloqueo de red).
 *
 * Cuando exista un proyecto de Supabase real, reemplazar por
 * `supabase gen types typescript` y ajustar los `import type { Database }`.
 */

export type EstadoProducto = "activo" | "agotado" | "descontinuado";
export type CondicionProducto = "nuevo" | "usado";

export interface GroupRow {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  position: number;
  active: boolean;
}

export interface SubcategoryRow {
  id: string;
  group_id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  position: number;
  active: boolean;
}

export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  active: boolean;
}

export interface ProductRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  brand_id: string | null;
  group_id: string;
  subcategory_id: string;
  // `numeric` de Postgres viaja por PostgREST como número JSON en el caso
  // normal, pero el código que lo consume (`formatearPrecio()`,
  // `src/lib/formato.ts`) acepta `number | string` a propósito: no hay que
  // confiar en que el runtime siempre entregue el mismo tipo.
  price: number | string;
  tax_rate: number | string;
  stock: number;
  reserved: number;
  warranty_months: number;
  weight_kg: number | string | null;
  includes: string[] | null;
  attributes: Record<string, unknown>;
  status: EstadoProducto;
  condition: CondicionProducto;
  condition_detail: string | null;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductDocumentRow {
  id: string;
  product_id: string;
  kind: "ficha_tecnica" | "manual" | "otro";
  name: string;
  url: string;
  size_bytes: number | null;
}

export interface CategoryAttributeRow {
  id: string;
  group_id: string | null;
  subcategory_id: string | null;
  key: string;
  label: string;
  data_type: "text" | "number" | "boolean";
  options: string[] | null;
  filterable: boolean;
  position: number;
}

export interface BannerRow {
  id: string;
  title: string;
  brand_label: string | null;
  image_url: string;
  group_id: string | null;
  gradient_from: string | null;
  gradient_to: string | null;
  position: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface ReviewRow {
  id: string;
  product_id: string | null;
  user_id: string | null;
  author_name: string;
  rating: number;
  category: string | null;
  title: string | null;
  body: string;
  published: boolean;
  created_at: string;
}

export interface FaqRow {
  id: string;
  scope: "general" | "servicios" | "devoluciones" | "como_comprar";
  topic: string | null;
  question: string;
  answer: string;
  position: number;
  active: boolean;
}

export interface SettingRow {
  key: string;
  value: string | null;
  updated_at: string;
  updated_by: string | null;
}

/** Fila de la vista `catalogo_productos` (0009_catalogo_lectura_publica.sql):
 * el producto activo + `disponible` calculado (stock - reserved). */
export interface CatalogoProductoRow extends ProductRow {
  disponible: number;
}

/** Fila que regresa la función `buscar_productos()` (RPC, 0009). */
export interface BuscarProductosRow {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand_id: string | null;
  group_id: string;
  subcategory_id: string;
  price: string;
  stock: number;
  reserved: number;
  disponible: number;
  sales_count: number;
  condition: CondicionProducto;
  condition_detail: string | null;
  total_count: number;
}

type Tabla<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row> };

/**
 * Tipo `Database` mínimo, escrito a mano, con solo las tablas/vistas/
 * funciones que el catálogo público (Épica A) lee. Se amplía en incrementos
 * futuros (pedidos, cuenta, panel admin) conforme se necesiten. Cuando
 * exista un proyecto de Supabase real, reemplazar por
 * `supabase gen types typescript`.
 */
export interface Database {
  public: {
    Tables: {
      groups: Tabla<GroupRow>;
      subcategories: Tabla<SubcategoryRow>;
      brands: Tabla<BrandRow>;
      products: Tabla<ProductRow>;
      product_images: Tabla<ProductImageRow>;
      product_documents: Tabla<ProductDocumentRow>;
      category_attributes: Tabla<CategoryAttributeRow>;
      banners: Tabla<BannerRow>;
      reviews: Tabla<ReviewRow>;
      faqs: Tabla<FaqRow>;
      settings: Tabla<SettingRow>;
    };
    Views: {
      catalogo_productos: { Row: CatalogoProductoRow };
    };
    Functions: {
      buscar_productos: {
        Args: { p_query: string; p_limit?: number; p_offset?: number };
        Returns: BuscarProductosRow[];
      };
    };
  };
}
