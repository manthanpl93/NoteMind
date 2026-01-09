# LLM Utils Testing Documentation

## Overview
This document provides information about testing the LLM utilities module (`utils/llm.py`).

## Test Structure

### Directory Layout
```
API/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Shared fixtures for unit tests
│   ├── unit/
│   │   ├── __init__.py
│   │   └── test_llm.py          # 31 unit tests
│   └── integration/
│       ├── __init__.py
│       └── llm-integration/
│           ├── __init__.py
│           ├── conftest.py      # LLM integration-specific fixtures
│           └── test_llm_integration.py  # 5 OpenAI integration tests
├── requirements.txt
└── pytest.ini
```

## Running Tests

### Prerequisites
1. Set up a virtual environment:
```bash
cd API
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Ensure `.env` file exists with required variables:
   - MONGODB_URI
   - DATABASE_NAME
   - JWT_SECRET
   - ENCRYPTION_KEY

### Run All Tests
```bash
pytest tests/
```

### Run Only Unit Tests
```bash
pytest tests/unit/ -m unit
```

### Run Only Integration Tests (requires API keys)
```bash
# API keys are loaded from .env file automatically
# Or set them as environment variables:
export OPENAI_API_KEY="your-key"

pytest tests/integration/llm-integration/ -m integration
```

### Run with Coverage
```bash
pytest tests/unit/ --cov=utils.llm --cov-report=html
# View coverage report at htmlcov/index.html
```

### Run Verbose Output
```bash
pytest tests/ -v
```

## Test Coverage

### Unit Tests (31 tests - all mocked)

#### 1. Provider Enum Tests (2 tests)
- Test enum values for all providers
- Test string conversion

#### 2. Configuration Tests (4 tests)
- Test default models for each provider
- Test API key field mappings

#### 3. get_user_api_key Tests (5 tests)
- Successfully retrieve API keys for OpenAI, Anthropic, Google
- Handle user not found (404 error)
- Handle missing API key configuration (400 error)

#### 4. get_chat_model Tests (6 tests)
- Create chat models for all providers with default models
- Create chat models with custom model names
- Verify correct parameters passed to each provider

#### 5. _convert_messages Tests (8 tests)
- Convert user, assistant, and system messages
- Handle multiple messages
- Default unknown roles to user messages
- Handle empty message lists
- Handle missing role or content fields

#### 6. chat_with_model Tests (6 tests)
- Chat with all three providers (OpenAI, Anthropic, Google)
- Use custom model names
- Handle multiple messages in conversation
- Propagate exceptions from underlying functions

### Integration Tests (5 tests - require real API keys)

**Note:** Integration tests are organized in subdirectories with their own `conftest.py` files to keep fixtures organized and prevent clutter in the root conftest.

#### 1. OpenAI Integration (5 tests)
- Retrieve and decrypt API key
- Create chat model instance
- Simple chat completion
- Conversation with history
- Custom model usage (gpt-4o-mini)

**Note:** Integration tests are automatically skipped if API keys are not provided. Currently only OpenAI tests are included; Anthropic and Google tests can be added when those API keys are available.

## Test Fixtures

### Root conftest.py (Unit Test Fixtures)

These fixtures use **mongomock-motor** for realistic MongoDB mocking with actual query support.

#### Mock Database Fixtures
- `mock_database`: mongomock database with user and API keys (supports real queries)
- `mock_database_no_user`: mongomock database with no users (empty collection)
- `mock_database_no_keys`: mongomock database with user but no API keys

#### Sample Data Fixtures
- `sample_user_id`: Valid ObjectId string
- `sample_api_keys`: Plaintext API keys for testing
- `encrypted_api_keys`: Encrypted versions for database
- `sample_messages`: Multi-turn conversation
- `sample_simple_messages`: Single message

#### Mock Model Fixtures
- `mock_openai_model`: Mock ChatOpenAI instance (for unit tests)
- `mock_anthropic_model`: Mock ChatAnthropic instance (for unit tests)
- `mock_google_model`: Mock ChatGoogleGenerativeAI instance (for unit tests)

---

### integration/llm-integration/conftest.py (LLM Integration Fixtures)

These fixtures also use **mongomock-motor** but with real encrypted API keys for integration testing.

#### Integration Test Fixtures
- `sample_user_id`: Valid ObjectId for integration tests
- `integration_openai_key`: Get OpenAI key from environment (or .env)
- `integration_anthropic_key`: Get Anthropic key from environment (or .env)
- `integration_google_key`: Get Google key from environment (or .env)
- `mock_integration_db_openai`: mongomock database with real OpenAI API key
- `mock_integration_db_anthropic`: mongomock database with real Anthropic API key
- `mock_integration_db_google`: mongomock database with real Google API key

**Benefits of mongomock-motor over MagicMock:**
- ✅ **Real query filtering** - Queries actually filter data correctly
- ✅ **MongoDB operators** - Supports $lt, $gt, $in, $exists, etc.
- ✅ **Multiple documents** - Can insert and query multiple documents
- ✅ **Updates work** - Can test update operations
- ✅ **Aggregations** - Supports aggregation pipelines
- ✅ **More realistic** - Catches query bugs that MagicMock wouldn't
- ✅ **Async support** - Native Motor compatibility with AsyncMongoMockClient

**Benefits of Separate conftest.py:**
- ✅ Keeps integration fixtures isolated from unit test fixtures
- ✅ Easier to manage as more integration test types are added
- ✅ Clearer organization - fixtures are close to the tests that use them
- ✅ No fixture name conflicts between different test types

## Test Results

### Current Status
✅ **31 unit tests PASSED**
✅ **5 OpenAI integration tests PASSED** (with OPENAI_API_KEY in .env)

### Example Output
```
============================= test session starts ==============================
collected 36 items

tests/integration/llm-integration/test_llm_integration.py::TestOpenAIIntegration::test_openai_get_user_api_key PASSED
tests/integration/llm-integration/test_llm_integration.py::TestOpenAIIntegration::test_openai_chat_simple PASSED
... (3 more OpenAI integration tests passed)
tests/unit/test_llm.py::TestProvider::test_provider_values PASSED
tests/unit/test_llm.py::TestDefaultModels::test_default_models_exist PASSED
tests/unit/test_llm.py::TestGetUserAPIKey::test_get_user_api_key_success_openai PASSED
... (28 more unit tests passed)

================== 36 passed, 1 warning in 4.25s ===================
```

## Continuous Integration

### pytest.ini Configuration
```ini
[pytest]
asyncio_mode = auto
testpaths = tests
markers =
    unit: Unit tests with mocked dependencies
    integration: Integration tests requiring real API keys
    slow: Tests that take a long time to run
```

### Markers Usage
```bash
# Run only fast unit tests
pytest -m unit

# Run integration tests (slow, requires API keys)
pytest -m "integration and slow"

# Run everything except slow tests
pytest -m "not slow"
```

## Best Practices

1. **Always run unit tests before committing** - they're fast and don't require API keys
2. **Run integration tests periodically** - they verify real API functionality
3. **Check coverage regularly** - aim for >90% coverage on critical functions
4. **Keep fixtures DRY** - reuse fixtures from conftest.py
5. **Mock external dependencies** - unit tests should be fast and isolated

## Troubleshooting

### Issue: ModuleNotFoundError
**Solution:** Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Issue: ValidationError for Settings
**Solution:** Ensure `.env` file exists with all required variables

### Issue: Integration tests not running
**Solution:** Set environment variables with API keys:
```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="..."
```

### Issue: Tests fail with encryption errors
**Solution:** Ensure ENCRYPTION_KEY is set and is a valid Fernet key:
```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Future Enhancements

1. Add performance benchmarking tests
2. Add stress tests for high-volume requests
3. Add tests for rate limiting and retries
4. Add tests for streaming responses
5. Mock LLM responses for more predictable testing
6. Add property-based testing with hypothesis

