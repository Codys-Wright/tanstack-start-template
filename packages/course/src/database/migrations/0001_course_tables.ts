import * as SqlClient from '@effect/sql/SqlClient';
import * as Effect from 'effect/Effect';

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // ===========================================
  // Categories - hierarchical course categories
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      parent_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_categories_parent ON public.course_categories(parent_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_categories_slug ON public.course_categories(slug)`;

  // ===========================================
  // Instructor Profiles - extends user table
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.instructor_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      
      -- Profile info
      display_name TEXT NOT NULL,
      bio TEXT,
      headline TEXT,
      avatar_url TEXT,
      
      -- Social links
      website_url TEXT,
      linkedin_url TEXT,
      twitter_url TEXT,
      youtube_url TEXT,
      
      -- Stats (denormalized for performance)
      total_students INTEGER NOT NULL DEFAULT 0,
      total_courses INTEGER NOT NULL DEFAULT 0,
      average_rating DECIMAL(3,2),
      total_reviews INTEGER NOT NULL DEFAULT 0,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
      approved_at TIMESTAMPTZ,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(user_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_instructor_profiles_user ON public.instructor_profiles(user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_instructor_profiles_status ON public.instructor_profiles(status)`;

  // ===========================================
  // Courses - main course entity
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
      
      -- Content
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      subtitle TEXT,
      description TEXT,
      thumbnail_url TEXT,
      preview_video_url TEXT,
      
      -- Categorization
      category_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL,
      tags JSONB DEFAULT '[]',
      level TEXT NOT NULL DEFAULT 'all-levels' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all-levels')),
      language TEXT NOT NULL DEFAULT 'en',
      
      -- Pricing (JSONB for flexibility)
      -- { model: 'free' | 'one-time' | 'subscription' | 'freemium', price?: number, currency?: string, freeLessonCount?: number }
      pricing JSONB NOT NULL DEFAULT '{"model": "free"}',
      
      -- Stats (denormalized for performance)
      total_duration_minutes INTEGER NOT NULL DEFAULT 0,
      lesson_count INTEGER NOT NULL DEFAULT 0,
      section_count INTEGER NOT NULL DEFAULT 0,
      enrollment_count INTEGER NOT NULL DEFAULT 0,
      average_rating DECIMAL(3,2),
      review_count INTEGER NOT NULL DEFAULT 0,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
      published_at TIMESTAMPTZ,
      
      -- Requirements and outcomes (stored as JSONB arrays)
      requirements JSONB DEFAULT '[]',
      learning_outcomes JSONB DEFAULT '[]',
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(published_at) WHERE status = 'published'`;

  // ===========================================
  // Sections - course sections for organization
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Content
      title TEXT NOT NULL,
      description TEXT,
      
      -- Ordering
      sort_order INTEGER NOT NULL DEFAULT 0,
      
      -- Stats (denormalized)
      lesson_count INTEGER NOT NULL DEFAULT 0,
      total_duration_minutes INTEGER NOT NULL DEFAULT 0,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_sections_course ON public.course_sections(course_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_sections_order ON public.course_sections(course_id, sort_order)`;

  // ===========================================
  // Lessons - individual lessons within sections
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Content
      title TEXT NOT NULL,
      description TEXT,
      
      -- Lesson type and content
      type TEXT NOT NULL CHECK (type IN ('video', 'text', 'quiz', 'assignment', 'download')),
      
      -- MDX content for text lessons (rendered with tailwind typography)
      mdx_content TEXT,
      
      -- Video content (JSONB for flexibility)
      -- { provider: 'youtube' | 'vimeo', videoId: string, durationSeconds: number }
      video_content JSONB,
      
      -- Quiz content (reference to @quiz package)
      quiz_id UUID,
      quiz_passing_score INTEGER,
      quiz_is_required BOOLEAN DEFAULT false,
      
      -- Download content (array of files)
      -- [{ name: string, url: string, sizeBytes: number, mimeType: string }]
      download_files JSONB DEFAULT '[]',
      
      -- Ordering
      sort_order INTEGER NOT NULL DEFAULT 0,
      
      -- Duration
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      
      -- Access control
      is_free BOOLEAN NOT NULL DEFAULT false,
      is_preview BOOLEAN NOT NULL DEFAULT false,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_lessons_section ON public.course_lessons(section_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON public.course_lessons(course_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(section_id, sort_order)`;

  // ===========================================
  // Enrollments - user course enrollments
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'refunded', 'cancelled')),
      source TEXT NOT NULL CHECK (source IN ('purchase', 'subscription', 'gift', 'promo', 'free')),
      
      -- Payment references (for future integration)
      purchase_id UUID,
      subscription_id UUID,
      
      -- Access window
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ,
      
      -- Progress summary (denormalized for performance)
      progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
      completed_lesson_count INTEGER NOT NULL DEFAULT 0,
      last_accessed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(user_id, course_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON public.course_enrollments(user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON public.course_enrollments(status)`;

  // ===========================================
  // Lesson Progress - tracks user progress per lesson
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.lesson_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
      
      -- Video progress
      watched_seconds INTEGER DEFAULT 0,
      last_position INTEGER DEFAULT 0,
      
      -- Quiz progress
      quiz_attempt_id TEXT,
      quiz_score DECIMAL(5,2),
      quiz_passed BOOLEAN,
      
      -- Time tracking
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(user_id, lesson_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id)`;

  // ===========================================
  // Reviews - course reviews and ratings
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      
      -- Review content
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      body TEXT,
      
      -- Instructor response
      instructor_response TEXT,
      responded_at TIMESTAMPTZ,
      
      -- Moderation
      is_approved BOOLEAN NOT NULL DEFAULT false,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      
      -- Engagement
      helpful_count INTEGER NOT NULL DEFAULT 0,
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(user_id, course_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews(course_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_reviews_user ON public.course_reviews(user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_reviews_approved ON public.course_reviews(course_id) WHERE is_approved = true`;

  // ===========================================
  // Certificates - completion certificates
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.course_certificates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id UUID NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
      
      -- Certificate details (snapshot at time of completion)
      recipient_name TEXT NOT NULL,
      course_title TEXT NOT NULL,
      instructor_name TEXT NOT NULL,
      
      -- Verification
      verification_code TEXT NOT NULL UNIQUE,
      
      -- Issue date
      issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      -- Timestamps
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      
      UNIQUE(enrollment_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_certificates_user ON public.course_certificates(user_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_course_certificates_verification ON public.course_certificates(verification_code)`;

  // ===========================================
  // Review Helpful Votes - track who voted
  // ===========================================
  yield* sql`
    CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      review_id UUID NOT NULL REFERENCES public.course_reviews(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(review_id, user_id)
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review ON public.review_helpful_votes(review_id)`;
});
