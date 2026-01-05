import { UserId } from '@auth';
import * as Effect from 'effect/Effect';
import { InstructorRepository } from '../database/repo.js';
import type {
  CreateInstructorInput,
  InstructorId,
  UpdateInstructorInput,
} from '../domain/index.js';

export class InstructorService extends Effect.Service<InstructorService>()(
  '@course/InstructorService',
  {
    dependencies: [InstructorRepository.Default],
    effect: Effect.gen(function* () {
      const repo = yield* InstructorRepository;

      return {
        list: () => repo.findAll(),
        listApproved: () => repo.findApproved(),
        listPending: () => repo.findPending(),
        getById: (id: InstructorId) => repo.findById(id),
        getByUserId: (userId: UserId) => repo.findByUserId(userId),
        apply: (input: CreateInstructorInput) => repo.create(input),
        update: (id: InstructorId, input: UpdateInstructorInput) => repo.update(id, input),
        approve: (id: InstructorId) => repo.approve(id),
        suspend: (id: InstructorId) => repo.suspend(id),
        delete: (id: InstructorId) => repo.delete(id),
      } as const;
    }),
  },
) {}
