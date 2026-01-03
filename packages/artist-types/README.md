# @artist-types

Artist Types package - single source of truth for all artist type content including descriptions, metadata, and future blog content.

## Overview

This package provides:

- **Domain schemas** for artist type data
- **Seed data** loaded from JSON files
- **Mock service** that returns data from JSON (no database required)
- **Live service** that reads from database (for production)
- **Client atoms** for SSR-compatible data fetching
- **Database layer** with migrations and seeders

## Usage

### Client (Browser/SSR)

```typescript
import {
  artistTypesAtom,
  artistTypeAtom,
  loadArtistTypes,
} from "@artist-types";

// In a route loader
export const loader = () => loadArtistTypes();

// In a component
const artistTypes = useAtomValue(artistTypesAtom);
const visionary = useAtomValue(artistTypeAtom("the-visionary-artist"));
```

### Server

```typescript
import { ArtistTypeService, ArtistTypeRpcLive } from "@artist-types/server";

// Add to your server layer
const ServerLive = Layer.mergeAll(
  ArtistTypeRpcLive
  // ... other layers
);
```

### Database

```typescript
import {
  artistTypes,
  cleanupArtistTypes,
  ArtistTypeMigrations,
} from "@artist-types/database";

// Seeding
const seeders = [artistTypes()];

// Migrations
const migrations = [...ArtistTypeMigrations];
```

## Artist Types

1. The Visionary Artist
2. The Consummate Artist
3. The Analyzer Artist
4. The Tech Artist
5. The Entertainer Artist
6. The Maverick Artist
7. The Dreamer Artist
8. The Feeler Artist
9. The Tortured Artist
10. The Solo Artist

## Data Structure

Each artist type includes:

- `id` - Unique identifier (e.g., "the-visionary-artist")
- `name` - Full display name
- `shortName` - Short name (e.g., "Visionary")
- `abbreviation` - 3-letter code
- `order` - Display order (1-10)
- `icon` - Path to logo SVG
- `coinIcon` - Path to coin SVG (optional)
- `subtitle` - Tagline
- `elevatorPitch` - One-sentence description
- `shortDescription` - 2-3 sentence description (markdown)
- `longDescription` - Full article (markdown)
- `metadata` - Object with strengths, challenges, collaborators, etc.
