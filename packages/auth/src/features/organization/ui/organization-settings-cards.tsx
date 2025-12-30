import { Button, Card, Input, cn } from '@shadcn';
import { Result, useAtom, useAtomValue } from '@effect-atom/atom-react';
import { BuildingIcon, Trash2Icon, ImageIcon, LinkIcon } from 'lucide-react';
import { sessionAtom } from '@auth/features/session/client/atoms.js';
import {
  organizationsAtom,
  updateOrganizationAtom,
  deleteOrganizationAtom,
} from '@auth/features/organization/client/atoms.js';
import { useForm } from '@tanstack/react-form';
import * as Schema from 'effect/Schema';
import { toast } from 'sonner';
import { useState } from 'react';

// Validation schemas
const OrganizationNameSchema = Schema.Struct({
  name: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => 'Organization name is required' }),
    Schema.maxLength(100, {
      message: () => 'Name must be less than 100 characters',
    }),
  ),
});

const OrganizationSlugSchema = Schema.Struct({
  slug: Schema.Trim.pipe(
    Schema.nonEmptyString({ message: () => 'Slug is required' }),
    Schema.pattern(/^[a-z0-9-]+$/, {
      message: () => 'Slug must be lowercase letters, numbers, and hyphens only',
    }),
    Schema.maxLength(50, {
      message: () => 'Slug must be less than 50 characters',
    }),
  ),
});

export interface OrganizationSettingsCardsProps {
  className?: string;
}

/**
 * OrganizationSettingsCards - Collection of organization management cards
 *
 * Renders all organization-related settings cards for the active organization:
 * - Update Organization Name
 * - Update Organization Slug
 * - Update Organization Logo
 * - Delete Organization
 */
export function OrganizationSettingsCards({ className }: OrganizationSettingsCardsProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const orgsResult = useAtomValue(organizationsAtom);

  const session = Result.builder(sessionResult)
    .onSuccess((value) => value)
    .orNull();
  const activeOrgId = session?.session?.activeOrganizationId;

  const organizations = Result.builder(orgsResult)
    .onSuccess((v) => v)
    .orElse(() => []);

  // Find the active organization
  const activeOrg = organizations.find((org: any) => org.id === activeOrgId);

  if (!session?.user) return null;

  if (!activeOrg) {
    return (
      <Card className={className}>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <BuildingIcon className="size-5" />
            Organization Settings
          </Card.Title>
          <Card.Description>No active organization selected.</Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-center py-8 text-muted-foreground">
            Please select an organization from your Account settings to manage it.
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className={cn('flex w-full flex-col gap-4 md:gap-6', className)}>
      {/* Organization Name Card */}
      <OrganizationNameCard organization={activeOrg} />

      {/* Organization Slug Card */}
      <OrganizationSlugCard organization={activeOrg} />

      {/* Organization Logo Card */}
      <OrganizationLogoCard organization={activeOrg} />

      {/* Delete Organization Card */}
      <DeleteOrganizationCard organization={activeOrg} />
    </div>
  );
}

// ============================================================================
// Organization Name Card
// ============================================================================

interface OrgCardProps {
  organization: any;
}

function OrganizationNameCard({ organization }: OrgCardProps) {
  const [updateResult, updateOrg] = useAtom(updateOrganizationAtom);
  const isUpdating = updateResult.waiting;

  const form = useForm({
    defaultValues: {
      name: organization.name || '',
    },
    onSubmit: async ({ value }) => {
      try {
        const decoded = Schema.decodeSync(OrganizationNameSchema)(value);
        await updateOrg({
          organizationId: organization.id,
          data: { name: decoded.name },
        });
        toast.success('Organization name updated');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    },
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <BuildingIcon className="size-5" />
          Organization Name
        </Card.Title>
        <Card.Description>The display name for your organization.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(fieldApi) => (
              <div className="space-y-2">
                <Input
                  id={fieldApi.name}
                  type="text"
                  value={fieldApi.state.value}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  placeholder="Organization name"
                />
              </div>
            )}
          </form.Field>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Name'}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// Organization Slug Card
// ============================================================================

function OrganizationSlugCard({ organization }: OrgCardProps) {
  const [updateResult, updateOrg] = useAtom(updateOrganizationAtom);
  const isUpdating = updateResult.waiting;

  const form = useForm({
    defaultValues: {
      slug: organization.slug || '',
    },
    onSubmit: async ({ value }) => {
      try {
        const decoded = Schema.decodeSync(OrganizationSlugSchema)(value);
        await updateOrg({
          organizationId: organization.id,
          data: { slug: decoded.slug },
        });
        toast.success('Organization slug updated');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    },
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <LinkIcon className="size-5" />
          Organization Slug
        </Card.Title>
        <Card.Description>
          The unique identifier for your organization in URLs. Lowercase letters, numbers, and
          hyphens only.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="slug">
            {(fieldApi) => (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <Input
                    id={fieldApi.name}
                    type="text"
                    value={fieldApi.state.value}
                    onChange={(e) => fieldApi.handleChange(e.target.value.toLowerCase())}
                    placeholder="my-organization"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </form.Field>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? 'Updating...' : 'Update Slug'}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// Organization Logo Card
// ============================================================================

function OrganizationLogoCard({ organization }: OrgCardProps) {
  const [updateResult, updateOrg] = useAtom(updateOrganizationAtom);
  const isUpdating = updateResult.waiting;

  const form = useForm({
    defaultValues: {
      logo: organization.logo || '',
    },
    onSubmit: async ({ value }) => {
      await updateOrg({
        organizationId: organization.id,
        data: { logo: value.logo || null },
      });
      toast.success('Organization logo updated');
    },
  });

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <ImageIcon className="size-5" />
          Organization Logo
        </Card.Title>
        <Card.Description>
          The logo for your organization. Enter a URL to an image.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="flex items-start gap-4">
          {/* Logo Preview */}
          <div className="size-16 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="size-full object-cover"
              />
            ) : (
              <BuildingIcon className="size-8 text-muted-foreground" />
            )}
          </div>

          {/* Logo URL Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="flex-1 space-y-4"
          >
            <form.Field name="logo">
              {(fieldApi) => (
                <div className="space-y-2">
                  <Input
                    id={fieldApi.name}
                    type="url"
                    value={fieldApi.state.value}
                    onChange={(e) => fieldApi.handleChange(e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              )}
            </form.Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update Logo'}
              </Button>
              {organization.logo && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => {
                    void updateOrg({
                      organizationId: organization.id,
                      data: { logo: null },
                    });
                    toast.success('Logo removed');
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          </form>
        </div>
      </Card.Content>
    </Card>
  );
}

// ============================================================================
// Delete Organization Card
// ============================================================================

function DeleteOrganizationCard({ organization }: OrgCardProps) {
  const [deleteResult, deleteOrg] = useAtom(deleteOrganizationAtom);
  const [confirmName, setConfirmName] = useState('');
  const isDeleting = deleteResult.waiting;

  const canDelete = confirmName === organization.name;

  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      await deleteOrg({ organizationId: organization.id });
      toast.success('Organization deleted');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  return (
    <Card className="border-destructive/50">
      <Card.Header>
        <Card.Title className="flex items-center gap-2 text-destructive">
          <Trash2Icon className="size-5" />
          Delete Organization
        </Card.Title>
        <Card.Description>
          Permanently delete this organization and all its data. This action cannot be undone.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm">
              To confirm, type <span className="font-semibold">"{organization.name}"</span> below:
            </p>
            <Input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={organization.name}
              className="mt-2"
            />
          </div>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
