/**
 * ArtistTypeCard - Card component for displaying an artist type summary
 */

import { Card } from '@shadcn';
import type { ArtistType } from '../../../domain/schema.js';

export interface ArtistTypeCardProps {
  artistType: ArtistType;
}

export function ArtistTypeCard({ artistType }: ArtistTypeCardProps) {
  return (
    <Card className="hover:border-primary transition-colors">
      <Card.Header>
        <div className="flex items-center gap-3">
          <img src={artistType.icon} alt={artistType.name} className="w-10 h-10" />
          <div>
            <Card.Title className="text-lg">{artistType.name}</Card.Title>
            <Card.Description>{artistType.subtitle}</Card.Description>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        <p className="text-sm text-muted-foreground line-clamp-2">{artistType.elevatorPitch}</p>
      </Card.Content>
    </Card>
  );
}
