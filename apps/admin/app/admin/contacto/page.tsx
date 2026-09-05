import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { ContactoForm } from "./contacto-form";

export const dynamic = "force-dynamic";

const CLAVES = ["contacto"] as const;

export default async function ContactoPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));
  const contacto = porClave.get("contacto");

  const contactoObj =
    contacto && typeof contacto === "object" && !Array.isArray(contacto)
      ? (contacto as {
          info?: {
            address?: string;
            phone?: string;
            email?: string;
            hours?: string;
            mapUrl?: string;
            mapEmbedUrl?: string;
          };
          departments?: { name?: string; phone?: string; email?: string; hours?: string; hidden?: boolean }[];
        })
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Contacto
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Datos de contacto y directorio por departamento. Los cambios aparecen
          en la web tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="contacto-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="contacto-editor" title="Contacto">
        <ContactoForm initial={contactoObj} />
      </ModuleCard>
    </div>
  );
}
