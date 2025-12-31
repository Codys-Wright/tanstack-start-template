/**
 * Shareable URL utilities for encoding/decoding quiz results
 *
 * The shareable URL encodes the analysis results (percentages for each artist type)
 * in a compact format that can be shared without requiring database access.
 *
 * Format: /results?d=<base64-encoded-data>
 *
 * The encoded data contains:
 * - winnerId: The winning artist type ID
 * - scores: Array of [artistTypeIndex, percentage] pairs
 */

import type { ArtistData } from '../components/artist-type/artist-data-utils.js';

/**
 * Compact representation of analysis results for URL encoding
 */
export type ShareableResults = {
  /** Winning artist type ID */
  w: string;
  /** Scores as [index, percentage] pairs - index maps to ARTIST_TYPE_ORDER */
  s: Array<[number, number]>;
  /** Timestamp when shared (for display purposes) */
  t?: number;
};

/**
 * Order of artist types for encoding (matches database order)
 */
export const ARTIST_TYPE_ORDER = [
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

/**
 * Short names for URL display
 */
export const ARTIST_TYPE_SHORT_NAMES: Record<string, string> = {
  'the-visionary-artist': 'Visionary',
  'the-consummate-artist': 'Consummate',
  'the-analyzer-artist': 'Analyzer',
  'the-tech-artist': 'Tech',
  'the-entertainer-artist': 'Entertainer',
  'the-maverick-artist': 'Maverick',
  'the-dreamer-artist': 'Dreamer',
  'the-feeler-artist': 'Feeler',
  'the-tortured-artist': 'Tortured',
  'the-solo-artist': 'Solo',
};

/**
 * Encode analysis results into a shareable URL parameter
 */
export function encodeResultsForShare(artistData: ArtistData[], winnerId: string): string {
  const scores: Array<[number, number]> = artistData
    .map((data) => {
      const index = ARTIST_TYPE_ORDER.indexOf(
        data.databaseId as (typeof ARTIST_TYPE_ORDER)[number],
      );
      if (index === -1) return null;
      // Round percentage to 1 decimal place for compact encoding
      return [index, Math.round(data.percentage * 10) / 10] as [number, number];
    })
    .filter((item): item is [number, number] => item !== null);

  const winnerIndex = ARTIST_TYPE_ORDER.indexOf(winnerId as (typeof ARTIST_TYPE_ORDER)[number]);

  const payload: ShareableResults = {
    w: winnerIndex >= 0 ? String(winnerIndex) : winnerId,
    s: scores,
    t: Date.now(),
  };

  // Encode as base64
  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(jsonStr);

  // Make URL-safe (replace + with -, / with _, remove trailing =)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode shareable URL parameter back to analysis results
 */
export function decodeResultsFromShare(encoded: string): {
  artistData: ArtistData[];
  winnerId: string;
  sharedAt?: Date;
} | null {
  try {
    // Restore base64 padding and characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const jsonStr = atob(base64);
    const payload: ShareableResults = JSON.parse(jsonStr);

    // Reconstruct artist data
    const artistData: ArtistData[] = payload.s.map(([index, percentage]) => {
      const databaseId = ARTIST_TYPE_ORDER[index] ?? `unknown-${index}`;
      const shortName = ARTIST_TYPE_SHORT_NAMES[databaseId] ?? 'Unknown';

      return {
        databaseId,
        artistType: shortName,
        fullName: `The ${shortName} Artist`,
        percentage,
        points: percentage, // Use percentage as points for display
      };
    });

    // Sort by percentage descending
    artistData.sort((a, b) => b.percentage - a.percentage);

    // Determine winner ID
    const winnerId =
      typeof payload.w === 'string' && payload.w.length <= 2
        ? (ARTIST_TYPE_ORDER[parseInt(payload.w, 10)] ?? payload.w)
        : payload.w;

    return {
      artistData,
      winnerId,
      sharedAt: payload.t ? new Date(payload.t) : undefined,
    };
  } catch (error) {
    console.error('Failed to decode shared results:', error);
    return null;
  }
}

/**
 * Generate a shareable URL for the results
 */
export function generateShareableUrl(
  artistData: ArtistData[],
  winnerId: string,
  baseUrl?: string,
): string {
  const encoded = encodeResultsForShare(artistData, winnerId);
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/results?d=${encoded}`;
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
