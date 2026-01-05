import * as Layer from 'effect/Layer';

import { CategoryRpcLive } from '../../features/category/server/rpc-live.js';
import { CertificateRpcLive } from '../../features/certificate/server/rpc-live.js';
import { CourseRpcLive } from '../../features/course/server/rpc-live.js';
import { EnrollmentRpcLive } from '../../features/enrollment/server/rpc-live.js';
import { InstructorRpcLive } from '../../features/instructor/server/rpc-live.js';
import { LessonRpcLive } from '../../features/lesson/server/rpc-live.js';
import { ProgressRpcLive } from '../../features/progress/server/rpc-live.js';
import { ReviewRpcLive } from '../../features/review/server/rpc-live.js';
import { SectionRpcLive } from '../../features/section/server/rpc-live.js';

/**
 * CourseRpcLayer - Combined RPC handlers for all course features.
 *
 * Usage in app server:
 * ```ts
 * import { CourseRpcLayer } from "@course/server";
 *
 * const RpcRouter = RpcServer.layerHttpRouter({...}).pipe(
 *   Layer.provide(CourseRpcLayer)
 * );
 * ```
 */
export const CourseRpcLayer = Layer.mergeAll(
  CategoryRpcLive,
  CertificateRpcLive,
  CourseRpcLive,
  EnrollmentRpcLive,
  InstructorRpcLive,
  LessonRpcLive,
  ProgressRpcLive,
  ReviewRpcLive,
  SectionRpcLive,
);
