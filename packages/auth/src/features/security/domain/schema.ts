import * as Schema from 'effect/Schema';

// Import schemas from related files
export {
  TwoFactorStatus,
  EnableTwoFactorResult,
  VerifyTwoFactorInput,
  VerifyBackupCodeInput,
} from './two-factor.js';
export { AddPasskeyInput, DeletePasskeyInput } from './passkey.js';

// Re-export from account domain to avoid duplication
export {
  ChangePasswordInput,
  DeleteAccountInput,
} from '../../account/domain/schema.js';

export const EnableTwoFactorInput = Schema.Struct({});
export type EnableTwoFactorInput = typeof EnableTwoFactorInput.Type;

export const RevokeSessionInput = Schema.Struct({
  token: Schema.String,
});
export type RevokeSessionInput = typeof RevokeSessionInput.Type;

export const UnlinkAccountInput = Schema.Struct({
  accountId: Schema.String,
});
export type UnlinkAccountInput = typeof UnlinkAccountInput.Type;

export const ListPasskeysResult = Schema.Struct({
  passkeys: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      credentialID: Schema.String,
      counter: Schema.Number,
      deviceType: Schema.optional(Schema.String),
      backedUp: Schema.optional(Schema.Boolean),
      transports: Schema.optional(Schema.String),
      aaguid: Schema.optional(Schema.String),
      createdAt: Schema.DateTimeUtc,
    }),
  ),
});
export type ListPasskeysResult = typeof ListPasskeysResult.Type;

export const ListSessionsResult = Schema.Struct({
  sessions: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      expiresAt: Schema.DateTimeUtc,
      token: Schema.String,
      createdAt: Schema.DateTimeUtc,
      ipAddress: Schema.optional(Schema.String),
      userAgent: Schema.optional(Schema.String),
      userId: Schema.String,
    }),
  ),
});
export type ListSessionsResult = typeof ListSessionsResult.Type;

export const ListAccountsResult = Schema.Struct({
  accounts: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      accountId: Schema.String,
      providerId: Schema.String,
      userId: Schema.String,
    }),
  ),
});
export type ListAccountsResult = typeof ListAccountsResult.Type;
