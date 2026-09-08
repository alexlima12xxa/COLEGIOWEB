import { describe, it, expect } from "vitest";
import { BANNERS_SLUGS, CATALOGO_BANNERS, catalogoPorSlug } from "./catalogo";

describe("catálogo de banners", () => {
  it("cada slug de BANNERS_SLUGS tiene exactamente una entrada en CATALOGO_BANNERS", () => {
    expect(BANNERS_SLUGS.length).toBeGreaterThan(0);

    for (const slug of BANNERS_SLUGS) {
      const entradas = CATALOGO_BANNERS.filter((c) => c.slug === slug);
      expect(entradas).toHaveLength(1);
      expect(entradas[0].contrato.slug).toBe(slug);
    }
  });

  it("no hay entradas en CATALOGO_BANNERS sin su slug en BANNERS_SLUGS", () => {
    for (const entrada of CATALOGO_BANNERS) {
      expect(BANNERS_SLUGS).toContain(entrada.slug);
    }
  });

  it("cada contrato tiene campos no vacíos", () => {
    for (const entrada of CATALOGO_BANNERS) {
      expect(entrada.contrato.campos.length).toBeGreaterThan(0);
    }
  });

  it("cada campo de tipo opciones tiene un default válido dentro de sus opciones", () => {
    for (const entrada of CATALOGO_BANNERS) {
      for (const campo of entrada.contrato.campos) {
        if (campo.tipo === "opciones") {
          expect(campo.opciones?.length).toBeGreaterThan(0);
          if (campo.default) {
            expect(campo.opciones?.some((o) => o.value === campo.default)).toBe(true);
          }
        }
      }
    }
  });

  it("catalogoPorSlug devuelve la entrada correcta y undefined para slugs desconocidos", () => {
    for (const slug of BANNERS_SLUGS) {
      expect(catalogoPorSlug(slug)?.slug).toBe(slug);
    }
    expect(catalogoPorSlug("no-existe")).toBeUndefined();
  });
});