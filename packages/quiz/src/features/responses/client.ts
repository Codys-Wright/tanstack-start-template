import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import type { ResponseId } from './schema.js';
import { ResponsesGroup } from '@core/client';
import { Data, Effect, Array as EffectArray } from 'effect';

export class ResponsesClient extends AtomRpc.Tag<ResponsesClient>()('@quiz/responses/Client', {
  group: ResponsesGroup as any,
  protocol: RpcProtocol,
}) {}

export const makeResponsesAtoms = (client: ResponsesClient) => {
  const runtime = client.runtime;

  // Remote atom for getting responses (empty by default to avoid UUID validation errors)
  const responsesRemoteAtom = runtime.atom(Effect.succeed([] as ReadonlyArray<any>));

  // Export all atoms
  return {
    responsesAtom: responsesRemoteAtom,
  };
};
