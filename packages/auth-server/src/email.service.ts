import * as Effect from "effect/Effect";

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
}

export interface SendEmailResult {
  readonly success: boolean;
  readonly messageId: string;
}

/**
 * Email Service - Mocked implementation for development
 *
 * This service logs emails to the console instead of actually sending them.
 * In production, replace this with a real email service (Resend, SendGrid, etc.)
 */
export class EmailService extends Effect.Service<EmailService>()(
  "EmailService",
  {
    effect: Effect.sync(() => ({
      send: (message: EmailMessage) =>
        Effect.gen(function* () {
          // Mock implementation - logs to console
          yield* Effect.logInfo("📧 Email would be sent:");
          yield* Effect.logInfo(`   To: ${message.to}`);
          yield* Effect.logInfo(`   Subject: ${message.subject}`);
          yield* Effect.logInfo(
            `   Body: ${message.html.substring(0, 100)}...`
          );

          return {
            success: true,
            messageId: `mock-${Date.now()}`,
          } satisfies SendEmailResult;
        }),
    })),
  }
) {}
