import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, Card, Table, Tabs } from "@shadcn";
import { Result, useAtomValue } from "@effect-atom/atom-react";
import {
  CalendarIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
  BuildingIcon,
  MonitorIcon,
  MailCheckIcon,
  UsersIcon,
} from "lucide-react";
import { listUsersAtom } from "../features/auth/client/atoms/admin.atoms.js";
import { sessionAtom } from "../features/auth/client/atoms/session.atoms.js";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const sessionResult = useAtomValue(sessionAtom);
  const usersResult = useAtomValue(listUsersAtom);

  const isPending = Result.isInitial(usersResult) && usersResult.waiting;
  const users = Result.builder(usersResult)
    .onSuccess((v) => v?.users || [])
    .orElse(() => []);

  const currentUser = Result.builder(sessionResult)
    .onSuccess((s) => s?.user)
    .orNull();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ShieldIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage users, organizations, and system data
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-2">
            <UserIcon className="h-3 w-3" />
            {currentUser?.name || currentUser?.email}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <Tabs.List>
            <Tabs.Trigger value="users" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Users
            </Tabs.Trigger>
            <Tabs.Trigger value="organizations" className="gap-2">
              <BuildingIcon className="h-4 w-4" />
              Organizations
            </Tabs.Trigger>
            <Tabs.Trigger value="sessions" className="gap-2">
              <MonitorIcon className="h-4 w-4" />
              Sessions
            </Tabs.Trigger>
            <Tabs.Trigger value="invitations" className="gap-2">
              <MailCheckIcon className="h-4 w-4" />
              Invitations
            </Tabs.Trigger>
            <Tabs.Trigger value="members" className="gap-2">
              <UsersIcon className="h-4 w-4" />
              Members
            </Tabs.Trigger>
          </Tabs.List>

          {/* Users Tab */}
          <Tabs.Content value="users">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div>
                    <Card.Title className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Users
                    </Card.Title>
                    <Card.Description>
                      Manage all users in the system ({users.length} total)
                    </Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                {isPending ? (
                  <div className="space-y-3">
                    {["user-1", "user-2", "user-3", "user-4", "user-5"].map(
                      (key) => (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                            <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm mt-1">
                      Create your first user to get started.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>User</Table.Head>
                        <Table.Head>Email</Table.Head>
                        <Table.Head>Role</Table.Head>
                        <Table.Head>Created</Table.Head>
                        <Table.Head>Status</Table.Head>
                        <Table.Head className="text-right">Actions</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {users.map((user: any) => {
                        const roles = Array.isArray(user.role)
                          ? user.role
                          : user.role
                          ? [user.role]
                          : [];
                        const isAdmin = roles.includes("admin");
                        const isBanned = user.banned;

                        return (
                          <Table.Row key={user.id}>
                            <Table.Cell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                  <UserIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {user.name || "Unnamed User"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    ID: {user.id.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center gap-2">
                                <MailIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{user.email}</span>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              {isAdmin ? (
                                <Badge variant="default" className="gap-1">
                                  <ShieldIcon className="h-3 w-3" />
                                  Admin
                                </Badge>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              {isBanned ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-600"
                                >
                                  Active
                                </Badge>
                              )}
                            </Table.Cell>
                            <Table.Cell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" disabled>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={user.id === currentUser?.id}
                                >
                                  {isBanned ? "Unban" : "Ban"}
                                </Button>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                )}
              </Card.Content>
            </Card>
          </Tabs.Content>

          {/* Organizations Tab */}
          <Tabs.Content value="organizations">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <BuildingIcon className="h-5 w-5" />
                  Organizations
                </Card.Title>
                <Card.Description>
                  View all organizations in the system
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="text-center py-12 text-muted-foreground">
                  <BuildingIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">
                    Organizations data coming soon
                  </p>
                  <p className="text-sm mt-1">
                    Organization repository integration in progress
                  </p>
                </div>
              </Card.Content>
            </Card>
          </Tabs.Content>

          {/* Sessions Tab */}
          <Tabs.Content value="sessions">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <MonitorIcon className="h-5 w-5" />
                  Sessions
                </Card.Title>
                <Card.Description>
                  View all active sessions in the system
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="text-center py-12 text-muted-foreground">
                  <MonitorIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">
                    Sessions data coming soon
                  </p>
                  <p className="text-sm mt-1">
                    Session repository integration in progress
                  </p>
                </div>
              </Card.Content>
            </Card>
          </Tabs.Content>

          {/* Invitations Tab */}
          <Tabs.Content value="invitations">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <MailCheckIcon className="h-5 w-5" />
                  Invitations
                </Card.Title>
                <Card.Description>
                  View all organization invitations
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="text-center py-12 text-muted-foreground">
                  <MailCheckIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">
                    Invitations data coming soon
                  </p>
                  <p className="text-sm mt-1">
                    Invitation repository integration in progress
                  </p>
                </div>
              </Card.Content>
            </Card>
          </Tabs.Content>

          {/* Members Tab */}
          <Tabs.Content value="members">
            <Card>
              <Card.Header>
                <Card.Title className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  Members
                </Card.Title>
                <Card.Description>
                  View all organization members
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="text-center py-12 text-muted-foreground">
                  <UsersIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium">
                    Members data coming soon
                  </p>
                  <p className="text-sm mt-1">
                    Member repository integration in progress
                  </p>
                </div>
              </Card.Content>
            </Card>
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  );
}
