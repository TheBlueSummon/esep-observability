# OpenTelemetry todo application

Express and MongoDB example with OpenTelemetry traces exported to Jaeger over OTLP/HTTP, metrics exported to the console, and structured application logs correlated with trace IDs.

## Current verification status

Dependencies installed; JavaScript syntax and console exporter initialization verified. End-to-end execution awaits a running Docker engine. No application results or Jaeger screenshots have been claimed.

## Run

Requires Node.js 20 or later and Docker Desktop with its engine running.

```sh
npm ci
docker compose up -d
npm run start:console
# In another terminal:
curl http://localhost:3000/todo
```

Stop the application with Ctrl+C, then switch to the final OTLP configuration:

```sh
npm start
# In another terminal:
curl http://localhost:3000/todo
```

Allow at least five seconds for trace batching. Open http://localhost:16686, select service `todo-service`, and click Find Traces. Open a GET /todo trace and expand the `todo.list` and MongoDB spans. Capture the search results and expanded timeline. Metrics print every ten seconds in the application terminal. Stop the application with Ctrl+C to flush remaining telemetry.

Use `docker compose stop` to stop the services. Jaeger uses in-memory storage: traces are lost when its process restarts. Database seed records use fixed IDs and upserts so app restarts do not duplicate them. Ports bind only to the local machine.

## Signals

- Traces: HTTP and library instrumentation plus a manual `todo.list` span and `todos.loaded` event. MongoDB driver spans measure client-side calls, not MongoDB server execution in isolation.
- Metrics: `todo.requests` counts completed handler calls; `todo.request.duration` records handler duration in milliseconds. Automatic instrumentation may also emit metrics. These are console exports, not Jaeger metric dashboards.
- Logs: JSON records include timestamp, severity, result count, traceId, and spanId. These are stdout/stderr application logs, not an OTLP Logs pipeline. The event inside the trace is distinct from the console record.

## Changes from the course starter

Unmodified supplied files are retained in `starter/` for comparison. The runnable app preserves the `todo` database, both `/todo` and `/todo/:id` routes, the three sample titles and string IDs, and the `todo-service` resource name. Seeding uses upserts instead of inserting duplicates on every restart. The final tracing configuration supports OTLP and console modes, avoids registering the same instrumentation twice, and adds graceful SDK shutdown. Custom handler metrics, a manual span, and correlated structured logs provide explicit evidence for all three telemetry concepts. Missing IDs return HTTP 404.

## Dependency choices

The SDK versions follow the assignment's 2.0.0 / 0.200.0 generation. Auto instrumentation supplies HTTP, Express, and MongoDB instrumentation. The final configuration uses `@opentelemetry/exporter-trace-otlp-http` instead of the legacy Jaeger exporter. `./tracing.js` uses an explicit relative preload path. A lockfile pins the installation. npm reports 34 dependency advisories in this assignment-era dependency set; review and update dependencies before any use beyond this local exercise.

## Documentation reviewed

- https://opentelemetry.io/docs/
- https://opentelemetry.io/docs/concepts/components/
- https://opentelemetry.io/docs/concepts/context-propagation/
- https://opentelemetry.io/docs/concepts/signals/traces/
- https://opentelemetry.io/docs/concepts/signals/metrics/
- https://opentelemetry.io/docs/concepts/signals/logs/
- https://opentelemetry.io/docs/concepts/sampling/
- https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
- https://opentelemetry.io/docs/languages/js/exporters/
- https://www.jaegertracing.io/docs/2.5/getting-started/
