// @course package - Course Learning Platform
//
// Features:
// - Course management (CRUD, publish, pricing)
// - Section organization
// - Lesson content (MDX, video, quizzes, downloads)
// - Lesson parts (multi-part lessons with mixed content types)
// - Instructor profiles
// - User enrollments
// - Progress tracking
// - Course reviews
// - Completion certificates

// Export all domain schemas
export * from './features/category/index.js';
export * from './features/certificate/index.js';
export * from './features/course/index.js';
export * from './features/enrollment/index.js';
export * from './features/instructor/index.js';
export * from './features/lesson/index.js';
export * from './features/lesson-part/index.js';
export * from './features/progress/index.js';
export * from './features/review/index.js';
export * from './features/section/index.js';
