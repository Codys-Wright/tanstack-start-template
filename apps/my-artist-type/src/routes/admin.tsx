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
// import { listUsersAtom } from "@auth";
// import { sessionAtom } from "@auth";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  // const sessionResult = useAtomValue(sessionAtom);
  // const usersResult = useAtomValue(listUsersAtom);

  // const isPending = Result.isInitial(usersResult) && usersResult.waiting;
  // const users = Result.builder(usersResult)
  //   .onSuccess((v) => v?.users || [])
  //   .orElse(() => []);

  // const currentUser = Result.builder(sessionResult)
  //   .onSuccess((s) => s?.user)
  //   .orNull();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <ShieldIcon className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
          <p className="text-muted-foreground">Auth components are currently commented out.</p>
        </div>
      </div>
    </div>
  );
}
