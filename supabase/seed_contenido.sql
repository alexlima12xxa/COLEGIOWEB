-- GATE A1: seed de contenido para el colegio piloto.
-- ---------------------------------------------------------------------------
-- Inserta las 11 claves de contenido (GATE A1) para el tenant piloto
-- (slug 'colegio-piloto'), tomando como base los valores actuales de
-- src/data/fallback/*.json y src/site.config.ts de apps/web.
--
-- Idempotente y seguro de re-ejecutar:
--   * Crea el colegio piloto si no existe (ON CONFLICT por slug).
--   * El tenant_id se resuelve por slug, así que funciona aunque el colegio
--     ya exista con otro id.
--   * Cada clave se inserta con UPSERT (tenant_id, clave); si ya existe, se
--     sobrescribe con el valor del seed.
--
-- Las claves válidas están documentadas en el README del header de
-- supabase/migrations/20260901000000_contenido.sql.

-- ── 0. Colegio piloto (tenant) ──────────────────────────────────────────────

insert into public.colegios (slug, nombre, slogan, descripcion, activo)
values (
  'colegio-piloto',
  'Colegio Piloto',
  'Formando líderes para el futuro con excelencia académica',
  'Institución educativa comprometida con la excelencia académica y la formación integral.',
  true
)
on conflict (slug) do nothing;

-- ── 1. Upsert de las 11 claves ──────────────────────────────────────────────

insert into public.contenido (tenant_id, clave, valor)
values
  ((select id from public.colegios where slug = 'colegio-piloto'), 'mision',
   $json$"Formar personas íntegras, críticas y comprometidas con su entorno, a través de una educación de excelencia que integra saberes, valores y competencias para la vida."$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'vision',
   $json$"Ser una institución educativa referente en la región, reconocida por la calidad académica, la innovación pedagógica y el impacto positivo en la comunidad."$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'filosofia',
   $json$[
     {
       "title": "Aprendizaje significativo",
       "description": "Conectamos los contenidos curriculares con la vida cotidiana de los estudiantes."
     },
     {
       "title": "Comunidad activa",
       "description": "Familias, docentes y estudiantes construyen juntos el proyecto educativo."
     },
     {
       "title": "Excelencia con equidad",
       "description": "Brindamos oportunidades de crecimiento a cada niño y joven según sus necesidades."
     }
   ]$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'historia',
   $json$[
     {
       "title": "Fundación",
       "date": "1985",
       "description": "Nace el Colegio Piloto con la misión de ofrecer una educación de calidad centrada en el estudiante y en valores sólidos."
     },
     {
       "title": "Primera promoción de bachilleres",
       "date": "1995",
       "description": "Diez años después de su apertura, egresa la primera promoción de estudiantes con resultados destacados en pruebas nacionales."
     },
     {
       "title": "Expansión de sede",
       "date": "2005",
       "description": "Inauguramos nuevos espacios: laboratorios de ciencias, biblioteca moderna y zonas deportivas para toda la comunidad escolar."
     },
     {
       "title": "Certificación de calidad",
       "date": "2015",
       "description": "Recibimos reconocimiento por nuestro modelo pedagógico y gestión institucional, consolidando años de mejora continua."
     },
     {
       "title": "Educación híbrida y digital",
       "date": "2023",
       "description": "Integramos plataformas digitales, aula virtual y metodologías activas para preparar a los estudiantes ante los retos del futuro."
     }
   ]$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'hero',
   $json${
     "badge": "Admisiones 2026 abiertas",
     "name": "Colegio Piloto",
     "slogan": "Formando líderes para el futuro con excelencia académica",
     "description": "Somos una institución educativa con décadas de trayectoria formando estudiantes íntegros, críticos y preparados para los desafíos del mundo actual.",
     "heroPhoto": "/branding/placeholders/hero-photo.avif",
     "tourPoster": "/branding/placeholders/hero-tour-poster.jpg",
     "actions": [
       {
         "label": "Solicitar información",
         "href": "#contacto",
         "variant": "primary"
       },
       {
         "label": "Conócenos",
         "href": "/nosotros",
         "variant": "secondary"
       }
     ]
   }$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'video_tour',
   $json${
     "videoUrl": "/branding/tour.mp4",
     "poster": "/branding/placeholders/hero-tour-poster.jpg",
     "title": "Tour virtual por Colegio Piloto",
     "description": "Recorrido virtual por las instalaciones del Colegio Piloto: aulas, laboratorios, zonas deportivas y espacios comunes."
   }$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'autoridades',
   $json$[
     {
       "name": "Dra. Carolina Mendoza",
       "role": "Rectora",
       "image": "/branding/placeholders/authority-1.jpg"
     },
     {
       "name": "Dr. Andrés Velasco",
       "role": "Vicerrector académico",
       "image": "/branding/placeholders/authority-2.jpg"
     },
     {
       "name": "Mg. Lucía Ríos",
       "role": "Coordinadora de bienestar",
       "image": "/branding/placeholders/authority-3.jpg"
     },
     {
       "name": "Esp. Miguel Torres",
       "role": "Director de admisiones",
       "image": "/branding/placeholders/authority-4.jpg"
     }
   ]$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'niveles',
   $json${
     "preescolar": {
       "headline": "Primera experiencia escolar con alegría",
       "description": "En preescolar acompañamos a los niños en su primer contacto con la escuela mediante juegos, exploración sensorial, arte y rutinas que fortalecen su autonomía y creatividad.",
       "image": "/branding/placeholders/level-preescolar.jpg",
       "program": [
         "Desarrollo del lenguaje oral y comunicativo",
         "Pensamiento lógico-matemático vivencial",
         "Exploración del entorno natural y social",
         "Expresión artística, música y movimiento",
         "Hábitos de autonomía y convivencia"
       ],
       "methodology": "Implementamos una pedagogía lúdica y afectiva donde el juego estructurado es el eje central del aprendizaje. Los docentes observan, acompañan y documentan el desarrollo integral de cada niño.",
       "schedule": {
         "mondayFriday": "7:30 a.m. – 12:30 p.m.",
         "saturday": "Actividades familiares programadas"
       },
       "cta": "Conoce el proceso de admisión para preescolar"
     },
     "primaria": {
       "headline": "Bases sólidas para aprender a aprender",
       "description": "La primaria fortalece la lectoescritura, el pensamiento matemático, la indagación científica y la formación en valores, preparando a los estudiantes para continuar su trayectoria académica.",
       "image": "/branding/placeholders/level-primaria.jpg",
       "program": [
         "Lenguaje, lectura y escritura creativa",
         "Matemáticas y resolución de problemas",
         "Ciencias naturales y educación ambiental",
         "Ciencias sociales y cultura ciudadana",
         "Educación artística, tecnología y deportes"
       ],
       "methodology": "Combinamos clases activas, proyectos interdisciplinarios y el uso pedagógico de la tecnología. Fomentamos la curiosidad, el trabajo en equipo y la responsabilidad personal.",
       "schedule": {
         "mondayFriday": "7:00 a.m. – 2:00 p.m.",
         "saturday": "Actividades extracurriculares opcionales"
       },
       "cta": "Solicita información sobre primaria"
     },
     "secundaria": {
       "headline": "Pensamiento crítico y preparación para la media",
       "description": "En secundaria profundizamos en áreas disciplinares, desarrollamos habilidades de pensamiento crítico y orientamos a los estudiantes en su proyecto de vida.",
       "image": "/branding/placeholders/level-secundaria.jpg",
       "program": [
         "Lengua castellana, inglés y comunicación",
         "Matemáticas, estadística y geometría",
         "Ciencias naturales: física, química y biología",
         "Ciencias sociales: historia, geografía y política",
         "Tecnología, emprendimiento y educación artística"
       ],
       "methodology": "Trabajamos por competencias a través de la indagación, el debate, la experimentación en laboratorios y proyectos que conectan el aula con el mundo real.",
       "schedule": {
         "mondayFriday": "7:00 a.m. – 2:30 p.m.",
         "saturday": "Clubes académicos y deportivos"
       },
       "cta": "Descubre nuestra secundaria"
     }
   }$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'admisiones',
   $json${
     "periodLabel": "Admisiones 2026 abiertas",
     "fechasClave": [
       {
         "title": "Inicio de Postulaciones",
         "date": "1 de Septiembre, 2025",
         "estado": "en-curso",
         "description": "Apertura oficial del proceso para todos los niveles educativos."
       },
       {
         "title": "Cierre de Convocatoria",
         "date": "30 de Noviembre, 2025",
         "estado": "ultimos-cupos",
         "description": "Fecha límite de recepción de postulaciones completas."
       },
       {
         "title": "Jornada de Inducción",
         "date": "22 de Enero, 2026",
         "estado": "familias-admitidas",
         "description": "Bienvenida y orientación para las familias admitidas."
       }
     ],
     "aviso": "El número de vacantes es limitado por nivel para mantener un ratio máximo de 22 alumnos por aula.",
     "etapas": [
       {
         "title": "Inscripción en línea",
         "description": "Diligencia el formulario digital y adjunta la documentación requerida sin salir de casa.",
         "pie": "Formato 100% digital"
       },
       {
         "title": "Entrevista y valoración",
         "description": "Conoce al equipo docente y realiza la entrevista y la valoración académica según el nivel.",
         "pie": "Presencial en campus"
       },
       {
         "title": "Publicación de resultados",
         "description": "Recibe la confirmación de admisión de forma oficial y con toda la transparencia.",
         "pie": "Vía portal y correo"
       },
       {
         "title": "Matrícula y bienvenida",
         "description": "Completa la matrícula y participa en la inducción para integrarte a la comunidad escolar.",
         "pie": "Integración institucional"
       }
     ],
     "requisitosPorNivel": {
       "preescolar": [
         { "title": "Registro civil de nacimiento", "description": "Copia legible del registro civil del aspirante, vigente y sin enmendaduras.", "formato": "PDF o JPG legible (máx. 5MB)" },
         { "title": "Documento de identidad de los acudientes", "description": "Copia de la cédula de identidad de padre, madre o acudiente responsable.", "formato": "PDF o JPG legible (máx. 5MB)" },
         { "title": "Certificado de desarrollo o jardín", "description": "Certificación de la institución o jardín anterior (si aplica) sobre el proceso del menor.", "formato": "Documento oficial sellado (PDF)" },
         { "title": "Fotografía reciente", "description": "Fotografía tamaño 3x4 con fondo claro y actualizada al periodo vigente.", "formato": "JPG o PNG (máx. 2MB)" },
         { "title": "Certificado de salud y vacunación", "description": "Esquema de vacunación al día y certificado médico de aptitud para actividad escolar.", "formato": "Documento oficial sellado (PDF)" }
       ],
       "primaria": [
         { "title": "Registro civil de nacimiento", "description": "Copia legible del registro civil del aspirante, vigente y sin enmendaduras.", "formato": "PDF o JPG legible (máx. 5MB)" },
         { "title": "Documento de identidad de los acudientes", "description": "Copia de la cédula de identidad de padre, madre o acudiente responsable.", "formato": "PDF o JPG legible (máx. 5MB)" },
         { "title": "Certificado de notas del año anterior", "description": "Informe académico o boletín del grado inmediatamente anterior, debidamente firmado.", "formato": "Documento oficial sellado (PDF)" },
         { "title": "Paz y salvo de la institución anterior", "description": "Certificación de paz y salvo académico y financiero de la institución de procedencia.", "formato": "Documento oficial sellado (PDF)" },
         { "title": "Fotografía reciente", "description": "Fotografía tamaño 3x4 con fondo claro y actualizada al periodo vigente.", "formato": "JPG o PNG (máx. 2MB)" }
       ],
       "secundaria": [
         { "title": "Registro civil de nacimiento", "description": "Copia legible del registro civil del aspirante, vigente y sin enmendaduras.", "formato": "PDF o JPG legible (máx. 5MB)" },
         { "title": "Documento de identidad del estudiante", "description": "Tarjeta de identidad o cédula de ciudadanía del aspirante, según corresponda.", "formato": "PDF o JPG legible (máx. 5MB)" },
         { "title": "Certificado de notas del año anterior", "description": "Informe académico o boletín del grado inmediatamente anterior, debidamente firmado.", "formato": "Documento oficial sellado (PDF)" },
         { "title": "Paz y salvo de la institución anterior", "description": "Certificación de paz y salvo académico y financiero de la institución de procedencia.", "formato": "Documento oficial sellado (PDF)" },
         { "title": "Certificado de conducta y conformidad", "description": "Certificación de buen comportamiento y convivencia expedida por la institución anterior.", "formato": "Documento oficial sellado (PDF)" }
       ]
     },
     "faq": [
       { "id": "criterios", "title": "¿Cuáles son los criterios de selección?", "content": "Evaluamos el desempeño académico, la entrevista con la familia y la disponibilidad de cupos por nivel, manteniendo un proceso transparente con criterios publicados y comunicados a cada familia." },
       { "id": "hermanos", "title": "¿Tienen prioridad los hermanos de estudiantes actuales?", "content": "Sí. Las familias con hijos matriculados activos tienen prioridad de cupo para nuevos hermanos, siempre que cumplan los requisitos y se postulen dentro del periodo oficial." },
       { "id": "costos", "title": "¿Cuáles son los costos de inscripción?", "content": "El valor de inscripción y matrícula se informa en la oficina de admisiones. Ofrecemos facilidades de pago y descuentos por pronto pago descritos en la circular de costos del periodo." },
       { "id": "resultados", "title": "¿Cómo y cuándo me notifican los resultados?", "content": "Los resultados se publican vía portal de admisiones y correo electrónico registrado en la postulación, dentro del cronograma oficial señalado en la sección de fechas clave." },
       { "id": "becas", "title": "¿Existen becas o alivios económicos?", "content": "Contamos con un programa de becas y alivios por mérito académico y por situación socioeconómica. La solicitud se gestiona directamente con la oficina de admisiones al momento de postular." }
     ]
   }$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'galeria',
   $json$[
     {
       "src": "/branding/placeholders/gallery-1.jpg",
       "alt": "Estudiantes en clase de arte",
       "variant": "large"
     },
     {
       "src": "/branding/placeholders/gallery-2.jpg",
       "alt": "Laboratorio de ciencias",
       "variant": "default"
     },
     {
       "src": "/branding/placeholders/gallery-3.jpg",
       "alt": "Actividad deportiva",
       "variant": "tall"
     },
     {
       "src": "/branding/placeholders/gallery-4.jpg",
       "alt": "Biblioteca del colegio",
       "variant": "default"
     },
     {
       "src": "/branding/placeholders/gallery-5.jpg",
       "alt": "Evento cultural",
       "variant": "wide"
     },
     {
       "src": "/branding/placeholders/gallery-6.jpg",
       "alt": "Graduación",
       "variant": "default"
     }
   ]$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'contacto',
   $json${
     "departments": [
       {
         "name": "Recepción general",
         "phone": "+57 601 234 5678",
         "email": "recepcion@colegiopiloto.edu.co",
         "hours": "Lunes a viernes, 7:00 a.m. – 4:00 p.m."
       },
       {
         "name": "Admisiones",
         "phone": "+57 601 234 5679",
         "email": "admisiones@colegiopiloto.edu.co",
         "hours": "Lunes a viernes, 8:00 a.m. – 12:00 m."
       },
       {
         "name": "Rectoría",
         "phone": "+57 601 234 5680",
         "email": "rectoria@colegiopiloto.edu.co",
         "hours": "Previa cita"
       },
{
          "name": "Bienestar estudiantil",
          "phone": "+57 601 234 5681",
          "email": "bienestar@colegiopiloto.edu.co",
          "hours": "Lunes a viernes, 8:00 a.m. – 3:00 p.m.",
          "hidden": true
        },
        {
          "name": "Tesorería",
          "phone": "+57 601 234 5682",
          "email": "tesoreria@colegiopiloto.edu.co",
          "hours": "Lunes a viernes, 8:00 a.m. – 2:00 p.m.",
          "hidden": true
        }
     ],
     "formFields": [
       {
         "id": "name",
         "label": "Nombre completo",
         "type": "text",
         "required": true
       },
       {
         "id": "email",
         "label": "Correo electrónico",
         "type": "email",
         "required": true
       },
       {
         "id": "phone",
         "label": "Teléfono",
         "type": "tel",
         "required": true
       },
       {
         "id": "subject",
         "label": "Asunto",
         "type": "text",
         "required": true
       },
       {
         "id": "message",
         "label": "Mensaje",
         "type": "textarea",
         "required": true
       }
     ]
   }$json$::jsonb)
on conflict (tenant_id, clave) do update
  set valor = excluded.valor,
      updated_at = now();