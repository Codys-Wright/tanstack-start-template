import type { AnalysisResult } from './domain/schema.js';
import { useMemo } from 'react';
import { endingNameToArtistType } from './ui/artist-type/artist-data-utils.js';
import type { ArtistData } from './ui/artist-type/artist-type-graph-card.js';

// Create a reverse mapping from endingId to full artist names
const createEndingIdToFullNameMapping = (): Record<string, string> => {
  const mapping: Record<string, string> = {};

  // Create the reverse mapping from the existing endingNameToArtistType
  Object.keys(endingNameToArtistType).forEach((fullName) => {
    // Convert "The Visionary Artist" to "the-visionary-artist"
    const endingId = fullName.toLowerCase().replace(/\s+/g, '-');
    mapping[endingId] = fullName;
  });

  return mapping;
};

/**
 * Custom hook to transform analysis results into ArtistData format for graph cards
 */
export const useAnalysisArtistData = (analysis: AnalysisResult | null): ArtistData[] => {
  return useMemo(() => {
    if (!analysis) return [];

    console.log('🔍 Analysis data:', analysis);
    console.log('🔍 Ending results:', analysis.endingResults);

    const endingIdToFullName = createEndingIdToFullNameMapping();
    console.log('🔍 EndingId to FullName mapping:', endingIdToFullName);

    return analysis.endingResults.map((ending) => {
      console.log('🔍 Processing ending:', ending);

      // Get the full name from the endingId
      const fullName = endingIdToFullName[ending.endingId];

      if (!fullName) {
        console.warn('⚠️ No full name found for endingId:', ending.endingId);
        // Fallback: try to construct it manually
        const constructedName = ending.endingId
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        console.log('🔍 Constructed fallback name:', constructedName);
      }

      console.log('🔍 Mapped endingId to fullName:', ending.endingId, '→', fullName);

      // Now map to artist type using the existing mapping
      const artistType = fullName ? endingNameToArtistType[fullName] : ending.endingId;

      console.log('🔍 Mapped to artistType:', fullName, '→', artistType);

      const result = {
        artistType: artistType || ending.endingId,
        percentage: ending.percentage,
        points: ending.points,
        fullName: fullName || ending.endingId,
        databaseId: ending.endingId,
      };

      console.log('🔍 Final ArtistData:', result);

      return result;
    });
  }, [analysis]);
};

/**
 * Transform a single analysis result to ArtistData format
 */
export const transformAnalysisToArtistData = (analysis: AnalysisResult): ArtistData[] => {
  const endingIdToFullName = createEndingIdToFullNameMapping();

  return analysis.endingResults.map((ending) => {
    // Get the full name from the endingId
    const fullName = endingIdToFullName[ending.endingId];

    // Now map to artist type using the existing mapping
    const artistType = fullName ? endingNameToArtistType[fullName] : ending.endingId;

    return {
      artistType: artistType || ending.endingId,
      percentage: ending.percentage,
      points: ending.points,
      fullName: fullName || ending.endingId,
      databaseId: ending.endingId,
    };
  });
};
