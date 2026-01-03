import { makeRpcConfigLayer } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { ArtistTypeRpc } from '../domain/index.js';

const ArtistTypeRpcProtocol = makeRpcConfigLayer('/api/rpc');

export class ArtistTypeClient extends AtomRpc.Tag<ArtistTypeClient>()('@artist-types/Client', {
  group: ArtistTypeRpc,
  protocol: ArtistTypeRpcProtocol,
}) {}
