// Randomization utilities for theme parameters
import { FONTS, type Font } from './fonts.js';
import { themes } from './themes.js';

export type RandomizeContext = {
  theme?: string;
  font?: string;
  radius?: string;
};

export type RandomizeBiases = {
  fonts?: (fonts: readonly Font[], context: RandomizeContext) => readonly Font[];
  radius?: (
    radii: readonly { name: string; value: string }[],
    context: RandomizeContext,
  ) => readonly { name: string; value: string }[];
};

/**
 * Configuration for randomization biases.
 * Add biases here to influence random selection based on context.
 */
export const RANDOMIZE_BIASES: RandomizeBiases = {
  fonts: (fonts, _context) => {
    // Example: If theme is "dark", prefer certain fonts
    // For now, return all fonts
    return fonts;
  },
  radius: (radii, _context) => {
    // Example: If theme is "minimal", prefer smaller radius
    // For now, return all radii
    return radii;
  },
};

/**
 * Applies biases to a list of items based on the current context.
 */
export function applyBias<T>(
  items: readonly T[],
  context: RandomizeContext,
  biasFilter?: (items: readonly T[], context: RandomizeContext) => readonly T[],
): readonly T[] {
  if (!biasFilter) {
    return items;
  }

  return biasFilter(items, context);
}

/**
 * Randomly selects an item from an array
 */
export function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Available radius options
 */
export const RADII = [
  { name: 'none', value: '0' },
  { name: 'sm', value: '0.125rem' },
  { name: 'default', value: '0.625rem' },
  { name: 'md', value: '0.75rem' },
  { name: 'lg', value: '1rem' },
  { name: 'xl', value: '1.5rem' },
  { name: '2xl', value: '2rem' },
] as const;

/**
 * Randomizes all theme parameters
 */
export function randomizeThemeParams(
  lockedParams: Partial<RandomizeContext> = {},
): RandomizeContext {
  const context: RandomizeContext = {};

  // Randomize theme (unless locked)
  const availableThemes = Object.keys(themes);
  context.theme = lockedParams.theme || randomItem(availableThemes);

  // Randomize font (unless locked)
  const availableFonts = applyBias(FONTS, context, RANDOMIZE_BIASES.fonts);
  context.font = lockedParams.font || randomItem(availableFonts).value;

  // Randomize radius (unless locked)
  const availableRadii = applyBias(RADII, context, RANDOMIZE_BIASES.radius);
  context.radius = lockedParams.radius || randomItem(availableRadii).name;

  return context;
}
