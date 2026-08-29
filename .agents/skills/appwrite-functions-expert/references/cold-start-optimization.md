# Cold Start Optimization for Appwrite Functions

## What Causes Cold Starts

A cold start occurs when Appwrite needs to spin up a fresh container for your function
because no warm container is available. During a cold start:

1. Container image pulled (if not cached)
2. Runtime initialized (Node.js, Python, etc.)
3. Dependencies loaded
4. **Your module-level code executed**
5. Request handler called

Warm starts skip steps 1–4 — only step 5 runs.

---

## Runtime Cold Start Comparison

```
Fastest cold starts:
  1. Bun 1.x          ~50-100ms
  2. Go 1.21          ~50-150ms (compiled binary)
  3. C++ 17           ~20-50ms  (compiled binary)
  4. Dart 3.x         ~100-200ms (AOT compiled)
  5. Node.js 20       ~200-400ms (bundled with ESBuild)
  6. Deno 1.x         ~200-400ms

Slower cold starts:
  7. Python 3.11      ~400-800ms (+ slow import of heavy libs)
  8. PHP 8.2          ~300-600ms
  9. Ruby 3.3         ~500-1000ms
  10. Swift 5.9       ~200-400ms (compiled)
  11. Kotlin 1.9      ~800-1500ms (JVM startup)
  12. Java 21         ~1000-2000ms (JVM startup)
```

---

## Optimization Techniques

### 1. Initialize at Module Level (Most Impactful)
```typescript
// ✅ Created once per container — survives all warm invocations
import { Client, Databases, Storage } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

export const databases = new Databases(client)
export const storage   = new Storage(client)

// Pre-load any config or static data
const CONFIG = {
  databaseId:   process.env.DATABASE_ID!,
  postsColId:   process.env.POSTS_COLLECTION_ID!,
}

// Handler is called on EVERY invocation
export default async ({ req, res }) => {
  // Uses pre-initialized `databases` and `CONFIG` — no setup overhead
  const posts = await databases.listDocuments(CONFIG.databaseId, CONFIG.postsColId)
  return res.json(posts)
}
```

### 2. Bundle with ESBuild (Node.js)
```json
// package.json — bundle to single file = fewer module reads on startup
{
  "scripts": {
    "build": "esbuild src/main.ts --bundle --outfile=dist/main.js --platform=node --target=node20 --minify"
  }
}
```

```json
// appwrite.json
{
  "entrypoint": "dist/main.js",
  "buildCommand": "npm ci && npm run build"
}
```

Effect: reduces startup module resolution from potentially 100+ files to 1 file.

### 3. Lazy Load Heavy Dependencies
```typescript
// ✅ Only load heavy libs when they're actually needed
let sharpInstance: typeof import('sharp') | null = null

async function getSharp() {
  if (!sharpInstance) {
    sharpInstance = (await import('sharp')).default
  }
  return sharpInstance
}

export default async ({ req, res, log }) => {
  const path = req.path

  if (path === '/resize') {
    const sharp = await getSharp() // loaded only for image routes
    // ... image processing
  }

  return res.json({ ok: true })
}
```

### 4. Reuse HTTP/DB Connections
```typescript
// ✅ Connection pool at module level — reused across warm invocations
import { createPool } from 'mysql2/promise'
import { createClient } from 'redis'

// MySQL connection pool — survives warm invocations
const pool = createPool({
  host:             process.env.DB_HOST,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  database:         process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
})

// Redis client — reconnects if dropped, but stays warm
const redis = createClient({ url: process.env.REDIS_URL })
await redis.connect()

export default async ({ req, res }) => {
  // pool.query() reuses existing connections — no new TCP handshake
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.query.id])
  return res.json(rows[0])
}
```

### 5. Choose Compiled Runtimes for Latency-Critical Functions
```
If your function is:
  - User-facing (< 200ms response expected)   → Go, Bun, or Dart
  - Background processing (latency flexible)  → Python or Node.js
  - Mixed team, prefer Node.js ecosystem       → Node.js 20 + ESBuild bundle
```

---

## Keep-Warm Strategy

> ⚠️ Use judiciously — pinging functions purely to keep them warm may violate
> free-tier fair-use policies. Only apply for genuinely latency-critical functions.

```typescript
// Scheduled "ping" function — runs every 5 minutes to keep target warm
// Function config: schedule: "*/5 * * * *"
export default async ({ req, res, log }) => {
  const targetFunctionId = process.env.TARGET_FUNCTION_ID!

  const execution = await functions.createExecution(
    targetFunctionId,
    JSON.stringify({ _warmup: true }),
    false, '/', ExecutionMethod.Get
  )

  log(`Warmed up ${targetFunctionId}: ${execution.status}`)
  return res.json({ warmed: true })
}

// In the target function — skip processing for warmup pings
export default async ({ req, res }) => {
  const body = JSON.parse(req.body || '{}')
  if (body._warmup) return res.json({ warm: true }) // fast-path

  // ... actual processing
}
```

---

## Memory & CPU Sizing

```
Too little CPU:    Function times out on moderate workloads
Too much CPU:      Unnecessary cost
Too little RAM:    OOM crash, undefined behavior
Too much RAM:      Unnecessary cost

Sizing guide (Appwrite Console → Function → Settings → Runtime):
  ┌─────────────────────────────────────┬─────────────┬──────────┐
  │ Workload                            │ CPU         │ RAM      │
  ├─────────────────────────────────────┼─────────────┼──────────┤
  │ Simple CRUD / email / notifications │ 0.5 vCPU   │ 256 MB   │
  │ Standard API / webhooks             │ 1 vCPU     │ 512 MB   │
  │ PDF generation / data transforms    │ 1 vCPU     │ 1 GB     │
  │ Image processing (sharp/pillow)     │ 2 vCPU     │ 2 GB     │
  │ ML inference (small models)         │ 2 vCPU     │ 4 GB     │
  │ Heavy compute / large datasets      │ 4 vCPU     │ 4+ GB    │
  └─────────────────────────────────────┴─────────────┴──────────┘
```

---

## Timeout Configuration

```json
{
  "timeout": 15   // default — good for API functions
  "timeout": 30   // webhook/payment processing
  "timeout": 300  // long-running jobs (report generation, bulk imports)
  "timeout": 900  // maximum supported — heavy compute only
}
```

---

## Cold Start Checklist

- [ ] Appwrite Client initialized at module level (not inside handler)
- [ ] Database/cache connections initialized at module level
- [ ] ESBuild bundle configured for Node.js functions
- [ ] Heavy dependencies (sharp, pandas, etc.) lazy-loaded if not always needed
- [ ] Correct runtime selected for latency requirements
- [ ] CPU and RAM sized appropriately for workload
- [ ] Timeout set per-function based on expected execution time
- [ ] Keep-warm strategy applied only for user-facing latency-critical functions
