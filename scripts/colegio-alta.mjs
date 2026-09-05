#!/usr/bin/env node
/**
 * scripts/colegio-alta.mjs — Onboarding automatizado de un colegio.
 * ---------------------------------------------------------------------------
 * Alta end-to-end de un tenant en el modelo multi-colegio:
 *
 *   1. Lee el catálogo clients.json (raíz) y localiza la entrada por slug.
 *   2. Supabase (service role):
 *      a. Upsert del colegio en `colegios` (por slug) → tenant_id.
 *      b. Crea el usuario admin en Auth con app_metadata
 *         { role: "admin", tenant_id } (o actualiza si ya existe).
 *      c. Siembra las 11 claves de contenido (plantilla parametrizada).
 *   3. Vercel (REST API, token):
 *      a. Crea el proyecto web (rootDirectory apps/web, framework astro).
 *      b. Setea env vars (PUBLIC_TENANT_ID, PUBLIC_SITE_SLUG, Supabase URL/keys).
 *      c. Agrega el dominio.
 *      d. Crea el deploy hook → rebuild_hook_url.
 *   4. Upsert de tenant_settings.rebuild_hook_url.
 *
 * Uso:
 *   node scripts/colegio-alta.mjs <slug> [opciones]
 *
 * Opciones:
 *   --password <pw>       Contraseña del admin (si se omite, se genera y se imprime).
 *   --domain <dominio>    Sobrescribe el dominio de clients.json.
 *   --email <email>       Sobrescribe el adminEmail de clients.json.
 *   --rebuild-hook <url>  Usa este hook en vez de crear uno en Vercel.
 *   --project-name <n>    Nombre del proyecto Vercel (default: web-<slug>).
 *   --skip-vercel         Omite la creación del proyecto Vercel (solo BD).
 *   --skip-seed           Omite la siembra de contenido.
 *
 * Env vars requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 *   VERCEL_TOKEN (salvo --skip-vercel), VERCEL_TEAM_ID (opcional)
 *
 * Nota: la config de marca (apps/web/src/configs/<slug>.ts) y los assets
 * (public/branding/<slug>/) son cambios de código que hace la agencia ANTES
 * de correr este script (ver docs/multi-colegio.md).
 */

import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/* ── Configuración ───────────────────────────────────────────────────────── */

const CLIENTS_FILE = new URL("../clients.json", import.meta.url);
const CONTENT_KEYS = [
  "mision",
  "vision",
  "filosofia",
  "historia",
  "hero",
  "video_tour",
  "autoridades",
  "niveles",
  "admisiones",
  "galeria",
  "contacto",
];

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

function humanize(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

/* ── Supabase (service role) ─────────────────────────────────────────────── */

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    fail(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno. " +
        "Defínelas antes de ejecutar el script.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function upsertColegio(supabase, cliente) {
  const nombre = humanize(cliente.slug);
  const { data, error } = await supabase
    .from("colegios")
    .upsert(
      {
        slug: cliente.slug,
        nombre,
        slogan: `Formando líderes para el futuro con excelencia académica`,
        descripcion: `Institución educativa comprometida con la excelencia académica y la formación integral.`,
        activo: true,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (error) fail(`No se pudo crear el colegio: ${error.message}`);
  return data.id;
}

async function ensureAdminUser(supabase, tenantId, cliente, password) {
  const email = cliente.adminEmail;
  if (!email) fail("clients.json no define adminEmail para este colegio.");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin", tenant_id: tenantId },
  });

  if (!error) {
    console.log(`  ✓ Usuario admin creado: ${email}`);
    return;
  }

  // Si el usuario ya existe, actualiza su app_metadata (idempotente).
  if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) fail(`No se pudo listar usuarios: ${listError.message}`);
    const existing = users.users.find((u) => u.email === email);
    if (!existing) fail(`El usuario ${email} existe pero no se encontró al listar.`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      { app_metadata: { role: "admin", tenant_id: tenantId } },
    );
    if (updateError) fail(`No se pudo actualizar el admin: ${updateError.message}`);
    console.log(`  ✓ Usuario admin ya existía; app_metadata actualizado: ${email}`);
    return;
  }

  fail(`No se pudo crear el usuario admin: ${error.message}`);
}

/* ── Seed de contenido (plantilla parametrizada) ─────────────────────────── */

function buildSeed(cliente) {
  const nombre = humanize(cliente.slug);
  const email = cliente.adminEmail || `contacto@${cliente.slug}.edu.co`;
  const slug = cliente.slug;
  const assets = (file) => `/branding/${slug}/${file}`;

  return {
    mision: `Formar personas íntegras, críticas y comprometidas con su entorno, a través de una educación de excelencia que integra saberes, valores y competencias para la vida.`,
    vision: `Ser una institución educativa referente en la región, reconocida por la calidad académica, la innovación pedagógica y el impacto positivo en la comunidad.`,
    filosofia: [
      {
        title: "Aprendizaje significativo",
        description:
          "Conectamos los contenidos curriculares con la vida cotidiana de los estudiantes.",
      },
      {
        title: "Comunidad activa",
        description:
          "Familias, docentes y estudiantes construyen juntos el proyecto educativo.",
      },
      {
        title: "Excelencia con equidad",
        description:
          "Brindamos oportunidades de crecimiento a cada niño y joven según sus necesidades.",
      },
    ],
    historia: [
      {
        title: "Fundación",
        date: "2026",
        description: `Nace ${nombre} con la misión de ofrecer una educación de calidad centrada en el estudiante y en valores sólidos.`,
      },
    ],
    hero: {
      badge: "Admisiones abiertas",
      name: nombre,
      slogan: "Formando líderes para el futuro con excelencia académica",
      description: `Somos una institución educativa comprometida con la formación integral de nuestros estudiantes.`,
      heroPhoto: assets("placeholders/hero-photo.avif"),
      tourPoster: assets("placeholders/hero-tour-poster.jpg"),
      actions: [
        { label: "Solicitar información", href: "#contacto", variant: "primary" },
        { label: "Conócenos", href: "/nosotros", variant: "secondary" },
      ],
    },
    video_tour: {
      videoUrl: assets("tour.mp4"),
      poster: assets("placeholders/hero-tour-poster.jpg"),
      title: `Tour virtual por ${nombre}`,
      description: `Recorrido virtual por las instalaciones de ${nombre}.`,
    },
    autoridades: [
      {
        name: "Rector(a)",
        role: "Rectoría",
        image: assets("placeholders/authority-1.jpg"),
      },
    ],
    niveles: {
      preescolar: {
        headline: "Primera experiencia escolar con alegría",
        description:
          "Acompañamos a los niños en su primer contacto con la escuela mediante juegos, exploración y rutinas que fortalecen su autonomía.",
        image: assets("placeholders/level-preescolar.jpg"),
        program: [
          "Desarrollo del lenguaje oral y comunicativo",
          "Pensamiento lógico-matemático vivencial",
          "Expresión artística, música y movimiento",
        ],
        methodology:
          "Pedagogía lúdica y afectiva donde el juego estructurado es el eje central del aprendizaje.",
        schedule: {
          mondayFriday: "7:30 a.m. – 12:30 p.m.",
          saturday: "Actividades familiares programadas",
        },
        cta: "Conoce el proceso de admisión para preescolar",
      },
      primaria: {
        headline: "Bases sólidas para aprender a aprender",
        description:
          "La primaria fortalece la lectoescritura, el pensamiento matemático y la formación en valores.",
        image: assets("placeholders/level-primaria.jpg"),
        program: [
          "Lenguaje, lectura y escritura creativa",
          "Matemáticas y resolución de problemas",
          "Ciencias naturales y educación ambiental",
        ],
        methodology:
          "Clases activas, proyectos interdisciplinarios y uso pedagógico de la tecnología.",
        schedule: {
          mondayFriday: "7:00 a.m. – 2:00 p.m.",
          saturday: "Actividades extracurriculares opcionales",
        },
        cta: "Solicita información sobre primaria",
      },
      secundaria: {
        headline: "Pensamiento crítico y preparación para la media",
        description:
          "Profundizamos en áreas disciplinares y desarrollamos habilidades de pensamiento crítico.",
        image: assets("placeholders/level-secundaria.jpg"),
        program: [
          "Lengua castellana, inglés y comunicación",
          "Matemáticas, estadística y geometría",
          "Ciencias naturales: física, química y biología",
        ],
        methodology:
          "Trabajo por competencias a través de la indagación, el debate y la experimentación.",
        schedule: {
          mondayFriday: "7:00 a.m. – 2:30 p.m.",
          saturday: "Clubes académicos y deportivos",
        },
        cta: "Descubre nuestra secundaria",
      },
    },
    admisiones: {
      schedule: [
        {
          title: "Inscripciones abiertas",
          date: "Enero – marzo",
          description: "Recepción de formularios y documentos de aspirantes.",
        },
        {
          title: "Evaluación de admisión",
          date: "Abril",
          description: "Entrevistas y pruebas de ubicación académica.",
        },
        {
          title: "Publicación de resultados",
          date: "Mayo",
          description: "Comunicación de resultados y cartas de aceptación.",
        },
        {
          title: "Matrícula y bienvenida",
          date: "Junio – julio",
          description: "Proceso de matrícula e inducción a la comunidad escolar.",
        },
      ],
      requirements: [
        "Formulario de inscripción debidamente diligenciado",
        "Copia del documento de identidad del estudiante",
        "Copia del documento de identidad del acudiente",
        "Certificado de notas del año escolar anterior",
        "Fotografía tamaño 3x4 actualizada",
      ],
      faq: [
        {
          id: "edades",
          title: "¿Qué edades corresponden a cada nivel?",
          content:
            "Preescolar recibe niños entre 3 y 5 años, primaria de 6 a 10 años y secundaria de 11 a 17 años.",
        },
        {
          id: "costos",
          title: "¿Cuáles son los costos de matrícula y pensión?",
          content:
            "Los valores se definen anualmente y se informan en la oficina de admisiones.",
        },
        {
          id: "uniforme",
          title: "¿El colegio tiene uniforme?",
          content:
            "Sí, contamos con uniforme institucional diario y de educación física.",
        },
      ],
    },
    galeria: [
      { src: assets("placeholders/gallery-1.jpg"), alt: "Estudiantes en clase", variant: "large" },
      { src: assets("placeholders/gallery-2.jpg"), alt: "Laboratorio de ciencias", variant: "default" },
      { src: assets("placeholders/gallery-3.jpg"), alt: "Actividad deportiva", variant: "tall" },
      { src: assets("placeholders/gallery-4.jpg"), alt: "Biblioteca del colegio", variant: "default" },
      { src: assets("placeholders/gallery-5.jpg"), alt: "Evento cultural", variant: "wide" },
      { src: assets("placeholders/gallery-6.jpg"), alt: "Graduación", variant: "default" },
    ],
    contacto: {
      departments: [
        {
          name: "Recepción general",
          phone: "+57 601 000 0000",
          email,
          hours: "Lunes a viernes, 7:00 a.m. – 4:00 p.m.",
        },
        {
          name: "Admisiones",
          phone: "+57 601 000 0001",
          email,
          hours: "Lunes a viernes, 8:00 a.m. – 12:00 m.",
        },
      ],
      formFields: [
        { id: "name", label: "Nombre completo", type: "text", required: true },
        { id: "email", label: "Correo electrónico", type: "email", required: true },
        { id: "phone", label: "Teléfono", type: "tel", required: true },
        { id: "subject", label: "Asunto", type: "text", required: true },
        { id: "message", label: "Mensaje", type: "textarea", required: true },
      ],
    },
  };
}

async function seedContenido(supabase, tenantId, cliente) {
  const seed = buildSeed(cliente);
  for (const clave of CONTENT_KEYS) {
    const { error } = await supabase.from("contenido").upsert(
      { tenant_id: tenantId, clave, valor: seed[clave] },
      { onConflict: "tenant_id,clave" },
    );
    if (error) fail(`No se pudo sembrar "${clave}": ${error.message}`);
  }
  console.log(`  ✓ Contenido sembrado (${CONTENT_KEYS.length} claves).`);
}

/* ── Vercel (REST API) ───────────────────────────────────────────────────── */

const VERCEL_API = "https://api.vercel.com";

function vercelHeaders() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) fail("Falta VERCEL_TOKEN en el entorno (o usa --skip-vercel).");
  const headers = { Authorization: `Bearer ${token}` };
  if (process.env.VERCEL_TEAM_ID) {
    headers["x-vercel-team-id"] = process.env.VERCEL_TEAM_ID;
  }
  return headers;
}

async function vercelFetch(path, options = {}) {
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: { ...vercelHeaders(), ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail(`Vercel API ${res.status} en ${path}: ${JSON.stringify(body.error || body)}`);
  }
  return body;
}

async function createVercelProject(projectName) {
  const body = await vercelFetch("/v10/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: projectName,
      rootDirectory: "apps/web",
      framework: "astro",
    }),
  });
  console.log(`  ✓ Proyecto Vercel creado: ${body.name} (id ${body.id})`);
  return body;
}

async function addVercelEnv(projectId, key, value) {
  const targets = ["production", "preview", "development"];
  await vercelFetch(`/v10/projects/${projectId}/env`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, type: "encrypted", targets }),
  });
  console.log(`  ✓ Env var ${key} (${targets.join(", ")})`);
}

async function addVercelDomain(projectId, domain) {
  if (!domain) return;
  await vercelFetch(`/v10/projects/${projectId}/domains`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  });
  console.log(`  ✓ Dominio agregado: ${domain} (configura DNS en el registrar)`);
}

async function createVercelDeployHook(projectId, hookName) {
  const body = await vercelFetch(`/v10/projects/${projectId}/hooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: hookName }),
  });
  console.log(`  ✓ Deploy hook creado: ${hookName}`);
  return body.url;
}

/* ── Main ────────────────────────────────────────────────────────────────── */

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args._[0];
  if (!slug) {
    fail(
      "Uso: node scripts/colegio-alta.mjs <slug> [--password <pw>] [--domain <d>] " +
        "[--email <e>] [--rebuild-hook <url>] [--project-name <n>] [--skip-vercel] [--skip-seed]",
    );
  }

  // 1. Catálogo
  const clients = JSON.parse(readFileSync(CLIENTS_FILE, "utf8"));
  const cliente = clients.find((c) => c.slug === slug);
  if (!cliente) {
    fail(`El slug "${slug}" no existe en clients.json. Agrégalo primero.`);
  }
  if (args.domain) cliente.domain = args.domain;
  if (args.email) cliente.adminEmail = args.email;
  if (args["rebuild-hook"]) cliente.rebuildHookUrl = args["rebuild-hook"];

  const password = args.password || randomBytes(12).toString("base64url");
  const projectName = args["project-name"] || `web-${slug}`;

  console.log(`\n🚀 Alta del colegio: ${slug}`);
  console.log(`   Dominio: ${cliente.domain || "(sin dominio)"}`);
  console.log(`   Admin:   ${cliente.adminEmail || "(sin email)"}\n`);

  // 2. Supabase
  const supabase = createSupabaseClient();
  const tenantId = await upsertColegio(supabase, cliente);
  console.log(`  ✓ Colegio en BD: ${slug} → tenant_id ${tenantId}`);

  await ensureAdminUser(supabase, tenantId, cliente, password);

  if (!args["skip-seed"]) {
    await seedContenido(supabase, tenantId, cliente);
  } else {
    console.log("  ⏭ Seed omitido (--skip-seed).");
  }

  // 3. Vercel
  let rebuildHookUrl = cliente.rebuildHookUrl;
  if (!args["skip-vercel"]) {
    const project = await createVercelProject(projectName);

    const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    await addVercelEnv(project.id, "PUBLIC_TENANT_ID", tenantId);
    await addVercelEnv(project.id, "PUBLIC_SITE_SLUG", slug);
    await addVercelEnv(project.id, "PUBLIC_SUPABASE_URL", supabaseUrl);
    await addVercelEnv(project.id, "PUBLIC_SUPABASE_ANON_KEY", anonKey);
    await addVercelEnv(project.id, "SUPABASE_SERVICE_ROLE_KEY", serviceKey);

    await addVercelDomain(project.id, cliente.domain);

    if (!rebuildHookUrl) {
      rebuildHookUrl = await createVercelDeployHook(project.id, "rebuild-webhook");
    }
  } else {
    console.log("  ⏭ Proyecto Vercel omitido (--skip-vercel).");
  }

  // 4. tenant_settings
  const { error: settingsError } = await supabase.from("tenant_settings").upsert(
    { tenant_id: tenantId, rebuild_hook_url: rebuildHookUrl || "" },
    { onConflict: "tenant_id" },
  );
  if (settingsError) fail(`No se pudo guardar tenant_settings: ${settingsError.message}`);
  console.log(`  ✓ tenant_settings.rebuild_hook_url: ${rebuildHookUrl || "(vacío)"}`);

  // 5. Resumen
  console.log("\n─────────────────────────────────────────────");
  console.log("✅ ALTA COMPLETADA");
  console.log(`   slug        : ${slug}`);
  console.log(`   tenant_id   : ${tenantId}`);
  console.log(`   admin email : ${cliente.adminEmail}`);
  console.log(`   password    : ${password}`);
  console.log(`   dominio     : ${cliente.domain || "(pendiente)"}`);
  console.log(`   rebuild hook: ${rebuildHookUrl || "(pendiente)"}`);
  console.log("─────────────────────────────────────────────");
  console.log("\nPendientes manuales:");
  console.log("  1. Config de marca: apps/web/src/configs/<slug>.ts + assets en public/branding/<slug>/");
  console.log("  2. DNS del dominio apuntando a Vercel (ver docs/multi-colegio.md).");
  console.log("  3. Ignored Build Step por proyecto (ver docs/multi-colegio.md).");
}

main().catch((err) => {
  console.error("\n❌ Error inesperado:", err);
  process.exit(1);
});