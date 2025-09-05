#!/usr/bin/env python3
"""Simple test script to verify Python backend functionality"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def test_storage():
    """Test the storage functionality"""
    try:
        from storage import storage
        print("✓ Storage imported successfully")
        
        # Test getting exams
        exams = await storage.get_all_active_exams()
        print(f"✓ Found {len(exams)} active exams")
        
        if exams:
            exam = exams[0]
            print(f"✓ Sample exam: {exam.title}")
            
            # Test getting exam with questions
            exam_with_questions = await storage.get_exam_with_questions(exam.id)
            if exam_with_questions:
                print(f"✓ Exam has {len(exam_with_questions.questions)} questions")
        
        return True
    except Exception as e:
        print(f"✗ Storage test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_models():
    """Test the model functionality"""
    try:
        from models import User, UserRole, Exam, Question, QuestionType
        print("✓ Models imported successfully")
        
        # Test creating a user
        user = User(username="test", password="test", role=UserRole.STUDENT)
        print(f"✓ Created user: {user.username}")
        
        return True
    except Exception as e:
        print(f"✗ Models test failed: {e}")
        return False

def test_fastapi():
    """Test FastAPI app creation"""
    try:
        from main import app
        print("✓ FastAPI app created successfully")
        
        # Check routes
        route_count = len([r for r in app.routes if hasattr(r, 'path')])
        print(f"✓ Found {route_count} routes")
        
        return True
    except Exception as e:
        print(f"✗ FastAPI test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("Testing Python Backend Components")
    print("=" * 40)
    
    # Test models
    if not test_models():
        return False
    
    # Test storage
    if not await test_storage():
        return False
    
    # Test FastAPI
    if not test_fastapi():
        return False
    
    print("=" * 40)
    print("✓ All tests passed! Python backend is working correctly.")
    return True

if __name__ == "__main__":
    asyncio.run(main())