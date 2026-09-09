import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { AdmisionesForm } from "./admisiones-form";

export const dynamic = "force-dynamic";

// Claves que gestiona este módulo (estado de la tarjeta).
const CLAVES = ["admisiones"] as const;

// Claves que se leen para alimentar el editor (admisiones + niveles).
const CLAVES_CONSULTA = [...CLAVES, "niveles"] as const;

// Claves internas estables de los niveles: contrato de datos del formulario.
// `name` se reemplaza por el nombre real editable del módulo "Niveles".
const NIVELES = [
  { key: "preescolar", label: "Preescolar" },
  { key: "primaria", label: "Primaria" },
  { key: "secundaria", label: "Secundaria" },
] as const;

export default async function AdmisionesPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES_CONSULTA]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));
  const admisiones = porClave.get("admisiones");

  const admisionesObj =
    admisiones && typeof admisiones === "object" && !Array.isArray(admisiones)
      ? (admisiones as {
          periodLabel?: string;
          heroBadge?: string;
          heroTitlePre?: string;
          heroTitleHighlight?: string;
          heroDescription?: string;
          aviso?: string;
          fechasClave?: {
            title?: string;
            date?: string;
            estado?: string;
            description?: string;
          }[];
          etapas?: { title?: string; description?: string; pie?: string }[];
          requisitosPorNivel?: Record<
            string,
            { title?: string; description?: string; formato?: string }[]
          >;
          faq?: { title?: string; content?: string }[];
        })
      : {};

  const nivelesRaw = porClave.get("niveles");
  const nivelesObj =
    nivelesRaw && typeof nivelesRaw === "object" && !Array.isArray(nivelesRaw)
      ? (nivelesRaw as Record<string, { name?: string }>)
      : {};

  const niveles = NIVELES.map((nivel) => ({
    key: nivel.key,
    label: nivel.label,
    name: nivelesObj[nivel.key]?.name?.trim()
      ? (nivelesObj[nivel.key]!.name as string)
      : nivel.label,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Admisiones
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Proceso de admisiones: periodo, requisitos, cronograma y preguntas
          frecuentes. Los cambios aparecen en la web tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="admisiones-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="admisiones-editor" title="Proceso de admisiones">
        <AdmisionesForm initial={admisionesObj} niveles={niveles} />
      </ModuleCard>
    </div>
  );
}
