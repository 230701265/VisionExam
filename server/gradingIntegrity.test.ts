import test from "node:test";
import assert from "node:assert/strict";
import { storage } from "./storage";
import { gradeAttempt } from "./routes";

test("automatic grading preserves short-answer points for instructor grading", async () => {
  await storage.ready;
  const instructor = (await storage.getAllUsers()).find(user => user.role === "instructor");
  const student = (await storage.getAllUsers()).find(user => user.role === "student");
  assert.ok(instructor && student);

  const exam = await storage.createExam({
    title: "Grading integrity test",
    description: null,
    duration: 30,
    createdBy: instructor.id,
    isActive: true,
  });
  const objective = await storage.createQuestion({
    examId: exam.id,
    type: "true_false",
    text: "Objective",
    options: null,
    correctAnswer: "true",
    points: 4,
    order: 1,
    language: null,
    starterCode: null,
    testCases: null,
    timeLimit: null,
    memoryLimit: null,
  });
  const written = await storage.createQuestion({
    examId: exam.id,
    type: "short_answer",
    text: "Written",
    options: null,
    correctAnswer: "sample",
    points: 6,
    order: 2,
    language: null,
    starterCode: null,
    testCases: null,
    timeLimit: null,
    memoryLimit: null,
  });
  const attempt = await storage.createExamAttempt({
    examId: exam.id,
    userId: student.id,
    completedAt: null,
    score: null,
    totalQuestions: 10,
    correctAnswers: null,
    answers: {},
    timeSpent: null,
    codeExecutions: null,
    graded: false,
    teacherFeedback: null,
  });

  const grade = await gradeAttempt(attempt, {
    [objective.id]: "true",
    [written.id]: "sample",
  });
  assert.deepEqual(grade, { score: 4, correctAnswers: 1, graded: false });
});