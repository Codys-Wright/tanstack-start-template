// Domain exports only - safe for client bundle
export * from './domain/index.js';

// Database exports are in @course/database to avoid bundling pg in client
// Server exports are in @course/server to avoid bundling server code in client
