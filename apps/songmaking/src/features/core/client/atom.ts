/**
 * Core Atom Runtime for Songmaking App
 *
 * Sets up the Effect Atom runtime with proper logging and layers.
 */

import {
  Atom,
  type Registry,
  RegistryContext,
  Result,
  useAtomSet,
  useAtomValue,
} from '@effect-atom/atom-react';
import * as FetchHttpClient from '@effect/platform/FetchHttpClient';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as LogLevel from 'effect/LogLevel';
import * as React from 'react';

export const prefixLogs =
  (prefix: string) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.annotateLogs(effect, '__prefix', prefix);

const prettyLoggerWithPrefix: Layer.Layer<never> = Logger.replace(
  Logger.defaultLogger,
  Logger.prettyLogger().pipe(
    Logger.mapInputOptions((options) => {
      const prefixAnnotation = HashMap.get(options.annotations, '__prefix');
      if (prefixAnnotation._tag === 'Some') {
        const prefix = String(prefixAnnotation.value);
        const newAnnotations = HashMap.remove(options.annotations, '__prefix');

        const messageArray = Array.isArray(options.message) ? options.message : [options.message];
        const prefixedMessages =
          messageArray.length > 0
            ? [`[${prefix}] ${messageArray[0]}`, ...messageArray.slice(1)]
            : [`[${prefix}] `];

        return {
          ...options,
          message: prefixedMessages,
          annotations: newAnnotations,
        };
      } else {
        return options;
      }
    }),
  ),
);

export const makeAtomRuntime = Atom.context({ memoMap: Atom.defaultMemoMap });
makeAtomRuntime.addGlobalLayer(
  Layer.mergeAll(
    prettyLoggerWithPrefix,
    FetchHttpClient.layer,
    Logger.minimumLogLevel(LogLevel.Debug),
  ),
);

export const useAtomRegistry = (): Registry.Registry => {
  return React.useContext(RegistryContext);
};

export const isResultLoading = <A, E>(result: Result.Result<A, E>) =>
  result.waiting && result._tag === 'Initial';

export const isResultSuccess = <A, E>(result: Result.Result<A, E>): result is Result.Success<A> =>
  result._tag === 'Success';

export const AtomValue = <A>({
  atom,
  children,
}: {
  atom: Atom.Atom<A>;
  children: (value: A) => React.ReactNode;
}) => {
  const value = useAtomValue(atom);
  return children(value);
};

export const AtomResult = <A, E>({
  atom,
  onLoading,
  onError,
  onSuccess,
}: {
  atom: Atom.Atom<Result.Result<A, E>>;
  onLoading?: () => React.ReactNode;
  onError?: (error: E) => React.ReactNode;
  onSuccess: (value: A) => React.ReactNode;
}) => {
  const result = useAtomValue(atom);

  if (result._tag === 'Initial' || result.waiting) {
    return onLoading?.() ?? null;
  }

  if (result._tag === 'Failure') {
    return onError?.(result.cause as E) ?? null;
  }

  return onSuccess(result.value);
};

export const useAtomInterrupt = (atom: Atom.Writable<unknown, unknown>) => {
  const set = useAtomSet(atom);
  return React.useCallback(() => {
    set(Atom.Interrupt);
  }, [set]);
};

export { Atom, Result, useAtomValue, useAtomSet };
