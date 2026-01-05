import { RpcProtocol } from '@core/client/rpc-config';
import { AtomRpc } from '@effect-atom/atom-react';
import { EnrollmentRpc } from '../domain/index.js';

/**
 * EnrollmentClient - RPC client for the Enrollment feature.
 *
 * Provides:
 * - EnrollmentClient.query("enrollment_listMy", ...) - for read queries
 * - EnrollmentClient.mutation("enrollment_enroll") - for mutations
 * - EnrollmentClient.runtime - for custom atoms
 * - EnrollmentClient.layer - for Effect services
 * - EnrollmentClient (as Context.Tag) - yields the raw RPC client
 */
export class EnrollmentClient extends AtomRpc.Tag<EnrollmentClient>()('@course/EnrollmentClient', {
  group: EnrollmentRpc,
  protocol: RpcProtocol,
}) {}
