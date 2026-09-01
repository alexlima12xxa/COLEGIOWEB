export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
          @web-modelo/admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Panel Admin — esqueleto
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Panel de administración para el director del colegio: noticias,
          circulares, textos institucionales, autoridades, galería, admisiones,
          contacto y leads. La implementación completa corresponde a la Fase 2
          (bloques A0-A8) sobre Supabase multi-tenant con RLS.
        </p>
      </div>
    </main>
  );
}