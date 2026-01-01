'use client';

import { cn } from '@shadcn';
import React from 'react';
import { getArtistIconPath } from '@/features/analysis/ui/artist-type/artist-data-utils.js';

export interface ArtistIconProps {
  artistType: string;
  className?: string;
  size?: number;
}

export const ArtistIcon: React.FC<ArtistIconProps> = ({ artistType, className, size = 20 }) => {
  const [loadError, setLoadError] = React.useState(false);
  // Convert artist type to database ID format
  const databaseId = `the-${artistType.toLowerCase()}-artist`;
  const iconPath = getArtistIconPath(databaseId);

  if (iconPath === null || loadError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-400 text-xs font-bold text-white',
          className,
        )}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${artistType} icon`}
      >
        {artistType.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        aspectRatio: '1 / 1',
        flexShrink: 0,
      }}
    >
      <img
        src={iconPath}
        alt={`${artistType} icon`}
        className="rounded-full dark:brightness-0 dark:invert"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          aspectRatio: '1 / 1',
        }}
        onError={() => {
          setLoadError(true);
        }}
      />
    </div>
  );
};
