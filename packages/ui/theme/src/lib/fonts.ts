// Font definitions for dynamic font switching
// These fonts are loaded via Google Fonts API

export type FontType = 'sans' | 'mono';

export type Font = {
  name: string;
  value: string;
  type: FontType;
  // Google Fonts family name
  family: string;
  // CSS variable name (for preloading if needed)
  variable?: string;
};

export const FONTS: readonly Font[] = [
  {
    name: 'Inter',
    value: 'inter',
    type: 'sans',
    family: "'Inter Variable', 'Inter', sans-serif",
    variable: '--font-inter',
  },
  {
    name: 'Noto Sans',
    value: 'noto-sans',
    type: 'sans',
    family: "'Noto Sans Variable', 'Noto Sans', sans-serif",
    variable: '--font-noto-sans',
  },
  {
    name: 'Nunito Sans',
    value: 'nunito-sans',
    type: 'sans',
    family: "'Nunito Sans Variable', 'Nunito Sans', sans-serif",
    variable: '--font-nunito-sans',
  },
  {
    name: 'Figtree',
    value: 'figtree',
    type: 'sans',
    family: "'Figtree Variable', 'Figtree', sans-serif",
    variable: '--font-figtree',
  },
  {
    name: 'Roboto',
    value: 'roboto',
    type: 'sans',
    family: "'Roboto', sans-serif",
    variable: '--font-roboto',
  },
  {
    name: 'Raleway',
    value: 'raleway',
    type: 'sans',
    family: "'Raleway', sans-serif",
    variable: '--font-raleway',
  },
  {
    name: 'DM Sans',
    value: 'dm-sans',
    type: 'sans',
    family: "'DM Sans', sans-serif",
    variable: '--font-dm-sans',
  },
  {
    name: 'Public Sans',
    value: 'public-sans',
    type: 'sans',
    family: "'Public Sans', sans-serif",
    variable: '--font-public-sans',
  },
  {
    name: 'Outfit',
    value: 'outfit',
    type: 'sans',
    family: "'Outfit', sans-serif",
    variable: '--font-outfit',
  },
  {
    name: 'JetBrains Mono',
    value: 'jetbrains-mono',
    type: 'mono',
    family: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
    variable: '--font-jetbrains-mono',
  },
] as const;

export function getFont(value: string): Font | undefined {
  return FONTS.find((f) => f.value === value);
}

export function getDefaultFont(): Font {
  return FONTS[0]; // Inter
}
