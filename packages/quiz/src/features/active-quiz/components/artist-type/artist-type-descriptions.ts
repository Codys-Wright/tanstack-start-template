/**
 * Artist Type Descriptions
 *
 * Contains display information for each of the 10 artist types
 * including titles, descriptions, and character traits.
 */

export type ArtistTypeInfo = {
  id: string;
  shortName: string;
  title: string;
  description: string;
  traits: string[];
  iconPath: string;
};

/**
 * Map of artist type IDs to their display information
 */
export const artistTypeDescriptions: Record<string, ArtistTypeInfo> = {
  'the-visionary-artist': {
    id: 'the-visionary-artist',
    shortName: 'Visionary',
    title: 'The Visionary Artist',
    description:
      'You see the world differently. Your creative vision pushes boundaries and inspires others to think beyond the conventional. You are driven by big ideas and the desire to create something truly original.',
    traits: ['Innovative', 'Forward-thinking', 'Inspirational', 'Original'],
    iconPath: '/svgs/artist-type-logos/1_VISIONARY_LOGO.svg',
  },
  'the-consummate-artist': {
    id: 'the-consummate-artist',
    shortName: 'Consummate',
    title: 'The Consummate Artist',
    description:
      'You pursue excellence in every detail. Your dedication to craft and continuous improvement sets you apart. You believe that mastery comes through practice, patience, and an unwavering commitment to quality.',
    traits: ['Dedicated', 'Skilled', 'Professional', 'Perfectionist'],
    iconPath: '/svgs/artist-type-logos/2_CONSUMATE_LOGO.svg',
  },
  'the-analyzer-artist': {
    id: 'the-analyzer-artist',
    shortName: 'Analyzer',
    title: 'The Analyzer Artist',
    description:
      'You approach your art with precision and thoughtfulness. Your analytical mind helps you understand the deeper structures and patterns that make great art work. You find beauty in complexity and logic.',
    traits: ['Analytical', 'Precise', 'Thoughtful', 'Strategic'],
    iconPath: '/svgs/artist-type-logos/3_ANALYZER_LOGO.svg',
  },
  'the-tech-artist': {
    id: 'the-tech-artist',
    shortName: 'Tech',
    title: 'The Tech Artist',
    description:
      'You embrace technology as a creative tool. You see the intersection of art and technology as a frontier of endless possibilities. You are not afraid to experiment with new tools and techniques.',
    traits: ['Innovative', 'Technical', 'Experimental', 'Modern'],
    iconPath: '/svgs/artist-type-logos/4_TECH_LOGO.svg',
  },
  'the-entertainer-artist': {
    id: 'the-entertainer-artist',
    shortName: 'Entertainer',
    title: 'The Entertainer Artist',
    description:
      'You create to connect and delight. Your art is meant to be experienced, enjoyed, and shared. You understand that the greatest art moves people emotionally and brings joy to their lives.',
    traits: ['Charismatic', 'Engaging', 'Joyful', 'Crowd-pleasing'],
    iconPath: '/svgs/artist-type-logos/5_ENTERTAINER_LOGO.svg',
  },
  'the-maverick-artist': {
    id: 'the-maverick-artist',
    shortName: 'Maverick',
    title: 'The Maverick Artist',
    description:
      'You forge your own path. Rules and conventions are starting points, not limitations. You take risks, challenge norms, and are not afraid to stand alone in your creative vision.',
    traits: ['Independent', 'Bold', 'Unconventional', 'Risk-taking'],
    iconPath: '/svgs/artist-type-logos/6_MAVERICK_LOGO.svg',
  },
  'the-dreamer-artist': {
    id: 'the-dreamer-artist',
    shortName: 'Dreamer',
    title: 'The Dreamer Artist',
    description:
      'You live in a world of imagination and possibility. Your creativity flows from an inner wellspring of dreams, fantasies, and visions. You bring the intangible into being through your art.',
    traits: ['Imaginative', 'Idealistic', 'Romantic', 'Visionary'],
    iconPath: '/svgs/artist-type-logos/7_DREAMER_LOGO.svg',
  },
  'the-feeler-artist': {
    id: 'the-feeler-artist',
    shortName: 'Feeler',
    title: 'The Feeler Artist',
    description:
      'You create from the heart. Your art is deeply connected to emotions - both your own and those of others. You have an extraordinary ability to capture and express the human experience.',
    traits: ['Empathetic', 'Emotional', 'Intuitive', 'Sensitive'],
    iconPath: '/svgs/artist-type-logos/8_FEELER_LOGO.svg',
  },
  'the-tortured-artist': {
    id: 'the-tortured-artist',
    shortName: 'Tortured',
    title: 'The Tortured Artist',
    description:
      'You channel struggle into art. Your creativity is born from depth, complexity, and the willingness to explore darker themes. You understand that great art often comes from great challenges.',
    traits: ['Deep', 'Complex', 'Intense', 'Authentic'],
    iconPath: '/svgs/artist-type-logos/9_TORTURED_LOGO.svg',
  },
  'the-solo-artist': {
    id: 'the-solo-artist',
    shortName: 'Solo',
    title: 'The Solo Artist',
    description:
      'You thrive in solitude. Your creative process is deeply personal and requires space for introspection. You find your truest expression when working independently, free from external influences.',
    traits: ['Independent', 'Introspective', 'Self-sufficient', 'Focused'],
    iconPath: '/svgs/artist-type-logos/10_SOLO_LOGO.svg',
  },
};

/**
 * Get artist type info by ID (supports various ID formats)
 */
export function getArtistTypeInfo(id: string): ArtistTypeInfo | undefined {
  // Direct lookup
  if (artistTypeDescriptions[id]) {
    return artistTypeDescriptions[id];
  }

  // Try converting short name to full ID
  const normalizedId = `the-${id.toLowerCase()}-artist`;
  if (artistTypeDescriptions[normalizedId]) {
    return artistTypeDescriptions[normalizedId];
  }

  // Try finding by short name
  return Object.values(artistTypeDescriptions).find(
    (info) => info.shortName.toLowerCase() === id.toLowerCase(),
  );
}

/**
 * Get all artist type infos as an array
 */
export function getAllArtistTypes(): ArtistTypeInfo[] {
  return Object.values(artistTypeDescriptions);
}

/**
 * Get artist type info from an ending ID (from analysis results)
 */
export function getArtistTypeFromEndingId(endingId: string): ArtistTypeInfo | undefined {
  return getArtistTypeInfo(endingId);
}
