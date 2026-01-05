import { serializable } from '@core/client/atom-utils';
import { Result } from '@effect-atom/atom-react';
import * as RpcClientError from '@effect/rpc/RpcClientError';
import * as Effect from 'effect/Effect';
import * as S from 'effect/Schema';
import { EnrollmentId } from '../../enrollment/domain/schema.js';
import { Certificate, CertificateId, IssueCertificateInput } from '../domain/index.js';
import { CertificateClient } from './client.js';

const CertificatesSchema = S.Array(Certificate);

// ============================================================================
// Query Atoms
// ============================================================================

/**
 * Current user's certificates
 */
export const myCertificatesAtom = CertificateClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* CertificateClient;
      return yield* client('certificate_listMyCertificates', undefined);
    }),
  )
  .pipe(
    serializable({
      key: '@course/certificates/my',
      schema: Result.Schema({
        success: CertificatesSchema,
        error: RpcClientError.RpcClientError,
      }),
    }),
  );

/**
 * Get certificate for a specific enrollment
 */
export const getCertificateByEnrollmentAtom = CertificateClient.runtime.fn<{
  readonly enrollmentId: EnrollmentId;
}>()(
  Effect.fnUntraced(function* ({ enrollmentId }) {
    const client = yield* CertificateClient;
    return yield* client('certificate_getByEnrollment', { enrollmentId });
  }),
);

/**
 * Verify a certificate by verification code
 */
export const verifyCertificateAtom = CertificateClient.runtime.fn<{
  readonly code: string;
}>()(
  Effect.fnUntraced(function* ({ code }) {
    const client = yield* CertificateClient;
    return yield* client('certificate_verify', { code });
  }),
);

// ============================================================================
// Mutation Atoms
// ============================================================================

/**
 * Issue a certificate for a completed enrollment
 */
export const issueCertificateAtom = CertificateClient.runtime.fn<IssueCertificateInput>()(
  Effect.fnUntraced(function* (input, get) {
    const client = yield* CertificateClient;
    const result = yield* client('certificate_issue', { input });
    get.refresh(myCertificatesAtom);
    return result;
  }),
);

/**
 * Delete a certificate (admin only)
 */
export const deleteCertificateAtom = CertificateClient.runtime.fn<CertificateId>()(
  Effect.fnUntraced(function* (id, get) {
    const client = yield* CertificateClient;
    yield* client('certificate_delete', { id });
    get.refresh(myCertificatesAtom);
  }),
);
