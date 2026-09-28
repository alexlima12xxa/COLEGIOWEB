export interface NoticiaRow {
  id: string;
  slug: string;
  titulo: string;
  resumen: string | null;
  contenido: string;
  imagen_path: string | null;
  imagen_alt: string;
  autor: string | null;
  publicado: boolean;
  publicado_en: string;
  updated_at: string;
}