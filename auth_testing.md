# Auth Testing Playbook for SULTAN App

## Step 1: Create Test User & Session
```bash
# Register test user via API
curl -X POST "BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Test User", "email": "test@sultan.app", "password": "Test123456"}'
```

## Step 2: Login and get token
```bash
curl -X POST "BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@sultan.app", "password": "Test123456"}'
```

## Step 3: Test protected endpoints
```bash
curl -X GET "BACKEND_URL/api/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 4: Browser Testing with token
```javascript
// In Playwright, set AsyncStorage equivalent
await page.evaluate((token) => {
  localStorage.setItem('sultan_auth', JSON.stringify({
    token: token,
    authId: 'test-auth-id',
    email: 'test@sultan.app',
    fullName: 'Test User'
  }));
}, TOKEN);
```

## Checklist
- [ ] User registration works
- [ ] User login works
- [ ] JWT token is returned
- [ ] Protected endpoints require auth
- [ ] Google OAuth redirect works
