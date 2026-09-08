import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // student, instructor, admin
});

export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration").notNull(), // in minutes
  createdBy: varchar("created_by").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull(),
  type: text("type").notNull(), // multiple_choice, short_answer, true_false, coding
  text: text("text").notNull(),
  options: jsonb("options"), // for multiple choice questions
  correctAnswer: text("correct_answer"),
  points: integer("points").notNull().default(1),
  order: integer("order").notNull(),
  // Coding question specific fields
  language: text("language"), // javascript, python, java, cpp, etc.
  starterCode: text("starter_code"), // initial code template
  testCases: jsonb("test_cases"), // array of test cases with input/expected output
  timeLimit: integer("time_limit"), // execution time limit in seconds
  memoryLimit: integer("memory_limit"), // memory limit in MB
});

export const examAttempts = pgTable("exam_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull(),
  userId: varchar("user_id").notNull(),
  startedAt: timestamp("started_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers"),
  answers: jsonb("answers").notNull(), // questionId -> answer/code mapping
  timeSpent: integer("time_spent"), // in minutes
  codeExecutions: jsonb("code_executions"), // execution history and results
  graded: boolean("graded").notNull().default(false),
  teacherFeedback: text("teacher_feedback"),
});

// New table for coding submissions
export const codeSubmissions = pgTable("code_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").notNull(),
  questionId: varchar("question_id").notNull(),
  userId: varchar("user_id").notNull(),
  code: text("code").notNull(),
  language: text("language").notNull(),
  status: text("status").notNull(), // running, passed, failed, error, timeout
  testResults: jsonb("test_results"), // detailed test case results
  executionTime: integer("execution_time"), // in milliseconds
  memoryUsed: integer("memory_used"), // in KB
  submittedAt: timestamp("submitted_at").notNull().default(sql`now()`),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  fontSize: integer("font_size").notNull().default(18),
  contrastMode: text("contrast_mode").notNull().default("normal"), // normal, high, dark
  speechRate: integer("speech_rate").notNull().default(10), // 0.5 to 2.0, stored as 5-20
  speechVolume: integer("speech_volume").notNull().default(80),
  speechPitch: integer("speech_pitch").notNull().default(10),
  speechVoice: text("speech_voice").notNull().default(""),
  voiceMode: text("voice_mode").notNull().default("push-to-talk"),
  audioInstructions: boolean("audio_instructions").notNull().default(true),
  soundEffects: boolean("sound_effects").notNull().default(true),
  reducedMotion: boolean("reduced_motion").notNull().default(false),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({
  id: true,
  startedAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
});

// Insert schemas for new table
export const insertCodeSubmissionSchema = createInsertSchema(codeSubmissions).omit({
  id: true,
  submittedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;

export type CodeSubmission = typeof codeSubmissions.$inferSelect;
export type InsertCodeSubmission = z.infer<typeof insertCodeSubmissionSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Additional types for frontend
export type QuestionType = "multiple_choice" | "short_answer" | "true_false" | "coding";
export type ProgrammingLanguage = "javascript" | "python" | "java" | "cpp" | "c" | "typescript" | "go" | "rust";
export type CodeExecutionStatus = "running" | "passed" | "failed" | "error" | "timeout";

export interface MultipleChoiceOption {
  id: string;
  text: string;
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export interface ExamAttemptWithDetails extends ExamAttempt {
  exam: Exam;
  user: User;
}

// Coding question interfaces
export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  description?: string;
  isHidden?: boolean;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime: number;
  error?: string;
  isHidden?: boolean;
}

export interface CodeExecutionResult {
  status: CodeExecutionStatus;
  output: string;
  error?: string;
  testResults: TestResult[];
  executionTime: number;
  memoryUsed: number;
  passedTests: number;
  totalTests: number;
}
