import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema,
  insertExamSchema,
  insertQuestionSchema,
  insertExamAttemptSchema,
  insertUserSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      
      // Create default settings for new user
      await storage.createUserSettings({
        userId: user.id,
        fontSize: 18,
        contrastMode: "normal",
        speechRate: 10,
        speechVolume: 80,
        audioInstructions: true,
        soundEffects: true,
        reducedMotion: false
      });

      res.status(201).json({ user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Exam routes
  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getAllActiveExams();
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
    try {
      const exam = await storage.getExamWithQuestions(req.params.id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", async (req, res) => {
    try {
      const examData = insertExamSchema.parse(req.body);
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      res.status(400).json({ message: "Failed to create exam" });
    }
  });

  app.put("/api/exams/:id", async (req, res) => {
    try {
      const examData = req.body;
      const exam = await storage.updateExam(req.params.id, examData);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(400).json({ message: "Failed to update exam" });
    }
  });

  // Question routes
  app.get("/api/exams/:examId/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestionsByExam(req.params.examId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/exams/:examId/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        examId: req.params.examId
      });
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const questionData = req.body;
      const question = await storage.updateQuestion(req.params.id, questionData);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteQuestion(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Exam attempt routes
  app.get("/api/attempts/user/:userId", async (req, res) => {
    try {
      const attempts = await storage.getExamAttemptsByUser(req.params.userId);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam attempts" });
    }
  });

  app.get("/api/attempts/:id", async (req, res) => {
    try {
      const attempt = await storage.getExamAttempt(req.params.id);
      if (!attempt) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }
      res.json(attempt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam attempt" });
    }
  });

  app.post("/api/attempts", async (req, res) => {
    try {
      const attemptData = insertExamAttemptSchema.parse(req.body);
      const attempt = await storage.createExamAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      res.status(400).json({ message: "Failed to create exam attempt" });
    }
  });

  app.put("/api/attempts/:id", async (req, res) => {
    try {
      const attemptData = req.body;
      const attempt = await storage.updateExamAttempt(req.params.id, attemptData);
      if (!attempt) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }
      res.json(attempt);
    } catch (error) {
      res.status(400).json({ message: "Failed to update exam attempt" });
    }
  });

  // User settings routes
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const settings = await storage.getUserSettings(req.params.userId);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/:userId", async (req, res) => {
    try {
      const settingsData = req.body;
      const settings = await storage.updateUserSettings(req.params.userId, settingsData);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update settings" });
    }
  });

  // Code execution routes
  app.post("/api/code/execute", async (req, res) => {
    try {
      const { questionId, code, language, attemptId, testCases } = req.body;
      
      if (!questionId || !code || !language) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Simulate code execution with mock results
      const executionResult = await simulateCodeExecution(code, language, testCases);
      
      // Store submission if attemptId is provided
      if (attemptId) {
        await storage.createCodeSubmission({
          attemptId,
          questionId,
          userId: "current-user", // In real app, this would come from session
          code,
          language,
          status: executionResult.status,
          testResults: executionResult.testResults,
          executionTime: executionResult.executionTime,
          memoryUsed: executionResult.memoryUsed
        });
      }

      res.json(executionResult);
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        output: '',
        error: error instanceof Error ? error.message : 'Code execution failed',
        testResults: [],
        executionTime: 0,
        memoryUsed: 0,
        passedTests: 0,
        totalTests: 0
      });
    }
  });

  // ── Admin routes ────────────────────────────────────────────
  app.get("/api/admin/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id/role", async (req, res) => {
    try {
      const { role } = req.body;
      if (!['student', 'instructor', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const ok = await storage.deleteUser(req.params.id);
      if (!ok) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted" });
    } catch {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/stats", async (_req, res) => {
    try {
      const [users, exams] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllActiveExams(),
      ]);
      const students  = users.filter(u => u.role === 'student').length;
      const faculty   = users.filter(u => u.role === 'instructor').length;
      res.json({ totalUsers: users.length, students, faculty, totalExams: exams.length });
    } catch {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/questions", async (_req, res) => {
    try {
      const exams = await storage.getAllActiveExams();
      const questionPromises = exams.map(e => storage.getQuestionsByExam(e.id));
      const nested = await Promise.all(questionPromises);
      const questions = nested.flat();
      res.json(questions);
    } catch {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Mock code execution function
async function simulateCodeExecution(code: string, language: string, testCases: any[]): Promise<any> {
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const executionTime = Math.floor(Math.random() * 500) + 50;
  const memoryUsed = Math.floor(Math.random() * 1000) + 100;
  
  // Simple heuristic to determine if code looks correct
  const isLikelyCorrect = (code: string, language: string): boolean => {
    if (language === 'javascript') {
      return code.includes('function') && 
             (code.includes('return') || code.includes('console.log')) &&
             code.length > 50;
    } else if (language === 'python') {
      return code.includes('def') && 
             (code.includes('return') || code.includes('print')) &&
             code.length > 40;
    }
    return code.length > 30;
  };
  
  const codeQuality = isLikelyCorrect(code, language);
  const passRate = codeQuality ? 0.8 : 0.3; // 80% pass rate for good code, 30% for poor code
  
  const testResults = testCases.map((testCase: any, index: number) => {
    const passed = Math.random() < passRate;
    return {
      testCaseId: testCase.id,
      passed,
      actualOutput: passed ? testCase.expectedOutput : "Wrong output",
      expectedOutput: testCase.expectedOutput,
      executionTime: Math.floor(Math.random() * 100) + 10,
      error: passed ? undefined : "Test case failed"
    };
  });
  
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const allPassed = passedTests === totalTests;
  
  return {
    status: allPassed ? 'passed' : (passedTests > 0 ? 'failed' : 'failed'),
    output: allPassed ? "All tests passed!" : `${passedTests}/${totalTests} tests passed`,
    testResults,
    executionTime,
    memoryUsed,
    passedTests,
    totalTests
  };
}
