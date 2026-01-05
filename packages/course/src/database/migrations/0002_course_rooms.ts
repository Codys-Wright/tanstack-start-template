import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

/**
 * Course Rooms Migration
 *
 * Creates tables for course-based communication:
 * - course_rooms: Links courses to chat rooms (channels, DMs)
 * - course_announcements: Course-specific announcements
 * - course_room_members: Additional metadata for room membership
 */
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // ===========================================
  // Course Rooms - links courses to chat rooms
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Reference to chat room (from @chat package)
      -- This is the external room ID from the chat system
      chat_room_id TEXT NOT NULL,
      
      -- Room type within course context
      -- 'main' - Main course discussion channel (auto-created with course)
      -- 'section' - Section-specific channel
      -- 'lesson' - Lesson Q&A channel
      -- 'direct' - DM between course participants
      -- 'study_group' - Student-created study groups
      room_type TEXT NOT NULL CHECK (room_type IN ('main', 'section', 'lesson', 'direct', 'study_group')),
      
      -- Optional reference to section/lesson for context-specific rooms
      section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE,
      lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
      
      -- Room metadata
      name TEXT NOT NULL,
      description TEXT,
      icon_emoji TEXT,
      
      -- Access control
      -- 'all_enrolled' - All enrolled students can access
      -- 'instructors_only' - Only instructors and TAs
      -- 'invite_only' - Requires explicit invitation
      access_level TEXT NOT NULL DEFAULT 'all_enrolled' CHECK (access_level IN ('all_enrolled', 'instructors_only', 'invite_only')),
      
      -- Settings
      is_archived BOOLEAN NOT NULL DEFAULT false,
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL DEFAULT 0,
      
      -- Stats (denormalized for performance)
      member_count INTEGER NOT NULL DEFAULT 0,
      message_count INTEGER NOT NULL DEFAULT 0,
      last_message_at TIMESTAMPTZ,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      -- Ensure unique chat_room_id per course
      UNIQUE(course_id, chat_room_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_rooms_course ON public.course_rooms(course_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_rooms_chat_room ON public.course_rooms(chat_room_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_rooms_type ON public.course_rooms(course_id, room_type)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_rooms_section ON public.course_rooms(section_id) WHERE section_id IS NOT NULL`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_rooms_lesson ON public.course_rooms(lesson_id) WHERE lesson_id IS NOT NULL`;

  // ===========================================
  // Course Announcements - instructor announcements
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Author (instructor/TA)
      author_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      
      -- Content
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      
      -- Priority and visibility
      priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
      
      -- Visibility scope
      -- 'all_enrolled' - All enrolled students
      -- 'section' - Specific section(s)
      -- 'draft' - Not published yet
      visibility TEXT NOT NULL DEFAULT 'all_enrolled' CHECK (visibility IN ('all_enrolled', 'section', 'draft')),
      
      -- Target sections (for section-specific announcements)
      target_section_ids JSONB DEFAULT '[]',
      
      -- Publishing
      is_published BOOLEAN NOT NULL DEFAULT false,
      published_at TIMESTAMPTZ,
      
      -- Pinning
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      pinned_at TIMESTAMPTZ,
      
      -- Scheduling
      scheduled_for TIMESTAMPTZ,
      
      -- Email notification
      send_email BOOLEAN NOT NULL DEFAULT false,
      email_sent_at TIMESTAMPTZ,
      
      -- Stats
      view_count INTEGER NOT NULL DEFAULT 0,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_announcements_course ON public.course_announcements(course_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_announcements_author ON public.course_announcements(author_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_announcements_published ON public.course_announcements(course_id, is_published, published_at DESC) WHERE is_published = true`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_announcements_scheduled ON public.course_announcements(scheduled_for) WHERE scheduled_for IS NOT NULL AND is_published = false`;

  // ===========================================
  // Announcement Read Status - tracks who read what
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.announcement_read_status (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      announcement_id UUID NOT NULL REFERENCES public.course_announcements(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(announcement_id, user_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_announcement_read_announcement ON public.announcement_read_status(announcement_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_announcement_read_user ON public.announcement_read_status(user_id)`;

  // ===========================================
  // Course Room Members - extended membership info
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_room_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_room_id UUID NOT NULL REFERENCES public.course_rooms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      
      -- Role within the course room
      -- 'instructor' - Course instructor
      -- 'ta' - Teaching assistant
      -- 'student' - Enrolled student
      -- 'guest' - Invited guest (for invite_only rooms)
      role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('instructor', 'ta', 'student', 'guest')),
      
      -- Notification preferences
      notifications_enabled BOOLEAN NOT NULL DEFAULT true,
      muted_until TIMESTAMPTZ,
      
      -- Stats
      last_read_at TIMESTAMPTZ,
      last_read_message_id TEXT,
      
      -- Timestamps
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(course_room_id, user_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_room_members_room ON public.course_room_members(course_room_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_room_members_user ON public.course_room_members(user_id)`;

  // ===========================================
  // Direct Message Threads - for course DMs
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_dm_threads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Reference to chat room
      chat_room_id TEXT NOT NULL,
      
      -- Participants (always 2 for DMs)
      participant_ids JSONB NOT NULL,
      
      -- Last activity
      last_message_at TIMESTAMPTZ,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      -- Ensure unique thread per participant pair per course
      UNIQUE(course_id, chat_room_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_dm_course ON public.course_dm_threads(course_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_dm_chat_room ON public.course_dm_threads(chat_room_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_dm_participants ON public.course_dm_threads USING GIN (participant_ids)`;
});
