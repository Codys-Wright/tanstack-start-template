import { Dialog } from "@shadcn";
import { useState } from "react";
import { TeamMembersCard } from "./team-members-card.js";
import type { Team } from "../../../domain/team.schema.js";

export interface TeamMembersDialogProps {
	team: Team;
	children: React.ReactNode;
}

export function TeamMembersDialog({ team, children }: TeamMembersDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>
				{children}
			</Dialog.Trigger>
			<Dialog.Content className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<Dialog.Header>
					<Dialog.Title>Manage Team Members</Dialog.Title>
				</Dialog.Header>
				<TeamMembersCard team={team} className="border-0 shadow-none" />
			</Dialog.Content>
		</Dialog>
	);
}