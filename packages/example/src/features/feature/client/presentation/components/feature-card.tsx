import { Card } from '@shadcn';
import type { Feature } from '../../../domain/index.js';

export interface FeatureCardProps {
  feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{feature.name}</Card.Title>
        <Card.Description>{feature.description}</Card.Description>
      </Card.Header>
    </Card>
  );
}
