import { Card, Skeleton } from "@shadcn";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { sessionAtom } from "@/features/auth";

export const Route = createFileRoute("/auth/callback")({
	component: OAuthCallback,
});

/**
 * OAuth Callback Route
 *
 * This route handles the redirect back from OAuth providers (Google, etc.).
 * Better Auth automatically handles the token exchange and session creation.
 * We just wait for the session to be established and redirect to home.
 */
function OAuthCallback() {
	const navigate = useNavigate();
	const sessionResult = useAtomValue(sessionAtom);

	useEffect(() => {
		// Wait for session to be established
		if (Result.isSuccess(sessionResult) && sessionResult.value) {
			// Session established, redirect to home
			navigate({ to: "/" });
		} else if (Result.isFailure(sessionResult)) {
			// OAuth failed, redirect to sign in
			navigate({ to: "/auth/$authView", params: { authView: "sign-in" } });
		}
	}, [sessionResult, navigate]);

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<Card.Header>
					<Card.Title>Completing sign in...</Card.Title>
				</Card.Header>
				<Card.Content className="space-y-4">
					<div className="flex flex-col gap-3">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
					<p className="text-sm text-muted-foreground text-center">
						Please wait while we complete your sign in...
					</p>
				</Card.Content>
			</Card>
		</div>
	);
}
