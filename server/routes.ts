import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storage } from "./storage";
import { executeCode } from "./codeRunner";
import { isElevated, requireAuth, requireRole } from "./auth";
import {
  insertExamAttemptSchema,
  insertExamSchema,
  insertQuestionSchema,
  insertUserSchema,
  insertUserSettingsSchema,
  type CodeExecutionResult,
  type ExamAttempt,
  type ExamAttemptWithDetails,
  type Question,
  type TestCase,
  type TestResult,
} from "@shared/schema";

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(200),
});
const registrationSchema = credentialsSchema.extend({
  role: z.enum(["student", "instructor"]).optional(),
});
const codeRequestSchema = z.object({
  questionId: z.string().uuid(),
  attemptId: z.string().uuid(),
  code: z.string().min(1).max(64 * 1024),
  language: z.enum(["javascript", "typescript", "python"]),
});
const roleUpdateSchema = z.object({
  role: z.enum(["student", "instructor", "admin"]),
});
const attemptUpdateSchema = insertExamAttemptSchema.partial().extend({
  completedAt: z.coerce.date().nullable().optional(),
});

function publicUser(user: { id: string; username: string; role: string }) {
  return { id: user.id, username: user.username, role: user.role };
}

function publicAttemptDetails(attempts: ExamAttemptWithDetails[]) {
  return attempts.map(attempt => ({ ...attempt, user: publicUser(attempt.user) }));
}

function canManageExam(req: Request, createdBy: string) {
  return req.authUser?.role === "admin" || req.authUser?.id === createdBy;
}

function sanitizeQuestion(question: Question, revealAnswers: boolean): Question {
  if (revealAnswers) return question;
  const testCases = Array.isArray(question.testCases)
    ? (question.testCases as TestCase[])
      .filter(testCase => !testCase.isHidden)
    : question.testCases;
  return { ...question, correctAnswer: null, testCases };
}

function sanitizeExecutionResult(result: CodeExecutionResult): CodeExecutionResult {
  return {
    ...result,
    testResults: result.testResults.map(test => test.isHidden
      ? { ...test, actualOutput: "", expectedOutput: "", error: test.passed ? undefined : "Hidden test failed" }
      : test),
  };
}

async function canAccessAttempt(req: Request, attempt: ExamAttempt) {
  if (req.authUser?.id === attempt.userId || req.authUser?.role === "admin") return true;
  if (req.authUser?.role !== "instructor") return false;
  const exam = await storage.getExam(attempt.examId);
  return exam?.createdBy === req.authUser.id;
}

async function gradeAttempt(attempt: ExamAttempt, answers: Record<string, string>) {
  const questions = await storage.getQuestionsByExam(attempt.examId);
  const submissions = await storage.getCodeSubmissionsByAttempt(attempt.id);
  let score = 0;
  let correctAnswers = 0;

  for (const question of questions) {
    if (question.type !== "coding") {
      if (answers[question.id] === question.correctAnswer) {
        score += question.points;
        correctAnswers += 1;
      }
      continue;
    }

    const latest = submissions.find(submission =>
      submission.questionId === question.id && submission.userId === attempt.userId);
    const results = Array.isArray(latest?.testResults) ? latest.testResults as TestResult[] : [];
    const passed = results.filter(result => result.passed).length;
    const canonicalTotal = Array.isArray(question.testCases) ? (question.testCases as TestCase[]).length : 0;
    if (canonicalTotal > 0) {
      score += Math.round(question.points * Math.min(passed, canonicalTotal) / canonicalTotal);
      if (passed === canonicalTotal) correctAnswers += 1;
    }
  }

  return { score, correctAnswers };
}

export async function registerRoutes(app: Express): Promise<Server> {
  await storage.ready;

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = credentialsSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
      req.session.user = publicUser(user) as typeof req.session.user;
      res.json({ user: publicUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid login data" });
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = registrationSchema.parse(req.body);
      if (await storage.getUserByUsername(username)) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const userData = insertUserSchema.parse({ username, password, role: "student" });
      const user = await storage.createUser(userData);
      await storage.createUserSettings({ userId: user.id });
      await new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
      req.session.user = publicUser(user) as typeof req.session.user;
      res.status(201).json({ user: publicUser(user) });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: "Invalid registration data" });
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/me", (req, res, next) => {
    if (!req.session.user) return res.json({ user: null });
    void requireAuth(req, res, error => {
      if (error) return next(error);
      res.json({ user: req.authUser });
    });
  });

  app.use("/api", requireAuth);

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(error => {
      if (error) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("opsis.sid");
      res.status(204).send();
    });
  });

  app.get("/api/exams", async (req, res) => {
    try {
      res.json(await storage.getAllActiveExams());
    } catch {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const exam = await storage.getExamWithQuestions(req.params.id);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (!exam.isActive && !canManageExam(req, exam.createdBy)) {
        return res.status(404).json({ message: "Exam not found" });
      }
      const revealAnswers = req.authUser!.role === "admin" || req.authUser!.id === exam.createdBy;
      res.json({ ...exam, questions: exam.questions.map(question => sanitizeQuestion(question, revealAnswers)) });
    } catch {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", requireRole("instructor", "admin"), async (req, res) => {
    try {
      const examData = insertExamSchema.parse({ ...req.body, createdBy: req.authUser!.id });
      res.status(201).json(await storage.createExam(examData));
    } catch (error) {
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid exam data" : "Failed to create exam" });
    }
  });

  app.put("/api/exams/:id", requireRole("instructor", "admin"), async (req, res) => {
    try {
      const existing = await storage.getExam(req.params.id);
      if (!existing) return res.status(404).json({ message: "Exam not found" });
      if (!canManageExam(req, existing.createdBy)) return res.status(403).json({ message: "Forbidden" });
      const { createdBy: _ignored, ...update } = insertExamSchema.partial().parse(req.body);
      res.json(await storage.updateExam(req.params.id, update));
    } catch (error) {
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid exam data" : "Failed to update exam" });
    }
  });

  app.get("/api/exams/:examId/questions", async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.examId);
      if (!exam || (!exam.isActive && !canManageExam(req, exam.createdBy))) {
        return res.status(404).json({ message: "Exam not found" });
      }
      const questions = await storage.getQuestionsByExam(req.params.examId);
      const revealAnswers = req.authUser!.role === "admin" || req.authUser!.id === exam.createdBy;
      res.json(questions.map(question => sanitizeQuestion(question, revealAnswers)));
    } catch {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/exams/:examId/questions", requireRole("instructor", "admin"), async (req, res) => {
    try {
      const exam = await storage.getExam(req.params.examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (!canManageExam(req, exam.createdBy)) return res.status(403).json({ message: "Forbidden" });
      const data = insertQuestionSchema.parse({ ...req.body, examId: req.params.examId });
      res.status(201).json(await storage.createQuestion(data));
    } catch (error) {
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid question data" : "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", requireRole("instructor", "admin"), async (req, res) => {
    try {
      const existing = await storage.getQuestion(req.params.id);
      if (!existing) return res.status(404).json({ message: "Question not found" });
      const exam = await storage.getExam(existing.examId);
      if (!exam || !canManageExam(req, exam.createdBy)) return res.status(403).json({ message: "Forbidden" });
      const { examId: _ignored, ...update } = insertQuestionSchema.partial().parse(req.body);
      res.json(await storage.updateQuestion(req.params.id, update));
    } catch (error) {
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid question data" : "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", requireRole("instructor", "admin"), async (req, res) => {
    const question = await storage.getQuestion(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });
    const exam = await storage.getExam(question.examId);
    if (!exam || !canManageExam(req, exam.createdBy)) return res.status(403).json({ message: "Forbidden" });
    await storage.deleteQuestion(req.params.id);
    res.status(204).send();
  });

  app.get("/api/attempts/user/:userId", async (req, res) => {
    if (req.params.userId !== req.authUser!.id && req.authUser!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(publicAttemptDetails(await storage.getExamAttemptsByUser(req.params.userId)));
  });

  app.get("/api/attempts/instructor/:userId", requireRole("instructor", "admin"), async (req, res) => {
    if (req.authUser!.role !== "admin" && req.params.userId !== req.authUser!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const exams = req.authUser!.role === "admin"
      ? await storage.getAllActiveExams()
      : await storage.getExamsByUser(req.authUser!.id);
    const attempts = await Promise.all(exams.map(exam => storage.getExamAttemptsByExam(exam.id)));
    res.json(publicAttemptDetails(attempts.flat()));
  });

  app.get("/api/attempts/:id", async (req, res) => {
    const attempt = await storage.getExamAttempt(req.params.id);
    if (!attempt) return res.status(404).json({ message: "Exam attempt not found" });
    if (!(await canAccessAttempt(req, attempt))) return res.status(403).json({ message: "Forbidden" });
    res.json(attempt);
  });

  app.post("/api/attempts", async (req, res) => {
    try {
      const exam = await storage.getExam(req.body?.examId);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      if (req.authUser!.role === "student" && !exam.isActive) {
        return res.status(403).json({ message: "This exam is not available" });
      }
      const questions = await storage.getQuestionsByExam(exam.id);
      const data = insertExamAttemptSchema.parse({
        examId: exam.id,
        userId: req.authUser!.id,
        totalQuestions: questions.reduce((total, question) => total + question.points, 0),
        answers: {},
      });
      res.status(201).json(await storage.createExamAttempt(data));
    } catch (error) {
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid attempt data" : "Failed to create attempt" });
    }
  });

  app.put("/api/attempts/:id", async (req, res) => {
    try {
      const existing = await storage.getExamAttempt(req.params.id);
      if (!existing) return res.status(404).json({ message: "Exam attempt not found" });
      if (!(await canAccessAttempt(req, existing))) return res.status(403).json({ message: "Forbidden" });
      if (req.authUser!.role === "student" && existing.completedAt) {
        return res.status(409).json({ message: "This attempt is already complete" });
      }
      const parsed = attemptUpdateSchema.parse(req.body);
      let update: Partial<ExamAttempt>;
      if (req.authUser!.role === "student") {
        const answers = parsed.answers && typeof parsed.answers === "object"
          ? parsed.answers as Record<string, string>
          : existing.answers as Record<string, string>;
        update = { answers };
        if (parsed.completedAt && !existing.completedAt) {
          const grade = await gradeAttempt(existing, answers);
          update = { ...update, ...grade, completedAt: new Date(), timeSpent: parsed.timeSpent };
        }
      } else {
        const { userId: _userId, examId: _examId, ...safeUpdate } = parsed;
        update = safeUpdate;
      }
      res.json(await storage.updateExamAttempt(req.params.id, update));
    } catch (error) {
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid attempt data" : "Failed to update attempt" });
    }
  });

  app.get("/api/settings/:userId", async (req, res) => {
    if (req.params.userId !== req.authUser!.id && req.authUser!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const settings = await storage.getUserSettings(req.params.userId);
    if (!settings) return res.status(404).json({ message: "Settings not found" });
    res.json(settings);
  });

  app.put("/api/settings/:userId", async (req, res) => {
    try {
      if (req.params.userId !== req.authUser!.id && req.authUser!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { userId: _ignored, ...update } = insertUserSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateUserSettings(req.params.userId, update);
      if (!settings) return res.status(404).json({ message: "Settings not found" });
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: error instanceof z.ZodError ? "Invalid settings data" : "Failed to update settings" });
    }
  });

  app.post("/api/code/execute", async (req, res) => {
    try {
      const input = codeRequestSchema.parse(req.body);
      const attempt = await storage.getExamAttempt(input.attemptId);
      if (!attempt) return res.status(404).json({ message: "Exam attempt not found" });
      if (attempt.userId !== req.authUser!.id) return res.status(403).json({ message: "Forbidden" });
      if (attempt.completedAt) return res.status(409).json({ message: "This attempt is already complete" });
      const question = await storage.getQuestion(input.questionId);
      if (!question || question.examId !== attempt.examId || question.type !== "coding") {
        return res.status(400).json({ message: "Question does not belong to this attempt" });
      }
      if (question.language !== input.language) {
        return res.status(400).json({ message: `This question requires ${question.language}` });
      }
      const testCases = Array.isArray(question.testCases) ? question.testCases as TestCase[] : [];
      const result = await executeCode(
        input.code,
        input.language,
        testCases,
        question.timeLimit ?? 3,
        question.memoryLimit ?? 128,
      );
      await storage.createCodeSubmission({
        attemptId: attempt.id,
        questionId: question.id,
        userId: req.authUser!.id,
        code: input.code,
        language: input.language,
        status: result.status,
        testResults: result.testResults,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
      });
      res.json(sanitizeExecutionResult(result));
    } catch (error) {
      const status = error instanceof z.ZodError ? 400 : 422;
      res.status(status).json({
        status: "error",
        output: "",
        error: error instanceof Error ? error.message : "Code execution failed",
        testResults: [],
        executionTime: 0,
        memoryUsed: 0,
        passedTests: 0,
        totalTests: 0,
      });
    }
  });

  app.use("/api/admin", requireRole("admin"));

  app.get("/api/admin/users", async (_req, res) => {
    res.json((await storage.getAllUsers()).map(publicUser));
  });

  app.put("/api/admin/users/:id/role", async (req, res) => {
    try {
      const { role } = roleUpdateSchema.parse(req.body);
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(publicUser(user));
    } catch {
      res.status(400).json({ message: "Invalid role" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (req.params.id === req.authUser!.id) return res.status(400).json({ message: "You cannot delete your own account" });
    if (!(await storage.deleteUser(req.params.id))) return res.status(404).json({ message: "User not found" });
    res.status(204).send();
  });

  app.get("/api/admin/stats", async (_req, res) => {
    const [users, exams] = await Promise.all([storage.getAllUsers(), storage.getAllActiveExams()]);
    res.json({
      totalUsers: users.length,
      students: users.filter(user => user.role === "student").length,
      faculty: users.filter(user => user.role === "instructor").length,
      totalExams: exams.length,
    });
  });

  app.get("/api/admin/questions", async (_req, res) => {
    const exams = await storage.getAllActiveExams();
    const questions = await Promise.all(exams.map(exam => storage.getQuestionsByExam(exam.id)));
    res.json(questions.flat());
  });

  return createServer(app);
}