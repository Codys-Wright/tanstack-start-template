// Combined RPC definitions for @course package
//
// This file merges all feature RPC groups into a single CourseRpcGroup
// for use with @effect/rpc router and client.

import { CategoryRpc } from './features/category/domain/rpc.js';
import { CertificateRpc } from './features/certificate/domain/rpc.js';
import { CourseRpc } from './features/course/domain/rpc.js';
import { EnrollmentRpc } from './features/enrollment/domain/rpc.js';
import { InstructorRpc } from './features/instructor/domain/rpc.js';
import { LessonRpc } from './features/lesson/domain/rpc.js';
import { ProgressRpc } from './features/progress/domain/rpc.js';
import { ReviewRpc } from './features/review/domain/rpc.js';
import { SectionRpc } from './features/section/domain/rpc.js';

// Re-export individual RPC groups for granular use
export {
  CategoryRpc,
  CertificateRpc,
  CourseRpc,
  EnrollmentRpc,
  InstructorRpc,
  LessonRpc,
  ProgressRpc,
  ReviewRpc,
  SectionRpc,
};

// Combined RPC group with all course-related endpoints
export const CourseRpcGroup = CategoryRpc.merge(InstructorRpc)
  .merge(CourseRpc)
  .merge(SectionRpc)
  .merge(LessonRpc)
  .merge(EnrollmentRpc)
  .merge(ProgressRpc)
  .merge(ReviewRpc)
  .merge(CertificateRpc);

// Type for the combined RPC group
export type CourseRpcGroup = typeof CourseRpcGroup;
