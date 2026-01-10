# MongoDB Database Indexes

This document describes the required MongoDB indexes for optimal performance of the NoteMind API.

## Folders Collection

### Required Indexes

#### 1. User ID + Name Index

**Purpose:** Efficiently retrieve and sort folders for a user, enforce name uniqueness

**Index:**
```javascript
db.folders.create_index([("user_id", 1), ("name", 1)])
```

**Used By:**
- `GET /folders` - List folders sorted by creation date
- `POST /folders` - Check for duplicate names
- `PATCH /folders/{id}` - Check for duplicate names during update

**Benefits:**
- Fast lookup of all folders for a user
- Efficient name uniqueness checking (case-insensitive via application logic)
- Supports pagination with skip/limit
- Enables compound queries for user-specific operations

**Query Pattern:**
```javascript
// List user's folders
db.folders.find({ user_id: ObjectId("...") })
  .sort({ created_at: -1 })
  .skip(0)
  .limit(50)

// Check name uniqueness
db.folders.find({
  user_id: ObjectId("..."),
  name: { $regex: "^name$", $options: "i" }
})
```

---

## Conversations Collection

### Required Indexes

#### 1. User ID + Folder ID + Updated At Index

**Purpose:** Efficiently retrieve and sort conversations for a user by folder and most recent activity

**Index:**
```javascript
db.conversations.createIndex({ user_id: 1, folder_id: 1, updated_at: -1 })
```

**Used By:**
- `GET /conversations` - List conversations with optional folder filtering
- `GET /conversations?folder_id=null` - List conversations without folders
- `GET /conversations?folder_id={id}` - List conversations in specific folder

**Benefits:**
- Fast lookup of all conversations for a user
- Efficient filtering by folder (including null folder_id)
- Efficient sorting by updated_at without scanning all documents
- Supports pagination with skip/limit
- Enables folder-based organization and queries

**Query Pattern:**
```javascript
// List all conversations for user
db.conversations.find({ user_id: ObjectId("...") })
  .sort({ updated_at: -1 })
  .skip(0)
  .limit(50)

// Filter by specific folder
db.conversations.find({
  user_id: ObjectId("..."),
  folder_id: ObjectId("...")
})
  .sort({ updated_at: -1 })

// Filter for conversations without folders
db.conversations.find({
  user_id: ObjectId("..."),
  $or: [
    { folder_id: { $exists: false } },
    { folder_id: null }
  ]
})
  .sort({ updated_at: -1 })
```

---

**Note:** Single document lookups by `_id` use MongoDB's default `_id` index (O(1) hash lookup), so a compound index on `{ user_id: 1, _id: 1 }` is not needed.

---

## Messages Collection

### Required Indexes

#### 1. Conversation ID + Sequence Number Index

**Purpose:** Efficiently retrieve and order messages for a conversation

**Index:**
```javascript
db.messages.createIndex({ conversation_id: 1, sequence_number: 1 })
```

**Used By:**
- `GET /conversations/{id}/messages` - Get paginated messages
- `GET /conversations/{id}` - Get conversation with all messages
- `DELETE /conversations/{id}` - Cascade delete messages

**Benefits:**
- Fast lookup of all messages for a conversation
- Efficient ordering by sequence_number without sorting
- Supports pagination with skip/limit
- Enables cascade deletes efficiently

**Query Pattern:**
```javascript
db.messages.find({ conversation_id: ObjectId("...") })
  .sort({ sequence_number: 1 })
  .skip(0)
  .limit(50)
```

**Note:** Security verification happens at the conversation level (checking `conversations.user_id`), so we don't need indexes on `messages.user_id`.

---

## Users Collection

### Existing Indexes

The users collection typically has these indexes from the user management system:

#### 1. Email Unique Index

**Purpose:** Ensure email uniqueness and fast lookup by email

**Index:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
```

**Used By:**
- `POST /users` - Registration (check for duplicate email)
- `POST /users/login` - Authentication

---

## Creating Indexes

### Using MongoDB Shell

```javascript
// Connect to your database
use notemind

// Create folder indexes
db.folders.createIndex({ user_id: 1, name: 1 })

// Create conversation indexes
db.conversations.createIndex({ user_id: 1, folder_id: 1, updated_at: -1 })

// Create messages indexes
db.messages.createIndex({ conversation_id: 1, sequence_number: 1 })

// Verify indexes
db.folders.getIndexes()
db.conversations.getIndexes()
db.messages.getIndexes()
```

### Using Python/Motor (Async)

```python
from motor.motor_asyncio import AsyncIOMotorClient

async def create_indexes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["notemind"]

    # Create folder indexes
    await db.folders.create_index([
        ("user_id", 1),
        ("name", 1)
    ])

    # Create conversation indexes
    await db.conversations.create_index([
        ("user_id", 1),
        ("folder_id", 1),
        ("updated_at", -1)
    ])

    # Create messages indexes
    await db.messages.create_index([
        ("conversation_id", 1),
        ("sequence_number", 1)
    ])

    print("Indexes created successfully")
```

### During Application Startup

Add to your FastAPI application startup:

```python
# In database.py or main.py startup function
async def create_database_indexes(db):
    """Create required database indexes."""
    try:
        # Folder indexes
        await db.folders.create_index([
            ("user_id", 1),
            ("name", 1)
        ])

        # Conversation indexes
        await db.conversations.create_index([
            ("user_id", 1),
            ("folder_id", 1),
            ("updated_at", -1)
        ])

        # Messages indexes
        await db.messages.create_index([
            ("conversation_id", 1),
            ("sequence_number", 1)
        ])

        print("Database indexes created")
    except Exception as e:
        print(f"Error creating indexes: {e}")
```

---

## Index Performance

### Query Performance Analysis

Use MongoDB's `explain()` to verify index usage:

```javascript
// Analyze list conversations query
db.conversations.find({ user_id: ObjectId("...") })
  .sort({ updated_at: -1 })
  .explain("executionStats")

// Check for:
// - "stage": "IXSCAN" (index scan, good)
// - "stage": "COLLSCAN" (collection scan, bad)
// - "totalKeysExamined" should be close to "nReturned"
```

### Expected Performance

With proper indexes:
- **List conversations**: O(log N + K) where N = total docs, K = returned docs
- **Get conversation**: O(log N) lookup
- **Update conversation**: O(log N) lookup + O(1) update

Without indexes:
- **List conversations**: O(N) - full collection scan
- **Get conversation**: O(N) - full collection scan

---

## Index Maintenance

### Monitoring Index Usage

```javascript
// Check index statistics
db.conversations.aggregate([
  { $indexStats: {} }
])

// Look for indexes with low "accesses"
// These might be unused and can be removed
```

### Index Size

```javascript
// Check collection and index sizes
db.conversations.stats()

// Look at:
// - totalIndexSize
// - indexSizes (per index)
```

### Rebuilding Indexes

If indexes become fragmented:

```javascript
// Rebuild all indexes
db.conversations.reIndex()

// Or rebuild specific index
db.conversations.dropIndex("user_id_1_updated_at_-1")
db.conversations.createIndex({ user_id: 1, updated_at: -1 })
```

---

## Future Optimizations

### Potential Additional Indexes

As the application grows, consider these indexes:

#### 1. Provider Index

If you add filtering by provider:

```javascript
db.conversations.createIndex({ user_id: 1, provider: 1, updated_at: -1 })
```

**Use Case:**
```
GET /conversations?provider=openai
```

#### 2. Title Text Index

For conversation search:

```javascript
db.conversations.createIndex({ title: "text" })
```

**Use Case:**
```
GET /conversations?search=quantum computing
```

#### 3. Created At Index

For date range queries:

```javascript
db.conversations.createIndex({ user_id: 1, created_at: -1 })
```

**Use Case:**
```
GET /conversations?from_date=2024-01-01&to_date=2024-01-31
```

#### 4. Token Usage Index

For finding high-usage conversations:

```javascript
db.conversations.createIndex({ user_id: 1, total_tokens_used: -1 })
```

**Use Case:**
```
GET /conversations?sort_by=tokens
```

---

## Index Best Practices

1. **Create indexes before deployment** to avoid production performance issues
2. **Monitor index usage** regularly to identify unused indexes
3. **Limit total indexes** - too many indexes slow down writes
4. **Order matters** - put equality filters before sort fields in compound indexes
5. **Test queries** with `explain()` to verify index usage
6. **Consider write performance** - indexes speed reads but slow writes
7. **Use covered queries** when possible (query only uses indexed fields)

---

## Troubleshooting

### Slow List Queries

**Symptom:** `GET /conversations` is slow

**Check:**
1. Verify index exists: `db.conversations.getIndexes()`
2. Check index usage: `.explain("executionStats")`
3. Look for COLLSCAN (bad) vs IXSCAN (good)

**Solution:**
```javascript
db.conversations.createIndex({ user_id: 1, updated_at: -1 })
```

### Slow Get Queries

**Symptom:** `GET /conversations/{id}` is slow

**Check:**
1. Verify compound index exists
2. Check if query uses both user_id and _id

**Solution:**
```javascript
db.conversations.createIndex({ user_id: 1, _id: 1 })
```

### High Memory Usage

**Symptom:** Queries causing high memory usage

**Possible Cause:** Sorting without index

**Solution:** Ensure sort fields are indexed

---

## Backup Considerations

When backing up MongoDB:
- **Indexes are included** in mongodump
- **Indexes are rebuilt** during mongorestore
- Large indexes take time to rebuild
- Consider using --noIndexRestore for faster restores (then rebuild later)

---

## Summary

**Required Indexes:**

**Folders:**
1. `{ user_id: 1, name: 1 }` - List folders and enforce name uniqueness per user

**Conversations:**
1. `{ user_id: 1, folder_id: 1, updated_at: -1 }` - List conversations with folder filtering and sorting

**Messages:**
1. `{ conversation_id: 1, sequence_number: 1 }` - Fetch and order messages for conversations

**Quick Setup:**
```javascript
use notemind
// Create folder indexes
db.folders.createIndex({ user_id: 1, name: 1 })

// Create conversation indexes
db.conversations.createIndex({ user_id: 1, folder_id: 1, updated_at: -1 })

// Create messages indexes
db.messages.createIndex({ conversation_id: 1, sequence_number: 1 })

// Verify all indexes
db.folders.getIndexes()
db.conversations.getIndexes()
db.messages.getIndexes()
```

These indexes provide optimal performance for all conversation and message API operations.


