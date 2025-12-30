/**
 * OpenTelemetry Tracing Configuration for Server Runtimes
 *
 * This module provides a TracerLive layer that can be composed into
 * package-level server runtimes to enable Effect.fn span exports.
 *
 * Usage:
 * ```ts
 * import { TracerLive } from '@core/server';
 *
 * export const MyPackageServerLayer = Layer.merge(
 *   MyService.Default,
 *   AuthService.Default,
 * ).pipe(Layer.provideMerge(TracerLive));
 * ```
 *
 * View traces at http://localhost:16686 (Jaeger UI)
 */

import * as OtlpTracer from '@effect/opentelemetry/OtlpTracer';
import * as FetchHttpClient from '@effect/platform/FetchHttpClient';
import * as Layer from 'effect/Layer';

// OTLP endpoint - Jaeger collector
const OTLP_URL = process.env.OTLP_URL ?? 'http://localhost:4318/v1/traces';

/**
 * TracerLive - OpenTelemetry tracer layer that sends traces to Jaeger.
 *
 * This layer uses Layer.setTracer internally to replace Effect's default
 * tracer with one that exports spans via OTLP HTTP to Jaeger.
 *
 * When composed into a runtime layer, all Effect.fn spans and
 * Effect.withSpan calls will be exported.
 */
export const TracerLive = OtlpTracer.layer({
  url: OTLP_URL,
  resource: {
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'my-artist-type-api',
  },
  exportInterval: '1 second',
  maxBatchSize: 100,
}).pipe(Layer.provide(FetchHttpClient.layer));
