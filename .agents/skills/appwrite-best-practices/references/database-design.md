# Appwrite Database Design Best Practices

## Attribute Types — Choose the Right Type

| Attribute Type | Use For | Notes |
|---|---|---|
| `string` | Short text (names, titles, slugs) | Specify `size` to conserve storage |
| `email` | Email addresses | Built-in format validation |
| `url` | URLs | Built-in format validation |
| `integer` | Whole numbers | Specify `min`/`max` for validation |
| `float` | Decimal numbers | Use for prices, coordinates |
| `boolean` | Flags, toggles | |
| `datetime` | Timestamps | ISO 8601, use for `$createdAt`/`$updatedAt` sorting |
| `enum` | Constrained value sets | e.g., `status: ['draft','published','archived']` |
| `ip` | IP addresses | Format validated |
| `relationship` | Foreign keys to other collections | Prefer over manual ID storage |
| `string[]` | Tags, categories arrays | Use array indexes for querying |

### Example: Correct Attribute Definition
```typescript
const db = DATABASE_ID
const col = COLLECTION_ID

// ✅ Use specific types — not everything is a string
await databases.createStringAttribute(db, col, 'title',    255,  true)
await databases.createEmailAttribute (db, col, 'email',         true)
await databases.createEnumAttribute  (db, col, 'status',   ['draft','published','archived'], true, 'draft')
await databases.createIntegerAttribute(db, col, 'views',   false, 0, 0, 9999999)
await databases.createDatetimeAttribute(db, col, 'publishedAt', false)
await databases.createBooleanAttribute(db, col, 'is_featured', false, false)
```

---

## Indexing Strategy

### Index Types
| Type | Use For |
|---|---|
| `key` | Equality queries (`Query.equal`) and range queries (`Query.lessThan`, `Query.between`) |
| `unique` | Enforcing uniqueness (email, username, slug) |
| `fulltext` | Full-text search (`Query.search`) on text fields |
| `array` | Querying array attribute values |

### Critical: Index Everything You Filter Or Sort On
```typescript
// ✅ Create composite index for multi-attribute queries
await databases.createIndex(
  db, col,
  'status_publishedAt_idx',
  IndexType.Key,
  ['status', 'publishedAt'],
  ['ASC', 'DESC']
)

// ✅ Unique index for uniqueness enforcement
await databases.createIndex(db, col, 'email_unique_idx', IndexType.Unique, ['email'])

// ✅ Full-text index for search
await databases.createIndex(db, col, 'title_content_search', IndexType.Fulltext, ['title', 'content'])

// ✅ Array index for tag/category arrays
await databases.createIndex(db, col, 'tags_idx', IndexType.Key, ['tags'])
```

### When Indexes Matter Most
- Filtering by `status`, `userId`, `category` — always index
- Sorting by `$createdAt` or `$updatedAt` — already auto-indexed by Appwrite
- Full-text search on long text fields — use `fulltext` index type
- Relationship lookups — Appwrite auto-indexes relationship attributes

---

## Query Optimization

### Use Cursor Pagination for Large Datasets
```typescript
// ❌ Offset pagination degrades at scale (reads N+limit docs)
const page2 = await databases.listDocuments(db, col, [
  Query.limit(20),
  Query.offset(20), // slow for large collections
])

// ✅ Cursor pagination — always O(1) regardless of position
const firstPage = await databases.listDocuments(db, col, [
  Query.limit(20),
  Query.orderDesc('$createdAt'),
])
const lastId = firstPage.documents.at(-1)?.$id

const nextPage = await databases.listDocuments(db, col, [
  Query.limit(20),
  Query.orderDesc('$createdAt'),
  Query.cursorAfter(lastId), // ← cursor-based, efficient
])
```

### Use the Correct Query Methods
```typescript
// Equality
Query.equal('status', 'published')
Query.notEqual('status', 'deleted')

// Range
Query.lessThan('price', 100)
Query.greaterThan('views', 1000)
Query.between('age', 18, 65)

// Collections / Arrays
Query.contains('tags', ['typescript', 'node'])

// Search
Query.search('title', 'appwrite tutorial') // requires fulltext index

// Ordering
Query.orderDesc('$createdAt')
Query.orderAsc('name')

// Pagination
Query.limit(25)
Query.offset(0)         // only for small datasets
Query.cursorAfter(id)   // preferred for large datasets
Query.cursorBefore(id)

// Select specific fields (reduces payload)
Query.select(['$id', 'title', 'status', '$createdAt'])
```

### Combine Queries Efficiently
```typescript
// ✅ Combine all query constraints in one request
const result = await databases.listDocuments(db, 'posts', [
  Query.equal('status', 'published'),
  Query.equal('authorId', userId),
  Query.orderDesc('$createdAt'),
  Query.limit(10),
  Query.select(['$id', 'title', 'slug', '$createdAt']),
])
```

---

## Relationship Attributes

```typescript
// ✅ Use relationship attributes for linked data — Appwrite handles JOINs
await databases.createRelationshipAttribute(
  db,
  'posts',       // collection with the relationship
  'comments',    // related collection
  RelationshipType.OneToMany,
  false,          // two_way: false = one-directional
  'comments',     // key name in posts documents
  'commentsPost', // reverse key name in comments (if two_way)
  OnDelete.Cascade // cascade delete comments when post is deleted
)
```

---

## Transactions (Atomic Operations)

```typescript
// ✅ Use transactions for multi-document atomic writes
const txn = await databases.createTransaction(db, { ttl: 300 })

try {
  await databases.createDocument(db, 'users', ID.unique(),
    { name: 'Alice', email: 'alice@example.com' },
    undefined, txn.$id
  )
  await databases.createDocument(db, 'profiles', ID.unique(),
    { userId: userId, bio: '...' },
    undefined, txn.$id
  )
  await databases.updateTransaction(db, txn.$id, true) // commit
} catch (err) {
  await databases.updateTransaction(db, txn.$id, false) // rollback
  throw err
}
```

---

## Schema Versioning Pattern

```typescript
const MIGRATIONS: Record<string, () => Promise<void>> = {
  'v1_add_users_name': async () => {
    await databases.createStringAttribute(db, 'users', 'name', 255, true)
  },
  'v2_add_users_email_unique': async () => {
    await databases.createEmailAttribute(db, 'users', 'email', true)
    await databases.createIndex(db, 'users', 'email_unique', IndexType.Unique, ['email'])
  },
  'v3_add_posts_status_enum': async () => {
    await databases.createEnumAttribute(db, 'posts', 'status',
      ['draft', 'published', 'archived'], true, 'draft')
    await databases.createIndex(db, 'posts', 'status_idx', IndexType.Key, ['status'])
  },
}

async function runMigrations(appliedVersions: string[]) {
  for (const [version, migrate] of Object.entries(MIGRATIONS)) {
    if (!appliedVersions.includes(version)) {
      console.log(`Running migration: ${version}`)
      await migrate()
    }
  }
}
```

---

## Common Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Fetching all documents without `Query.limit` | Unbounded response, hits rate limits | Always use `Query.limit(n)` |
| Querying on non-indexed fields | Full collection scan, slow at scale | Index every filtered/sorted field |
| Storing user IDs as strings in every doc manually | Hard to manage, no referential integrity | Use `relationship` attributes |
| Using `offset` for pagination on large collections | O(N) read cost | Use `cursorAfter`/`cursorBefore` |
| Using `string` for everything | No validation, larger storage | Use typed attributes |
| No `document_security` on user-owned data | Any user can edit/delete others' data | Enable `document_security: true` |
| Mixing server-side API key with client SDK | Security breach | API keys are server-only |
