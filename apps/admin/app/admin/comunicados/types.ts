export interface CircularRow {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string | null;
  fecha: string;
  archivo_path: string | null;
  archivo_nombre: string | null;
  publicado: boolean;
  publicado_en: string;
  updated_at: string;
}