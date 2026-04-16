"""Backend API tests for SULTAN app - Auth, Gold, AI Chat endpoints"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL').rstrip('/')

class TestHealthCheck:
    """Health check endpoint"""
    
    def test_root_endpoint(self, api_client):
        """Test root API endpoint returns status"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        assert "SULTAN" in data["message"]
        print("✓ Root endpoint working")

class TestAuthEndpoints:
    """Authentication endpoints - register, login, me, google session"""
    
    def test_register_new_user(self, api_client):
        """Test user registration with new email"""
        timestamp = int(time.time())
        test_email = f"test.sultan.{timestamp}@test.com"
        
        response = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "fullName": "Test Sultan User",
                "email": test_email,
                "password": "TestPass123"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Token missing in response"
        assert "authId" in data, "authId missing in response"
        assert data["email"] == test_email, f"Email mismatch: {data['email']} != {test_email}"
        assert data["fullName"] == "Test Sultan User", f"Name mismatch: {data['fullName']}"
        print(f"✓ User registration successful: {test_email}")
    
    def test_register_duplicate_email(self, api_client):
        """Test registration with existing email returns 400"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "fullName": "Duplicate User",
                "email": "test@sultan.app",
                "password": "TestPass123"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        data = response.json()
        assert "already registered" in data["detail"].lower(), f"Unexpected error message: {data['detail']}"
        print("✓ Duplicate email validation working")
    
    def test_login_success(self, api_client):
        """Test login with correct credentials"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test@sultan.app",
                "password": "Test123456"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data, "Token missing in response"
        assert "authId" in data, "authId missing"
        assert data["email"] == "test@sultan.app", f"Email mismatch: {data['email']}"
        print("✓ Login successful")
    
    def test_login_wrong_password(self, api_client):
        """Test login with wrong password returns 401"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test@sultan.app",
                "password": "WrongPassword123"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "invalid" in data["detail"].lower(), f"Unexpected error: {data['detail']}"
        print("✓ Wrong password validation working")
    
    def test_login_nonexistent_user(self, api_client):
        """Test login with non-existent email returns 401"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@sultan.app",
                "password": "Test123456"
            }
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Non-existent user validation working")
    
    def test_get_me_with_token(self, api_client, test_user_token):
        """Test /api/auth/me with valid token"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "auth_id" in data, "auth_id missing"
        assert "email" in data, "email missing"
        assert "full_name" in data, "full_name missing"
        assert data["email"] == "test@sultan.app", f"Email mismatch: {data['email']}"
        print(f"✓ /api/auth/me working: {data['full_name']}")
    
    def test_get_me_without_token(self, api_client):
        """Test /api/auth/me without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Auth protection working")

class TestGoldPricesEndpoint:
    """Gold prices endpoint"""
    
    def test_get_gold_prices(self, api_client):
        """Test /api/gold/prices returns gold data"""
        response = api_client.get(f"{BASE_URL}/api/gold/prices")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "prices" in data, "prices field missing"
        assert isinstance(data["prices"], list), "prices should be a list"
        assert len(data["prices"]) > 0, "prices list is empty"
        
        # Check structure of first price
        price = data["prices"][0]
        assert "karat" in price, "karat field missing"
        assert "pricePerGramEGP" in price, "pricePerGramEGP field missing"
        assert "change24h" in price, "change24h field missing"
        
        # Check for 21k gold specifically
        gold_21k = next((p for p in data["prices"] if p["karat"] == 21), None)
        assert gold_21k is not None, "21k gold price not found"
        assert gold_21k["pricePerGramEGP"] > 0, "21k gold price should be positive"
        
        print(f"✓ Gold prices endpoint working: 21k = EGP {gold_21k['pricePerGramEGP']}")

class TestCurrencyRatesEndpoint:
    """Currency rates endpoint"""
    
    def test_get_currency_rates(self, api_client):
        """Test /api/currency/rates returns currency data"""
        response = api_client.get(f"{BASE_URL}/api/currency/rates")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "base" in data, "base field missing"
        assert "rates" in data, "rates field missing"
        assert data["base"] == "EGP", f"Expected base EGP, got {data['base']}"
        assert "USD" in data["rates"], "USD rate missing"
        assert "SAR" in data["rates"], "SAR rate missing"
        assert "AED" in data["rates"], "AED rate missing"
        
        print(f"✓ Currency rates endpoint working: 1 EGP = {data['rates']['USD']} USD")

class TestAIChatEndpoint:
    """AI Chat endpoint with Emergent LLM"""
    
    def test_ai_chat_with_auth(self, api_client, test_user_token):
        """Test /api/ai/chat with authenticated user"""
        response = api_client.post(
            f"{BASE_URL}/api/ai/chat",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "message": "What is inflation?",
                "session_id": "test_session_123",
                "language": "en"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data, "response field missing"
        assert "session_id" in data, "session_id field missing"
        assert len(data["response"]) > 0, "AI response is empty"
        assert data["session_id"] == "test_session_123", "session_id mismatch"
        
        print(f"✓ AI chat working: {data['response'][:100]}...")
    
    def test_ai_chat_without_auth(self, api_client):
        """Test /api/ai/chat without auth (should still work per code)"""
        response = api_client.post(
            f"{BASE_URL}/api/ai/chat",
            json={
                "message": "Tell me about gold investment",
                "session_id": "test_session_456",
                "language": "en"
            }
        )
        
        # Based on code, AI chat doesn't require auth (just verifies if present)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "response" in data, "response field missing"
        assert len(data["response"]) > 0, "AI response is empty"
        
        print(f"✓ AI chat without auth working: {data['response'][:100]}...")
