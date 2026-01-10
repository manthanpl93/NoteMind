# Conversation API

The Conversation API enables creating and managing multi-turn conversations with various LLM providers.

## Base URL

```
http://localhost:8000/conversations
```

## Authentication

All conversation endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Endpoints

### 1. Create Conversation

Create a new conversation with the first message.

**Endpoint:** `POST /conversations`

**Request Body:**

```json
{
  "provider": "openai",
  "model_name": "gpt-4o-mini",
  "first_message": "Explain quantum computing in simple terms"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| provider | string | Yes | LLM provider: `openai`, `anthropic`, or `google` |
| model_name | string | Yes | Specific model name (e.g., `gpt-4o-mini`) |
| first_message | string | Yes | Initial message to start the conversation |

**Response:** `201 Created`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439012",
  "title": "Understanding Quantum Computing",
  "provider": "openai",
  "model_name": "gpt-4o-mini",
  "message_count": 1,
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing in simple terms",
      "timestamp": "2024-01-06T12:00:00Z",
      "tokens_used": 12
    }
  ],
  "total_tokens_used": 12,
  "created_at": "2024-01-06T12:00:00Z",
  "updated_at": "2024-01-06T12:00:00Z"
}
```

**Features:**
- Auto-generates title using AI (max 60 characters)
- Tracks tokens for the initial message
- Validates user has configured API key for the provider

**Example cURL:**

```bash
curl -X POST http://localhost:8000/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model_name": "gpt-4o-mini",
    "first_message": "What is Python?"
  }'
```

---

### 2. List Conversations

Retrieve all conversations for the authenticated user.

**Endpoint:** `GET /conversations`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Number of conversations to skip (pagination) |
| limit | integer | 50 | Maximum conversations to return (max: 100) |

**Response:** `200 OK`

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Understanding Quantum Computing",
    "provider": "openai",
    "model_name": "gpt-4o-mini",
    "message_count": 12,
    "total_tokens_used": 1543,
    "created_at": "2024-01-06T12:00:00Z",
    "updated_at": "2024-01-06T12:30:00Z"
  }
]
```

**Features:**
- Sorted by `updated_at` (most recent first)
- Pagination support
- Returns summary view (no full message history)
- Only shows user's own conversations

**Example cURL:**

```bash
# Get first 20 conversations
curl -X GET "http://localhost:8000/conversations?skip=0&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get next 20 conversations
curl -X GET "http://localhost:8000/conversations?skip=20&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get Conversation

Retrieve a specific conversation with full message history.

**Endpoint:** `GET /conversations/{conversation_id}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| conversation_id | string | MongoDB ObjectId of the conversation |

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439012",
  "title": "Understanding Quantum Computing",
  "provider": "openai",
  "model_name": "gpt-4o-mini",
  "message_count": 2,
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing",
      "timestamp": "2024-01-06T12:00:00Z",
      "tokens_used": 10
    },
    {
      "role": "assistant",
      "content": "Quantum computing is...",
      "timestamp": "2024-01-06T12:00:05Z",
      "tokens_used": 85
    }
  ],
  "total_tokens_used": 1543,
  "created_at": "2024-01-06T12:00:00Z",
  "updated_at": "2024-01-06T12:30:00Z"
}
```

**Features:**
- Returns complete conversation history
- All messages with timestamps and token counts
- User can only access their own conversations

**Example cURL:**

```bash
curl -X GET http://localhost:8000/conversations/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Send Message

Send a message to a conversation and receive an AI response.

**Endpoint:** `POST /conversations/{conversation_id}/messages`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| conversation_id | string | MongoDB ObjectId of the conversation |

**Request Body:**

```json
{
  "content": "Can you give an example?",
  "context_limit_tokens": 4000
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| content | string | Yes | - | The message to send |
| context_limit_tokens | integer | No | 4000 | Max tokens from history to include |

**Response:** `200 OK`

```json
{
  "message": {
    "role": "assistant",
    "content": "Sure! Here's an example...",
    "timestamp": "2024-01-06T12:05:00Z",
    "tokens_used": 45
  },
  "conversation": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Understanding Quantum Computing",
    "provider": "openai",
    "model_name": "gpt-4o-mini",
    "messages": [...],
    "total_tokens_used": 195,
    "created_at": "2024-01-06T12:00:00Z",
    "updated_at": "2024-01-06T12:05:00Z"
  }
}
```

**Features:**
- Token-based context limiting
- Automatic token counting
- Updates `updated_at` timestamp
- Increments `total_tokens_used`

**Context Limiting:**

The `context_limit_tokens` parameter controls how much conversation history is sent to the AI:

- **Low (500-1000 tokens)**: Recent messages only, cost-efficient
- **Medium (2000-4000 tokens)**: Good balance (default)
- **High (8000-16000 tokens)**: Extended context, higher cost

Recent messages are selected to fit within the limit.

**Example cURL:**

```bash
curl -X POST http://localhost:8000/conversations/507f1f77bcf86cd799439011/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Can you explain more?",
    "context_limit_tokens": 4000
  }'
```

---

### 5. Switch Model

Switch the language model used in an existing conversation. Automatically recalculates context limits and percentages based on the new model's capabilities.

**Endpoint:** `PATCH /conversations/{conversation_id}/model`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| conversation_id | string | MongoDB ObjectId of the conversation |

**Request Body:**

```json
{
  "model": "gpt-4-turbo"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| model | string | Yes | New model name to switch to (must be a valid supported model) |

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user_id": "507f1f77bcf86cd799439012",
  "title": "Understanding Quantum Computing",
  "provider": "openai",
  "model_name": "gpt-4-turbo",
  "message_count": 12,
  "total_tokens_used": 1543,
  "total_context_size": 128000,
  "remaining_context_size": 126457,
  "total_used_percentage": 1.21,
  "remaining_percentage": 98.79,
  "created_at": "2024-01-06T12:00:00Z",
  "updated_at": "2024-01-06T12:35:00Z"
}
```

**Features:**
- Validates model name is supported
- Automatically recalculates context limits based on new model
- Updates percentages based on current token usage
- Preserves all existing conversation data
- User can only modify their own conversations

**Supported Models:**

See the [Supported Models](#supported-models) section above for all available models.

**Context Recalculation:**

When switching models, the API automatically:
1. Gets the new model's context window size
2. Calculates: `remaining_context_size = total_context_size - total_tokens_used`
3. Calculates: `total_used_percentage = (total_tokens_used / total_context_size) * 100`
4. Calculates: `remaining_percentage = 100 - total_used_percentage`

**Example cURL:**

```bash
curl -X PATCH http://localhost:8000/conversations/507f1f77bcf86cd799439011/model \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo"
  }'
```

---

### 6. Delete Conversation

Permanently delete a conversation and all its messages.

**Endpoint:** `DELETE /conversations/{conversation_id}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| conversation_id | string | MongoDB ObjectId of the conversation |

**Response:** `204 No Content`

**Features:**
- Hard delete (permanent)
- User can only delete their own conversations
- No response body on success

**Example cURL:**

```bash
curl -X DELETE http://localhost:8000/conversations/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Supported Models

### OpenAI

- `gpt-4o` - Most capable, 128K context
- `gpt-4o-mini` - Fast and affordable, 128K context
- `gpt-4-turbo` - High performance, 128K context
- `gpt-3.5-turbo` - Cost-effective, 16K context

### Anthropic

- `claude-sonnet-4-20250514` - Latest Claude, 200K context
- `claude-3-5-sonnet-20241022` - High capability, 200K context
- `claude-3-opus-20240229` - Most capable Claude 3, 200K context

### Google

- `gemini-1.5-pro` - Advanced model, 2M context
- `gemini-1.5-flash` - Fast and efficient, 1M context
- `gemini-1.0-pro` - General purpose, 32K context

---

## Token Management

### Token Tracking

Every message tracks token usage:

```json
{
  "role": "user",
  "content": "Message content",
  "tokens_used": 15
}
```

Conversations track total cumulative tokens:

```json
{
  "total_tokens_used": 1543
}
```

### Token Counting

Uses `tiktoken` library for accurate OpenAI-compatible token counting.

### Cost Optimization Tips

1. **Use appropriate models**:
   - `gpt-4o-mini` for routine tasks (90% cheaper)
   - `gpt-4o` for complex reasoning

2. **Limit context**:
   - Set `context_limit_tokens` to control history
   - Lower limits = lower costs

3. **Monitor usage**:
   - Check `total_tokens_used` per conversation
   - Track `tokens_used` per message

---

## Error Responses

See [Error Handling Documentation](errors.md) for details.

Common errors:

- `400 Bad Request` - API key not configured
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Accessing another user's conversation
- `404 Not Found` - Conversation doesn't exist
- `422 Unprocessable Entity` - Invalid provider or validation error
- `500 Internal Server Error` - AI API call failed

---

## Workflows

### Basic Conversation Flow

```
1. Create conversation
   POST /conversations
   → Get conversation_id

2. Send messages
   POST /conversations/{id}/messages
   → Receive AI responses

3. Switch model (optional)
   PATCH /conversations/{id}/model
   → Change to different model, auto-recalculate context limits

4. View history
   GET /conversations/{id}
   → See full message history

   Or use pagination:
   GET /conversations/{id}/messages?skip=0&limit=50
   → Get paginated messages

5. Manage messages (optional)
   GET /conversations/{id}/messages - Paginated messages
   PATCH /messages/{message_id} - Edit user messages
   DELETE /messages/{message_id} - Delete messages
   See [Messages API](messages.md) for details

6. Cleanup
   DELETE /conversations/{id}
```

### Multi-Provider Workflow

```
1. Configure API keys
   PUT /users/api-keys
   {
     "openai_api_key": "sk-...",
     "anthropic_api_key": "sk-ant-...",
     "google_api_key": "..."
   }

2. Create conversations with different providers
   OpenAI: provider="openai", model="gpt-4o-mini"
   Anthropic: provider="anthropic", model="claude-sonnet-4-20250514"
   Google: provider="google", model="gemini-1.5-pro"

3. Each conversation maintains its own provider/model
```

### Context Management Workflow

```
1. Start conversation
2. For each message, choose context limit based on needs:
   - Quick Q&A: 500-1000 tokens
   - Normal chat: 2000-4000 tokens
   - Deep discussion: 8000-16000 tokens
3. Monitor total_tokens_used to track costs
```

---

## Best Practices

1. **Choose the right model** for your use case
2. **Switch models mid-conversation** if you need different capabilities (e.g., from gpt-4o-mini to gpt-4-turbo for complex reasoning)
3. **Use token limits** to control costs
4. **Monitor token usage** regularly
5. **Set meaningful context limits** based on conversation complexity
6. **Handle errors gracefully** (API failures, rate limits)
7. **Clean up** unused conversations

---

## Rate Limiting

Rate limits are determined by your LLM provider:

- **OpenAI**: Based on your account tier
- **Anthropic**: Based on your account tier
- **Google**: Based on your account tier

The API will return provider-specific error messages when rate limits are hit.


