// Tipos de la base de datos Supabase (multi-tenant).
// Generar desde el proyecto real con:
//   pnpm --filter @web-modelo/shared gen:types
// Este archivo es el contrato compartido entre web, admin y aula.
// Mientras no se genere, se declaran las interfaces mínimas de los
// esquemas public actualmente en uso.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Colegio {
  id: string;
  slug: string;
  nombre: string;
  slogan: string | null;
  descripcion: string | null;
  contacto: Json;
  branding: Json;
  activo: boolean;
}

export interface Noticia {
  id: string;
  tenant_id: string;
  slug: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  imagen_path: string | null;
  imagen_alt: string;
  autor: string | null;
  publicado: boolean;
  publicado_en: string;
}

export interface Circular {
  id: string;
  tenant_id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  fecha: string;
  archivo_path: string | null;
  archivo_nombre: string | null;
  publicado: boolean;
  publicado_en: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  nivel_interes: string | null;
  mensaje: string | null;
  origen: string;
  estado: string;
  created_at: string;
}

export interface Contenido {
  id: string;
  tenant_id: string;
  clave: string;
  valor: Json;
  updated_at: string;
}

export type ContenidoClave =
  | "mision"
  | "vision"
  | "filosofia"
  | "historia"
  | "hero"
  | "video_tour"
  | "autoridades"
  | "niveles"
  | "admisiones"
  | "galeria"
  | "contacto";