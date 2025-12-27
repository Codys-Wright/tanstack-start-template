import { useState, useMemo } from "react";
import { Dialog, Button } from "@shadcn";
import { UsersIcon, PlusIcon, Loader2 } from "lucide-react";
import { useAtomValue, useAtom, Result } from "@effect-atom/atom-react";
import { toast } from "sonner";
import {
	addTeamMemberAtom,
	teamMembersAtom,
	organizationMembersAtom,
} from "../../../client/atoms/organization.atoms.js";
import type { Team } from "../../../domain/team.schema.js";

export interface AddTeamMemberDialogProps {
	team: Team;
	children: React.ReactNode;
	onSuccess?: () => void;
}

export function AddTeamMemberDialog({ team, children, onSuccess }: AddTeamMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [addResult, addMember] = useAtom(addTeamMemberAtom);

	// Create atoms for current team data (memoized to prevent recreation)
	const currentOrgMembersAtom = useMemo(
		() => organizationMembersAtom(team.organizationId),
		[team.organizationId]
	);
	const currentTeamMembersAtom = useMemo(() => teamMembersAtom(team.id), [team.id]);

	const orgMembersResult = useAtomValue(currentOrgMembersAtom);
	const teamMembersResult = useAtomValue(currentTeamMembersAtom);

	const isPending =
		(Result.isInitial(orgMembersResult) && orgMembersResult.waiting) ||
		(Result.isInitial(teamMembersResult) && teamMembersResult.waiting);

	const organizationMembers = Result.builder(orgMembersResult)
		.onSuccess((v) => v)
		.orElse(() => []);

	const teamMembers = Result.builder(teamMembersResult)
		.onSuccess((v) => v)
		.orElse(() => []);

	const handleAddMember = async (member: any) => {
		try {
			await addMember({
				teamId: team.id,
				userId: member.userId,
				role: "member",
			});
			toast.success("Member added to team");
			onSuccess?.();
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Failed to add member");
			}
		}
	};

	// Filter out members who are already in the team
	const availableMembers = organizationMembers.filter(
		(orgMember: any) =>
			!teamMembers.some((teamMember: any) => teamMember.userId === orgMember.userId)
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>{children}</Dialog.Trigger>
			<Dialog.Content className="max-w-md">
				<Dialog.Header>
					<Dialog.Title>Add Team Member</Dialog.Title>
					<Dialog.Description>
						Add existing organization members to the {team.name} team.
					</Dialog.Description>
				</Dialog.Header>

				<div className="space-y-4">
					{isPending ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin" />
						</div>
					) : availableMembers.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<UsersIcon className="mx-auto size-8 mb-2" />
							<p>No available members</p>
							<p className="text-sm mt-1">All organization members are already in this team.</p>
						</div>
					) : (
						<div className="space-y-2 max-h-64 overflow-y-auto">
							{availableMembers.map((member: any) => (
								<div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
											<span className="text-sm font-medium">
												{member.user?.name?.charAt(0)?.toUpperCase() || member.userId?.charAt(0)?.toUpperCase() || '?'}
											</span>
										</div>
										<div>
											<p className="font-medium">{member.user?.name || `User ${member.userId?.slice(-4)}` || 'Unknown'}</p>
											<p className="text-sm text-muted-foreground">{member.user?.email || member.userId}</p>
										</div>
									</div>
									<Button
										size="sm"
										onClick={() => handleAddMember(member)}
										disabled={addResult.waiting}
									>
										{addResult.waiting ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<PlusIcon className="h-4 w-4" />
										)}
									</Button>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="flex justify-end mt-4">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Close
					</Button>
				</div>
			</Dialog.Content>
		</Dialog>
	);
}