# Observabilidad Fase 4

Estado: instrumentacion agregada en el proxy de Next.js, API routes observadas, health dashboard JSON y sink APM HTTP configurable.

## Datos agregados por request

- `X-Correlation-Id`: se respeta si llega en el request o se genera uno nuevo.
- `X-Request-Duration-Ms`: duracion total vista por el proxy.
- `Server-Timing`: incluye `app;dur=<ms>`.
- Metrica in-memory: `http_requests_total{route,method,status}`.
- Metrica in-memory: `http_request_duration_ms{route,method,status}`.
- Metrica in-memory: `http_request_duration_seconds{route,method,status}` con p50/p95/p99.
- Metrica in-memory: `external_api_duration_seconds{provider,outcome}` desde circuit breakers.
- Metrica in-memory: `circuit_breaker_open_total{provider}` y `circuit_breaker_rejected_total{provider}`.
- Evento APM HTTP opcional: `http.server.request` con `correlationId`, `routeName`, `statusCode` y duracion.

## Dashboard de salud

- `GET /api/health`: health check sintetico para DB, OpenAI, Gemini y APM.
- `GET /api/performance/metrics`: pools, cache, presupuestos y metricas agregadas.
- `GET /api/observability/health`: dashboard JSON de metricas, circuit breakers y presupuestos.
- Monitor programado: `.github/workflows/observability-health-monitor.yml`.

En produccion, `/api/observability/health` requiere `Authorization: Bearer $OBSERVABILITY_DASHBOARD_TOKEN`.

## Configuracion APM

| Variable | Uso |
|---|---|
| `OBSERVABILITY_APM_PROVIDER=http` | Activa el sink HTTP vendor-neutral. |
| `OBSERVABILITY_APM_ENDPOINT` | URL de ingesta del proveedor APM/log pipeline. |
| `OBSERVABILITY_APM_API_KEY` | Token bearer opcional para ingesta. |
| `OBSERVABILITY_APM_SAMPLE_RATE` | Muestreo entre `0` y `1`; default `1`. |
| `OBSERVABILITY_SERVICE_NAME` | Nombre del servicio; default `soflia-academy-web`. |
| `OBSERVABILITY_DASHBOARD_TOKEN` | Token bearer para consultar `/api/observability/health` en produccion. |

## Proveedores recomendados

- Errores y performance: Sentry.
- Logs: Axiom o Logflare.
- Metricas y alertas: Grafana Cloud o Datadog.

## Alertas minimas

| Alerta | Umbral | Runbook |
|---|---|---|
| p95 alto | presupuesto x2 por 5 min | `docs/observability/runbooks/latency-p95.md` |
| 5xx alto | >1% por 5 min | `docs/observability/runbooks/error-rate-5xx.md` |
| DB pool alto | >80% conexiones | `docs/observability/runbooks/db-connections.md` |
| Queue backlog | pendiente > umbral por cola | `docs/observability/runbooks/queue-backlog.md` |
| Circuit breaker abierto | estado `open` | `docs/observability/runbooks/circuit-breaker-open.md` |

## Pendiente operativo

1. Configurar `OBSERVABILITY_APM_ENDPOINT` por entorno.
2. Configurar `OBSERVABILITY_BASE_URL` y `OBSERVABILITY_DASHBOARD_TOKEN` para el monitor programado.
3. Activar alertas del proveedor sobre p95, 5xx, DB pool, queues y circuit breakers.
