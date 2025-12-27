import { Atom } from "@effect-atom/atom-react";

// Helper to read from localStorage synchronously
const readFromLocalStorage = (key: string, defaultValue: string): string => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const value = localStorage.getItem(key);
    return value || defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper to write to localStorage
const writeToLocalStorage = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore errors
  }
};

// Helper to validate theme name
const validateThemeName = (value: string): string => {
  const valid = [
    "neutral",
    "blue",
    "green",
    "rose",
    "purple",
    "orange",
    "cyan",
  ];
  return valid.includes(value) ? value : "neutral";
};

// Helper to validate radius
const validateRadius = (value: string): string => {
  const valid = ["none", "sm", "default", "md", "lg", "xl", "2xl"];
  return valid.includes(value) ? value : "default";
};

// Helper to validate color mode
const validateColorMode = (value: string): string => {
  const valid = ["light", "dark", "system"];
  return valid.includes(value) ? value : "system";
};

// Create a writable atom that syncs with localStorage
const createSyncedAtom = (
  key: string,
  defaultValue: string,
  validate: (v: string) => string
) => {
  // Read synchronously from localStorage for initial value
  const initialValue = validate(readFromLocalStorage(key, defaultValue));

  // Create atom with initial value
  const baseAtom = Atom.make(initialValue).pipe(Atom.keepAlive);

  // Wrap in writable atom that syncs to localStorage
  return Atom.writable(
    (get) => get(baseAtom),
    (ctx, value: string) => {
      const validated = validate(value);
      ctx.setSelf(validated);
      // Sync to localStorage
      writeToLocalStorage(key, validated);
    }
  );
};

// Theme name atom - reads synchronously from localStorage on init
export const themeNameAtom = createSyncedAtom(
  "vite-ui-theme-name",
  "neutral",
  validateThemeName
);

// Radius atom
export const radiusAtom = createSyncedAtom(
  "vite-ui-radius",
  "default",
  validateRadius
);

// Color mode atom
export const colorModeAtom = createSyncedAtom(
  "vite-ui-theme",
  "system",
  validateColorMode
);
