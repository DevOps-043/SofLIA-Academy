# Despliegue coordinado para pruebas

Despliegue verificado el 2026-11-05. Learning QA está disponible desde 5ffa4092.

El usuario solicitó continuar la liberación para pruebas y habilitó acceso al panel Netlify. En el proyecto soflia-learning del equipo devops-043 se verificó el repositorio DevOps-043/SofLIA-Learning y se agregó codex/complete-synchronous-system a las ramas con deploy. Se conservaron main como producción y las ramas qa/load-testing y reafctorizacion/main ya configuradas.

Netlify completó el deploy 6aed311b87cd372cd48e585c en 4m 39s mediante scripts/netlify-build.sh. Publicó 14 funciones y una función edge. La URL de rama cargó la portada y el panel autenticado. [Learning QA](https://codex-complete-synchronous-system--soflia-learning.netlify.app) · [Evidencia del deploy](https://app.netlify.com/projects/soflia-learning/deploys/6aed311b87cd372cd48e585c).

Publicar Learning compatible antes de Engine/Hub. Las migraciones y límites remotos están en [la evidencia de ejecución](execution.md). El registro de historial de la migración manual de Engine y el piloto audiovisual continúan pendientes; no se habilitan credenciales Video ni se inicia una clase como parte de esta publicación.
