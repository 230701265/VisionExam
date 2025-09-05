from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    TRUE_FALSE = "true_false"
    CODING = "coding"

class ProgrammingLanguage(str, Enum):
    JAVASCRIPT = "javascript"
    PYTHON = "python"
    JAVA = "java"
    CPP = "cpp"
    C = "c"
    TYPESCRIPT = "typescript"
    GO = "go"
    RUST = "rust"

class CodeExecutionStatus(str, Enum):
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    ERROR = "error"
    TIMEOUT = "timeout"

class ContrastMode(str, Enum):
    NORMAL = "normal"
    HIGH = "high"
    DARK = "dark"

# Base Models
class MultipleChoiceOption(BaseModel):
    id: str
    text: str

class TestCase(BaseModel):
    id: str
    input: str
    expectedOutput: str
    description: Optional[str] = None
    isHidden: Optional[bool] = False

class TestResult(BaseModel):
    testCaseId: str
    passed: bool
    actualOutput: str
    expectedOutput: str
    executionTime: int
    error: Optional[str] = None

class CodeExecutionResult(BaseModel):
    status: CodeExecutionStatus
    output: str
    error: Optional[str] = None
    testResults: List[TestResult]
    executionTime: int
    memoryUsed: int
    passedTests: int
    totalTests: int

# Core Data Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password: str
    role: UserRole = UserRole.STUDENT

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.STUDENT

class UserResponse(BaseModel):
    id: str
    username: str
    role: UserRole

class Exam(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    duration: int  # in minutes
    createdBy: str
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.now)

class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: int
    createdBy: str
    isActive: bool = True

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    examId: str
    type: QuestionType
    text: str
    options: Optional[List[MultipleChoiceOption]] = None
    correctAnswer: Optional[str] = None
    points: int = 1
    order: int
    # Coding question specific fields
    language: Optional[ProgrammingLanguage] = None
    starterCode: Optional[str] = None
    testCases: Optional[List[TestCase]] = None
    timeLimit: Optional[int] = None  # in seconds
    memoryLimit: Optional[int] = None  # in MB

class QuestionCreate(BaseModel):
    examId: str
    type: QuestionType
    text: str
    options: Optional[List[MultipleChoiceOption]] = None
    correctAnswer: Optional[str] = None
    points: int = 1
    order: int
    language: Optional[ProgrammingLanguage] = None
    starterCode: Optional[str] = None
    testCases: Optional[List[TestCase]] = None
    timeLimit: Optional[int] = None
    memoryLimit: Optional[int] = None

class ExamAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    examId: str
    userId: str
    startedAt: datetime = Field(default_factory=datetime.now)
    completedAt: Optional[datetime] = None
    score: Optional[int] = None
    totalQuestions: int
    correctAnswers: Optional[int] = None
    answers: Dict[str, Any] = Field(default_factory=dict)  # questionId -> answer/code mapping
    timeSpent: Optional[int] = None  # in minutes
    codeExecutions: Optional[Dict[str, Any]] = None  # execution history and results

class ExamAttemptCreate(BaseModel):
    examId: str
    userId: str
    totalQuestions: int
    answers: Dict[str, Any] = Field(default_factory=dict)
    codeExecutions: Optional[Dict[str, Any]] = None

class CodeSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    attemptId: str
    questionId: str
    userId: str
    code: str
    language: ProgrammingLanguage
    status: CodeExecutionStatus
    testResults: Optional[List[TestResult]] = None
    executionTime: Optional[int] = None  # in milliseconds
    memoryUsed: Optional[int] = None  # in KB
    submittedAt: datetime = Field(default_factory=datetime.now)

class CodeSubmissionCreate(BaseModel):
    attemptId: str
    questionId: str
    userId: str
    code: str
    language: ProgrammingLanguage
    status: CodeExecutionStatus = CodeExecutionStatus.RUNNING
    testResults: Optional[List[TestResult]] = None
    executionTime: Optional[int] = None
    memoryUsed: Optional[int] = None

class UserSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    fontSize: int = 18
    contrastMode: ContrastMode = ContrastMode.NORMAL
    speechRate: int = 10  # 0.5 to 2.0, stored as 5-20
    speechVolume: int = 80
    audioInstructions: bool = True
    soundEffects: bool = True
    reducedMotion: bool = False

class UserSettingsCreate(BaseModel):
    userId: str
    fontSize: int = 18
    contrastMode: ContrastMode = ContrastMode.NORMAL
    speechRate: int = 10
    speechVolume: int = 80
    audioInstructions: bool = True
    soundEffects: bool = True
    reducedMotion: bool = False

# Complex types for frontend
class ExamWithQuestions(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    duration: int
    createdBy: str
    isActive: bool
    createdAt: datetime
    questions: List[Question]

class ExamAttemptWithDetails(BaseModel):
    id: str
    examId: str
    userId: str
    startedAt: datetime
    completedAt: Optional[datetime] = None
    score: Optional[int] = None
    totalQuestions: int
    correctAnswers: Optional[int] = None
    answers: Dict[str, Any]
    timeSpent: Optional[int] = None
    codeExecutions: Optional[Dict[str, Any]] = None
    exam: Exam
    user: UserResponse

# Auth models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    user: UserResponse

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.STUDENT

class RegisterResponse(BaseModel):
    user: UserResponse