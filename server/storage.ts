import { 
  type User, type InsertUser,
  type Exam, type InsertExam,
  type Question, type InsertQuestion,
  type ExamAttempt, type InsertExamAttempt,
  type UserSettings, type InsertUserSettings,
  type CodeSubmission, type InsertCodeSubmission,
  type ExamWithQuestions,
  type ExamAttemptWithDetails
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

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

  // Code submission operations
  createCodeSubmission(submission: InsertCodeSubmission): Promise<CodeSubmission>;
  getCodeSubmissionsByAttempt(attemptId: string): Promise<CodeSubmission[]>;
  getCodeSubmissionsByQuestion(questionId: string): Promise<CodeSubmission[]>;

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
  public codeSubmissions: Map<string, CodeSubmission>;

  constructor() {
    this.users = new Map();
    this.exams = new Map();
    this.questions = new Map();
    this.examAttempts = new Map();
    this.userSettings = new Map();
    this.codeSubmissions = new Map();
    
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

    // Create sample student user with roll number
    const student = await this.createUser({
      username: "S001",
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

    // Create a programming exam
    const programmingExam = await this.createExam({
      title: "Programming Fundamentals",
      description: "Test your coding skills with JavaScript, Python, and problem-solving challenges.",
      duration: 90,
      createdBy: instructor.id,
      isActive: true
    });

    // Add coding questions
    await this.createQuestion({
      examId: programmingExam.id,
      type: "coding",
      text: "Write a function that calculates the factorial of a given number n.\n\nExample:\n- factorial(5) should return 120\n- factorial(0) should return 1\n- factorial(3) should return 6",
      language: "javascript",
      starterCode: `// Write your factorial function here
function factorial(n) {
    // Your code here
}

// Example usage:
console.log(factorial(5)); // Should output 120`,
      testCases: [
        {
          id: "test1",
          input: "5",
          expectedOutput: "120",
          description: "Basic factorial test"
        },
        {
          id: "test2", 
          input: "0",
          expectedOutput: "1",
          description: "Edge case: factorial of 0"
        },
        {
          id: "test3",
          input: "3", 
          expectedOutput: "6",
          description: "Small number test"
        },
        {
          id: "test4",
          input: "1",
          expectedOutput: "1",
          description: "Edge case: factorial of 1",
          isHidden: true
        }
      ],
      points: 10,
      order: 1,
      timeLimit: 5,
      memoryLimit: 128
    });

    await this.createQuestion({
      examId: programmingExam.id,
      type: "coding",
      text: "Write a Python function that finds the maximum number in a list.\n\nExample:\n- find_max([1, 3, 2, 8, 5]) should return 8\n- find_max([-1, -5, -2]) should return -1\n- find_max([42]) should return 42",
      language: "python",
      starterCode: `# Write your find_max function here
def find_max(numbers):
    # Your code here
    pass

# Example usage:
print(find_max([1, 3, 2, 8, 5]))  # Should output 8`,
      testCases: [
        {
          id: "test1",
          input: "[1, 3, 2, 8, 5]",
          expectedOutput: "8",
          description: "Basic maximum finding"
        },
        {
          id: "test2",
          input: "[-1, -5, -2]", 
          expectedOutput: "-1",
          description: "All negative numbers"
        },
        {
          id: "test3",
          input: "[42]",
          expectedOutput: "42",
          description: "Single element"
        }
      ],
      points: 8,
      order: 2,
      timeLimit: 3,
      memoryLimit: 64
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
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'student'
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, role };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
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
      createdAt: new Date(),
      description: insertExam.description || null,
      isActive: insertExam.isActive ?? true
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
    const question: Question = { 
      ...insertQuestion, 
      id,
      options: insertQuestion.options || null,
      correctAnswer: insertQuestion.correctAnswer || null,
      points: insertQuestion.points || 1,
      language: insertQuestion.language || null,
      starterCode: insertQuestion.starterCode || null,
      testCases: insertQuestion.testCases || null,
      timeLimit: insertQuestion.timeLimit || null,
      memoryLimit: insertQuestion.memoryLimit || null
    };
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
      startedAt: new Date(),
      completedAt: insertAttempt.completedAt || null,
      score: insertAttempt.score || null,
      correctAnswers: insertAttempt.correctAnswers || null,
      timeSpent: insertAttempt.timeSpent || null,
      codeExecutions: insertAttempt.codeExecutions || null
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

  // Code submission operations
  async createCodeSubmission(insertSubmission: InsertCodeSubmission): Promise<CodeSubmission> {
    const id = randomUUID();
    const submission: CodeSubmission = { 
      ...insertSubmission, 
      id,
      submittedAt: new Date(),
      testResults: insertSubmission.testResults || null,
      executionTime: insertSubmission.executionTime || null,
      memoryUsed: insertSubmission.memoryUsed || null
    };
    // codeSubmissions map should already be initialized in constructor
    this.codeSubmissions.set(id, submission);
    return submission;
  }

  async getCodeSubmissionsByAttempt(attemptId: string): Promise<CodeSubmission[]> {
    if (!this.codeSubmissions) return [];
    return Array.from(this.codeSubmissions.values())
      .filter(submission => submission.attemptId === attemptId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  async getCodeSubmissionsByQuestion(questionId: string): Promise<CodeSubmission[]> {
    if (!this.codeSubmissions) return [];
    return Array.from(this.codeSubmissions.values())
      .filter(submission => submission.questionId === questionId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(settings => settings.userId === userId);
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const id = randomUUID();
    const settings: UserSettings = { 
      ...insertSettings, 
      id,
      fontSize: insertSettings.fontSize || 18,
      contrastMode: insertSettings.contrastMode || 'normal',
      speechRate: insertSettings.speechRate || 10,
      speechVolume: insertSettings.speechVolume || 80,
      audioInstructions: insertSettings.audioInstructions ?? true,
      soundEffects: insertSettings.soundEffects ?? true,
      reducedMotion: insertSettings.reducedMotion ?? false
    };
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
