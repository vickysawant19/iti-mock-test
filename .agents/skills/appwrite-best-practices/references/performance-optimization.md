# Appwrite Performance Optimization

## API Request Reduction

### Use `Query.select` to Reduce Payload
```typescript
// ❌ Fetches ALL fields including large content fields
const posts = await databases.listDocuments(db, 'posts', [
  Query.limit(20),
])

// ✅ Select only fields needed for a listing view
const posts = await databases.listDocuments(db, 'posts', [
  Query.equal('status', 'published'),
  Query.orderDesc('$createdAt'),
  Query.limit(20),
  Query.select(['$id', 'title', 'slug', 'authorId', 'coverImageId', '$createdAt']),
  // 'content' field omitted — only load on full article view
])
```

### Batch Related Operations
```typescript
// ❌ N+1 Problem — one request per post author
const posts = await databases.listDocuments(db, 'posts', [Query.limit(20)])
const authors = await Promise.all(
  posts.documents.map(p => databases.getDocument(db, 'users', p.authorId))
)

// ✅ Fetch all needed authors in one request using Query.contains
const authorIds = [...new Set(posts.documents.map(p => p.authorId))]
const authors = await databases.listDocuments(db, 'users', [
  Query.contains('$id', authorIds), // single request
  Query.select(['$id', 'name', 'avatarFileId']),
])
const authorMap = Object.fromEntries(authors.documents.map(a => [a.$id, a]))
```

---

## Caching Strategies

### Client-Side Cache with TTL (Browser)
```typescript
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class AppwriteCache {
  private store = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data
  }

  invalidate(keyPattern: string): void {
    for (const key of this.store.keys()) {
      if (key.includes(keyPattern)) this.store.delete(key)
    }
  }
}

const cache = new AppwriteCache()

async function getPost(postId: string) {
  const cacheKey = `post:${postId}`
  const cached = cache.get<AppwriteDocument>(cacheKey)
  if (cached) return cached

  const post = await databases.getDocument(db, 'posts', postId)
  cache.set(cacheKey, post, 5 * 60 * 1000) // 5 min TTL
  return post
}
```

### Server-Side Cache with Redis (Node.js Functions)
```typescript
import { createClient } from 'redis'

const redis = createClient({ url: process.env.REDIS_URL })
await redis.connect()

async function getCachedPosts(category: string) {
  const cacheKey = `posts:category:${category}`
  
  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // Cache miss — query Appwrite
  const result = await databases.listDocuments(db, 'posts', [
    Query.equal('category', category),
    Query.equal('status', 'published'),
    Query.orderDesc('$createdAt'),
    Query.limit(20),
  ])

  // Cache for 2 minutes
  await redis.setEx(cacheKey, 120, JSON.stringify(result))
  return result
}

// Invalidate on write
async function publishPost(postId: string) {
  await databases.updateDocument(db, 'posts', postId, { status: 'published' })
  // Clear cached listing
  const keys = await redis.keys('posts:category:*')
  if (keys.length) await redis.del(keys)
}
```

### SWR Pattern for React
```typescript
import useSWR from 'swr'

// ✅ SWR handles caching, revalidation, deduplication automatically
function usePost(postId: string) {
  return useSWR(
    `post/${postId}`,
    () => databases.getDocument(db, 'posts', postId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,  // 30 seconds dedup window
    }
  )
}
```

---

## Realtime Instead of Polling

```typescript
// ❌ BAD: Polling every 5 seconds — wastes resources
setInterval(async () => {
  const messages = await databases.listDocuments(db, 'messages', [
    Query.orderDesc('$createdAt'),
    Query.limit(50),
  ])
  setMessages(messages.documents)
}, 5000)

// ✅ GOOD: Realtime subscription — zero overhead when idle
const unsubscribe = client.subscribe(
  [`databases.${db}.collections.messages.documents`],
  (response) => {
    if (response.events.includes('databases.*.collections.*.documents.*.create')) {
      setMessages(prev => [response.payload as Message, ...prev])
    }
    if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
      setMessages(prev => prev.filter(m => m.$id !== (response.payload as Message).$id))
    }
  }
)

// ✅ Always clean up subscription
onUnmount(() => unsubscribe())
```

---

## Connection & Request Management

### Reuse Client Instances
```typescript
// ❌ BAD: Creating new client on every request (common in Functions)
export default async ({ req, res }) => {
  const client = new Client() // Don't create inside handler
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!)
  const databases = new Databases(client)
  // ...
}

// ✅ GOOD: Create client once at module level — reused across warm invocations
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)
const storage   = new Storage(client)

export default async ({ req, res }) => {
  // Use pre-initialized `databases` and `storage`
}
```

### Retry with Exponential Backoff
```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: unknown) {
      const appwriteError = error as { code?: number }
      const isTransient = [408, 429, 500, 502, 503, 504].includes(appwriteError.code ?? 0)
      if (!isTransient || attempt === maxRetries - 1) throw error
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage
const post = await withRetry(() => databases.getDocument(db, 'posts', postId))
```

---

## Pagination Performance Comparison

| Method | Performance | Best For |
|---|---|---|
| `Query.cursorAfter(id)` | O(1) — always fast | Infinite scroll, large collections |
| `Query.offset(n)` | O(N) — gets slower as N grows | Small collections (< 1000 docs) |
| `Query.limit` | Always required | All queries |

```typescript
// ✅ Cursor-based infinite scroll implementation
class PostCursor {
  private lastId: string | null = null
  private hasMore = true

  async nextPage(limit = 20) {
    if (!this.hasMore) return []

    const queries = [
      Query.equal('status', 'published'),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ]
    if (this.lastId) queries.push(Query.cursorAfter(this.lastId))

    const result = await databases.listDocuments(db, 'posts', queries)
    this.hasMore = result.documents.length === limit
    this.lastId  = result.documents.at(-1)?.$id ?? null
    return result.documents
  }
}
```

---

## Cost Optimization Checklist

- [ ] `Query.select([...fields])` on every `listDocuments` call — only needed fields
- [ ] `Query.limit(n)` on every query — never unbounded
- [ ] Cursor pagination for collections > 1000 documents
- [ ] Client-side caching with TTL for user-visible data
- [ ] Server-side Redis cache for shared/public data
- [ ] Realtime subscriptions replacing polling
- [ ] Image Preview API with `webp` output and appropriate dimensions
- [ ] Bucket `zstd` compression enabled
- [ ] CDN in front of Appwrite for media delivery
- [ ] Function client initialized at module level (not inside handler)
- [ ] Budget alerts configured in Appwrite Cloud Console
- [ ] Appwrite region selected closest to primary user base
