import { 
  type User, type InsertUser,
  type Exam, type InsertExam,
  type Question, type InsertQuestion,
  type ExamAttempt, type InsertExamAttempt,
  type UserSettings, type InsertUserSettings,
  type ExamWithQuestions,
  type ExamAttemptWithDetails
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Exam operations
  getExam(id: string): Promise<Exam | undefined>;
  getExamWithQuestions(id: string): Promise<ExamWithQuestions | undefined>;
  getExamsByUser(userId: string): Promise<Exam[]>;
  getAllActiveExams(): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: string, exam: Partial<Exam>): Promise<Exam | undefined>;

  // Question operations
  getQuestionsByExam(examId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;

  // Exam attempt operations
  getExamAttempt(id: string): Promise<ExamAttempt | undefined>;
  getExamAttemptsByUser(userId: string): Promise<ExamAttemptWithDetails[]>;
  getExamAttemptsByExam(examId: string): Promise<ExamAttemptWithDetails[]>;
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  updateExamAttempt(id: string, attempt: Partial<ExamAttempt>): Promise<ExamAttempt | undefined>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private exams: Map<string, Exam>;
  private questions: Map<string, Question>;
  private examAttempts: Map<string, ExamAttempt>;
  private userSettings: Map<string, UserSettings>;

  constructor() {
    this.users = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.examAttempts = new Map();
    this.userSettings = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create sample instructor user
    const instructor = await this.createUser({
      username: "instructor",
      password: "password123",
      role: "instructor"
    });

    // Create sample student user
    const student = await this.createUser({
      username: "student",
      password: "password123",
      role: "student"
    });

    // Create sample exam
    const mathExam = await this.createExam({
      title: "Mathematics Final Exam",
      description: "Comprehensive mathematics exam covering algebra, geometry, and calculus topics.",
      duration: 120,
      createdBy: instructor.id,
      isActive: true
    });

    const scienceExam = await this.createExam({
      title: "Science Quiz",
      description: "Quick assessment covering basic physics, chemistry, and biology concepts.",
      duration: 30,
      createdBy: instructor.id,
      isActive: true
    });

    // Add sample questions to math exam
    await this.createQuestion({
      examId: mathExam.id,
      type: "multiple_choice",
      text: "What is the derivative of x² + 3x + 5?",
      options: [
        { id: "a", text: "2x + 3" },
        { id: "b", text: "x² + 3x" },
        { id: "c", text: "2x + 5" },
        { id: "d", text: "3x + 5" }
      ],
      correctAnswer: "a",
      points: 2,
      order: 1
    });

    await this.createQuestion({
      examId: mathExam.id,
      type: "short_answer",
      text: "Explain the process of solving a quadratic equation using the quadratic formula.",
      correctAnswer: "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a",
      points: 5,
      order: 2
    });

    await this.createQuestion({
      examId: mathExam.id,
      type: "true_false",
      text: "The sum of angles in a triangle is always 180 degrees.",
      correctAnswer: "true",
      points: 1,
      order: 3
    });

    // Create default user settings for student
    await this.createUserSettings({
      userId: student.id,
      fontSize: 18,
      contrastMode: "normal",
      speechRate: 10,
      speechVolume: 80,
      audioInstructions: true,
      soundEffects: true,
      reducedMotion: false
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Exam operations
  async getExam(id: string): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamWithQuestions(id: string): Promise<ExamWithQuestions | undefined> {
    const exam = this.exams.get(id);
    if (!exam) return undefined;

    const questions = await this.getQuestionsByExam(id);
    return { ...exam, questions };
  }

  async getExamsByUser(userId: string): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => exam.createdBy === userId);
  }

  async getAllActiveExams(): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => exam.isActive);
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const id = randomUUID();
    const exam: Exam = { 
      ...insertExam, 
      id,
      createdAt: new Date()
    };
    this.exams.set(id, exam);
    return exam;
  }

  async updateExam(id: string, examUpdate: Partial<Exam>): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    if (!exam) return undefined;

    const updatedExam = { ...exam, ...examUpdate };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  // Question operations
  async getQuestionsByExam(examId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.examId === examId)
      .sort((a, b) => a.order - b.order);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { ...insertQuestion, id };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: string, questionUpdate: Partial<Question>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;

    const updatedQuestion = { ...question, ...questionUpdate };
    this.questions.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    return this.questions.delete(id);
  }

  // Exam attempt operations
  async getExamAttempt(id: string): Promise<ExamAttempt | undefined> {
    return this.examAttempts.get(id);
  }

  async getExamAttemptsByUser(userId: string): Promise<ExamAttemptWithDetails[]> {
    const attempts = Array.from(this.examAttempts.values())
      .filter(attempt => attempt.userId === userId);

    const attemptsWithDetails: ExamAttemptWithDetails[] = [];
    for (const attempt of attempts) {
      const exam = await this.getExam(attempt.examId);
      const user = await this.getUser(attempt.userId);
      if (exam && user) {
        attemptsWithDetails.push({ ...attempt, exam, user });
      }
    }

    return attemptsWithDetails.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async getExamAttemptsByExam(examId: string): Promise<ExamAttemptWithDetails[]> {
    const attempts = Array.from(this.examAttempts.values())
      .filter(attempt => attempt.examId === examId);

    const attemptsWithDetails: ExamAttemptWithDetails[] = [];
    for (const attempt of attempts) {
      const exam = await this.getExam(attempt.examId);
      const user = await this.getUser(attempt.userId);
      if (exam && user) {
        attemptsWithDetails.push({ ...attempt, exam, user });
      }
    }

    return attemptsWithDetails.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async createExamAttempt(insertAttempt: InsertExamAttempt): Promise<ExamAttempt> {
    const id = randomUUID();
    const attempt: ExamAttempt = { 
      ...insertAttempt, 
      id,
      startedAt: new Date()
    };
    this.examAttempts.set(id, attempt);
    return attempt;
  }

  async updateExamAttempt(id: string, attemptUpdate: Partial<ExamAttempt>): Promise<ExamAttempt | undefined> {
    const attempt = this.examAttempts.get(id);
    if (!attempt) return undefined;

    const updatedAttempt = { ...attempt, ...attemptUpdate };
    this.examAttempts.set(id, updatedAttempt);
    return updatedAttempt;
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(settings => settings.userId === userId);
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const id = randomUUID();
    const settings: UserSettings = { ...insertSettings, id };
    this.userSettings.set(id, settings);
    return settings;
  }

  async updateUserSettings(userId: string, settingsUpdate: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const existingSettings = await this.getUserSettings(userId);
    if (!existingSettings) return undefined;

    const updatedSettings = { ...existingSettings, ...settingsUpdate };
    this.userSettings.set(existingSettings.id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();
