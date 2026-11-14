# Verificación visual del personaje Academy

La integración y las limitaciones están descritas en el
[plan del cambio](../../plans/soflia-avatar-academy.md).

La muestra usa los componentes productivos de chat general, curso y cuaderno,
con datos locales, un tema controlado y sin credenciales. El endpoint del
cuaderno se intercepta en el navegador; la señal de audio es un WAV sintetizado
localmente sobre el reproductor compartido. No mide latencia de servicios reales.

- [Tema oscuro](dark.png): perfiles superiores con duda y sorpresa independientes.
- [Bienvenida](welcome.png): personaje central antes de la primera interacción.
- [Acceso flotante](launcher.png): silueta de 96 px sin burbuja de fondo.
- [Tema claro](light.png): conversación y propuesta aplicada al apunte.
- [Móvil a 390 px](mobile.png): paneles con perfiles de 72 px y sin duplicados.
- [Resultados automáticos](browser-qa.json): siete verificaciones y cero errores;
  al escribir desaparece la bienvenida y queda sólo el perfil superior, incluso
  tras borrar el borrador. Incluye escritorio y anchos de 390/320 px.

Para reproducir desde la raíz del repositorio, iniciar en una terminal:

```powershell
node node_modules/vite/bin/vite.js --config test/manual/academy-avatar/vite.config.mts
```

Y en otra terminal:

```powershell
node test/manual/academy-avatar/verify.mjs
```

La prueba utiliza `playwright-core` ya instalado y Chrome en su ruta estándar
de Windows. Se puede adaptar esa ruta si el navegador está instalado en otro
directorio. El servidor de la muestra escucha únicamente en localhost:4332.
