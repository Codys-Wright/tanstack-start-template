import * as HttpApi from '@effect/platform/HttpApi';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as Layer from 'effect/Layer';
import { makeSessionApiLive } from '../session/session-api-live.js';

/**
 * Creates all Auth API handlers
 *
 * Usage in app:
 * ```ts
 * import { makeAuthApiLive } from "@auth/server";
 * const AuthApiLive = makeAuthApiLive(DomainApi);
 * ```
 */
export const makeAuthApiLive = <
  ApiId extends string,
  Groups extends HttpApiGroup.HttpApiGroup.Any,
  ApiError,
  ApiR,
>(
  api: HttpApi.HttpApi<ApiId, Groups, ApiError, ApiR>,
): Layer.Layer<HttpApiGroup.ApiGroup<ApiId, 'session'>, never, never> => makeSessionApiLive(api);
