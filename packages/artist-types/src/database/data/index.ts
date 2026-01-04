/**
 * Artist Type Seed Data Loader
 *
 * Imports and loads all artist type JSON files, providing functions to access
 * the raw seed data for seeding the database or serving via mock service.
 */

import type { ArtistTypeSeedData } from '../../domain/schema.js';

// Static imports for all artist type JSON files
import theVisionaryArtist from './the-visionary-artist.json';
import theConsummateArtist from './the-consummate-artist.json';
import theAnalyzerArtist from './the-analyzer-artist.json';
import theTechArtist from './the-tech-artist.json';
import theEntertainerArtist from './the-entertainer-artist.json';
import theMaverickArtist from './the-maverick-artist.json';
import theDreamerArtist from './the-dreamer-artist.json';
import theFeelerArtist from './the-feeler-artist.json';
import theTorturedArtist from './the-tortured-artist.json';
import theSoloArtist from './the-solo-artist.json';

// All artist types data array
const allArtistTypes: ArtistTypeSeedData[] = [
  theVisionaryArtist as ArtistTypeSeedData,
  theConsummateArtist as ArtistTypeSeedData,
  theAnalyzerArtist as ArtistTypeSeedData,
  theTechArtist as ArtistTypeSeedData,
  theEntertainerArtist as ArtistTypeSeedData,
  theMaverickArtist as ArtistTypeSeedData,
  theDreamerArtist as ArtistTypeSeedData,
  theFeelerArtist as ArtistTypeSeedData,
  theTorturedArtist as ArtistTypeSeedData,
  theSoloArtist as ArtistTypeSeedData,
];

// Build lookup maps
const byIdMap = new Map<string, ArtistTypeSeedData>();
for (const data of allArtistTypes) {
  byIdMap.set(data.id, data);
}

const byOrderSorted = [...allArtistTypes].sort((a, b) => a.order - b.order);

// ============================================================================
// Export Functions
// ============================================================================

export const getAllArtistTypeSeedData = async (): Promise<readonly ArtistTypeSeedData[]> => {
  return allArtistTypes;
};

export const getArtistTypeSeedData = async (id: string): Promise<ArtistTypeSeedData | null> => {
  return byIdMap.get(id) ?? null;
};

export const getArtistTypeSeedDataBySlug = async (
  slug: string,
): Promise<ArtistTypeSeedData | null> => {
  if (slug.startsWith('the-') && slug.endsWith('-artist')) {
    return byIdMap.get(slug) ?? null;
  }

  const normalizedSlug = `the-${slug.toLowerCase()}-artist`;
  return byIdMap.get(normalizedSlug) ?? null;
};

export const getArtistTypeSeedDataByOrder = async (
  order: number,
): Promise<ArtistTypeSeedData | null> => {
  return byOrderSorted.find((d) => d.order === order) ?? null;
};

// Synchronous versions for when async isn't needed
export const getAllArtistTypeSeedDataSync = (): readonly ArtistTypeSeedData[] => {
  return allArtistTypes;
};

export const getArtistTypeSeedDataSync = (id: string): ArtistTypeSeedData | null => {
  return byIdMap.get(id) ?? null;
};

export const getArtistTypeSeedDataBySlugSync = (slug: string): ArtistTypeSeedData | null => {
  if (slug.startsWith('the-') && slug.endsWith('-artist')) {
    return byIdMap.get(slug) ?? null;
  }

  const normalizedSlug = `the-${slug.toLowerCase()}-artist`;
  return byIdMap.get(normalizedSlug) ?? null;
};
