/**
 * @fileoverview Tipos compartidos para el módulo de reportes de solicitudes.
 */

export type SolicitudEstado = 'pendiente' | 'aprobada' | 'rechazada';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SolicitudUsuario {
  nombre: string;
  cedula: string;
  telefono: string;
  email?: string;
  direccion?: string;
  tipo_persona?: string;
}

export interface SolicitudUnidad {
  id: number;
  nombre: string;
  simbolo: string;
  tipo_magnitud_id: number;
  es_base: boolean;
}

export interface Solicitud {
  id: string;
  usuario_id: string;
  tipo_alimento: string;
  cantidad: number;
  comentarios?: string;
  estado: SolicitudEstado;
  created_at: string;
  latitud?: number;
  longitud?: number;
  fecha_respuesta?: string;
  comentario_admin?: string;
  unidad_id?: number;
  unidades?: SolicitudUnidad | null;
  usuarios: SolicitudUsuario | null;
}

export interface SolicitudEstadoFilter {
  todos: boolean;
  pendiente: boolean;
  aprobada: boolean;
  rechazada: boolean;
}

export interface SolicitudFilters {
  search: string;
  estados: SolicitudEstadoFilter;
}

export interface SolicitudCounters {
  pendiente: number;
  aprobada: number;
  rechazada: number;
  total: number;
}

export interface InventarioDisponible {
  id: string;
  tipo_alimento: string;
  cantidad_disponible: number;
  deposito: string;
  fecha_vencimiento?: string | null;
}

export interface ProductoInventario {
  id_producto: string;
  nombre_producto: string;
  unidad_id?: number;
}

export interface UnidadConMagnitud {
  id: number;
  nombre: string;
  simbolo: string;
  tipo_magnitud_id: number;
  es_base: boolean;
}

export interface InventarioDescontado {
  producto: ProductoInventario;
  cantidadEntregada: number;
}

export interface ResultadoInventario {
  cantidadRestante: number;
  productosActualizados: number;
  noStock?: boolean;
  error?: boolean;
  detalleEntregado: InventarioDescontado[];
}

export interface SolicitudActionResponse {
  success: boolean;
  message: string;
  warning?: boolean;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: unknown;
}

export interface SupabaseSolicitudUsuario {
  nombre?: string | null;
  cedula?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tipo_persona?: string | null;
}

export interface SupabaseSolicitudUnidad {
  id?: number | null;
  nombre?: string | null;
  simbolo?: string | null;
  tipo_magnitud_id?: number | null;
  es_base?: boolean | null;
}

export interface SupabaseSolicitudRow {
  id: string;
  usuario_id: string;
  tipo_alimento: string | null;
  cantidad: number | null;
  comentarios?: string | null;
  estado: SolicitudEstado;
  created_at: string;
  latitud?: number | null;
  longitud?: number | null;
  fecha_respuesta?: string | null;
  comentario_admin?: string | null;
  unidad_id?: number | null;
  unidades?: SupabaseSolicitudUnidad | null;
  usuarios: SupabaseSolicitudUsuario | null;
}

export interface SupabaseInventarioDisponibleRow {
  id_inventario: string | number;
  cantidad_disponible: number | null;
  fecha_actualizacion: string | null;
  productos_donados: { nombre_producto?: string | null } | { nombre_producto?: string | null }[] | null;
  depositos: { nombre?: string | null } | { nombre?: string | null }[] | null;
}

export interface DescuentoProductoResult {
  cantidadRestante: number;
  productosActualizados: number;
  cantidadEntregada: number;
}
