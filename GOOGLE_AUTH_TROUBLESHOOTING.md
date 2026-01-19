# Google Authentication Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "Google token required" Error

**Cause:** The backend isn't receiving the token in the expected format.

**Solution:** Make sure your frontend sends the token correctly.

## Frontend Implementation Examples

### ✅ CORRECT - Using @react-oauth/google

```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

// 1. Wrap your app with GoogleOAuthProvider
function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <YourComponents />
    </GoogleOAuthProvider>
  );
}

// 2. Use GoogleLogin in your auth component
function LoginPage() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google Response:', credentialResponse);
      
      const response = await fetch('http://localhost:5001/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',  // CRITICAL!
        },
        credentials: 'include',
        body: JSON.stringify({ 
          token: credentialResponse.credential  // Send the credential as 'token'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Backend error:', error);
        return;
      }
      
      const data = await response.json();
      console.log('Success:', data);
      
      // Store the JWT token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect or update state
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.log('Login Failed')}
        useOneTap
      />
    </div>
  );
}
```

### ✅ ALTERNATIVE - Using Axios

```javascript
import axios from 'axios';

const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const { data } = await axios.post(
      'http://localhost:5001/api/auth/google',
      { token: credentialResponse.credential },
      { 
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true 
      }
    );
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};
```

## Backend Accepts Multiple Field Names

The backend now accepts the token from any of these field names:
- `token`
- `credential`
- `idToken`

So any of these will work:
```javascript
// Option 1
body: JSON.stringify({ token: credentialResponse.credential })

// Option 2
body: JSON.stringify({ credential: credentialResponse.credential })

// Option 3
body: JSON.stringify({ idToken: credentialResponse.credential })
```

## Debugging Steps

### 1. Check Browser Console
Look for:
- Google OAuth response
- Request being sent to backend
- Any CORS errors

### 2. Check Backend Console
When you attempt login, you should see:
```
=== Google Auth Debug ===
Request body: { "token": "eyJhbGc..." }
Content-Type: application/json
✓ Token received, verifying with Google...
✓ Token verified for user: user@example.com
```

### 3. Common Mistakes

❌ **Missing Content-Type header**
```javascript
fetch('/api/auth/google', {
  method: 'POST',
  body: JSON.stringify({ token: 'xxx' })
  // Missing: headers: { 'Content-Type': 'application/json' }
})
```

❌ **Wrong field name**
```javascript
body: JSON.stringify({ 
  googleToken: credentialResponse.credential  // Wrong!
})
```

❌ **Not sending credential value**
```javascript
body: JSON.stringify({ 
  token: credentialResponse  // Wrong! Should be credentialResponse.credential
})
```

❌ **CORS issues**
Make sure backend has:
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

## Testing with cURL

Test if the backend works correctly:

```bash
curl -X POST http://localhost:5001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"your_google_id_token_here"}'
```

## Environment Variables Check

Backend `.env` must have:
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
CORS_ORIGIN=http://localhost:3000
```

Frontend must use the SAME Google Client ID when initializing GoogleOAuthProvider.

## Still Not Working?

1. Pull latest backend code: `git pull origin main`
2. Restart backend server
3. Check backend logs when attempting login
4. Share the exact error message from backend console
5. Share the console.log output from frontend
