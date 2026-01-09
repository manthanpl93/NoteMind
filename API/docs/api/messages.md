# Messages API

The Messages API enables managing individual messages within conversations, including pagination, editing, and deletion.

## Base URL

```
http://localhost:8000
```

## Authentication

All message endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Endpoints

### 1. Get Paginated Messages

Retrieve messages for a conversation with pagination support.

**Endpoint:** `GET /conversations/{conversation_id}/messages`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| conversation_id | string | Yes | ID of the conversation |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| skip | integer | No | 0 | Number of messages to skip |
| limit | integer | No | 50 | Maximum number of messages to return (max 100) |
| order | string | No | "asc" | Sort order: "asc" (oldest first) or "desc" (newest first) |

**Response:** `200 OK`

```json
{
  "total": 10,
  "skip": 0,
  "limit": 50,
  "messages": [
    {
      "id": "507f1f77bcf86cd799439013",
      "conversation_id": "507f1f77bcf86cd799439011",
      "role": "user",
      "content": "What is Python?",
      "timestamp": "2024-01-06T12:00:00Z",
      "tokens_used": 15,
      "sequence_number": 0
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "conversation_id": "507f1f77bcf86cd799439011",
      "role": "assistant",
      "content": "Python is a programming language...",
      "timestamp": "2024-01-06T12:00:05Z",
      "tokens_used": 45,
      "sequence_number": 1
    }
  ]
}
```

**Example cURL:**

```bash
curl -X GET "http://localhost:8000/conversations/507f1f77bcf86cd799439011/messages?skip=0&limit=20&order=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get Single Message

Retrieve details of a specific message by ID.

**Endpoint:** `GET /messages/{message_id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message_id | string | Yes | ID of the message |

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439013",
  "conversation_id": "507f1f77bcf86cd799439011",
  "role": "user",
  "content": "What is Python?",
  "timestamp": "2024-01-06T12:00:00Z",
  "tokens_used": 15,
  "sequence_number": 0
}
```

**Example cURL:**

```bash
curl -X GET "http://localhost:8000/messages/507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Error Responses:**

- `404 Not Found` - Message not found
- `403 Forbidden` - User doesn't own the conversation

---

### 3. Edit Message

Update the content of a user message. Only user messages can be edited (not assistant or system messages).

**Endpoint:** `PATCH /messages/{message_id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message_id | string | Yes | ID of the message |

**Request Body:**

```json
{
  "content": "What is Python programming language?"
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439013",
  "conversation_id": "507f1f77bcf86cd799439011",
  "role": "user",
  "content": "What is Python programming language?",
  "timestamp": "2024-01-06T12:00:00Z",
  "tokens_used": 15,
  "sequence_number": 0
}
```

**Example cURL:**

```bash
curl -X PATCH "http://localhost:8000/messages/507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is Python programming language?"
  }'
```

**Error Responses:**

- `400 Bad Request` - Attempting to edit non-user message
- `404 Not Found` - Message not found
- `403 Forbidden` - User doesn't own the conversation

---

### 4. Delete Message

Permanently delete a message from a conversation. The conversation's `message_count` will be decremented.

**Endpoint:** `DELETE /messages/{message_id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message_id | string | Yes | ID of the message |

**Response:** `204 No Content`

**Example cURL:**

```bash
curl -X DELETE "http://localhost:8000/messages/507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Error Responses:**

- `404 Not Found` - Message not found
- `403 Forbidden` - User doesn't own the conversation

---

## Security

All message operations verify that the user owns the conversation:

1. **Get/Edit/Delete Message**: Verifies the message's conversation belongs to the user
2. **Get Conversation Messages**: Verifies the conversation belongs to the user

Users cannot access, edit, or delete messages from other users' conversations.

---

## Pagination

The paginated messages endpoint supports:

- **skip**: Number of messages to skip (for pagination)
- **limit**: Maximum number of messages to return (default: 50, max: 100)
- **order**: Sort order - "asc" for oldest first, "desc" for newest first

**Example Pagination:**

```bash
# First page (oldest 20 messages)
GET /conversations/{id}/messages?skip=0&limit=20&order=asc

# Second page
GET /conversations/{id}/messages?skip=20&limit=20&order=asc

# Most recent 10 messages
GET /conversations/{id}/messages?skip=0&limit=10&order=desc
```

---

## Message Sequence Numbers

Each message has a `sequence_number` field that indicates its order in the conversation:

- Starts at `0` for the first message
- Increments by 1 for each subsequent message
- Used for efficient ordering and pagination

---

## Best Practices

1. **Use Pagination**: For conversations with many messages, use pagination instead of fetching all messages
2. **Edit User Messages Only**: Only user messages can be edited - assistant messages are immutable
3. **Check Ownership**: Always verify you own the conversation before performing message operations
4. **Consider Impact**: Deleting messages affects conversation history and context for future AI responses

