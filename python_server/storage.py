from typing import Dict, List, Optional, Protocol
from models import (
    User, UserCreate, UserResponse,
    Exam, ExamCreate, ExamWithQuestions,
    Question, QuestionCreate,
    ExamAttempt, ExamAttemptCreate, ExamAttemptWithDetails,
    CodeSubmission, CodeSubmissionCreate,
    UserSettings, UserSettingsCreate,
    MultipleChoiceOption, TestCase,
    UserRole, QuestionType, ProgrammingLanguage
)
import uuid
from datetime import datetime

class IStorage(Protocol):
    # User operations
    async def get_user(self, user_id: str) -> Optional[User]: ...
    async def get_user_by_username(self, username: str) -> Optional[User]: ...
    async def create_user(self, user: UserCreate) -> User: ...

    # Exam operations
    async def get_exam(self, exam_id: str) -> Optional[Exam]: ...
    async def get_exam_with_questions(self, exam_id: str) -> Optional[ExamWithQuestions]: ...
    async def get_exams_by_user(self, user_id: str) -> List[Exam]: ...
    async def get_all_active_exams(self) -> List[Exam]: ...
    async def create_exam(self, exam: ExamCreate) -> Exam: ...
    async def update_exam(self, exam_id: str, exam: dict) -> Optional[Exam]: ...

    # Question operations
    async def get_questions_by_exam(self, exam_id: str) -> List[Question]: ...
    async def create_question(self, question: QuestionCreate) -> Question: ...
    async def update_question(self, question_id: str, question: dict) -> Optional[Question]: ...
    async def delete_question(self, question_id: str) -> bool: ...

    # Exam attempt operations
    async def get_exam_attempt(self, attempt_id: str) -> Optional[ExamAttempt]: ...
    async def get_exam_attempts_by_user(self, user_id: str) -> List[ExamAttemptWithDetails]: ...
    async def get_exam_attempts_by_exam(self, exam_id: str) -> List[ExamAttemptWithDetails]: ...
    async def create_exam_attempt(self, attempt: ExamAttemptCreate) -> ExamAttempt: ...
    async def update_exam_attempt(self, attempt_id: str, attempt: dict) -> Optional[ExamAttempt]: ...

    # Code submission operations
    async def create_code_submission(self, submission: CodeSubmissionCreate) -> CodeSubmission: ...
    async def get_code_submissions_by_attempt(self, attempt_id: str) -> List[CodeSubmission]: ...
    async def get_code_submissions_by_question(self, question_id: str) -> List[CodeSubmission]: ...

    # User settings operations
    async def get_user_settings(self, user_id: str) -> Optional[UserSettings]: ...
    async def create_user_settings(self, settings: UserSettingsCreate) -> UserSettings: ...
    async def update_user_settings(self, user_id: str, settings: dict) -> Optional[UserSettings]: ...

class MemoryStorage:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.exams: Dict[str, Exam] = {}
        self.questions: Dict[str, Question] = {}
        self.exam_attempts: Dict[str, ExamAttempt] = {}
        self.user_settings: Dict[str, UserSettings] = {}
        self.code_submissions: Dict[str, CodeSubmission] = {}
        
        # Initialize with sample data
        self._initialize_sample_data()

    def _initialize_sample_data(self):
        # Create sample instructor user
        instructor = User(
            id=str(uuid.uuid4()),
            username="instructor",
            password="password123",
            role=UserRole.INSTRUCTOR
        )
        self.users[instructor.id] = instructor

        # Create sample student user with roll number
        student = User(
            id=str(uuid.uuid4()),
            username="S001",
            password="password123",
            role=UserRole.STUDENT
        )
        self.users[student.id] = student

        # Create sample exams
        math_exam = Exam(
            id=str(uuid.uuid4()),
            title="Mathematics Final Exam",
            description="Comprehensive mathematics exam covering algebra, geometry, and calculus topics.",
            duration=120,
            createdBy=instructor.id,
            isActive=True
        )
        self.exams[math_exam.id] = math_exam

        science_exam = Exam(
            id=str(uuid.uuid4()),
            title="Science Quiz",
            description="Quick assessment covering basic physics, chemistry, and biology concepts.",
            duration=30,
            createdBy=instructor.id,
            isActive=True
        )
        self.exams[science_exam.id] = science_exam

        # Add sample questions to math exam
        math_question1 = Question(
            id=str(uuid.uuid4()),
            examId=math_exam.id,
            type=QuestionType.MULTIPLE_CHOICE,
            text="What is the derivative of x² + 3x + 5?",
            options=[
                MultipleChoiceOption(id="a", text="2x + 3"),
                MultipleChoiceOption(id="b", text="x² + 3x"),
                MultipleChoiceOption(id="c", text="2x + 5"),
                MultipleChoiceOption(id="d", text="3x + 5")
            ],
            correctAnswer="a",
            points=2,
            order=1
        )
        self.questions[math_question1.id] = math_question1

        math_question2 = Question(
            id=str(uuid.uuid4()),
            examId=math_exam.id,
            type=QuestionType.SHORT_ANSWER,
            text="Explain the process of solving a quadratic equation using the quadratic formula.",
            correctAnswer="The quadratic formula is x = (-b ± √(b²-4ac)) / 2a",
            points=5,
            order=2
        )
        self.questions[math_question2.id] = math_question2

        # Add coding question to science exam
        coding_question = Question(
            id=str(uuid.uuid4()),
            examId=science_exam.id,
            type=QuestionType.CODING,
            text="Write a Python function that calculates the factorial of a given number.",
            language=ProgrammingLanguage.PYTHON,
            starterCode="""def factorial(n):
    # Your code here
    pass

# Test your function
print(factorial(5))  # Should output 120""",
            testCases=[
                TestCase(
                    id="test1",
                    input="5",
                    expectedOutput="120",
                    description="Test factorial of 5"
                ),
                TestCase(
                    id="test2",
                    input="0",
                    expectedOutput="1",
                    description="Test factorial of 0"
                ),
                TestCase(
                    id="test3",
                    input="3",
                    expectedOutput="6",
                    description="Test factorial of 3"
                )
            ],
            points=10,
            order=1,
            timeLimit=30,
            memoryLimit=128
        )
        self.questions[coding_question.id] = coding_question

    # User operations
    async def get_user(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)

    async def get_user_by_username(self, username: str) -> Optional[User]:
        for user in self.users.values():
            if user.username == username:
                return user
        return None

    async def create_user(self, user_data: UserCreate) -> User:
        user = User(
            id=str(uuid.uuid4()),
            username=user_data.username,
            password=user_data.password,
            role=user_data.role
        )
        self.users[user.id] = user
        return user

    # Exam operations
    async def get_exam(self, exam_id: str) -> Optional[Exam]:
        return self.exams.get(exam_id)

    async def get_exam_with_questions(self, exam_id: str) -> Optional[ExamWithQuestions]:
        exam = self.exams.get(exam_id)
        if not exam:
            return None
        
        questions = [q for q in self.questions.values() if q.examId == exam_id]
        questions.sort(key=lambda x: x.order)
        
        return ExamWithQuestions(
            id=exam.id,
            title=exam.title,
            description=exam.description,
            duration=exam.duration,
            createdBy=exam.createdBy,
            isActive=exam.isActive,
            createdAt=exam.createdAt,
            questions=questions
        )

    async def get_exams_by_user(self, user_id: str) -> List[Exam]:
        return [exam for exam in self.exams.values() if exam.createdBy == user_id]

    async def get_all_active_exams(self) -> List[Exam]:
        return [exam for exam in self.exams.values() if exam.isActive]

    async def create_exam(self, exam_data: ExamCreate) -> Exam:
        exam = Exam(
            id=str(uuid.uuid4()),
            title=exam_data.title,
            description=exam_data.description,
            duration=exam_data.duration,
            createdBy=exam_data.createdBy,
            isActive=exam_data.isActive
        )
        self.exams[exam.id] = exam
        return exam

    async def update_exam(self, exam_id: str, exam_data: dict) -> Optional[Exam]:
        exam = self.exams.get(exam_id)
        if not exam:
            return None
        
        for key, value in exam_data.items():
            if hasattr(exam, key):
                setattr(exam, key, value)
        
        return exam

    # Question operations
    async def get_questions_by_exam(self, exam_id: str) -> List[Question]:
        questions = [q for q in self.questions.values() if q.examId == exam_id]
        return sorted(questions, key=lambda x: x.order)

    async def create_question(self, question_data: QuestionCreate) -> Question:
        question = Question(
            id=str(uuid.uuid4()),
            examId=question_data.examId,
            type=question_data.type,
            text=question_data.text,
            options=question_data.options,
            correctAnswer=question_data.correctAnswer,
            points=question_data.points,
            order=question_data.order,
            language=question_data.language,
            starterCode=question_data.starterCode,
            testCases=question_data.testCases,
            timeLimit=question_data.timeLimit,
            memoryLimit=question_data.memoryLimit
        )
        self.questions[question.id] = question
        return question

    async def update_question(self, question_id: str, question_data: dict) -> Optional[Question]:
        question = self.questions.get(question_id)
        if not question:
            return None
        
        for key, value in question_data.items():
            if hasattr(question, key):
                setattr(question, key, value)
        
        return question

    async def delete_question(self, question_id: str) -> bool:
        if question_id in self.questions:
            del self.questions[question_id]
            return True
        return False

    # Exam attempt operations
    async def get_exam_attempt(self, attempt_id: str) -> Optional[ExamAttempt]:
        return self.exam_attempts.get(attempt_id)

    async def get_exam_attempts_by_user(self, user_id: str) -> List[ExamAttemptWithDetails]:
        attempts = [attempt for attempt in self.exam_attempts.values() if attempt.userId == user_id]
        result = []
        
        for attempt in attempts:
            exam = self.exams.get(attempt.examId)
            user = self.users.get(attempt.userId)
            if exam and user:
                result.append(ExamAttemptWithDetails(
                    id=attempt.id,
                    examId=attempt.examId,
                    userId=attempt.userId,
                    startedAt=attempt.startedAt,
                    completedAt=attempt.completedAt,
                    score=attempt.score,
                    totalQuestions=attempt.totalQuestions,
                    correctAnswers=attempt.correctAnswers,
                    answers=attempt.answers,
                    timeSpent=attempt.timeSpent,
                    codeExecutions=attempt.codeExecutions,
                    exam=exam,
                    user=UserResponse(id=user.id, username=user.username, role=user.role)
                ))
        
        return result

    async def get_exam_attempts_by_exam(self, exam_id: str) -> List[ExamAttemptWithDetails]:
        attempts = [attempt for attempt in self.exam_attempts.values() if attempt.examId == exam_id]
        result = []
        
        for attempt in attempts:
            exam = self.exams.get(attempt.examId)
            user = self.users.get(attempt.userId)
            if exam and user:
                result.append(ExamAttemptWithDetails(
                    id=attempt.id,
                    examId=attempt.examId,
                    userId=attempt.userId,
                    startedAt=attempt.startedAt,
                    completedAt=attempt.completedAt,
                    score=attempt.score,
                    totalQuestions=attempt.totalQuestions,
                    correctAnswers=attempt.correctAnswers,
                    answers=attempt.answers,
                    timeSpent=attempt.timeSpent,
                    codeExecutions=attempt.codeExecutions,
                    exam=exam,
                    user=UserResponse(id=user.id, username=user.username, role=user.role)
                ))
        
        return result

    async def create_exam_attempt(self, attempt_data: ExamAttemptCreate) -> ExamAttempt:
        attempt = ExamAttempt(
            id=str(uuid.uuid4()),
            examId=attempt_data.examId,
            userId=attempt_data.userId,
            totalQuestions=attempt_data.totalQuestions,
            answers=attempt_data.answers,
            codeExecutions=attempt_data.codeExecutions
        )
        self.exam_attempts[attempt.id] = attempt
        return attempt

    async def update_exam_attempt(self, attempt_id: str, attempt_data: dict) -> Optional[ExamAttempt]:
        attempt = self.exam_attempts.get(attempt_id)
        if not attempt:
            return None
        
        for key, value in attempt_data.items():
            if hasattr(attempt, key):
                setattr(attempt, key, value)
        
        return attempt

    # Code submission operations
    async def create_code_submission(self, submission_data: CodeSubmissionCreate) -> CodeSubmission:
        submission = CodeSubmission(
            id=str(uuid.uuid4()),
            attemptId=submission_data.attemptId,
            questionId=submission_data.questionId,
            userId=submission_data.userId,
            code=submission_data.code,
            language=submission_data.language,
            status=submission_data.status,
            testResults=submission_data.testResults,
            executionTime=submission_data.executionTime,
            memoryUsed=submission_data.memoryUsed
        )
        self.code_submissions[submission.id] = submission
        return submission

    async def get_code_submissions_by_attempt(self, attempt_id: str) -> List[CodeSubmission]:
        return [sub for sub in self.code_submissions.values() if sub.attemptId == attempt_id]

    async def get_code_submissions_by_question(self, question_id: str) -> List[CodeSubmission]:
        return [sub for sub in self.code_submissions.values() if sub.questionId == question_id]

    # User settings operations
    async def get_user_settings(self, user_id: str) -> Optional[UserSettings]:
        for settings in self.user_settings.values():
            if settings.userId == user_id:
                return settings
        return None

    async def create_user_settings(self, settings_data: UserSettingsCreate) -> UserSettings:
        settings = UserSettings(
            id=str(uuid.uuid4()),
            userId=settings_data.userId,
            fontSize=settings_data.fontSize,
            contrastMode=settings_data.contrastMode,
            speechRate=settings_data.speechRate,
            speechVolume=settings_data.speechVolume,
            audioInstructions=settings_data.audioInstructions,
            soundEffects=settings_data.soundEffects,
            reducedMotion=settings_data.reducedMotion
        )
        self.user_settings[settings.id] = settings
        return settings

    async def update_user_settings(self, user_id: str, settings_data: dict) -> Optional[UserSettings]:
        settings = await self.get_user_settings(user_id)
        if not settings:
            return None
        
        for key, value in settings_data.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        return settings

# Global storage instance
storage = MemoryStorage()