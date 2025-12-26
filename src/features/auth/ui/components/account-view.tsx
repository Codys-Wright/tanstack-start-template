import { Button, Drawer, Label } from "@shadcn";
import { Link } from "@tanstack/react-router";
import { MenuIcon, SettingsIcon, ShieldIcon, UsersIcon, KeyIcon, BuildingIcon } from "lucide-react";
import { AccountSettingsCards } from "./account-settings-cards.js";
import { SecuritySettingsCards } from "./settings/security-settings-cards.js";
import { UserTeamsCard } from "./settings/teams/user-teams-card.js";
import { ApiKeysCard } from "./settings/api-key/api-keys-card.js";
import { OrganizationsCard } from "./organization/organizations-card.js";
import { UserInvitationsCard } from "./organization/user-invitations-card.js";
import { TeamsCard } from "./organization/teams-card.js";

export interface AccountViewProps {
	className?: string;
	view?: AccountViewType;
}

type AccountViewType = "settings" | "security" | "teams" | "api-keys" | "organizations";

const navItems = [
	{ view: "settings" as AccountViewType, label: "Account Settings", icon: SettingsIcon },
	{ view: "security" as AccountViewType, label: "Security", icon: ShieldIcon },
	{ view: "teams" as AccountViewType, label: "Teams", icon: UsersIcon },
	{ view: "api-keys" as AccountViewType, label: "API Keys", icon: KeyIcon },
	{ view: "organizations" as AccountViewType, label: "Organizations", icon: BuildingIcon },
];

export function AccountView({ className, view }: AccountViewProps) {
	const currentView = view || "settings";

	return (
		<div className={`flex w-full grow flex-col gap-4 md:flex-row md:gap-12 ${className || ""}`}>
			{/* Mobile Navigation */}
			<div className="flex justify-between gap-2 md:hidden">
				<Label className="font-semibold text-base">
					{navItems.find((i) => i.view === currentView)?.label}
				</Label>

				<Drawer>
					<Drawer.Trigger asChild>
						<Button variant="outline">
							<MenuIcon />
						</Button>
					</Drawer.Trigger>
					<Drawer.Content>
						<Drawer.Header>
							<Drawer.Title className="hidden">
								Account Settings
							</Drawer.Title>
						</Drawer.Header>
						<div className="flex flex-col px-4 pb-4">
							{navItems.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.view}
										to="/account/$accountView"
										params={{ accountView: item.view }}
									>
										<Button
											size="lg"
											className={`w-full justify-start px-4 transition-none ${
												currentView === item.view
													? "font-semibold"
													: "text-foreground/70"
											}`}
											variant="ghost"
										>
											<Icon className="mr-2 size-4" />
											{item.label}
										</Button>
									</Link>
								);
							})}
						</div>
					</Drawer.Content>
				</Drawer>
			</div>

			{/* Desktop Navigation Sidebar */}
			<div className="hidden md:block">
				<div className="flex w-48 flex-col gap-1 lg:w-60">
					{navItems.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.view}
								to="/account/$accountView"
								params={{ accountView: item.view }}
							>
								<Button
									size="lg"
									className={`w-full justify-start px-4 transition-none ${
										currentView === item.view
											? "font-semibold"
											: "text-foreground/70"
									}`}
									variant="ghost"
								>
									<Icon className="mr-2 size-4" />
									{item.label}
								</Button>
							</Link>
						);
					})}
				</div>
			</div>

			{/* Content Area */}
			<div className="flex-1">
				{currentView === "settings" && (
					<AccountSettingsContent />
				)}
				{currentView === "security" && (
					<SecuritySettingsContent />
				)}
				{currentView === "teams" && (
					<TeamsContent />
				)}
				{currentView === "api-keys" && (
					<ApiKeysContent />
				)}
				{currentView === "organizations" && (
					<OrganizationsContent />
				)}
			</div>
		</div>
	);
}

// Content components for each section
function AccountSettingsContent() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold mb-2">Account Settings</h1>
				<p className="text-muted-foreground">
					Manage your account information and preferences.
				</p>
			</div>
			<AccountSettingsCards />
		</div>
	);
}

function SecuritySettingsContent() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold mb-2">Security Settings</h1>
				<p className="text-muted-foreground">
					Manage your password, email, and security preferences.
				</p>
			</div>
			<SecuritySettingsCards />
		</div>
	);
}

function TeamsContent() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold mb-2">Teams</h1>
				<p className="text-muted-foreground">
					Manage your team memberships and collaborations.
				</p>
			</div>
			<UserTeamsCard />
		</div>
	);
}

function ApiKeysContent() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold mb-2">API Keys</h1>
				<p className="text-muted-foreground">
					Manage your API keys and access tokens.
				</p>
			</div>
			<ApiKeysCard />
		</div>
	);
}

function OrganizationsContent() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold mb-2">Organizations</h1>
				<p className="text-muted-foreground">
					Manage your organization memberships and roles.
				</p>
			</div>
			<div className="grid w-full gap-4 md:gap-6">
				<OrganizationsCard />
				<UserInvitationsCard />
				<TeamsCard />
			</div>
		</div>
	);
}