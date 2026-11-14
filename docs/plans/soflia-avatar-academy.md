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

Refinamiento de bienvenida del 13 de noviembre: el acceso flotante general y
de cursos mide 96 px y conserva únicamente la silueta transparente del personaje,
sin fondo circular, borde, sombra de botón ni anillo pulsante. El acceso de la
barra móvil usa una imagen de 48 px sin marco circular.

El chat vacío muestra una bienvenida central de 260 px (180 px con poca altura).
Al primer carácter se retira de inmediato y queda el perfil superior reactivo;
borrar el borrador no la recupera. Una conversación nueva reinicia la bienvenida.
Historial, carga, voz o decisiones pendientes no muestran una bienvenida nueva.
El avatar ampliado del chat general oculta la bienvenida mientras está abierto.
Este comportamiento se comparte con cursos, actividades y cuaderno.

Verificación: 86 pruebas dirigidas aprobadas en 14 archivos, ESLint de 12 archivos
aprobado, core typecheck aprobado y los mismos siete diagnósticos previos de
features. Build completo con postbuild Lambda aprobado; QA local de navegador
con siete comprobaciones aprobadas, incluyendo fondo transparente, entrada y
borrado de texto, audio, temas, móvil y aprobación explícita del cuaderno.
Se conservan los bloqueos del acceso al asistente durante actividades.
Publicación autorizada por la solicitud de implementación y despliegue en curso;
avance desde `f987732a` sin reescribir historial.

Actualización del 13 de noviembre de 2026: cada chat concentra el personaje
reactivo en la cabecera, de 88 px en escritorio y 72 px en móvil o poca altura.
Se retiraron las presencias inferiores y los personajes grandes de bienvenida
y voz, conservando los controles de voz y el texto de estado. General, cursos,
cuaderno, actividades y retroalimentación comparten el perfil. Al ampliar el
avatar del chat general se oculta el original mientras está abierto el ampliado.
La escucha tiene prioridad inmediata sobre el saludo de activación.

Validación de esta actualización: 82 pruebas dirigidas aprobadas en 13 archivos,
ESLint de 18 archivos aprobado, `type-check:core` y build completo con postbuild
Lambda aprobados. `type-check:features` conserva los siete diagnósticos previos,
sin nuevos. QA de navegador: siete comprobaciones aprobadas con un solo perfil
por chat, audio local, borradores, aprobación explícita del cuaderno, ambos
temas, ES/EN/PT, anchos de 390/320 px y movimiento reducido. La muestra usa
componentes reales aislados; no es una sesión autenticada de producción.

El usuario autorizó commit y despliegue a `main`. El avance se realiza desde
`6d927722`, preservando la reparación del merge y las fuentes locales. El
resultado remoto de Netlify se verifica después de publicar.

Corrección posterior de contraste: el visor usa tokens propios cian/ámbar
luminosos independientes del acento de acciones de UI. Se reforzaron trazos de
boca y cejas y opacidad mínima, incluida la expresión de sueño. Se repitieron
las 75 pruebas dirigidas y las seis comprobaciones visuales con resultado
aprobado; las capturas del reporte reflejan esta corrección.

Rama `codex/academy-avatar-2d`, desde `8aee8be2`. No implica despliegue de
producción ni migración. La reversión consiste en revertir el commit de esta
integración; el retrato original permanece en los recursos de Academy.
