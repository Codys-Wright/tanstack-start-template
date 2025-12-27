import { Card } from "@shadcn";
import { SignInForm } from "./sign-in-form.js";
import { SignUpForm } from "./sign-up-form.js";
import { ForgotPasswordForm } from "../../account/ui/forgot-password-form.js";
import { ResetPasswordForm } from "../../account/ui/reset-password-form.js";
import { TwoFactorForm } from "./two-factor-form.js";
import { RecoverAccountForm } from "../../account/ui/recover-account-form.js";

export interface AuthViewProps {
  pathname: string;
  className?: string;
}

/**
 * AuthView - Renders the appropriate authentication form based on the pathname
 *
 * Supports the following views:
 * - sign-in: Email/password sign in
 * - sign-up: Create new account
 * - forgot-password: Request password reset email
 * - reset-password: Reset password with token
 * - two-factor: Verify 2FA code
 * - recover-account: Account recovery with backup code
 * - callback: OAuth callback processing
 */
export function AuthView({ pathname, className }: AuthViewProps) {
  const renderView = () => {
    switch (pathname) {
      case "sign-in":
        return <SignInForm className={className} />;
      case "sign-up":
        return <SignUpForm className={className} />;
      case "forgot-password":
        return <ForgotPasswordForm className={className} />;
      case "reset-password":
        return <ResetPasswordForm className={className} />;
      case "two-factor":
        return <TwoFactorForm className={className} />;
      case "recover-account":
        return <RecoverAccountForm className={className} />;
      case "callback":
        return (
          <Card className={className}>
            <Card.Header>
              <Card.Title>Processing</Card.Title>
              <Card.Description>
                Processing your authentication...
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-muted-foreground">Redirecting you...</p>
            </Card.Content>
          </Card>
        );
      default:
        return (
          <Card className={className}>
            <Card.Header>
              <Card.Title>Authentication</Card.Title>
              <Card.Description>{pathname}</Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-muted-foreground">
                Unknown authentication view. Please check the URL.
              </p>
            </Card.Content>
          </Card>
        );
    }
  };

  return renderView();
}
