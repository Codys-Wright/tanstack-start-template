import { Button, Card } from '@shadcn';
import { Result, useAtom, useAtomValue } from '@effect-atom/atom-react';
import { BuildingIcon, PlusIcon, CheckIcon } from 'lucide-react';
import { sessionAtom } from '../../session/client/atoms.js';
import {
  organizationsAtom,
  setActiveOrganizationAtom,
  createOrganizationAtom,
} from '../client/atoms.js';
import { useForm } from '@tanstack/react-form';
import * as Schema from 'effect/Schema';
import { toast } from 'sonner';

// Schema for creating organization
const CreateOrganizationSchema = Schema.Struct({
  name: Schema.Trim.pipe(
    Schema.nonEmptyString({
      message: () => 'Organization name is required',
    }),
    Schema.maxLength(100, {
      message: () => 'Organization name must be less than 100 characters',
    }),
  ),
});

export interface OrganizationsCardProps {
  className?: string;
}

export function OrganizationsCard({ className }: OrganizationsCardProps) {
  const sessionResult = useAtomValue(sessionAtom);
  const orgsResult = useAtomValue(organizationsAtom);

  const session = Result.builder(sessionResult)
    .onSuccess((s) => s)
    .orNull();
  const user = session?.user;
  const activeOrganizationId = session?.session?.activeOrganizationId || null;

  const isPending = Result.isInitial(orgsResult) && orgsResult.waiting;
  const organizations = Result.builder(orgsResult)
    .onSuccess((v) => v)
    .orElse(() => []);

  if (!user) return null;

  return (
    <div className={`flex w-full flex-col gap-4 md:gap-6 ${className || ''}`}>
      {/* Organization Switcher */}
      <OrganizationSwitcherCard
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
        loading={isPending}
      />

      {/* Create Organization */}
      <CreateOrganizationCard />
    </div>
  );
}

interface OrganizationSwitcherCardProps {
  organizations: any[];
  activeOrganizationId: string | null;
  loading: boolean;
}

function OrganizationSwitcherCard({
  organizations,
  activeOrganizationId,
  loading,
}: OrganizationSwitcherCardProps) {
  const [switchResult, switchOrg] = useAtom(setActiveOrganizationAtom);

  const handleSwitch = (orgId: string | null) => {
    switchOrg({ organizationId: orgId });
    toast.success('Switched organization');
  };

  const isSwitching = switchResult.waiting;

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <BuildingIcon className="size-5" />
          Your Organizations
        </Card.Title>
        <Card.Description>Switch between organizations you belong to.</Card.Description>
      </Card.Header>
      <Card.Content>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Loading organizations...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BuildingIcon className="mx-auto size-8 mb-2" />
            <p>No organizations found.</p>
            <p className="text-sm mt-1">Create your first organization below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {organizations.map((org: any) => (
              <div
                key={org.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  activeOrganizationId === org.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="size-8 rounded" />
                  ) : (
                    <div className="size-8 rounded bg-primary/10 flex items-center justify-center">
                      <BuildingIcon className="size-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">@{org.slug}</p>
                  </div>
                </div>
                {activeOrganizationId === org.id ? (
                  <CheckIcon className="size-4 text-primary" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitch(org.id)}
                    disabled={isSwitching}
                  >
                    {isSwitching ? 'Switching...' : 'Switch'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function CreateOrganizationCard() {
  const [createResult, createOrg] = useAtom(createOrganizationAtom);

  const form = useForm({
    defaultValues: {
      name: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const decoded = Schema.decodeSync(CreateOrganizationSchema)(value);
        await createOrg(decoded);
        form.reset();
        toast.success('Organization created successfully');
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        }
      }
    },
  });

  // Display error from atom
  const error = Result.builder(createResult)
    .onFailure((failure) => String(failure))
    .orNull();

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <PlusIcon className="size-5" />
          Create Organization
        </Card.Title>
        <Card.Description>Start a new organization and invite team members.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(fieldApi) => (
              <div className="space-y-2">
                <label htmlFor={fieldApi.name} className="text-sm font-medium">
                  Organization Name
                </label>
                <input
                  id={fieldApi.name}
                  type="text"
                  value={fieldApi.state.value}
                  onChange={(e) => fieldApi.handleChange(e.target.value)}
                  placeholder="My Organization"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}
          </form.Field>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-3">
              {error}
            </div>
          )}

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating...' : 'Create Organization'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </Card.Content>
    </Card>
  );
}
