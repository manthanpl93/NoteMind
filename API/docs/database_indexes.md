# MongoDB Database Indexes

This document describes the required MongoDB indexes for optimal performance of the NoteMind API.

## Conversations Collection

### Required Indexes

#### 1. User ID + Updated At Index

**Purpose:** Efficiently retrieve and sort conversations for a user by most recent activity

**Index:**
```javascript
db.conversations.createIndex({ user_id: 1, updated_at: -1 })
```

**Used By:**
- `GET /conversations` - List conversations sorted by updated_at descending

**Benefits:**
- Fast lookup of all conversations for a user
- Efficient sorting by updated_at without scanning all documents
- Supports pagination with skip/limit

**Query Pattern:**
```javascript
db.conversations.find({ user_id: ObjectId("...") })
  .sort({ updated_at: -1 })
  .skip(0)
  .limit(50)
```

---

#### 2. User ID + Conversation ID Index

**Purpose:** Quickly verify conversation ownership and retrieve specific conversations

**Index:**
```javascript
db.conversations.createIndex({ user_id: 1, _id: 1 })
```

**Used By:**
- `GET /conversations/{id}` - Get specific conversation
- `POST /conversations/{id}/messages` - Send message to conversation
- `DELETE /conversations/{id}` - Delete conversation

**Benefits:**
- Fast verification of user ownership
- Combines user_id and _id lookup in single index scan
- Prevents users from accessing other users' conversations

**Query Pattern:**
```javascript
db.conversations.findOne({
  _id: ObjectId("..."),
  user_id: ObjectId("...")
})
```

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

// Create conversation indexes
db.conversations.createIndex({ user_id: 1, updated_at: -1 })
db.conversations.createIndex({ user_id: 1, _id: 1 })

// Verify indexes
db.conversations.getIndexes()
```

### Using Python/Motor (Async)

```python
from motor.motor_asyncio import AsyncIOMotorClient

async def create_indexes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["notemind"]
    
    # Create conversation indexes
    await db.conversations.create_index([
        ("user_id", 1),
        ("updated_at", -1)
    ])
    
    await db.conversations.create_index([
        ("user_id", 1),
        ("_id", 1)
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
        # Conversation indexes
        await db.conversations.create_index([
            ("user_id", 1),
            ("updated_at", -1)
        ])
        
        await db.conversations.create_index([
            ("user_id", 1),
            ("_id", 1)
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
1. `{ user_id: 1, updated_at: -1 }` - List conversations
2. `{ user_id: 1, _id: 1 }` - Get/update/delete conversation

**Quick Setup:**
```javascript
use notemind
db.conversations.createIndex({ user_id: 1, updated_at: -1 })
db.conversations.createIndex({ user_id: 1, _id: 1 })
db.conversations.getIndexes()  // Verify
```

These two indexes provide optimal performance for all conversation API operations.


