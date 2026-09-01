export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
          @web-modelo/aula
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Aula Virtual — esqueleto
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Plataforma para padres y estudiantes con cuenta: notas por
          estudiante, cursos, comunicados y actividades (Fase 3). Conecta a la
          misma BD Supabase multi-tenant con RLS por relación familiar. La
          implementación completa es un proyecto posterior al panel admin.
        </p>
      </div>
    </main>
  );
}