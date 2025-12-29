import { Alert, Button } from '@shadcn';
import { Result, useAtomRefresh, useAtomValue } from '@effect-atom/atom-react';
import { featuresAtom } from '../../atoms.js';
import { FeatureCard } from '../components/index.js';

export function FeaturesListView() {
  const result = useAtomValue(featuresAtom);
  const refreshFeatures = useAtomRefresh(featuresAtom);

  return (
    <div>
      {Result.builder(result)
        .onInitial(() => <p className="text-muted-foreground">Loading features...</p>)
        .onSuccess((features) => {
          return features.length === 0 ? (
            <p className="text-muted-foreground">No features yet.</p>
          ) : (
            <div className="space-y-4">
              {features.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </div>
          );
        })
        .onFailure((error) => {
          return (
            <Alert variant="destructive">
              <Alert.Title>Something went wrong loading features.</Alert.Title>
              <Alert.Description>
                <div className="mb-2 text-sm">Error: {String(error)}</div>
                <Button onClick={refreshFeatures} variant="outline" size="sm" className="mt-2">
                  Retry
                </Button>
              </Alert.Description>
            </Alert>
          );
        })
        .render()}
    </div>
  );
}
