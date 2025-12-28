import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import type { ActiveQuizId } from './schema.js';
import { ActiveQuizGroup } from './schema.js';
import { Data, Effect } from 'effect';

export class ActiveQuizClient extends AtomRpc.Tag<ActiveQuizClient>()('@quiz/active-quiz/Client', {
  group: 'ActiveQuiz',
  protocol: RpcProtocol,
}) {}

export const makeActiveQuizAtoms = (client: ActiveQuizClient) => {
  const runtime = client.runtime;

  // Remote atom for getting active quiz sessions (empty by default to avoid UUID validation errors)
  const activeQuizSessionsRemoteAtom = runtime.atom(Effect.succeed([] as ReadonlyArray<any>));

  // Export all atoms
  return {
    activeQuizSessionsAtom: activeQuizSessionsRemoteAtom,
  };
};
