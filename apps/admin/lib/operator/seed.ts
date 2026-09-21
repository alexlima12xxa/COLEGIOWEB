import "server-only";

// Plantilla parametrizada del contenido inicial de un colegio nuevo.
// ---------------------------------------------------------------------------
// Porta la plantilla de scripts/colegio-alta.mjs (buildSeed) al núcleo de
// provisión del operador. Siembra las 12 claves editoriales que consume la web
// pública (ver docs/contrato-contenido.md). El shape de cada clave es el MISMO
// que valida el front (zod) — no se modifica el contrato.

export const CONTENT_KEYS = [
  "mision",
  "vision",
  "filosofia",
  "historia",
  "nosotros_hero",
  "hero",
  "video_tour",
  "autoridades",
  "niveles",
  "admisiones",
  "galeria",
  "contacto",
] as const;

export interface SeedInput {
  slug: string;
  nombre: string;
  adminEmail: string;
}

export function humanize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildSeed(input: SeedInput): Record<string, unknown> {
  const nombre = input.nombre || humanize(input.slug);
  const email = input.adminEmail || `contacto@${input.slug}.edu.co`;
  const slug = input.slug;
  const assets = (file: string) => `/branding/${slug}/${file}`;
  const anio = new Date().getFullYear();

  return {
    mision:
      "Formar personas íntegras, críticas y comprometidas con su entorno, a través de una educación de excelencia que integra saberes, valores y competencias para la vida.",
    vision:
      "Ser una institución educativa referente en la región, reconocida por la calidad académica, la innovación pedagógica y el impacto positivo en la comunidad.",
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
        date: String(anio),
        description: `Nace ${nombre} con la misión de ofrecer una educación de calidad centrada en el estudiante y en valores sólidos.`,
      },
      {
        title: "Primera promoción",
        date: String(anio + 1),
        description: `Egresará la primera promoción de ${nombre}, consolidando un proyecto educativo centrado en el estudiante.`,
      },
      {
        title: "Expansión de sede",
        date: String(anio + 2),
        description: `Ampliamos las instalaciones y la oferta académica para acompañar el crecimiento de la comunidad educativa.`,
      },
      {
        title: "Certificación de calidad",
        date: String(anio + 3),
        description: `Alcanzamos la certificación de calidad que avala nuestros procesos pedagógicos y de gestión institucional.`,
      },
      {
        title: "Educación híbrida y digital",
        date: String(anio + 4),
        description: `Integramos entornos híbridos y herramientas digitales para enriquecer la experiencia de aprendizaje.`,
      },
    ],
    nosotros_hero: {
      title: "Nuestra historia",
      lead: "Desde hoy construimos una comunidad de aprendizaje centrada en las personas.",
      description:
        "Somos una institución educativa comprometida con la formación integral de nuestros estudiantes.",
      image: assets("placeholders/about-campus.jpg"),
    },
    hero: {
      badge: "Admisiones abiertas",
      name: nombre,
      slogan: "Formando líderes para el futuro con excelencia académica",
      description:
        "Somos una institución educativa comprometida con la formación integral de nuestros estudiantes.",
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
      periodLabel: `Admisiones ${anio} abiertas`,
      fechasClave: [
        {
          title: "Inicio de Postulaciones",
          date: "1 de Septiembre, " + (anio - 1),
          estado: "en-curso",
          description: "Apertura oficial del proceso para todos los niveles educativos.",
        },
        {
          title: "Cierre de Convocatoria",
          date: "30 de Noviembre, " + (anio - 1),
          estado: "ultimos-cupos",
          description: "Fecha límite de recepción de postulaciones completas.",
        },
        {
          title: "Jornada de Inducción",
          date: "22 de Enero, " + anio,
          estado: "familias-admitidas",
          description: "Bienvenida y orientación para las familias admitidas.",
        },
      ],
      aviso: `El número de vacantes es limitado por nivel para mantener un ratio máximo de 22 alumnos por aula en ${nombre}.`,
      etapas: [
        {
          title: "Inscripción en línea",
          description:
            "Diligencia el formulario digital y adjunta la documentación requerida sin salir de casa.",
          pie: "Formato 100% digital",
        },
        {
          title: "Entrevista y valoración",
          description:
            "Conoce al equipo docente y realiza la entrevista y la valoración académica según el nivel.",
          pie: "Presencial en campus",
        },
        {
          title: "Publicación de resultados",
          description:
            "Recibe la confirmación de admisión de forma oficial y con toda la transparencia.",
          pie: "Vía portal y correo",
        },
        {
          title: "Matrícula y bienvenida",
          description:
            "Completa la matrícula y participa en la inducción para integrarte a la comunidad escolar.",
          pie: "Integración institucional",
        },
      ],
      requisitosPorNivel: {
        preescolar: [
          { title: "Registro civil de nacimiento", description: "Copia legible del registro civil del aspirante, vigente y sin enmendaduras.", formato: "PDF o JPG legible (máx. 5MB)" },
          { title: "Documento de identidad de los acudientes", description: "Copia de la cédula de identidad de padre, madre o acudiente responsable.", formato: "PDF o JPG legible (máx. 5MB)" },
          { title: "Certificado de desarrollo o jardín", description: "Certificación de la institución o jardín anterior (si aplica) sobre el proceso del menor.", formato: "Documento oficial sellado (PDF)" },
          { title: "Fotografía reciente", description: "Fotografía tamaño 3x4 con fondo claro y actualizada al periodo vigente.", formato: "JPG o PNG (máx. 2MB)" },
          { title: "Certificado de salud y vacunación", description: "Esquema de vacunación al día y certificado médico de aptitud para actividad escolar.", formato: "Documento oficial sellado (PDF)" },
        ],
        primaria: [
          { title: "Registro civil de nacimiento", description: "Copia legible del registro civil del aspirante, vigente y sin enmendaduras.", formato: "PDF o JPG legible (máx. 5MB)" },
          { title: "Documento de identidad de los acudientes", description: "Copia de la cédula de identidad de padre, madre o acudiente responsable.", formato: "PDF o JPG legible (máx. 5MB)" },
          { title: "Certificado de notas del año anterior", description: "Informe académico o boletín del grado inmediatamente anterior, debidamente firmado.", formato: "Documento oficial sellado (PDF)" },
          { title: "Paz y salvo de la institución anterior", description: "Certificación de paz y salvo académico y financiero de la institución de procedencia.", formato: "Documento oficial sellado (PDF)" },
          { title: "Fotografía reciente", description: "Fotografía tamaño 3x4 con fondo claro y actualizada al periodo vigente.", formato: "JPG o PNG (máx. 2MB)" },
        ],
        secundaria: [
          { title: "Registro civil de nacimiento", description: "Copia legible del registro civil del aspirante, vigente y sin enmendaduras.", formato: "PDF o JPG legible (máx. 5MB)" },
          { title: "Documento de identidad del estudiante", description: "Tarjeta de identidad o cédula de ciudadanía del aspirante, según corresponda.", formato: "PDF o JPG legible (máx. 5MB)" },
          { title: "Certificado de notas del año anterior", description: "Informe académico o boletín del grado inmediatamente anterior, debidamente firmado.", formato: "Documento oficial sellado (PDF)" },
          { title: "Paz y salvo de la institución anterior", description: "Certificación de paz y salvo académico y financiero de la institución de procedencia.", formato: "Documento oficial sellado (PDF)" },
          { title: "Certificado de conducta y conformidad", description: "Certificación de buen comportamiento y convivencia expedida por la institución anterior.", formato: "Documento oficial sellado (PDF)" },
        ],
      },
      faq: [
        {
          id: "criterios",
          title: "¿Cuáles son los criterios de selección?",
          content:
            "Evaluamos el desempeño académico, la entrevista con la familia y la disponibilidad de cupos por nivel, manteniendo un proceso transparente con criterios publicados y comunicados a cada familia.",
        },
        {
          id: "costos",
          title: "¿Cuáles son los costos de inscripción?",
          content:
            "El valor de inscripción y matrícula se informa en la oficina de admisiones. Ofrecemos facilidades de pago y descuentos por pronto pago descritos en la circular de costos del periodo.",
        },
        {
          id: "resultados",
          title: "¿Cómo y cuándo me notifican los resultados?",
          content:
            "Los resultados se publican vía portal de admisiones y correo electrónico registrado en la postulación, dentro del cronograma oficial señalado en la sección de fechas clave.",
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
