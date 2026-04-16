import pytest
import requests
import os

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def base_url():
    """Get base URL from environment"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        pytest.skip("EXPO_PUBLIC_BACKEND_URL not set")
    return url.rstrip('/')

@pytest.fixture
def test_user_token(api_client, base_url):
    """Login and return auth token for test user"""
    try:
        response = api_client.post(
            f"{base_url}/api/auth/login",
            json={"email": "test@sultan.app", "password": "Test123456"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        else:
            pytest.skip("Test user login failed")
    except Exception as e:
        pytest.skip(f"Cannot login test user: {e}")
