import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { FooterForm } from "./footer-form";
import type { FooterData } from "./footer-form";

export const dynamic = "force-dynamic";

const CLAVES = ["footer"] as const;

export default async function FooterPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const fila = (filas ?? []).find((f) => f.clave === "footer");
  const footerObj: FooterData =
    fila && typeof fila.valor === "object" && !Array.isArray(fila.valor)
      ? (fila.valor as FooterData)
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Footer
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Datos de contacto, redes sociales y enlaces de niveles que se
          muestran en la parte inferior de la web. Los cambios aparecen tras el
          rebuild automático.
        </p>
      </div>

      <ModuleCard id="footer-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="footer-editor" title="Contenido del footer">
        <FooterForm initial={footerObj} />
      </ModuleCard>
    </div>
  );
}