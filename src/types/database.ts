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
export type CondicionProducto = "nuevo" | "caja_abierta" | "usado";

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
  /** 0021: destino del banner — 'home' (carrusel de la portada,
   * `BannerHero`) o 'catalogo' (franja de `/catalogo/*`,
   * `BannerCatalogo`). Nunca se mezclan. */
  placement: "home" | "catalogo";
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

// ─────────────────────────────────────────────────────────────────────────
// Épica B — cuenta e identidad (0002_identidad_y_roles.sql)
// ─────────────────────────────────────────────────────────────────────────

export type RolUsuario = "cliente" | "admin" | "inventario";

export interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: RolUsuario;
  email_verified: boolean;
  created_at: string;
}

export interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  street: string;
  ext_number: string;
  int_number: string | null;
  postal_code: string;
  neighborhood: string;
  municipality: string;
  state: string;
  recipient_name: string;
  directions: string | null;
  is_default: boolean;
  created_at: string;
}

export interface BillingProfileRow {
  id: string;
  user_id: string;
  rfc: string;
  legal_name: string;
  tax_regime: string;
  cfdi_use: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Épica B — carrito (0004_pedidos.sql, adición de arquitectura §9.6)
// ─────────────────────────────────────────────────────────────────────────

export interface CartRow {
  id: string;
  user_id: string;
  updated_at: string;
}

export interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  qty: number;
  added_at: string;
}

/** Ítem de carrito ya resuelto contra el producto vivo (precio/stock
 * actuales, nunca congelados — B1.3/B1.4: el carrito guarda intención, el
 * precio se recalcula siempre en el servidor). */
export interface ItemCarritoResuelto {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  price: number;
  qty: number;
  disponible: number;
  imagenUrl: string | null;
  stockCambio: boolean; // true si `qty` pedido excede el disponible actual
}

// ─────────────────────────────────────────────────────────────────────────
// Épica C — pedidos, comprobantes (0004_pedidos.sql, 0010)
// ─────────────────────────────────────────────────────────────────────────

export type EstadoPedido =
  | "pendiente_pago"
  | "comprobante_recibido"
  | "listo_envio"
  | "enviado"
  | "entregado"
  | "cancelado";

export type MetodoPago = "transferencia" | "saldo_completo";

export interface DireccionCongelada {
  label: string;
  street: string;
  ext_number: string;
  int_number: string | null;
  postal_code: string;
  neighborhood: string;
  municipality: string;
  state: string;
  recipient_name: string;
  directions: string | null;
}

export interface DatosFiscalesCongelados {
  rfc: string;
  legal_name: string;
  tax_regime: string;
  cfdi_use: string;
  postal_code: string;
}

export interface OrderRow {
  id: string;
  folio: string;
  user_id: string;
  status: EstadoPedido;
  payment_method: MetodoPago;
  subtotal: string;
  credit_applied: string;
  shipping_cost: string | null;
  total: string;
  wants_invoice: boolean;
  shipping_address: DireccionCongelada;
  billing_data: DatosFiscalesCongelados | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  /** 0011: llave de idempotencia generada por el cliente en /pagar. Nula
   * para pedidos previos a este incremento o llamadas internas sin llave. */
  idempotency_key: string | null;
  /** 0023: motivo que capturó el admin al cancelar (liberar_apartado).
   * Nulo si el pedido no está cancelado. */
  cancellation_reason: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  sku: string;
  name: string;
  unit_price: string;
  qty: number;
  subtotal: string;
}

export interface OrderStatusHistoryRow {
  id: string;
  order_id: string;
  from_status: EstadoPedido | null;
  to_status: EstadoPedido;
  changed_by: string | null;
  source: "panel" | "correo" | "sistema" | "cliente";
  note: string | null;
  changed_at: string;
}

export interface PaymentProofRow {
  id: string;
  order_id: string;
  file_url: string;
  transfer_date: string;
  amount: string;
  origin_bank: string | null;
  spei_tracking_key: string | null;
  status: "pendiente" | "validado" | "rechazado";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  uploaded_at: string;
}

export type EstadoDevolucion = "solicitada" | "en_revision" | "aprobada" | "rechazada";
export type CondicionDevolucion = "sellado" | "abierto" | "otro";

export interface ReturnRow {
  id: string;
  folio: string;
  order_id: string;
  user_id: string;
  status: EstadoDevolucion;
  reason: string;
  credit_amount: string | null; // se llena al resolver (D2, panel admin)
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface ReturnItemRow {
  id: string;
  return_id: string;
  order_item_id: string;
  qty: number;
  condition: CondicionDevolucion;
  percentage: string; // estimado al solicitar (RN-6); el admin lo corrige al resolver
  credit_amount: string;
}

export interface ReturnPhotoRow {
  id: string;
  return_id: string;
  url: string; // clave en el bucket privado de R2
}

export type TipoMovimientoSaldo = "devolucion" | "aplicado" | "ajuste";

export interface CreditMovementRow {
  id: string;
  user_id: string;
  amount: string; // positivo abona, negativo aplica
  kind: TipoMovimientoSaldo;
  order_id: string | null;
  return_id: string | null;
  description: string;
  created_by: string | null;
  created_at: string;
}

export type TipoServicio = "monitoreo" | "guardias" | "financiamiento";
export type TipoClienteServicio = "particular" | "negocio" | "empresa";
export type TipoInmueble = "casa" | "local" | "oficina" | "bodega" | "industria" | "otro";
export type EstadoSolicitudServicio = "nueva" | "contactada" | "cerrada";

export interface ServiceRequestRow {
  id: string;
  folio: string;
  service_type: TipoServicio;
  client_type: TipoClienteServicio;
  full_name: string;
  phone: string;
  email: string;
  state: string;
  municipality: string;
  neighborhood: string | null;
  address_reference: string | null;
  property_type: TipoInmueble;
  preferred_time: string | null;
  amount: string | null;
  term_months: number | null;
  message: string | null;
  status: EstadoSolicitudServicio;
  assigned_to: string | null;
  created_at: string;
}

export interface LegalPageRow {
  slug: "privacidad" | "terminos";
  title: string;
  body: string;
  updated_at: string;
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
      profiles: Tabla<ProfileRow>;
      addresses: Tabla<AddressRow>;
      billing_profiles: Tabla<BillingProfileRow>;
      carts: Tabla<CartRow>;
      cart_items: Tabla<CartItemRow>;
      orders: Tabla<OrderRow>;
      order_items: Tabla<OrderItemRow>;
      order_status_history: Tabla<OrderStatusHistoryRow>;
      payment_proofs: Tabla<PaymentProofRow>;
    };
    Views: {
      catalogo_productos: { Row: CatalogoProductoRow };
    };
    Functions: {
      buscar_productos: {
        Args: { p_query: string; p_limit?: number; p_offset?: number };
        Returns: BuscarProductosRow[];
      };
      crear_pedido: {
        Args: {
          p_user_id: string;
          p_items: { product_id: string; qty: number }[];
          p_shipping_address: DireccionCongelada;
          p_billing_data?: DatosFiscalesCongelados | null;
          p_wants_invoice?: boolean;
          p_credit_to_apply?: number;
          p_notes?: string | null;
          p_idempotency_key?: string | null;
        };
        Returns: OrderRow;
      };
      confirmar_comprobante: {
        Args: {
          p_order_id: string;
          p_user_id: string;
          p_file_url: string;
          p_transfer_date: string;
          p_amount: number;
          p_origin_bank?: string | null;
          p_spei_tracking_key?: string | null;
        };
        Returns: OrderRow;
      };
    };
  };
}
