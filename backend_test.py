#!/usr/bin/env python3
"""
Backend Authentication Testing Suite
Tests the complete authentication functionality for the messenger app
"""

import requests
import json
import os
import sys
from datetime import datetime
import uuid

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        return "http://localhost:8001"
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

print(f"Testing backend at: {API_URL}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def add_pass(self, test_name):
        self.passed += 1
        print(f"✅ PASS: {test_name}")
        
    def add_fail(self, test_name, error):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ FAIL: {test_name} - {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

def test_user_registration_success():
    """Test successful user registration"""
    test_name = "User Registration - Success"
    
    # Generate unique test data
    timestamp = str(int(datetime.now().timestamp()))
    test_data = {
        "username": f"testuser_{timestamp}",
        "email": f"test_{timestamp}@example.com",
        "password": "SecurePassword123!"
    }
    
    try:
        response = requests.post(f"{API_URL}/register", json=test_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if all(key in data for key in ["user_id", "username", "email"]):
                if data["username"] == test_data["username"] and data["email"] == test_data["email"]:
                    results.add_pass(test_name)
                    return data  # Return user data for further tests
                else:
                    results.add_fail(test_name, "Response data doesn't match input")
            else:
                results.add_fail(test_name, f"Missing required fields in response: {data}")
        else:
            results.add_fail(test_name, f"HTTP {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        results.add_fail(test_name, f"Request failed: {str(e)}")
    except Exception as e:
        results.add_fail(test_name, f"Unexpected error: {str(e)}")
    
    return None

def test_user_registration_duplicate_email():
    """Test registration with duplicate email"""
    test_name = "User Registration - Duplicate Email"
    
    # First, create a user
    timestamp = str(int(datetime.now().timestamp()))
    original_data = {
        "username": f"original_{timestamp}",
        "email": f"duplicate_{timestamp}@example.com",
        "password": "Password123!"
    }
    
    try:
        # Create first user
        response1 = requests.post(f"{API_URL}/register", json=original_data, timeout=10)
        
        if response1.status_code != 200:
            results.add_fail(test_name, f"Failed to create original user: {response1.text}")
            return
            
        # Try to create second user with same email
        duplicate_data = {
            "username": f"different_{timestamp}",
            "email": original_data["email"],  # Same email
            "password": "DifferentPassword123!"
        }
        
        response2 = requests.post(f"{API_URL}/register", json=duplicate_data, timeout=10)
        
        if response2.status_code == 400:
            error_data = response2.json()
            if "Email уже используется" in error_data.get("detail", ""):
                results.add_pass(test_name)
            else:
                results.add_fail(test_name, f"Wrong error message: {error_data}")
        else:
            results.add_fail(test_name, f"Expected 400 error, got {response2.status_code}: {response2.text}")
            
    except Exception as e:
        results.add_fail(test_name, f"Error: {str(e)}")

def test_user_registration_duplicate_username():
    """Test registration with duplicate username"""
    test_name = "User Registration - Duplicate Username"
    
    timestamp = str(int(datetime.now().timestamp()))
    original_data = {
        "username": f"uniqueuser_{timestamp}",
        "email": f"original_{timestamp}@example.com",
        "password": "Password123!"
    }
    
    try:
        # Create first user
        response1 = requests.post(f"{API_URL}/register", json=original_data, timeout=10)
        
        if response1.status_code != 200:
            results.add_fail(test_name, f"Failed to create original user: {response1.text}")
            return
            
        # Try to create second user with same username
        duplicate_data = {
            "username": original_data["username"],  # Same username
            "email": f"different_{timestamp}@example.com",
            "password": "DifferentPassword123!"
        }
        
        response2 = requests.post(f"{API_URL}/register", json=duplicate_data, timeout=10)
        
        if response2.status_code == 400:
            error_data = response2.json()
            if "Имя пользователя уже занято" in error_data.get("detail", ""):
                results.add_pass(test_name)
            else:
                results.add_fail(test_name, f"Wrong error message: {error_data}")
        else:
            results.add_fail(test_name, f"Expected 400 error, got {response2.status_code}: {response2.text}")
            
    except Exception as e:
        results.add_fail(test_name, f"Error: {str(e)}")

def test_user_login_success():
    """Test successful user login"""
    test_name = "User Login - Success"
    
    # First register a user
    timestamp = str(int(datetime.now().timestamp()))
    user_data = {
        "username": f"loginuser_{timestamp}",
        "email": f"login_{timestamp}@example.com",
        "password": "LoginPassword123!"
    }
    
    try:
        # Register user
        reg_response = requests.post(f"{API_URL}/register", json=user_data, timeout=10)
        if reg_response.status_code != 200:
            results.add_fail(test_name, f"Failed to register user for login test: {reg_response.text}")
            return
            
        # Now try to login
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        login_response = requests.post(f"{API_URL}/login", json=login_data, timeout=10)
        
        if login_response.status_code == 200:
            data = login_response.json()
            if all(key in data for key in ["user_id", "username", "email"]):
                if data["username"] == user_data["username"] and data["email"] == user_data["email"]:
                    results.add_pass(test_name)
                else:
                    results.add_fail(test_name, "Login response data doesn't match registered user")
            else:
                results.add_fail(test_name, f"Missing required fields in login response: {data}")
        else:
            results.add_fail(test_name, f"Login failed with HTTP {login_response.status_code}: {login_response.text}")
            
    except Exception as e:
        results.add_fail(test_name, f"Error: {str(e)}")

def test_user_login_wrong_password():
    """Test login with wrong password"""
    test_name = "User Login - Wrong Password"
    
    # First register a user
    timestamp = str(int(datetime.now().timestamp()))
    user_data = {
        "username": f"wrongpwuser_{timestamp}",
        "email": f"wrongpw_{timestamp}@example.com",
        "password": "CorrectPassword123!"
    }
    
    try:
        # Register user
        reg_response = requests.post(f"{API_URL}/register", json=user_data, timeout=10)
        if reg_response.status_code != 200:
            results.add_fail(test_name, f"Failed to register user: {reg_response.text}")
            return
            
        # Try to login with wrong password
        login_data = {
            "email": user_data["email"],
            "password": "WrongPassword123!"
        }
        
        login_response = requests.post(f"{API_URL}/login", json=login_data, timeout=10)
        
        if login_response.status_code == 401:
            error_data = login_response.json()
            if "Неверный email или пароль" in error_data.get("detail", ""):
                results.add_pass(test_name)
            else:
                results.add_fail(test_name, f"Wrong error message: {error_data}")
        else:
            results.add_fail(test_name, f"Expected 401 error, got {login_response.status_code}: {login_response.text}")
            
    except Exception as e:
        results.add_fail(test_name, f"Error: {str(e)}")

def test_user_login_nonexistent_email():
    """Test login with non-existent email"""
    test_name = "User Login - Non-existent Email"
    
    login_data = {
        "email": f"nonexistent_{int(datetime.now().timestamp())}@example.com",
        "password": "SomePassword123!"
    }
    
    try:
        login_response = requests.post(f"{API_URL}/login", json=login_data, timeout=10)
        
        if login_response.status_code == 401:
            error_data = login_response.json()
            if "Неверный email или пароль" in error_data.get("detail", ""):
                results.add_pass(test_name)
            else:
                results.add_fail(test_name, f"Wrong error message: {error_data}")
        else:
            results.add_fail(test_name, f"Expected 401 error, got {login_response.status_code}: {login_response.text}")
            
    except Exception as e:
        results.add_fail(test_name, f"Error: {str(e)}")

def test_field_validation():
    """Test field validation for registration"""
    test_name = "Field Validation"
    
    test_cases = [
        # Missing username
        {
            "data": {"email": "test@example.com", "password": "Password123!"},
            "description": "missing username"
        },
        # Missing email
        {
            "data": {"username": "testuser", "password": "Password123!"},
            "description": "missing email"
        },
        # Missing password
        {
            "data": {"username": "testuser", "email": "test@example.com"},
            "description": "missing password"
        },
        # Empty fields
        {
            "data": {"username": "", "email": "", "password": ""},
            "description": "empty fields"
        }
    ]
    
    validation_passed = 0
    validation_total = len(test_cases)
    
    try:
        for case in test_cases:
            response = requests.post(f"{API_URL}/register", json=case["data"], timeout=10)
            
            # Should return 422 (validation error) or 400 (bad request)
            if response.status_code in [400, 422]:
                validation_passed += 1
            else:
                print(f"  - Validation failed for {case['description']}: got {response.status_code}")
        
        if validation_passed == validation_total:
            results.add_pass(test_name)
        else:
            results.add_fail(test_name, f"Only {validation_passed}/{validation_total} validation tests passed")
            
    except Exception as e:
        results.add_fail(test_name, f"Error: {str(e)}")

def test_database_connectivity():
    """Test if backend is accessible and database is working"""
    test_name = "Database Connectivity"
    
    try:
        # Try a simple registration to test database connectivity
        timestamp = str(int(datetime.now().timestamp()))
        test_data = {
            "username": f"dbtest_{timestamp}",
            "email": f"dbtest_{timestamp}@example.com",
            "password": "DbTest123!"
        }
        
        response = requests.post(f"{API_URL}/register", json=test_data, timeout=10)
        
        if response.status_code == 200:
            results.add_pass(test_name)
        else:
            results.add_fail(test_name, f"Database connectivity issue: {response.status_code} - {response.text}")
            
    except requests.exceptions.ConnectionError:
        results.add_fail(test_name, "Cannot connect to backend server")
    except Exception as e:
        results.add_fail(test_name, f"Error: {str(e)}")

def main():
    """Run all authentication tests"""
    global results
    results = TestResults()
    
    print("🚀 Starting Backend Authentication Tests")
    print(f"Backend URL: {API_URL}")
    print("="*60)
    
    # Run all tests
    test_database_connectivity()
    test_user_registration_success()
    test_user_registration_duplicate_email()
    test_user_registration_duplicate_username()
    test_user_login_success()
    test_user_login_wrong_password()
    test_user_login_nonexistent_email()
    test_field_validation()
    
    # Print summary
    success = results.summary()
    
    if success:
        print("\n🎉 All authentication tests passed!")
        sys.exit(0)
    else:
        print(f"\n💥 {results.failed} test(s) failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()