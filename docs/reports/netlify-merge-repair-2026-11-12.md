# Recuperación del despliegue de Academy

Fecha: 12 de noviembre de 2026. Base: `main@7a4ebbac`.

## Diagnóstico confirmado

Se revisaron los dos despliegues fallidos recientes en Netlify:

- `main@5e8da136`, despliegue `6af6304aa1f111e6d9273eab`: el cargador
  Google de `next/font` falla en `root-fonts.ts`, con una lectura de índice sobre
  `null` durante la compilación.
- `main@7a4ebbac`, despliegue `6af630a8cd538aed02ea7501`: reproduce el fallo
  de fuentes y además contiene marcadores de conflicto en la ruta HTTP y el
  servicio del estudio en vivo. También quedaron en dos archivos de pruebas y
  la documentación del estudio.

El último despliegue publicado seguía en `8aee8be2`. La publicación automática
desde `main` está habilitada.

## Reparación

Se combinaron las dos ramas del estudio: negociación de participación 0/1,
cabecera del aviso de grabación, compatibilidad del snapshot antiguo, límites
de participación y entrega de preparación de Engine. Se preservaron los tres
códigos SQL de limitación existentes y las comprobaciones de identidad,
organización y acceso. Las pruebas de dominio y de coordinación SQL están
separadas para conservar ambos conjuntos sin imports o declaraciones duplicados.

Las mismas familias tipográficas se cargan con `next/font/local`, conservando
sus variables públicas, estilos y pesos. Los recursos y sus licencias SIL OFL
proceden de una revisión fijada del repositorio oficial `google/fonts`;
[procedencia y hashes](../../apps/web/src/app/fonts/README.md).
El build ya no necesita descargar fuentes de Google.

La verificación de marcadores de merge forma parte de `prebuild` y puede
ejecutarse con `npm run check:merge-conflicts`. Se comprobó que rechaza el
contenido real de la ruta del commit fallido y acepta el código reparado.

## Verificación local

- `npm run build --workspace=apps/web`: aprobado, con compilación optimizada,
  170 páginas generadas y comprobación `postbuild` del cuaderno y sanitizador
  compatibles con Lambda. Conserva la política previa de tipos/lint del build.
- 31 archivos y 196 pruebas del área live aprobados, incluida la ruta HTTP,
  ambos conjuntos de participación, roles, negociación antigua/nueva, aviso de
  grabación y SQL en PGlite. No se ejecutó SQL remoto.
- ESLint de los ocho archivos TypeScript cambiados: aprobado.
- `type-check:core`: aprobado. `type-check:features`: los mismos siete
  diagnósticos previos de componentes ajenos al estudio, comparados con la
  base registrada del trabajo anterior; no se desactivó ninguna comprobación.
- `git diff --check` y búsqueda global de marcadores: aprobados.

Revisión adversarial local: se probaron acceso no autenticado, falta de
membresía, identidad elegida en cuerpo, ausencia de aceptación del aviso y
negociación simultánea de participación/aviso. Los clientes antiguos no reciben
campos nuevos sin negociar. No se modificaron secretos, permisos, dependencias
ni migraciones. Los cambios de las ramas unificadas permanecen en el historial.

## Publicación y reversión

El usuario autorizó explícitamente commit y despliegue a `main`. Tras las
comprobaciones se publica el commit por avance normal, sin reescribir historial,
y se sigue el despliegue de producción en Netlify hasta su resultado.
La confirmación remota y los sondeos públicos se entregan al finalizar.

Si hubiera una regresión de producción, restaurar el despliegue publicado
`8aee8be2` en Netlify; no volver a publicar el merge que conserva conflictos.
La reparación no requiere migraciones de datos ni reversión de esquema.
