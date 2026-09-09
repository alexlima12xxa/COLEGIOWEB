import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { ContactoForm } from "./contacto-form";

export const dynamic = "force-dynamic";

const CLAVES = ["contacto", "whatsapp"] as const;

export default async function ContactoPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map(
    (filas ?? []).map((fila) => [fila.clave, fila.valor]),
  );
  const contacto = porClave.get("contacto");
  const whatsappRaw = porClave.get("whatsapp");

  const contactoObj =
    contacto && typeof contacto === "object" && !Array.isArray(contacto)
      ? (contacto as {
          info?: {
            mapUrl?: string;
            mapEmbedUrl?: string;
          };
          departments?: {
            name?: string;
            phone?: string;
            email?: string;
            hours?: string;
            hidden?: boolean;
          }[];
        })
      : {};

  const whatsappInicial =
    whatsappRaw &&
    typeof whatsappRaw === "object" &&
    !Array.isArray(whatsappRaw)
      ? (whatsappRaw as { numero?: string }).numero
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Contacto
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          WhatsApp, mapa y directorio por departamento de la página de contacto.
          La dirección, teléfono y horario generales se editan en
          &quot;Footer&quot;. Los cambios aparecen en la web tras el rebuild
          automático.
        </p>
      </div>

      <ModuleCard id="contacto-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="contacto-editor" title="Contacto">
        <ContactoForm initial={contactoObj} whatsappInicial={whatsappInicial} />
      </ModuleCard>
    </div>
  );
}
