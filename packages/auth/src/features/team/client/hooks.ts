import { useMemo, useState, useEffect } from 'react';
import { Result, useAtomValue } from '@effect-atom/atom-react';
import { sessionAtom } from '@auth/features/session/client/atoms';
import { authClient } from '@auth/features/session/client/client';
import type { TeamPermissions } from '@auth/features/team/domain/schema';

/**
 * Hook to check team permissions for the current user
 * Checks organization membership and role to determine permissions
 */
export function useTeamPermissions(): TeamPermissions {
  const sessionResult = useAtomValue(sessionAtom);
  const session = Result.isSuccess(sessionResult) ? sessionResult.value : null;
  const activeOrgId = (session as any)?.session?.activeOrganizationId;
  const userId = session?.user?.id;

  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check user's role in the active organization
  useEffect(() => {
    const checkUserRole = async () => {
      if (!activeOrgId || !userId) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const membersResult = await authClient.organization.listMembers({
          query: { organizationId: activeOrgId },
        });
        const members = membersResult.data?.members || [];
        const userMember = members.find((member: any) => member.userId === userId);

        setUserRole(userMember?.role || null);
      } catch {
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [activeOrgId, userId]);

  const permissions = useMemo(() => {
    if (loading) {
      // While loading, assume no permissions
      return {
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canManageMembers: false,
      };
    }

    // Grant permissions based on organization role
    // Owner and admin can do everything, members have limited permissions
    const isOwner = userRole === 'owner';
    const isAdmin = userRole === 'admin';

    return {
      canCreate: isOwner || isAdmin,
      canUpdate: isOwner || isAdmin,
      canDelete: isOwner || isAdmin,
      canManageMembers: isOwner || isAdmin,
    };
  }, [userRole, loading]);

  return permissions;
}
