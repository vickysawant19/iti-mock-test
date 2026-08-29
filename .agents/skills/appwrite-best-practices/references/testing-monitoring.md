# Appwrite Testing & Monitoring Best Practices

## Project Setup for Testing

```typescript
// config/appwrite.ts — environment-aware configuration
const ENVIRONMENTS = {
  test:       { project: process.env.TEST_PROJECT_ID!,  key: process.env.TEST_API_KEY! },
  staging:    { project: process.env.STG_PROJECT_ID!,   key: process.env.STG_API_KEY! },
  production: { project: process.env.PROD_PROJECT_ID!,  key: process.env.PROD_API_KEY! },
}

const env = (process.env.NODE_ENV ?? 'test') as keyof typeof ENVIRONMENTS
const config = ENVIRONMENTS[env]

export const serverClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(config.project)
  .setKey(config.key)

export const databases = new Databases(serverClient)
export const storage   = new Storage(serverClient)
export const users     = new Users(serverClient)
```

---

## Unit Testing with Mocked SDK

```typescript
// Vitest example — mock Appwrite to test service logic without network
vi.mock('node-appwrite', () => ({
  Client:    vi.fn().mockReturnValue({
    setEndpoint: vi.fn().mockReturnThis(),
    setProject:  vi.fn().mockReturnThis(),
    setKey:      vi.fn().mockReturnThis(),
  }),
  Databases: vi.fn().mockImplementation(() => ({
    getDocument:    vi.fn(),
    listDocuments:  vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  })),
  ID: { unique: () => 'test-id' },
  Query:      { equal: (k, v) => `equal(${k},${v})`, limit: n => `limit(${n})` },
  Permission: { read: r => `read(${r})`, update: r => `update(${r})` },
  Role:       { any: () => 'any()', user: id => `user:${id}`, users: () => 'users()' },
  AppwriteException: class extends Error { constructor(msg, public code) { super(msg) } },
}))

describe('PostService.getPost', () => {
  it('should return null for 404', async () => {
    mockDatabases.getDocument.mockRejectedValue(new AppwriteException('Not found', 404))
    const result = await postService.getPost('nonexistent')
    expect(result).toBeNull()
  })

  it('should create with correct owner permissions', async () => {
    mockDatabases.createDocument.mockResolvedValue({ $id: 'post-1', title: 'Test' })
    await postService.createPost({ title: 'Test', authorId: 'user-42' })
    expect(mockDatabases.createDocument).toHaveBeenCalledWith(
      expect.any(String), 'posts', expect.any(String),
      expect.objectContaining({ authorId: 'user-42' }),
      expect.arrayContaining([expect.stringContaining('user:user-42')])
    )
  })
})
```

---

## Integration Testing Pattern

```typescript
// Run against a dedicated test Appwrite project — NEVER production
const TEST_DB = process.env.TEST_DATABASE_ID!
const createdIds: { col: string; id: string }[] = []

afterEach(async () => {
  // Clean up test data after each test
  await Promise.allSettled(
    createdIds.map(({ col, id }) => databases.deleteDocument(TEST_DB, col, id))
  )
  createdIds.length = 0
})

it('creates and retrieves a document', async () => {
  const doc = await databases.createDocument(TEST_DB, 'posts', ID.unique(), {
    title: 'Integration Test', status: 'draft',
  })
  createdIds.push({ col: 'posts', id: doc.$id })

  const fetched = await databases.getDocument(TEST_DB, 'posts', doc.$id)
  expect(fetched.title).toBe('Integration Test')
})

it('enforces unique email constraint', async () => {
  await databases.createDocument(TEST_DB, 'users', 'u-test-1', {
    email: 'dupe@test.com', name: 'User 1',
  })
  createdIds.push({ col: 'users', id: 'u-test-1' })

  await expect(
    databases.createDocument(TEST_DB, 'users', 'u-test-2', {
      email: 'dupe@test.com', name: 'User 2',
    })
  ).rejects.toThrow() // expects 409 Conflict
})
```

---

## Appwrite Function Testing Helper

```typescript
// Create a mock context for testing Functions without deploying
function createMockFnContext(overrides = {}) {
  const responses = []
  return {
    req: {
      body: '{}', method: 'POST',
      headers: { 'content-type': 'application/json' },
      path: '/', query: {}, ...overrides,
    },
    res: {
      json: (data, status = 200) => {
        const r = { body: data, status }
        responses.push(r)
        return r
      },
      send: (body, status = 200) => ({ body, status }),
      empty: () => ({ body: '', status: 204 }),
    },
    log:   vi.fn(),
    error: vi.fn(),
    _responses: responses,
  }
}

// Test your exported function handler
it('returns 400 for missing email', async () => {
  const ctx = createMockFnContext({ body: JSON.stringify({ name: 'Test' }) })
  const result = await main(ctx)
  expect(result.status).toBe(400)
  expect(result.body.error).toMatch(/email/i)
})
```

---

## Structured Logging in Functions

```typescript
// Structured logging enables easy filtering in Appwrite Console
class FunctionLogger {
  private start = Date.now()

  constructor(private log: Function, private errorFn: Function) {}

  info(msg: string, extra = {}) {
    this.log(JSON.stringify({
      level: 'info', msg, ms: Date.now() - this.start, ...extra
    }))
  }

  error(msg: string, err?: unknown, extra = {}) {
    this.errorFn(JSON.stringify({
      level: 'error', msg,
      err: err instanceof Error ? { message: err.message } : String(err),
      ...extra
    }))
  }
}

export default async ({ req, res, log, error }) => {
  const logger = new FunctionLogger(log, error)
  logger.info('Invoked', { method: req.method })

  try {
    const result = await processRequest(req)
    logger.info('Success', { items: result.length })
    return res.json({ data: result })
  } catch (err) {
    logger.error('Failed', err)
    return res.json({ error: 'Internal server error' }, 500)
  }
}
```

---

## Monitoring Checklist

- [ ] Separate Appwrite project for testing (not production)
- [ ] Integration tests clean up all created documents in `afterEach`
- [ ] Unit tests mock the Appwrite SDK — no network calls
- [ ] Function logs include execution duration and request context
- [ ] Budget alerts configured in Appwrite Cloud Console
- [ ] Usage dashboard reviewed weekly during growth phase
- [ ] Function timeout set per-function based on workload (not one-size-fits-all)
- [ ] Error logs structured as JSON for easy parsing
- [ ] CI/CD pipeline runs tests before each deployment
