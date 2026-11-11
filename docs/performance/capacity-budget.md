# Capacity Budget

This budget is the operating target for SofLIA Academy at 10,000 concurrent active users. It mirrors Task 4.0 from `TECH_DEBT_REMEDIATION.md` and is exposed at runtime through `/api/performance/metrics`.

## Load Model

| Assumption | Value | Notes |
|---|---:|---|
| Concurrent active users | 10,000 | Active users, not registered users. |
| Average request rate | 6 req/min/user | One request every 10 seconds. |
| Sustained throughput | 1,000 req/s | `10,000 * 6 / 60`. |
| Peak multiplier | 3x | Start-of-day bursts, calendar sync, admin reporting. |
| Peak throughput | 3,000 req/s | Used for stress and spike tests. |

## Runtime Budgets

| Resource | Budget | Monitoring source |
|---|---:|---|
| Sustained throughput | >= 1,000 req/s | Load-test report and APM. |
| Peak throughput | >= 3,000 req/s | Stress/spike profile. |
| Postgres active connections | <= 200 via pooler | Supavisor metrics and `load_test_connection_snapshot`. |
| Next.js memory | <= 1 GB per instance | Platform metrics. |
| Next.js horizontal scale | >= 4 instances | Platform autoscaling config. |
| Read latency p50 | <= 120 ms | APM route metrics. |
| Read latency p95 | <= 500 ms | APM route metrics. |
| Read latency p99 | <= 1,200 ms | APM route metrics. |
| Write latency p95 | <= 800 ms | APM route metrics. |
| 5xx error rate | <= 0.1% | APM and log aggregation. |
| Monthly availability | >= 99.9% | Uptime checks. |
| API response payload | <= 100 KB p95 | APM payload sampling. |
| CI build time | <= 8 min | CI metrics. |

## Enforcement

- `apps/web/src/lib/performance/capacity-budget.ts` is the code-level source used by `/api/performance/metrics`.
- `tools/load-testing/` collects request metrics, app snapshots, Supabase snapshots, and Netlify snapshots.
- `LOAD_DB_METRICS_RPC=load_test_connection_snapshot` enables database connection snapshots during load tests.
- `npm run load:pool-check` enforces Supavisor URL topology and verifies the latest DB connection snapshot.
- Any performance task in Phase 4 must include a before/after run against this budget.

## Review Cadence

Review this document after each load-test report and whenever product behavior changes request volume, payload size, AI usage, or calendar sync frequency.
