/**
 * Environment variables for the quiz package.
 * These are read from the environment at runtime.
 */
export const envVars = {
  /** The current environment: 'dev' | 'prod' | 'test' */
  EFFECTIVE_ENV: (process.env.NODE_ENV ?? 'dev') as 'dev' | 'prod' | 'test',
  /** The API URL for client requests */
  API_URL: process.env.VITE_API_URL ?? process.env.API_URL ?? 'http://localhost:3000',
} as const;
