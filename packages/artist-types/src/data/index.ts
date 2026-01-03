/**
 * Artist Type Seed Data Loader
 *
 * Imports and loads all artist type JSON files, providing functions to access
 * the raw seed data for seeding the database or serving via mock service.
 */

import type { ArtistTypeSeedData } from '../domain/schema.js';

const loadJson = async (filename: string): Promise<ArtistTypeSeedData> => {
  const data = await import(`./${filename}.json`);
  return data.default as ArtistTypeSeedData;
};

const artistTypeFiles = [
  'the-visionary-artist',
  'the-consummate-artist',
  'the-analyzer-artist',
  'the-tech-artist',
  'the-entertainer-artist',
  'the-maverick-artist',
  'the-dreamer-artist',
  'the-feeler-artist',
  'the-tortured-artist',
  'the-solo-artist',
] as const;

interface ArtistTypeDataCache {
  byId: ReadonlyMap<string, ArtistTypeSeedData>;
  byOrder: ArtistTypeSeedData[];
  all: ArtistTypeSeedData[];
}

let cache: ArtistTypeDataCache | null = null;

const loadCache = async (): Promise<ArtistTypeDataCache> => {
  if (cache !== null) return cache;

  const allData = await Promise.all(artistTypeFiles.map((file) => loadJson(file)));

  const byId = new Map<string, ArtistTypeSeedData>();
  for (const data of allData) {
    byId.set(data.id, data);
  }

  const byOrder = [...allData].sort((a, b) => a.order - b.order);

  cache = { byId, byOrder, all: allData };
  return cache;
};

export const getAllArtistTypeSeedData = async (): Promise<readonly ArtistTypeSeedData[]> => {
  const { all } = await loadCache();
  return all;
};

export const getArtistTypeSeedData = async (id: string): Promise<ArtistTypeSeedData | null> => {
  const { byId } = await loadCache();
  return byId.get(id) ?? null;
};

export const getArtistTypeSeedDataBySlug = async (
  slug: string,
): Promise<ArtistTypeSeedData | null> => {
  const { byId } = await loadCache();

  if (slug.startsWith('the-') && slug.endsWith('-artist')) {
    return byId.get(slug) ?? null;
  }

  const normalizedSlug = `the-${slug.toLowerCase()}-artist`;
  return byId.get(normalizedSlug) ?? null;
};

export const getArtistTypeSeedDataByOrder = async (
  order: number,
): Promise<ArtistTypeSeedData | null> => {
  const { byOrder } = await loadCache();
  return byOrder.find((d) => d.order === order) ?? null;
};
