/**
 * OnLinkAccountHandler - Service for handling anonymous account linking
 *
 * When an anonymous user links their account (e.g., signs in with Google),
 * this service is called to migrate their data from the old anonymous user
 * to the new authenticated user.
 *
 * This is implemented as a separate service so that:
 * 1. Auth package doesn't depend on quiz/responses package
 * 2. Apps can provide their own implementation
 * 3. The handler is optional - if not provided, no data migration happens
 */
import * as Effect from 'effect/Effect';
import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';

/**
 * Data passed to the onLinkAccount handler
 */
export interface LinkAccountData {
  /** The anonymous user being linked (their data should be migrated) */
  anonymousUserId: string;
  /** The new user account (data should be migrated to this user) */
  newUserId: string;
}

/**
 * Service interface for handling account linking
 */
export interface OnLinkAccountHandler {
  /**
   * Called when an anonymous user links their account.
   * Implementations should migrate user data (e.g., quiz responses)
   * from anonymousUserId to newUserId.
   */
  readonly handle: (data: LinkAccountData) => Effect.Effect<void, never, never>;
}

/**
 * Service tag for OnLinkAccountHandler
 */
export const OnLinkAccountHandler =
  Context.GenericTag<OnLinkAccountHandler>('OnLinkAccountHandler');

/**
 * No-op implementation that does nothing.
 * Used when no data migration is needed.
 */
export const OnLinkAccountHandlerNoop = Layer.succeed(
  OnLinkAccountHandler,
  OnLinkAccountHandler.of({
    handle: () => Effect.void,
  }),
);

/**
 * Creates an OnLinkAccountHandler layer from a function.
 * Use this to provide a custom implementation.
 *
 * @example
 * ```ts
 * const MyHandler = makeOnLinkAccountHandler((data) =>
 *   Effect.gen(function* () {
 *     const repo = yield* ResponsesRepo;
 *     yield* repo.updateUserIdForResponses(data.anonymousUserId, data.newUserId);
 *   })
 * );
 * ```
 */
export const makeOnLinkAccountHandler = <R>(
  handler: (data: LinkAccountData) => Effect.Effect<void, never, R>,
): Layer.Layer<OnLinkAccountHandler, never, R> =>
  Layer.effect(
    OnLinkAccountHandler,
    Effect.map(Effect.context<R>(), (context) =>
      OnLinkAccountHandler.of({
        handle: (data) => Effect.provide(handler(data), context),
      }),
    ),
  );
