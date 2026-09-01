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
     },
     "media-tecnica": {
       "headline": "Bachillerato con énfasis técnico",
       "description": "La media técnica combina la formación de bachiller con competencias técnicas y proyectos de emprendimiento que preparan a los jóvenes para la educación superior y el mundo laboral.",
       "image": "/branding/placeholders/level-secundaria.jpg",
       "program": [
         "Bachillerato académico completo",
         "Énfasis técnico según oferta institucional",
         "Emprendimiento y desarrollo de proyectos",
         "Orientación vocacional y profesional",
         "Prácticas empresariales y articulación con la zona"
       ],
       "methodology": "Aprendizaje basado en proyectos, rotaciones técnicas y alianzas con empresas e instituciones de educación superior para una formación con sentido de realidad.",
       "schedule": {
         "mondayFriday": "7:00 a.m. – 3:00 p.m.",
         "saturday": "Prácticas técnicas y proyectos"
       },
       "cta": "Conoce la media técnica"
     }
   }$json$::jsonb),

  ((select id from public.colegios where slug = 'colegio-piloto'), 'admisiones',
   $json${
     "schedule": [
       {
         "title": "Inscripciones abiertas",
         "date": "Enero – marzo",
         "description": "Recepción de formularios y documentos de aspirantes a todos los niveles educativos."
       },
       {
         "title": "Evaluación de admisión",
         "date": "Abril",
         "description": "Entrevistas y pruebas de ubicación académica según el nivel al que aspira el estudiante."
       },
       {
         "title": "Publicación de resultados",
         "date": "Mayo",
         "description": "Comunicación de resultados y entrega de cartas de aceptación a las familias seleccionadas."
       },
       {
         "title": "Matrícula y bienvenida",
         "date": "Junio – julio",
         "description": "Proceso de matrícula, entrega de uniformes e inducción a la comunidad escolar."
       }
     ],
     "requirements": [
       "Formulario de inscripción debidamente diligenciado",
       "Copia del documento de identidad del estudiante",
       "Copia del documento de identidad del acudiente",
       "Certificado de notas del año escolar anterior",
       "Fotografía tamaño 3x4 actualizada",
       "Paz y salvo o certificación académica de la institución anterior",
       "Soporte de pago de la inscripción"
     ],
     "faq": [
       {
         "id": "edades",
         "title": "¿Qué edades corresponden a cada nivel?",
         "content": "Preescolar recibe niños entre 3 y 5 años, primaria de 6 a 10 años, secundaria de 11 a 14 años y media técnica de 15 a 17 años."
       },
       {
         "id": "costos",
         "title": "¿Cuáles son los costos de matrícula y pensión?",
         "content": "Los valores se definen anualmente y se informan en la oficina de admisiones. Ofrecemos facilidades de pago y descuentos por pronto pago."
       },
       {
         "id": "uniforme",
         "title": "¿El colegio tiene uniforme?",
         "content": "Sí, contamos con uniforme institucional diario y de educación física. Los detalles se entregan durante el proceso de inducción."
       },
       {
         "id": "ingreso-mitad-ano",
         "title": "¿Pueden ingresar estudiantes a mitad de año?",
         "content": "Las vacantes disponibles a mitad de año dependen de cada grado. Te invitamos a consultar directamente con la oficina de admisiones."
       },
       {
         "id": "transporte",
         "title": "¿Ofrecen servicio de transporte escolar?",
         "content": "Contamos con rutas de transporte escolar en convenio con empresas certificadas. Las rutas y tarifas se confirman antes del inicio de clases."
       }
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
         "hours": "Lunes a viernes, 8:00 a.m. – 3:00 p.m."
       },
       {
         "name": "Tesorería",
         "phone": "+57 601 234 5682",
         "email": "tesoreria@colegiopiloto.edu.co",
         "hours": "Lunes a viernes, 8:00 a.m. – 2:00 p.m."
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