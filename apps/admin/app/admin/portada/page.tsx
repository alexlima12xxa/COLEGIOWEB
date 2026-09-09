import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import {
  HeroForm,
  MetricasForm,
  NavbarForm,
  PilaresForm,
} from "./portada-form";

export const dynamic = "force-dynamic";

const CLAVES = ["hero", "navbar", "metricas", "pilares"] as const;

// Fallbacks del contrato de la web (apps/web/src/shared/db/contenido.ts):
// si la clave no existe aún en `contenido`, el formulario arranca con estos
// valores para que el director edite desde una base conocida.
const NAVBAR_FALLBACK = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Niveles", href: "/niveles" },
  { label: "Admisiones", href: "/admisiones" },
  { label: "Noticias", href: "/noticias" },
  { label: "Circulares", href: "/circulares" },
  { label: "Contacto", href: "/contacto" },
];

const METRICAS_FALLBACK = [
  { value: "40+", label: "Años de trayectoria" },
  { value: "1.200", label: "Estudiantes activos" },
  { value: "1:18", label: "Ratio profesor-estudiante" },
  { value: "98%", label: "Aprobación en pruebas estatales" },
];

const PILARES_FALLBACK = [
  {
    title: "Formación Integral",
    description:
      "Desarrollamos competencias académicas, artísticas, deportivas y socioemocionales en cada etapa escolar.",
    metric: "15+ Disciplinas extracurriculares",
  },
  {
    title: "Tecnología Educativa",
    description:
      "Aulas equipadas con recursos digitales, plataforma de aprendizaje y conectividad de alta velocidad.",
    metric: "Campus 100% digital",
  },
  {
    title: "Valores con Propósito",
    description:
      "Educamos en respeto, responsabilidad, solidaridad y liderazgo para transformar la sociedad.",
    metric: "Programa de liderazgo activo",
  },
  {
    title: "Acompañamiento Cercano",
    description:
      "Equipo de orientación y bienestar que acompaña a cada estudiante y su familia durante su proceso.",
    metric: "Tutoría personalizada 1 a 1",
  },
];

export default async function PortadaPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map(
    (filas ?? []).map((fila) => [fila.clave, fila.valor]),
  );

  const hero = porClave.get("hero");
  const heroObj =
    hero && typeof hero === "object" && !Array.isArray(hero)
      ? (hero as Record<string, unknown>)
      : {};

  const navbar = porClave.get("navbar");
  const navbarObj =
    navbar && typeof navbar === "object" && !Array.isArray(navbar)
      ? (navbar as { links?: unknown[] })
      : {};
  const navbarLinks =
    Array.isArray(navbarObj.links) && navbarObj.links.length > 0
      ? (navbarObj.links as { label?: string; href?: string }[])
      : NAVBAR_FALLBACK;

  const metricas = porClave.get("metricas");
  const metricasItems =
    Array.isArray(metricas) && metricas.length > 0
      ? (metricas as { value?: string; label?: string }[])
      : METRICAS_FALLBACK;

  const pilares = porClave.get("pilares");
  const pilaresObj =
    pilares && typeof pilares === "object" && !Array.isArray(pilares)
      ? (pilares as { titulo?: unknown; items?: unknown[] })
      : {};
  const pilaresItems =
    Array.isArray(pilaresObj.items) && pilaresObj.items.length > 0
      ? (pilaresObj.items as {
          title?: string;
          description?: string;
          metric?: string;
        }[])
      : PILARES_FALLBACK;
  const pilaresTitulo =
    typeof pilaresObj.titulo === "string" && pilaresObj.titulo.trim()
      ? pilaresObj.titulo
      : "Nuestros Pilares en Acción";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Portada
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Hero, menú de navegación, métricas y pilares de la portada. El video
          tour se edita en su propia sección. Los cambios aparecen en la web
          tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="portada-estado" title="Estado de las claves">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Identidad y navegación
        </h2>
        <div className="mt-3 space-y-6">
          <ModuleCard id="portada-hero" title="Hero">
            <HeroForm
              initial={{
                heroPhoto:
                  typeof heroObj.heroPhoto === "string"
                    ? heroObj.heroPhoto
                    : undefined,
                name:
                  typeof heroObj.name === "string" ? heroObj.name : undefined,
                slogan:
                  typeof heroObj.slogan === "string"
                    ? heroObj.slogan
                    : undefined,
                description:
                  typeof heroObj.description === "string"
                    ? heroObj.description
                    : undefined,
              }}
              heroJson={JSON.stringify(heroObj)}
            />
          </ModuleCard>

          <ModuleCard id="portada-navbar" title="Menú de navegación">
            <NavbarForm initial={navbarLinks} />
          </ModuleCard>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Contenido de la portada
        </h2>
        <div className="mt-3 space-y-6">
          <ModuleCard id="portada-metricas" title="Métricas de la franja">
            <MetricasForm initial={metricasItems} />
          </ModuleCard>

          <ModuleCard id="portada-pilares" title="Pilares en acción">
            <PilaresForm initial={pilaresItems} initialTitulo={pilaresTitulo} />
          </ModuleCard>
        </div>
      </div>
    </div>
  );
}
