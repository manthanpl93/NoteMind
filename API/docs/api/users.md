# User API

The User API handles user registration, authentication, and API key management.

## Base URL

```
http://localhost:8000/users
```

---

## Endpoints

### 1. Create User (Register)

Register a new user account.

**Endpoint:** `POST /users`

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Parameters:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| email | string | Yes | Valid email format | User's email address |
| password | string | Yes | Min 6 characters | User's password |
| first_name | string | Yes | Min 1 character | User's first name |
| last_name | string | Yes | Min 1 character | User's last name |

**Response:** `201 Created`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Features:**
- Password is hashed with bcrypt before storage
- JWT token returned for immediate authentication
- Email must be unique

**Example cURL:**

```bash
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

---

### 2. Login

Authenticate a user and receive a JWT token.

**Endpoint:** `POST /users/login`

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Response:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Features:**
- Validates email and password
- Returns JWT token for API authentication
- Token includes user_id and email in payload

**Example cURL:**

```bash
curl -X POST http://localhost:8000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

---

### 3. Get Current User

Retrieve the authenticated user's profile.

**Endpoint:** `GET /users/me`

**Authentication:** Required (JWT token)

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Example cURL:**

```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Update API Keys

Configure LLM provider API keys for the authenticated user.

**Endpoint:** `PUT /users/api-keys`

**Authentication:** Required (JWT token)

**Request Body:**

```json
{
  "openai_api_key": "sk-...",
  "anthropic_api_key": "sk-ant-...",
  "google_api_key": "..."
}
```

**Parameters:**

All fields are optional. Only provided fields will be updated.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| openai_api_key | string | No | OpenAI API key |
| anthropic_api_key | string | No | Anthropic API key |
| google_api_key | string | No | Google API key |

**Response:** `200 OK`

```json
{
  "openai_api_key": "sk-...***...xyz",
  "anthropic_api_key": "sk-ant-...***...abc",
  "google_api_key": null
}
```

**Features:**
- API keys are encrypted before storage
- Response shows masked keys for security
- Can update individual keys without affecting others
- Pass empty string to remove a key

**Example cURL:**

```bash
# Set OpenAI key
curl -X PUT http://localhost:8000/users/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openai_api_key": "sk-proj-..."
  }'

# Set multiple keys
curl -X PUT http://localhost:8000/users/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openai_api_key": "sk-proj-...",
    "anthropic_api_key": "sk-ant-...",
    "google_api_key": "..."
  }'
```

---

### 5. Get API Keys

Retrieve the user's configured API keys (masked for security).

**Endpoint:** `GET /users/api-keys`

**Authentication:** Required (JWT token)

**Response:** `200 OK`

```json
{
  "openai_api_key": "sk-...***...xyz",
  "anthropic_api_key": "sk-ant-...***...abc",
  "google_api_key": null
}
```

**Features:**
- Keys are masked (shows first 6 and last 3 characters)
- Null indicates key not configured
- Cannot retrieve full keys (security feature)

**Example cURL:**

```bash
curl -X GET http://localhost:8000/users/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Authentication

### JWT Tokens

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload

JWT tokens include:

```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "exp": 1704552000
}
```

### Token Expiration

Tokens expire based on server configuration. When expired, you'll receive a `401 Unauthorized` response. Re-authenticate using the login endpoint.

---

## Security

### Password Security

- Passwords hashed with bcrypt
- Minimum 6 characters required
- Never stored or returned in plain text

### API Key Security

- API keys encrypted with Fernet encryption
- Stored encrypted in database
- Masked when returned to client
- Only first 6 and last 3 characters shown

### User Isolation

- Users can only access their own data
- JWT token validates user identity
- All database queries filtered by user_id

---

## Error Responses

See [Error Handling Documentation](errors.md) for details.

Common errors:

- `400 Bad Request` - User with email already exists
- `401 Unauthorized` - Invalid email or password
- `404 Not Found` - User not found
- `422 Unprocessable Entity` - Validation error (email format, password length, etc.)

---

## Workflows

### Registration and First Conversation

```
1. Register
   POST /users
   → Receive JWT token

2. Configure API Key
   PUT /users/api-keys
   {
     "openai_api_key": "sk-..."
   }

3. Create Conversation
   POST /conversations
   (Use token from step 1)
```

### Login Workflow

```
1. Login
   POST /users/login
   → Receive JWT token

2. Use Token
   Include in Authorization header for all requests
   Authorization: Bearer TOKEN
```

### API Key Management

```
1. Check Configured Keys
   GET /users/api-keys
   → See which keys are configured

2. Add/Update Keys
   PUT /users/api-keys
   {
     "openai_api_key": "sk-...",
     "anthropic_api_key": "sk-ant-..."
   }

3. Verify
   GET /users/api-keys
   → Confirm keys are saved (masked)
```

---

## Best Practices

1. **Store JWT tokens securely** on the client (e.g., httpOnly cookies)
2. **Don't log API keys** or tokens
3. **Rotate API keys** regularly
4. **Handle token expiration** gracefully in your client
5. **Use HTTPS** in production
6. **Validate email format** on client before submission
7. **Enforce strong passwords** on client side

---

## Rate Limiting

Currently no rate limiting is implemented on user endpoints. This may be added in future versions.

---

## Future Enhancements

Planned features:
- Password reset functionality
- Email verification
- Two-factor authentication (2FA)
- User profile updates
- Account deletion
- Session management


