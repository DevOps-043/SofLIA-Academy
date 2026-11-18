# Ampliación de preparación para Hub

Estado: primera entrega implementada localmente, pendiente de publicación y piloto.

Academy conserva autoridad de organización, curso, instructor y sesión. Architect envía el manifiesto firmado y Hub consulta el estudio con bearer. Las lecciones asíncronas se toman en Academy y el vivo en Hub.

La primera entrega amplía el manifiesto v1 con preparación opcional que contiene duración, bloques ordenados, referencias a prácticas y notas del ponente por escena. El estado privado del estudio conserva esos campos. La proyección del participante los excluye. Los clientes que envían X-Soflia-Studio-Preparation: 1 reciben la preparación solo si pueden gestionar la sesión. Los demás reciben la respuesta anterior.

Las tablas live_studio_state y live_studio_commands mantienen permisos exclusivos de service_role. Solo live_studio_revisions publica una revisión accesible al cliente autorizado. Conservar esos permisos para proteger las notas. El commit SQL existente aplica las guardas de sesión, revisión e idempotencia. No se incorpora una migración de estructura en esta entrega.

Publicar Academy compatible antes de Architect y Hub. Evitar un pool con servidores anteriores después de guardar el JSON ampliado. El rollback de interfaz conserva datos y requiere backend capaz de leerlos.

Las siguientes entregas completan documentos, carga privada de archivos, relaciones por ID persistente, medios, encuestas y registro real. El cambio coordinado de Hub extend-live-session-preparation mantiene la ruta y criterios por plataforma.

La segunda entrega está documentada en [Documentos de sesión](live-session-documents.md), con publicación por audiencia y negociación compatible.
