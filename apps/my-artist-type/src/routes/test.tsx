import { createFileRoute } from '@tanstack/react-router';
import { useAtomValue } from '@effect-atom/atom-react';
import { Result } from '@effect-atom/atom-react';
import { Card, Button, Skeleton } from '@shadcn';
import { sessionAtom, isAdminAtom } from '@auth';
import { artistTypesAtom } from '@artist-types';

export const Route = createFileRoute('/test')({
  component: TestPage,
});

function TestPage() {
  return (
    <div className="container mx-auto p-8 pt-28">
      <h1 className="text-2xl font-bold mb-8">Performance Test Page</h1>
      <p className="text-muted-foreground mb-8">
        This page uses simple shadcn components to test if the freeze is caused by complex UI
        components.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <SessionCard />
        <ArtistTypesCard />
      </div>
    </div>
  );
}

function SessionCard() {
  const sessionResult = useAtomValue(sessionAtom);
  const isAdmin = useAtomValue(isAdminAtom);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Session Data</Card.Title>
        <Card.Description>Current user session state</Card.Description>
      </Card.Header>
      <Card.Content>
        {Result.isInitial(sessionResult) && sessionResult.waiting ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : Result.isSuccess(sessionResult) ? (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Signed in:</strong> {sessionResult.value ? 'Yes' : 'No'}
            </p>
            {sessionResult.value?.user && (
              <>
                <p>
                  <strong>Name:</strong> {sessionResult.value.user.name}
                </p>
                <p>
                  <strong>Email:</strong> {sessionResult.value.user.email}
                </p>
                <p>
                  <strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}
                </p>
              </>
            )}
          </div>
        ) : Result.isFailure(sessionResult) ? (
          <p className="text-destructive">Error loading session</p>
        ) : (
          <p className="text-muted-foreground">No session</p>
        )}
      </Card.Content>
    </Card>
  );
}

function ArtistTypesCard() {
  const artistTypesResult = useAtomValue(artistTypesAtom);

  // Log the result for debugging
  console.log('[ArtistTypesCard] Result:', artistTypesResult);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Artist Types Data</Card.Title>
        <Card.Description>List of artist types from database</Card.Description>
      </Card.Header>
      <Card.Content>
        {Result.isInitial(artistTypesResult) && artistTypesResult.waiting ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : Result.isSuccess(artistTypesResult) ? (
          <div className="space-y-1 text-sm">
            <p>
              <strong>Count:</strong> {artistTypesResult.value.length}
            </p>
            <ul className="list-disc list-inside">
              {artistTypesResult.value.slice(0, 5).map((at) => (
                <li key={at.id}>{at.name}</li>
              ))}
              {artistTypesResult.value.length > 5 && (
                <li className="text-muted-foreground">
                  ...and {artistTypesResult.value.length - 5} more
                </li>
              )}
            </ul>
          </div>
        ) : Result.isFailure(artistTypesResult) ? (
          <div className="space-y-2">
            <p className="text-destructive font-medium">Error loading artist types</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(artistTypesResult.cause, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">No data (initial state)</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(artistTypesResult, null, 2)}
            </pre>
          </div>
        )}
      </Card.Content>
      <Card.Footer>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </Card.Footer>
    </Card>
  );
}
