# Folder Integration Tests

This directory contains comprehensive integration tests for the folders feature in NoteMind API.

## Test Structure

### Files
- `__init__.py` - Package initialization
- `conftest.py` - Test fixtures and configuration
- `test_folder_integration.py` - Main test suite

### Test Coverage

#### Folder CRUD Operations
- ✅ Create folder with valid name
- ✅ Create folder with duplicate name (should NOT allow - return 409)
- ✅ Update folder to duplicate name (should NOT allow - return 409)
- ✅ List user's folders (pagination)
- ✅ Get specific folder
- ✅ Update folder name to unique name
- ✅ Delete empty folder
- ✅ Prevent deletion of folder with conversations
- ✅ Ensure users can only access their own folders

#### Folder-Conversation Integration
- ✅ Create conversation with valid folder_id
- ✅ Create conversation without folder_id (null)
- ✅ Create conversation with invalid folder_id (404)
- ✅ Create conversation with another user's folder_id (403)
- ✅ List all conversations (should include folder_id)
- ✅ Filter conversations by folder_id
- ✅ Filter conversations without folder (folder_id=null)
- ✅ Verify folder_id is immutable (cannot be changed after creation)

#### Edge Cases
- ✅ Delete conversation in folder (folder should remain)
- ✅ Create multiple conversations in same folder
- ✅ Folder isolation between users
- ✅ Invalid ObjectId format handling

## Running Tests

### Prerequisites
- MongoDB running (mock DB used in tests)
- Python dependencies installed
- Test database configured

### Execute Tests

```bash
# Run all folder integration tests
pytest tests/integration/folder-integration/

# Run specific test file
pytest tests/integration/folder-integration/test_folder_integration.py

# Run with verbose output
pytest tests/integration/folder-integration/ -v

# Run with coverage
pytest tests/integration/folder-integration/ --cov=API --cov-report=html
```

### Test Fixtures

The `conftest.py` provides:
- `authenticated_client` - TestClient with authenticated user
- `user_token` - JWT token for authentication
- `test_user` - User data fixture
- `folder_factory` - Factory for creating test folders
- `conversation_factory` - Factory for creating test conversations with optional folders

## Test Database

Tests use MongoDB mock database to avoid affecting production data. Each test:
1. Starts with clean database state
2. Creates necessary test data
3. Runs assertions
4. Cleans up automatically

## Key Design Decisions Tested

1. **Immutable folder assignment**: Conversations cannot be moved between folders after creation
2. **Folder deletion protection**: Folders containing conversations cannot be deleted
3. **Optional folders**: Conversations can exist without folder assignment
4. **Folder ownership**: Users can only access their own folders
5. **Unique names**: Folder names must be unique per user (case-insensitive)

## API Endpoints Tested

### Folder Endpoints
- `POST /folders` - Create folder
- `GET /folders` - List folders
- `GET /folders/{id}` - Get folder
- `PATCH /folders/{id}` - Update folder
- `DELETE /folders/{id}` - Delete folder

### Conversation Endpoints
- `POST /conversations` - Create conversation (with optional folder_id)
- `GET /conversations` - List conversations (with optional folder_id filter)
- `GET /conversations/{id}` - Get conversation (includes folder_id)
- `POST /conversations/{id}/messages` - Send message (preserves folder_id)
- `PATCH /conversations/{id}/model` - Switch model (preserves folder_id)

## Test Organization

Tests are organized by functionality:

1. **Folder CRUD Tests** - Basic folder operations
2. **Folder Validation Tests** - Name uniqueness, ownership
3. **Folder-Conversation Integration Tests** - Cross-resource interactions
4. **Security Tests** - Access control and isolation
5. **Edge Case Tests** - Error conditions and boundary cases

## Debugging Failed Tests

If tests fail:

1. Check test logs for detailed error messages
2. Verify database state with test fixtures
3. Check API response codes and messages
4. Use `--pdb` flag to debug interactively

```bash
pytest tests/integration/folder-integration/test_folder_integration.py::test_create_folder -v --pdb
```

## Performance Considerations

Tests are designed to be:
- Fast (mock database)
- Isolated (clean state per test)
- Comprehensive (cover all edge cases)
- Maintainable (clear fixtures and assertions)

## Future Enhancements

Potential additional tests:
- Bulk folder operations
- Folder sharing (if implemented)
- Folder hierarchy (nested folders)
- Folder search and filtering
- Performance tests with large datasets
