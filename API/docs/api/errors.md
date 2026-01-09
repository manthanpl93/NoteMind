# Error Handling

This document describes the error responses returned by the NoteMind API.

## Error Response Format

All errors follow a consistent JSON format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

For validation errors (422), the response includes detailed field information:

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

---

## HTTP Status Codes

### 2xx Success

| Code | Description |
|------|-------------|
| 200 OK | Request successful |
| 201 Created | Resource created successfully |
| 204 No Content | Request successful, no content to return |

### 4xx Client Errors

| Code | Description | Common Causes |
|------|-------------|---------------|
| 400 Bad Request | Invalid request data | API key not configured, malformed data |
| 401 Unauthorized | Authentication required or failed | Missing/invalid JWT token, invalid credentials |
| 403 Forbidden | Access denied | Attempting to access another user's resource |
| 404 Not Found | Resource not found | Invalid conversation ID, user not found |
| 422 Unprocessable Entity | Validation error | Invalid email format, password too short, invalid provider |

### 5xx Server Errors

| Code | Description | Common Causes |
|------|-------------|---------------|
| 500 Internal Server Error | Server error | LLM API failure, database error |

---

## Error Codes by Endpoint

### User Endpoints

#### POST /users (Register)

```json
// 400 - Email already exists
{
  "detail": "User with this email already exists"
}

// 422 - Invalid email format
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}

// 422 - Password too short
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "ensure this value has at least 6 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

#### POST /users/login

```json
// 401 - Invalid credentials
{
  "detail": "Invalid email or password"
}
```

#### GET /users/me

```json
// 401 - No token provided
{
  "detail": "Not authenticated"
}

// 404 - User not found
{
  "detail": "User not found"
}
```

#### PUT /users/api-keys

```json
// 401 - Invalid token
{
  "detail": "Could not validate credentials"
}

// 404 - User not found
{
  "detail": "User not found"
}
```

---

### Conversation Endpoints

#### POST /conversations (Create)

```json
// 400 - API key not configured
{
  "detail": "API key for openai is not configured. Please add your API key in settings."
}

// 401 - Not authenticated
{
  "detail": "Not authenticated"
}

// 422 - Invalid provider
{
  "detail": [
    {
      "loc": ["body", "provider"],
      "msg": "value is not a valid enumeration member",
      "type": "type_error.enum"
    }
  ]
}

// 422 - Empty first message
{
  "detail": [
    {
      "loc": ["body", "first_message"],
      "msg": "ensure this value has at least 1 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

#### GET /conversations (List)

```json
// 401 - Not authenticated
{
  "detail": "Not authenticated"
}

// 422 - Invalid pagination parameters
{
  "detail": [
    {
      "loc": ["query", "skip"],
      "msg": "ensure this value is greater than or equal to 0",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

#### GET /conversations/{conversation_id}

```json
// 404 - Conversation not found
{
  "detail": "Conversation not found"
}

// 404 - Invalid ObjectId format
{
  "detail": "Conversation not found"
}
```

#### POST /conversations/{conversation_id}/messages

```json
// 403 - Not your conversation
{
  "detail": "You don't have permission to access this conversation"
}

// 404 - Conversation not found
{
  "detail": "Conversation not found"
}

// 422 - Empty content
{
  "detail": [
    {
      "loc": ["body", "content"],
      "msg": "ensure this value has at least 1 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}

// 422 - Invalid context_limit_tokens
{
  "detail": [
    {
      "loc": ["body", "context_limit_tokens"],
      "msg": "ensure this value is greater than or equal to 100",
      "type": "value_error.number.not_ge"
    }
  ]
}

// 500 - LLM API failure
{
  "detail": "Failed to get AI response: Connection timeout"
}
```

#### DELETE /conversations/{conversation_id}

```json
// 403 - Not your conversation
{
  "detail": "You don't have permission to delete this conversation"
}

// 404 - Conversation not found
{
  "detail": "Conversation not found"
}
```

---

## Common Error Scenarios

### Authentication Errors

#### Missing Token

**Request:**
```bash
curl -X GET http://localhost:8000/conversations
```

**Response:** `401 Unauthorized`
```json
{
  "detail": "Not authenticated"
}
```

**Solution:** Include JWT token in Authorization header:
```bash
curl -X GET http://localhost:8000/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Invalid Token

**Response:** `401 Unauthorized`
```json
{
  "detail": "Could not validate credentials"
}
```

**Solution:** Re-authenticate using POST /users/login

#### Expired Token

**Response:** `401 Unauthorized`
```json
{
  "detail": "Token has expired"
}
```

**Solution:** Re-authenticate using POST /users/login

---

### Validation Errors

#### Invalid Email

**Request:**
```json
{
  "email": "notanemail",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `422 Unprocessable Entity`
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

#### Password Too Short

**Request:**
```json
{
  "email": "user@example.com",
  "password": "123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `422 Unprocessable Entity`
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "ensure this value has at least 6 characters",
      "type": "value_error.any_str.min_length"
    }
  ]
}
```

---

### Resource Access Errors

#### API Key Not Configured

**Scenario:** Trying to create a conversation without configuring the provider's API key

**Response:** `400 Bad Request`
```json
{
  "detail": "API key for openai is not configured. Please add your API key in settings."
}
```

**Solution:**
```bash
curl -X PUT http://localhost:8000/users/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openai_api_key": "sk-..."
  }'
```

#### Accessing Another User's Conversation

**Scenario:** User B tries to access User A's conversation

**Response:** `403 Forbidden` or `404 Not Found`
```json
{
  "detail": "You don't have permission to access this conversation"
}
```

**Solution:** Users can only access their own conversations

---

### LLM Provider Errors

#### OpenAI API Error

**Response:** `500 Internal Server Error`
```json
{
  "detail": "Failed to get AI response: Incorrect API key provided"
}
```

**Solution:** Check your OpenAI API key configuration

#### Rate Limit Exceeded

**Response:** `500 Internal Server Error`
```json
{
  "detail": "Failed to get AI response: Rate limit exceeded"
}
```

**Solution:** Wait and retry, or upgrade your LLM provider plan

#### Context Length Exceeded

**Response:** `500 Internal Server Error`
```json
{
  "detail": "Failed to get AI response: maximum context length exceeded"
}
```

**Solution:** Reduce `context_limit_tokens` in your request

---

## Error Handling Best Practices

### Client-Side Implementation

```javascript
async function createConversation(data) {
  try {
    const response = await fetch('http://localhost:8000/conversations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          // Handle API key not configured
          showApiKeyPrompt();
          break;
        case 401:
          // Handle authentication error
          redirectToLogin();
          break;
        case 403:
          // Handle forbidden access
          showAccessDeniedMessage();
          break;
        case 422:
          // Handle validation errors
          displayValidationErrors(error.detail);
          break;
        case 500:
          // Handle server errors
          showRetryPrompt();
          break;
        default:
          showGenericError();
      }
      
      return null;
    }
    
    return await response.json();
  } catch (error) {
    // Handle network errors
    showNetworkError();
    return null;
  }
}
```

### Retry Logic

For transient errors (500, network issues), implement exponential backoff:

```javascript
async function sendMessageWithRetry(conversationId, content, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await sendMessage(conversationId, content);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Debugging Tips

### Enable Verbose Logging

Check server logs for detailed error information:

```bash
# View logs in development
tail -f logs/app.log

# Check for errors
grep "ERROR" logs/app.log
```

### Common Issues

1. **401 Errors**: Check token format and expiration
2. **400 API Key Error**: Verify API keys are configured
3. **500 Errors**: Check LLM provider status and API quotas
4. **422 Validation**: Review request payload format

### Testing with cURL

Add `-v` flag for verbose output:

```bash
curl -v -X POST http://localhost:8000/conversations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","model_name":"gpt-4o-mini","first_message":"test"}'
```

---

## Contact Support

If you encounter persistent errors:

1. Check [API Status Page] for service status
2. Review [GitHub Issues] for known issues
3. Contact support@notemind.com with:
   - Request ID (if provided in error)
   - Timestamp of error
   - Request details (excluding sensitive data)
   - Error response


