/**
 * OpenTelemetry Tracing Configuration
 *
 * Exports traces to Jaeger via OTLP HTTP protocol.
 * View traces at http://localhost:16686
 *
 * This module provides:
 * - TracerLive: Layer that configures OtlpTracer to send spans to Jaeger
 *
 * The tracer is used by:
 * - HttpMiddleware.tracer: Creates HTTP server spans (automatic)
 * - RpcTracer middleware: Creates RPC handler spans (via Effect.withSpan)
 * - Effect.fn in services: Creates service-level spans (via span name parameter)
 */

import * as OtlpTracer from '@effect/opentelemetry/OtlpTracer';
import * as FetchHttpClient from '@effect/platform/FetchHttpClient';
import * as Layer from 'effect/Layer';

// OTLP endpoint - Jaeger collector
const OTLP_URL = process.env.OTLP_URL ?? 'http://localhost:4318/v1/traces';

// Log tracing configuration on module load
console.log(`[Tracing] OpenTelemetry configured -> ${OTLP_URL}`);
console.log(`[Tracing] View traces at http://localhost:16686`);

/**
 * TracerLive - OpenTelemetry tracer layer that sends traces to Jaeger.
 *
 * This layer uses Layer.setTracer internally to replace Effect's default
 * tracer with one that exports spans via OTLP HTTP to Jaeger.
 *
 * View traces at: http://localhost:16686
 */
export const TracerLive = OtlpTracer.layer({
  url: OTLP_URL,
  resource: {
    serviceName: 'my-artist-type-api',
  },
  exportInterval: '1 second',
  maxBatchSize: 100,
}).pipe(Layer.provide(FetchHttpClient.layer));
