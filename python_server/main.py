from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import time
import json
from typing import List, Optional
import os

from models import (
    User, UserCreate, UserResponse,
    Exam, ExamCreate, ExamWithQuestions,
    Question, QuestionCreate,
    ExamAttempt, ExamAttemptCreate, ExamAttemptWithDetails,
    CodeSubmission, CodeSubmissionCreate,
    UserSettings, UserSettingsCreate,
    LoginRequest, LoginResponse,
    RegisterRequest, RegisterResponse,
    CodeExecutionResult, TestResult, CodeExecutionStatus
)
from storage import storage

app = FastAPI(title="OPSIS Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    if request.url.path.startswith("/api"):
        log_line = f"{request.method} {request.url.path} {response.status_code} in {process_time*1000:.0f}ms"
        print(log_line)
    
    return response

# Auth Routes
@app.post("/api/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    try:
        user = await storage.get_user_by_username(login_data.username)
        if not user or user.password != login_data.password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return LoginResponse(
            user=UserResponse(id=user.id, username=user.username, role=user.role)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.post("/api/auth/register", response_model=RegisterResponse)
async def register(register_data: RegisterRequest):
    try:
        existing_user = await storage.get_user_by_username(register_data.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
        
        user = await storage.create_user(UserCreate(
            username=register_data.username,
            password=register_data.password,
            role=register_data.role
        ))
        
        # Create default settings for new user
        from models import ContrastMode
        await storage.create_user_settings(UserSettingsCreate(
            userId=user.id,
            fontSize=18,
            contrastMode=ContrastMode.NORMAL,
            speechRate=10,
            speechVolume=80,
            audioInstructions=True,
            soundEffects=True,
            reducedMotion=False
        ))
        
        return RegisterResponse(
            user=UserResponse(id=user.id, username=user.username, role=user.role)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=400, detail="Registration failed")

# Exam Routes
@app.get("/api/exams", response_model=List[Exam])
async def get_exams():
    try:
        exams = await storage.get_all_active_exams()
        return exams
    except Exception as e:
        print(f"Get exams error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exams")

@app.get("/api/exams/{exam_id}", response_model=ExamWithQuestions)
async def get_exam(exam_id: str):
    try:
        exam = await storage.get_exam_with_questions(exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        return exam
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get exam error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exam")

@app.post("/api/exams", response_model=Exam)
async def create_exam(exam_data: ExamCreate):
    try:
        exam = await storage.create_exam(exam_data)
        return exam
    except Exception as e:
        print(f"Create exam error: {e}")
        raise HTTPException(status_code=400, detail="Failed to create exam")

@app.put("/api/exams/{exam_id}", response_model=Exam)
async def update_exam(exam_id: str, exam_data: dict):
    try:
        exam = await storage.update_exam(exam_id, exam_data)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        return exam
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update exam error: {e}")
        raise HTTPException(status_code=400, detail="Failed to update exam")

# Question Routes
@app.get("/api/exams/{exam_id}/questions", response_model=List[Question])
async def get_questions(exam_id: str):
    try:
        questions = await storage.get_questions_by_exam(exam_id)
        return questions
    except Exception as e:
        print(f"Get questions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch questions")

@app.post("/api/exams/{exam_id}/questions", response_model=Question)
async def create_question(exam_id: str, question_data: dict):
    try:
        question_data["examId"] = exam_id
        question = QuestionCreate(**question_data)
        created_question = await storage.create_question(question)
        return created_question
    except Exception as e:
        print(f"Create question error: {e}")
        raise HTTPException(status_code=400, detail="Failed to create question")

@app.put("/api/questions/{question_id}", response_model=Question)
async def update_question(question_id: str, question_data: dict):
    try:
        question = await storage.update_question(question_id, question_data)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        return question
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update question error: {e}")
        raise HTTPException(status_code=400, detail="Failed to update question")

@app.delete("/api/questions/{question_id}")
async def delete_question(question_id: str):
    try:
        success = await storage.delete_question(question_id)
        if not success:
            raise HTTPException(status_code=404, detail="Question not found")
        return {"message": "Question deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete question error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete question")

# Exam Attempt Routes
@app.get("/api/attempts/user/{user_id}", response_model=List[ExamAttemptWithDetails])
async def get_user_attempts(user_id: str):
    try:
        attempts = await storage.get_exam_attempts_by_user(user_id)
        return attempts
    except Exception as e:
        print(f"Get user attempts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attempts")

@app.get("/api/attempts/exam/{exam_id}", response_model=List[ExamAttemptWithDetails])
async def get_exam_attempts(exam_id: str):
    try:
        attempts = await storage.get_exam_attempts_by_exam(exam_id)
        return attempts
    except Exception as e:
        print(f"Get exam attempts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attempts")

@app.get("/api/attempts/{attempt_id}", response_model=ExamAttempt)
async def get_attempt(attempt_id: str):
    try:
        attempt = await storage.get_exam_attempt(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        return attempt
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get attempt error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch attempt")

@app.post("/api/attempts", response_model=ExamAttempt)
async def create_attempt(attempt_data: ExamAttemptCreate):
    try:
        attempt = await storage.create_exam_attempt(attempt_data)
        return attempt
    except Exception as e:
        print(f"Create attempt error: {e}")
        raise HTTPException(status_code=400, detail="Failed to create attempt")

@app.put("/api/attempts/{attempt_id}", response_model=ExamAttempt)
async def update_attempt(attempt_id: str, attempt_data: dict):
    try:
        attempt = await storage.update_exam_attempt(attempt_id, attempt_data)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        return attempt
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update attempt error: {e}")
        raise HTTPException(status_code=400, detail="Failed to update attempt")

# Code Submission Routes
@app.post("/api/code/submit", response_model=CodeSubmission)
async def submit_code(submission_data: CodeSubmissionCreate):
    try:
        submission = await storage.create_code_submission(submission_data)
        return submission
    except Exception as e:
        print(f"Submit code error: {e}")
        raise HTTPException(status_code=400, detail="Failed to submit code")

@app.get("/api/code/submissions/attempt/{attempt_id}", response_model=List[CodeSubmission])
async def get_attempt_submissions(attempt_id: str):
    try:
        submissions = await storage.get_code_submissions_by_attempt(attempt_id)
        return submissions
    except Exception as e:
        print(f"Get attempt submissions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch submissions")

@app.get("/api/code/submissions/question/{question_id}", response_model=List[CodeSubmission])
async def get_question_submissions(question_id: str):
    try:
        submissions = await storage.get_code_submissions_by_question(question_id)
        return submissions
    except Exception as e:
        print(f"Get question submissions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch submissions")

# Mock code execution endpoint
@app.post("/api/code/execute", response_model=CodeExecutionResult)
async def execute_code(request_data: dict):
    """Mock code execution for demonstration purposes"""
    try:
        code = request_data.get("code", "")
        language = request_data.get("language", "python")
        test_cases = request_data.get("testCases", [])
        
        # Mock execution - always return success for demo
        test_results = []
        for i, test_case in enumerate(test_cases):
            test_results.append(TestResult(
                testCaseId=test_case.get("id", f"test_{i}"),
                passed=True,
                actualOutput=test_case.get("expectedOutput", ""),
                expectedOutput=test_case.get("expectedOutput", ""),
                executionTime=50
            ))
        
        return CodeExecutionResult(
            status=CodeExecutionStatus.PASSED,
            output="Code executed successfully",
            testResults=test_results,
            executionTime=100,
            memoryUsed=1024,
            passedTests=len(test_results),
            totalTests=len(test_results)
        )
    except Exception as e:
        print(f"Execute code error: {e}")
        return CodeExecutionResult(
            status=CodeExecutionStatus.ERROR,
            output="",
            error=str(e),
            testResults=[],
            executionTime=0,
            memoryUsed=0,
            passedTests=0,
            totalTests=len(request_data.get("testCases", []))
        )

# User Settings Routes
@app.get("/api/settings/{user_id}", response_model=UserSettings)
async def get_user_settings(user_id: str):
    try:
        settings = await storage.get_user_settings(user_id)
        if not settings:
            # Create default settings if none exist
            settings = await storage.create_user_settings(UserSettingsCreate(userId=user_id))
        return settings
    except Exception as e:
        print(f"Get user settings error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

@app.put("/api/settings/{user_id}", response_model=UserSettings)
async def update_user_settings(user_id: str, settings_data: dict):
    try:
        settings = await storage.update_user_settings(user_id, settings_data)
        if not settings:
            # Create new settings if none exist
            settings_data["userId"] = user_id
            settings = await storage.create_user_settings(UserSettingsCreate(**settings_data))
        return settings
    except Exception as e:
        print(f"Update user settings error: {e}")
        raise HTTPException(status_code=400, detail="Failed to update settings")

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "OPSIS Python Backend is running"}

# Serve React frontend in production
if os.getenv("NODE_ENV") != "development" and os.path.exists("dist"):
    # Mount static files if they exist
    if os.path.exists("dist/assets"):
        app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve index.html for all routes (SPA)
        if os.path.exists("dist/index.html"):
            return FileResponse("dist/index.html")
        return {"message": "Frontend not built yet"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )