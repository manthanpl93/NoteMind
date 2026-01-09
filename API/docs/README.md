# NoteMind API Documentation

Welcome to the NoteMind API documentation. This API enables multi-turn conversations with various LLM providers (OpenAI, Anthropic, Google) with advanced features like token tracking and context management.

## Overview

NoteMind API is a FastAPI-based backend for managing AI conversations with:
- **Multiple LLM Providers**: OpenAI, Anthropic (Claude), Google (Gemini)
- **Token Tracking**: Monitor token usage at message and conversation level
- **Context Management**: Token-based context limiting for cost control
- **Auto-Generated Titles**: AI-powered conversation titles
- **User Authentication**: JWT-based authentication
- **Encrypted API Keys**: Secure storage of user API keys

## Getting Started

### Prerequisites

- Python 3.11+
- MongoDB
- OpenAI/Anthropic/Google API keys

### Installation

```bash
# Clone the repository
cd API

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

Create a `.env` file with:

```env
mongodb_uri=mongodb://localhost:27017
database_name=notemind
jwt_secret=your-secret-key-here
encryption_key=your-encryption-key-here
```

### Running the Server

```bash
# Development server with auto-reload
uvicorn main:app --reload --port 8000

# Production server
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

## Quick Start Example

### 1. Register a User

```bash
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### 2. Configure API Key

```bash
curl -X PUT http://localhost:8000/users/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "openai_api_key": "sk-..."
  }'
```

### 3. Create a Conversation

```bash
curl -X POST http://localhost:8000/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model_name": "gpt-4o-mini",
    "first_message": "Explain quantum computing in simple terms"
  }'
```

### 4. Send a Message

```bash
curl -X POST http://localhost:8000/conversations/{conversation_id}/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Can you give an example?",
    "context_limit_tokens": 4000
  }'
```

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌──────▼──────────┐
│   FastAPI   │   │   JWT Auth      │
│   Routes    │───│   Middleware    │
└──────┬──────┘   └─────────────────┘
       │
       ├─────────────────┬────────────────┐
       │                 │                │
┌──────▼──────┐   ┌─────▼─────┐   ┌─────▼──────┐
│   MongoDB   │   │   LLM     │   │  Tiktoken  │
│  Database   │   │ Providers │   │  Counter   │
└─────────────┘   └───────────┘   └────────────┘
```

## API Documentation

- **[Conversation API](api/conversations.md)** - Managing AI conversations
- **[Messages API](api/messages.md)** - Managing individual messages (pagination, edit, delete)
- **[User API](api/users.md)** - User management and authentication
- **[Error Handling](api/errors.md)** - Error codes and responses

## Features

### Token Tracking

Every message and conversation tracks token usage:
- Message-level token counts
- Conversation-level cumulative totals
- Uses tiktoken for accurate counting

### Context Management

Control conversation context sent to LLMs:
```json
{
  "content": "Your message",
  "context_limit_tokens": 4000
}
```

Recent messages that fit within the token limit are sent to the AI.

### Multi-Provider Support

Choose the best model for your use case:
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4-turbo
- **Anthropic**: Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3 Opus
- **Google**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 1.0 Pro

### Secure API Key Storage

User API keys are encrypted at rest using Fernet encryption.

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  first_name: String,
  last_name: String,
  api_keys: {
    openai_api_key: String (encrypted),
    anthropic_api_key: String (encrypted),
    google_api_key: String (encrypted)
  }
}
```

### Conversations Collection

```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  title: String,
  provider: String,
  model_name: String,
  message_count: Integer,  // Denormalized count for performance
  total_tokens_used: Integer,
  total_context_size: Integer,
  remaining_context_size: Integer,
  total_used_percentage: Float,
  remaining_percentage: Float,
  created_at: ISODate,
  updated_at: ISODate
}

// Indexes
db.conversations.createIndex({ user_id: 1, updated_at: -1 })
```

### Messages Collection

```javascript
{
  _id: ObjectId,
  conversation_id: ObjectId,  // Foreign key to conversations
  user_id: ObjectId,  // Denormalized for security
  role: String,  // "user", "assistant", or "system"
  content: String,
  timestamp: ISODate,
  tokens_used: Integer,
  sequence_number: Integer  // Order of message in conversation (0-indexed)
}

// Indexes
db.messages.createIndex({ conversation_id: 1, sequence_number: 1 })
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run only unit tests
pytest tests/unit/ -v

# Run only integration tests (requires API keys)
pytest tests/integration/ -v -m integration

# Run with coverage
pytest tests/ --cov=routes --cov=models --cov=utils -v
```

## Security

- **JWT Authentication**: All conversation endpoints require authentication
- **API Key Encryption**: User API keys encrypted with Fernet
- **User Isolation**: Users can only access their own conversations
- **Password Hashing**: Bcrypt for password hashing

## Performance

- **Indexed Queries**: MongoDB indexes for fast conversation retrieval
- **Token-Based Context**: Limit context to reduce API costs
- **Async Operations**: FastAPI's async support for concurrent requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## Support

For issues, questions, or contributions:
- GitHub Issues
- Email: support@notemind.com

## License

[License information here]


