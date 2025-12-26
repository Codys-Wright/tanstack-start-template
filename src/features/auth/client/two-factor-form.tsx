import { Button, Card, Checkbox, Input, cn } from "@shadcn"
import { Link } from "@tanstack/react-router"
import { Result, useAtom } from "@effect-atom/atom-react"
import { useForm } from "@tanstack/react-form"
import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import * as Schema from "effect/Schema"

import { verifyTwoFactorAtom } from "./atoms/session.atoms.js"

// Define the form schema using Effect Schema
const TwoFactorSchema = Schema.Struct({
	code: Schema.String,
	trustDevice: Schema.optional(Schema.Boolean),
})

export interface TwoFactorFormProps {
	className?: string
}

export function TwoFactorForm({ className }: TwoFactorFormProps) {
	const [verifyResult, verify] = useAtom(verifyTwoFactorAtom)

	const form = useForm({
		defaultValues: {
			code: "",
			trustDevice: false,
		},
		onSubmit: async ({ value }) => {
			try {
				// Validate using Effect Schema
				const validated = Schema.decodeSync(TwoFactorSchema)(value)

				verify({
					code: validated.code,
					trustDevice: validated.trustDevice,
				})
			} catch {
				// Validation errors are handled by field validators
			}
		},
	})

	// Handle successful verification
	useEffect(() => {
		if (Result.isSuccess(verifyResult)) {
			// Redirect to home or dashboard
			window.location.href = "/"
		}
	}, [verifyResult])

	const isLoading = Result.isInitial(verifyResult) && verifyResult.waiting
	const error = Result.builder(verifyResult)
		.onFailure((failure) => failure)
		.orNull()

	return (
		<Card className={cn("w-full max-w-sm", className)}>
			<Card.Header>
				<Card.Title>Two-Factor Authentication</Card.Title>
				<Card.Description>
					Enter the 6-digit code from your authenticator app
				</Card.Description>
			</Card.Header>

			<Card.Content>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						void form.handleSubmit()
					}}
					className="space-y-4"
				>
					{/* OTP Code Field */}
					<form.Field
						name="code"
						validators={{
							onChange: ({ value }) => {
								if (!value) return "Code is required"
								if (!/^\d{6}$/.test(value)) {
									return "Code must be 6 digits"
								}
								return undefined
							},
						}}
					>
						{(field) => (
							<div className="space-y-1">
								<label htmlFor={field.name} className="text-sm font-medium">
									Verification Code
								</label>
								<Input
									id={field.name}
									type="text"
									inputMode="numeric"
									name={field.name}
									value={field.state.value}
									onChange={(e) => {
										// Only allow digits, max 6 characters
										const value = e.currentTarget.value.replace(/\D/g, "").slice(0, 6)
										field.handleChange(value)
									}}
									onBlur={field.handleBlur}
									placeholder="000000"
									disabled={isLoading}
									autoComplete="one-time-code"
									required
									className={cn(
										field.state.meta.errors.length > 0 && "border-destructive",
									)}
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-xs text-destructive">
										{field.state.meta.errors.join(", ")}
									</p>
								)}
							</div>
						)}
					</form.Field>

					{/* Trust Device Checkbox */}
					<form.Field name="trustDevice">
						{(field) => (
							<div className="flex items-center space-x-2">
								<Checkbox
									id="trustDevice"
									checked={field.state.value ?? false}
									onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
									disabled={isLoading}
								/>
								<label
									htmlFor="trustDevice"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Trust this device for 30 days
								</label>
							</div>
						)}
					</form.Field>

					{/* Error Message */}
					{error && (
						<div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-sm text-destructive">
							{error instanceof Error ? error.message : "Failed to verify code. Please try again."}
						</div>
					)}

					{/* Submit Button */}
					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button
								type="submit"
								disabled={isLoading || isSubmitting}
								className="w-full"
							>
								{isLoading || isSubmitting ? (
									<>
										<Loader2Icon className="mr-2 size-4 animate-spin" />
										Verifying...
									</>
								) : (
									"Verify"
								)}
							</Button>
						)}
					</form.Subscribe>
				</form>

				{/* Footer Links */}
				<div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
					<p>
						Lost your authenticator?{" "}
						<Link
							to="/auth/$authView"
							params={{ authView: "recover-account" }}
							className="text-primary hover:underline"
						>
							Use backup code
						</Link>
					</p>
				</div>
			</Card.Content>
		</Card>
	)
}
