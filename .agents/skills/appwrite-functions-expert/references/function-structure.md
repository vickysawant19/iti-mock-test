# Appwrite Function Structure & Context API

## The Function Handler Signature

All Appwrite Functions receive a single context object:

```typescript
// TypeScript / Node.js
export default async (context: {
  req:   AppwriteRequest
  res:   AppwriteResponse
  log:   (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}): Promise<AppwriteResponseResult> => {
  // your code
}
```

---

## Request Object (`req`)

```typescript
interface AppwriteRequest {
  body:      string                    // Raw body string — parse with JSON.parse()
  headers:   Record<string, string>    // Lowercase header names
  method:    string                    // 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path:      string                    // URL path, e.g. '/api/v1/users'
  query:     Record<string, string>    // Parsed query params
  scheme:    string                    // 'https'
  host:      string                    // Host header value
  port:      number                    // 443
  url:       string                    // Full request URL
  bodyBinary: Uint8Array               // Raw binary body
  bodyText:  string                    // Alias for body
  bodyJson:  Record<string, unknown>   // Pre-parsed JSON (if content-type is JSON)
  bodyRaw:   Uint8Array                // Alias for bodyBinary
}
```

### Accessing Common Data
```typescript
export default async ({ req, res, log }) => {
  // JSON body
  const data = JSON.parse(req.body)                    // manual parse
  const data = req.bodyJson                            // pre-parsed (Node.js 20+)

  // Query parameters
  const page = req.query.page ?? '1'
  const limit = parseInt(req.query.limit ?? '10')

  // Headers (always lowercase)
  const auth    = req.headers['authorization']
  const ct      = req.headers['content-type']
  const userJwt = req.headers['x-appwrite-user-jwt']  // user JWT from Appwrite session

  // Request method routing
  if (req.method === 'GET')    return handleGet(req, res)
  if (req.method === 'POST')   return handlePost(req, res)
  if (req.method === 'DELETE') return handleDelete(req, res)
  return res.json({ error: 'Method not allowed' }, 405)
}
```

---

## Response Object (`res`)

```typescript
// Return JSON response
return res.json(data: unknown, status?: number, headers?: Record<string,string>)

// Return plain text
return res.send(body: string, status?: number, headers?: Record<string,string>)

// Return empty response (204 No Content)
return res.empty()

// Return binary
return res.binary(bytes: Uint8Array, status?: number, headers?: Record<string,string>)

// Redirect
return res.redirect(url: string, status?: number) // status defaults to 301
```

### Response Examples
```typescript
// 200 OK with JSON
return res.json({ success: true, data: result })

// 201 Created
return res.json({ id: newItem.$id }, 201)

// 400 Bad Request
return res.json({ error: 'Missing required field: email' }, 400)

// 401 Unauthorized
return res.json({ error: 'Authentication required' }, 401)

// 204 No Content (delete operations)
return res.empty()

// Redirect
return res.redirect('https://yourapp.com/success', 302)

// Custom headers (e.g., for CORS)
return res.json({ ok: true }, 200, {
  'Access-Control-Allow-Origin': 'https://yourapp.com',
  'Cache-Control': 'no-store',
})
```

---

## Logging & Observability

```typescript
export default async ({ req, res, log, error }) => {
  // log() — shows in Console function logs (info level)
  log('Request received', req.method, req.path)
  log(JSON.stringify({ userId: req.query.userId, action: 'fetch' }))

  // error() — shows in Console function logs (error level, highlighted)
  error('Database query failed', errorDetails)

  // ✗ console.log — does NOT appear in Appwrite Console
  // console.log('This is invisible in Appwrite')
}
```

---

## HTTP API Function Pattern (Express-like routing)

```typescript
// Multi-route function using path-based routing
export default async ({ req, res, log, error }) => {
  const path   = req.path
  const method = req.method

  // CORS preflight
  if (method === 'OPTIONS') {
    return res.send('', 204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
  }

  // Route: GET /users
  if (method === 'GET' && path === '/users') {
    return handleListUsers(req, res, log, error)
  }

  // Route: POST /users
  if (method === 'POST' && path === '/users') {
    return handleCreateUser(req, res, log, error)
  }

  // Route: GET /users/:id (with path param)
  const userMatch = path.match(/^\/users\/([a-z0-9-]+)$/)
  if (method === 'GET' && userMatch) {
    return handleGetUser(req, res, log, error, userMatch[1])
  }

  return res.json({ error: 'Not found' }, 404)
}

async function handleListUsers(req, res, log, error) {
  try {
    const users = await usersService.list(parseInt(req.query.limit ?? '25'))
    log(`Listed ${users.total} users`)
    return res.json({ users: users.users, total: users.total })
  } catch (err) {
    error(`handleListUsers failed: ${err.message}`)
    return res.json({ error: 'Failed to list users' }, 500)
  }
}
```

---

## Receiving Event Payloads (Non-HTTP Triggers)

When a Function is triggered by an Appwrite event (not HTTP), `req.body` contains the event payload:

```typescript
export default async ({ req, res, log }) => {
  // For event-triggered functions, req.body is the event document
  const payload = JSON.parse(req.body)

  // Event metadata is in req.headers
  const eventType   = req.headers['x-appwrite-event']
  // e.g., "databases.DB_ID.collections.COL_ID.documents.DOC_ID.create"

  log(`Event: ${eventType}`)
  log(`Payload: ${JSON.stringify(payload)}`)

  // Process based on event type
  if (eventType?.includes('.create')) {
    await handleCreate(payload)
  } else if (eventType?.includes('.update')) {
    await handleUpdate(payload)
  }

  return res.empty() // events don't need a response body
}
```

---

## Accessing Appwrite Services from Functions

```typescript
// Server-side access — use API key (NOT session-based client)
const serverClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(serverClient)
const storage   = new Storage(serverClient)
const users     = new Users(serverClient)
const messaging = new Messaging(serverClient)

// Act on behalf of a user (preserves their permissions)
const userClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setJWT(req.headers['x-appwrite-user-jwt']!) // user JWT from client
const userDatabases = new Databases(userClient) // operations run as the user
```

---

## Function Configuration (appwrite.json)

```json
{
  "functions": [
    {
      "functionId": "process-payment",
      "name": "Process Payment",
      "runtime": "node-20.0",
      "path": "functions/process-payment",
      "entrypoint": "src/main.js",
      "buildCommand": "npm install && npm run build",
      "execute": ["any"],
      "events": [],
      "schedule": "",
      "timeout": 30,
      "enabled": true,
      "logging": true,
      "scopes": ["databases.read", "databases.write"],
      "vars": [
        { "key": "STRIPE_WEBHOOK_SECRET", "value": "" }
      ]
    }
  ]
}
```

### Specification Settings (CPU/RAM)
```
Navigate: Appwrite Console → Function → Settings → Runtime

Recommended specs:
  Small jobs (email, notifications):    0.5 vCPU, 256MB RAM
  Standard API functions:               1 vCPU, 512MB RAM
  Image processing, heavy compute:      2 vCPU, 2GB RAM
  ML inference, large data processing:  4 vCPU, 4GB RAM
```
