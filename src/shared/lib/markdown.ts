import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

/** Renderiza markdown (contenido editorial de noticias) a HTML en build-time. */
export function renderMarkdown(content: string): string {
  return marked.parse(content, { async: false }) as string;
}
