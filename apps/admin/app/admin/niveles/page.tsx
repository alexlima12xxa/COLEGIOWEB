import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { NivelesForm } from "./niveles-form";
import { NIVELES, type NivelClave } from "./niveles-constants";

export const dynamic = "force-dynamic";

const CLAVES = ["niveles"] as const;

type NivelShape = {
  name?: string;
  ageRange?: string;
  subtitle?: string;
  subtitleVisible?: boolean;
  enabled?: boolean;
  headline?: string;
  description?: string;
  image?: string;
  program?: string[];
  methodology?: string;
  schedule?: { mondayFriday?: string; saturday?: string };
  cta?: string;
  ctaHref?: string;
};

// Fallbacks del contrato de la web (apps/web/src/data/fallback/levels.json +
// configs/colegio-piloto.ts): si la clave no existe aún en `contenido`, el
// formulario arranca con estos valores para que el director edite desde una
// base conocida.
const NIVELES_FALLBACK: Record<NivelClave, NivelShape> = {
  preescolar: {
    name: "Preescolar",
    ageRange: "3-5 años",
    subtitle: "Bilingüe · Estimulación temprana",
    subtitleVisible: false,
    enabled: true,
    headline: "Primera experiencia escolar con alegría",
    description:
      "En preescolar acompañamos a los niños en su primer contacto con la escuela mediante juegos, exploración sensorial, arte y rutinas que fortalecen su autonomía y creatividad.",
    image: "/branding/placeholders/level-preescolar.jpg",
    program: [
      "Desarrollo del lenguaje oral y comunicativo",
      "Pensamiento lógico-matemático vivencial",
      "Exploración del entorno natural y social",
      "Expresión artística, música y movimiento",
      "Hábitos de autonomía y convivencia",
    ],
    methodology:
      "Implementamos una pedagogía lúdica y afectiva donde el juego estructurado es el eje central del aprendizaje. Los docentes observan, acompañan y documentan el desarrollo integral de cada niño.",
    schedule: {
      mondayFriday: "7:30 a.m. – 12:30 p.m.",
      saturday: "Actividades familiares programadas",
    },
    cta: "Conoce el proceso de admisión para preescolar",
    ctaHref: "/admisiones",
  },
  primaria: {
    name: "Primaria",
    ageRange: "6-10 años",
    subtitle: "Grados 1° a 5° · Enfoque STEAM",
    subtitleVisible: false,
    enabled: true,
    headline: "Bases sólidas para aprender a aprender",
    description:
      "La primaria fortalece la lectoescritura, el pensamiento matemático, la indagación científica y la formación en valores, preparando a los estudiantes para continuar su trayectoria académica.",
    image: "/branding/placeholders/level-primaria.jpg",
    program: [
      "Lenguaje, lectura y escritura creativa",
      "Matemáticas y resolución de problemas",
      "Ciencias naturales y educación ambiental",
      "Ciencias sociales y cultura ciudadana",
      "Educación artística, tecnología y deportes",
    ],
    methodology:
      "Combinamos clases activas, proyectos interdisciplinarios y el uso pedagógico de la tecnología. Fomentamos la curiosidad, el trabajo en equipo y la responsabilidad personal.",
    schedule: {
      mondayFriday: "7:00 a.m. – 2:00 p.m.",
      saturday: "Actividades extracurriculares opcionales",
    },
    cta: "Solicita información sobre primaria",
    ctaHref: "/admisiones",
  },
  secundaria: {
    name: "Secundaria",
    ageRange: "11-17 años",
    subtitle: "Grados 6° a 11° · Orientación Vocacional",
    subtitleVisible: false,
    enabled: true,
    headline: "Pensamiento crítico y preparación para la media",
    description:
      "En secundaria profundizamos en áreas disciplinares, desarrollamos habilidades de pensamiento crítico y orientamos a los estudiantes en su proyecto de vida.",
    image: "/branding/placeholders/level-secundaria.jpg",
    program: [
      "Lengua castellana, inglés y comunicación",
      "Matemáticas, estadística y geometría",
      "Ciencias naturales: física, química y biología",
      "Ciencias sociales: historia, geografía y política",
      "Tecnología, emprendimiento y educación artística",
    ],
    methodology:
      "Trabajamos por competencias a través de la indagación, el debate, la experimentación en laboratorios y proyectos que conectan el aula con el mundo real.",
    schedule: {
      mondayFriday: "7:00 a.m. – 2:30 p.m.",
      saturday: "Clubes académicos y deportivos",
    },
    cta: "Descubre nuestra secundaria",
    ctaHref: "/admisiones",
  },
};

export default async function NivelesPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));
  const niveles = porClave.get("niveles");

  const nivelesObj =
    niveles && typeof niveles === "object" && !Array.isArray(niveles)
      ? (niveles as Record<string, NivelShape>)
      : {};

  // Mezcla: dato real de la DB si existe, sino fallback conocido. Así el
  // director parte de valores coherentes aunque la clave aún no exista.
  const merged = Object.fromEntries(
    NIVELES.map((nivel) => [
      nivel.clave,
      { ...NIVELES_FALLBACK[nivel.clave], ...(nivelesObj[nivel.clave] ?? {}) },
    ]),
  ) as Record<NivelClave, NivelShape>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Niveles
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Información de cada nivel educativo: datos de la tarjeta (nombre,
          edad, subtítulo, imagen) y del detalle (titular, descripción, plan de
          estudios, metodología, horarios y llamado a la acción). Los cambios
          aparecen en la web tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="niveles-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <NivelesForm initial={merged} />
    </div>
  );
}