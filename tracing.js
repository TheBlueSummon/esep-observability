const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { ConsoleMetricExporter, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { resourceFromAttributes } = require('@opentelemetry/resources');

const sdk = new NodeSDK({
  resource: resourceFromAttributes({ 'service.name': 'todo-service' }),
  autoDetectResources: false,
  traceExporter: process.env.TRACE_EXPORTER === 'console'
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces' }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(), exportIntervalMillis: 10000
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },
    '@opentelemetry/instrumentation-dns': { enabled: false },
    '@opentelemetry/instrumentation-net': { enabled: false }
  })]
});
sdk.start();
module.exports = sdk;
