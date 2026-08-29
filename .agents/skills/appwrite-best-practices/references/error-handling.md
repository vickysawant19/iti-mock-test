# Appwrite Error Handling Best Practices

## Appwrite Error Code Reference

| Code | Meaning | Common Cause | Fix |
|---|---|---|---|
| 400 | Bad Request / Validation Error | Missing required field, wrong type | Validate inputs before sending |
| 401 | Unauthorized | Invalid/expired session or API key | Re-authenticate or check API key |
| 403 | Forbidden | Insufficient permissions | Check document/collection permissions |
| 404 | Not Found | Wrong ID, deleted resource | Verify IDs, handle gracefully |
| 409 | Conflict | Duplicate unique value, doc already exists | Check before create or use try/catch |
| 413 | Payload Too Large | File exceeds bucket limit | Validate file size before upload |
| 429 | Rate Limited | Too many requests | Implement backoff, add caching |
| 500 | Server Error | Appwrite internal issue | Retry with backoff, report if persistent |
| 503 | Service Unavailable | Maintenance/overload | Retry with exponential backoff |

---

## Typed Error Handling Pattern

```typescript
import { AppwriteException } from 'appwrite' // or 'node-appwrite'

async function safeGetDocument<T>(
  databaseId: string,
  collectionId: string,
  documentId: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const doc = await databases.getDocument(databaseId, collectionId, documentId)
    return { data: doc as T, error: null }
  } catch (err) {
    if (err instanceof AppwriteException) {
      switch (err.code) {
        case 404:
          return { data: null, error: 'Document not found' }
        case 401:
          return { data: null, error: 'Authentication required' }
        case 403:
          return { data: null, error: 'Access denied' }
        default:
          console.error(`Appwrite error ${err.code}: ${err.message}`)
          return { data: null, error: 'An unexpected error occurred' }
      }
    }
    // Non-Appwrite error
    console.error('Unexpected error:', err)
    return { data: null, error: 'A system error occurred' }
  }
}
```

---

## Exponential Backoff for Transient Errors

```typescript
type TransientCode = 408 | 429 | 500 | 502 | 503 | 504

const TRANSIENT_CODES = new Set<number>([408, 429, 500, 502, 503, 504])

async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, label = 'operation' } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const isLast = attempt === maxRetries - 1
      const code = error instanceof AppwriteException ? error.code : 0
      const isTransient = TRANSIENT_CODES.has(code)

      if (!isTransient || isLast) {
        console.error(`${label} failed after ${attempt + 1} attempts:`, error)
        throw error
      }

      // Jittered exponential backoff
      const delayMs = baseDelayMs * Math.pow(2, attempt) + Math.random() * 200
      console.warn(`${label} attempt ${attempt + 1} failed (${code}), retrying in ${delayMs.toFixed(0)}ms`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw new Error(`${label}: Max retries exceeded`)
}

// Usage
const post = await withRetry(
  () => databases.getDocument(db, 'posts', postId),
  { label: 'getPost', maxRetries: 3 }
)
```

---

## Function Error Handling

```typescript
// ✅ Production-ready Appwrite Function error handling
export default async ({ req, res, log, error }: AppwriteFunctionContext) => {
  const startTime = Date.now()

  try {
    // 1. Parse and validate body
    let body: unknown
    try {
      body = JSON.parse(req.body || '{}')
    } catch {
      return res.json({ error: 'Invalid JSON body' }, 400)
    }

    if (!isValidPayload(body)) {
      return res.json({ error: 'Missing required fields' }, 400)
    }

    // 2. Process
    const result = await processRequest(body)

    log(`Success in ${Date.now() - startTime}ms`)
    return res.json({ success: true, data: result })

  } catch (err) {
    const duration = Date.now() - startTime

    if (err instanceof AppwriteException) {
      error(`Appwrite error ${err.code} after ${duration}ms: ${err.message}`)

      // Map Appwrite errors to appropriate HTTP responses
      const statusMap: Record<number, number> = {
        400: 400, 401: 401, 403: 403, 404: 404, 409: 409,
      }
      const status = statusMap[err.code] ?? 500
      return res.json({ error: err.message }, status)
    }

    // Unknown error
    error(`Unhandled error after ${duration}ms: ${(err as Error).message}`)
    return res.json({ error: 'Internal server error' }, 500)
  }
}
```

---

## Client-Side Error Boundary Pattern (React)

```typescript
import { AppwriteException } from 'appwrite'

// Custom hook with full error state
function useAppwriteQuery<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: { message: string; code?: number } | null
  }>({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false

    fetcher()
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch(err => {
        if (!cancelled) {
          if (err instanceof AppwriteException) {
            setState({
              data: null,
              loading: false,
              error: { message: err.message, code: err.code },
            })
          } else {
            setState({
              data: null,
              loading: false,
              error: { message: 'An unexpected error occurred' },
            })
          }
        }
      })

    return () => { cancelled = true }
  }, [])

  return state
}
```

---

## Common Errors & Fixes

### `user_unauthorized` (401)
```typescript
// ✅ Always check authentication state before protected operations
try {
  await databases.createDocument(/* ... */)
} catch (err) {
  if (err instanceof AppwriteException && err.code === 401) {
    // Session expired — redirect to login
    await account.deleteSession('current').catch(() => {})
    router.push('/login')
  }
}
```

### `document_already_exists` (409)
```typescript
// ✅ Handle conflict for idempotent operations
async function upsertUserProfile(userId: string, data: Partial<Profile>) {
  try {
    return await databases.createDocument(db, 'profiles', userId, data, [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
    ])
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 409) {
      // Already exists — update instead
      return databases.updateDocument(db, 'profiles', userId, data)
    }
    throw err
  }
}
```

### `storage_file_size_limit` (413)
```typescript
// ✅ Validate file size before upload attempt
function validateUpload(file: File, maxMB: number): void {
  const maxBytes = maxMB * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds ${maxMB}MB limit`)
  }
}

try {
  validateUpload(selectedFile, 5)
  await storage.createFile(BUCKET_ID, ID.unique(), InputFile.fromBlob(selectedFile, selectedFile.name))
} catch (err) {
  if (err instanceof Error && err.message.includes('exceeds')) {
    setError(err.message) // user-friendly message
  }
}
```

### Rate Limit (429)
```typescript
// ✅ Implement rate-limit awareness on client
let rateLimitResetTime = 0

async function rateAwareRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  if (now < rateLimitResetTime) {
    await new Promise(r => setTimeout(r, rateLimitResetTime - now))
  }
  try {
    return await fn()
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 429) {
      rateLimitResetTime = Date.now() + 60_000 // back off 1 minute
      throw new Error('Rate limit reached. Please wait a moment.')
    }
    throw err
  }
}
```
