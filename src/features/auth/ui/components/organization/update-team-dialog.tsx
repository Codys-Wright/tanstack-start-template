import { useState, useEffect } from "react";
import { Dialog, Button, Input } from "@shadcn";
import { useForm } from "@tanstack/react-form";
import { useAtom } from "@effect-atom/atom-react";
import { toast } from "sonner";
import { updateTeamAtom } from "../../../client/atoms/organization.atoms.js";
import type { Team } from "../../../domain/team.schema.js";

export interface UpdateTeamDialogProps {
	team: Team;
	children: React.ReactNode;
	onSuccess?: () => void;
}

export function UpdateTeamDialog({ team, children, onSuccess }: UpdateTeamDialogProps) {
	const [open, setOpen] = useState(false);
	const [_updateResult, updateTeam] = useAtom(updateTeamAtom);

	const form = useForm({
		defaultValues: {
			name: team.name,
		},
		onSubmit: async ({ value }) => {
			try {
				await updateTeam({
					teamId: team.id,
					data: { name: value.name },
				});
				setOpen(false);
				toast.success("Team updated successfully");
				onSuccess?.();
			} catch (error) {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Failed to update team");
				}
			}
		},
	});

	// Update form when team changes
	useEffect(() => {
		form.reset();
		form.setFieldValue("name", team.name);
	}, [team, form]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>{children}</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Update Team</Dialog.Title>
				</Dialog.Header>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<label htmlFor={field.name} className="text-sm font-medium">
									Team Name
								</label>
								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Enter team name"
								/>
								{field.state.meta.errors.length > 0 && (
									<p className="text-sm text-destructive">
										{field.state.meta.errors[0]}
									</p>
								)}
							</div>
						)}
					</form.Field>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={form.state.isSubmitting}>
							{form.state.isSubmitting ? "Updating..." : "Update Team"}
						</Button>
					</div>
				</form>
			</Dialog.Content>
		</Dialog>
	);
}