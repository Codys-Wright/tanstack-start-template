import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { CertificateRpc } from '../domain/index.js';

/**
 * CertificateClient - RPC client for the Certificate feature.
 *
 * Provides:
 * - CertificateClient.query("certificate_listMyCertificates", ...) - for read queries
 * - CertificateClient.mutation("certificate_issue") - for mutations
 * - CertificateClient.runtime - for custom atoms
 * - CertificateClient.layer - for Effect services
 * - CertificateClient (as Context.Tag) - yields the raw RPC client
 */
export class CertificateClient extends AtomRpc.Tag<CertificateClient>()(
  '@course/CertificateClient',
  {
    group: CertificateRpc,
    protocol: RpcProtocol,
  },
) {}
