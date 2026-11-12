# Personaje SofLIA en Academy

## Alcance

Sustituir el retrato del asistente en chat general, cursos, actividades guiadas,
retroalimentación, cuaderno y accesos móviles. Conservar las fotos de usuarios y
las conversaciones entre personas. El personaje conserva el cuerpo y catorce
expresiones aprobados en Hub, con visor plano, mirada, parpadeo y gestos continuos.

## Contratos

- El turno visual es local, incrementado al aceptar un envío. No modifica API,
  mensajes persistidos, permisos, evaluaciones ni analíticas.
- Cargar historial no se interpreta como una respuesta nueva. Usuario,
  organización, conversación y lección delimitan la presencia.
- Carga y espera prolongada muestran pensamiento/concentración; voz o revelado
  muestran respuesta; dictado, escucha; errores reales, preocupación.
- Las decisiones pendientes muestran advertencia. Sólo un resultado estructurado
  de actividad completada o una propuesta aplicada muestra éxito; el texto normal
  confirma mediante asentimiento facial sin fingir una calificación aprobatoria.
- Los borradores tienen reacciones locales, sin enviar ni registrar el contenido.
  Reposo después de veinte segundos sin uso, con Zzz externos al cuerpo.
- Una presencia principal por chat; miniaturas en historial y accesos para evitar
  animar un motor completo por mensaje. La animación respeta movimiento reducido,
  el guard de rendimiento de Academy, visibilidad y desmontaje.
- La observación opcional del TTS usa captureStream del reproductor existente,
  sin redirigirlo ni pedir micrófono. Donde no está disponible se conserva el
  gesto ambiental; SpeechRecognition no expone señal PCM para medir tono.
- Textos accesibles sincronizados en ES/EN/PT; colores mediante variables.
- WebP sin pérdida: alpha y RGB visibles idénticos a los PNG de Hub. El RGB de
  píxeles completamente transparentes no participa en la identidad visible.

## Verificación ejecutada — 12 de noviembre de 2026

- 75 pruebas dirigidas, 12 archivos: aprobadas. Incluyen movimiento continuo,
  pausa, aislamiento entre conversaciones, historial, tiempos, resultados,
  audio prestado, aprobación de propuestas y respuestas tardías del cuaderno.
- ESLint de los 48 archivos TypeScript modificados o nuevos: aprobado.
- `type-check:core`: aprobado. `type-check:features`: siete diagnósticos previos,
  idénticos a `8aee8be2`. `type-check:app`: 302 diagnósticos tanto en la base
  limpia como en esta rama; mismas ubicaciones y códigos, con diferencias de
  orden en la impresión de algunas uniones de TypeScript.
- Compilación Next desde `apps/web` con `next build --experimental-build-mode
  compile`: aprobada. No equivale a un build completo con prerenderizado,
  comprobaciones globales y validación posterior de despliegue.
- Suite web completa: 490 archivos aprobados, 17 fallidos, uno omitido;
  3088 pruebas aprobadas, 22 fallidas, dos omitidas. La base limpia tiene los
  mismos 17 archivos fallidos (485 aprobados, uno omitido; 3033 pruebas
  aprobadas, 21 fallidas, dos omitidas). La diferencia de una prueba fallida
  corresponde a `InteractiveActivityRenderer`: la nueva compatibilidad de
  `matchMedia` permite recolectarlo y revela su falta previa de
  `LiaCourseProvider`. Se reprodujo el mismo fallo en la base con esa misma
  compatibilidad. Después se añadieron y aprobaron las tres pruebas del cuaderno.
- QA en Chrome con componentes reales aislados: seis comprobaciones aprobadas,
  sin excepciones del navegador. Incluye borradores independientes, boca con
  señal WAV local, propuesta/aplicación del cuaderno, ES/EN/PT, claro/oscuro,
  ancho de 390 px y movimiento reducido. No es una sesión autenticada de
  producción ni una llamada real de micrófono/TTS remoto.

Evidencia: [reporte y capturas](../reports/academy-avatar/README.md).

## Revisión adversarial

Se intentó refutar que cargar historial o cancelar generara éxito, que cambiar
de conversación conservara gestos anteriores, que una propuesta se aplicara
sin consentimiento y que una respuesta tardía contaminara otro apunte. Las
pruebas cubren esas rutas. Se verificó que el observador de audio no cambia el
reproductor, no pide micrófono y libera únicamente sus recursos. Los cambios no
tocan API, autenticación, persistencia, dependencias ni secretos.

Riesgos residuales: el dictado de SpeechRecognition no expone PCM; su expresión
se basa en el estado real de escucha, con movimiento ambiental. El análisis
del TTS requiere `captureStream`; los navegadores sin esa API conservan la
animación de conversación. Los fallos globales previos siguen pendientes.

## Entrega

Rama `codex/academy-avatar-2d`, desde `8aee8be2`. No implica despliegue de
producción ni migración. La reversión consiste en revertir el commit de esta
integración; el retrato original permanece en los recursos de Academy.
