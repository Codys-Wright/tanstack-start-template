import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { Data, Effect } from 'effect';

export class EnginesClient extends AtomRpc.Tag<EnginesClient>()('@quiz/engines/Client', {
  group: 'Engines' as any,
  protocol: RpcProtocol,
}) {}

export const makeEnginesAtoms = (client: EnginesClient) => {
  const runtime = client.runtime;

  // Remote atom for getting engines (empty by default to avoid UUID validation errors)
  const enginesRemoteAtom = runtime.atom(Effect.succeed([] as ReadonlyArray<any>));

  // Export all atoms
  return {
    enginesAtom: enginesRemoteAtom,
  };
};
