ALTER TABLE "exam_attempts"
  ADD COLUMN IF NOT EXISTS "graded" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "teacher_feedback" text;