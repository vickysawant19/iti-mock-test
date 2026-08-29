# Appwrite Security & Permissions Best Practices

## Permission System Overview

Appwrite uses a role-based permission system. Every resource (document, file, function) has
an array of permission strings controlling `read`, `create`, `update`, and `delete` access.

### Role Reference
```typescript
// Who can perform the action:
Role.any()              // Everyone — including unauthenticated guests
Role.users()            // Any logged-in user
Role.user('USER_ID')    // Specific user by ID
Role.team('TEAM_ID')    // Any member of a team
Role.team('TEAM_ID', 'owner') // Team members with role 'owner'
Role.guests()           // Unauthenticated users only
Role.label('admin')     // Users with label 'admin' (requires server-side labeling)
```

### Permission Actions
```typescript
Permission.read(role)     // Query/view the resource
Permission.create(role)   // Create new resources (collection-level only)
Permission.update(role)   // Modify existing resources
Permission.delete(role)   // Remove resources
```

---

## Collection vs Document-Level Permissions

```
Collection Permissions = Default permissions for all documents
Document Permissions   = Override per-document (only when document_security: true)
```

```typescript
// STEP 1: Create collection with sensible defaults + enable document security
await databases.createCollection(
  DATABASE_ID, ID.unique(), 'posts',
  [
    Permission.read(Role.any()),          // Anyone can list posts
    Permission.create(Role.users()),      // Logged-in users can create
    // NO update/delete at collection level — force doc-level security
  ],
  true // ← document_security MUST be true for per-document perms to work
)

// STEP 2: Set specific permissions when creating each document
await databases.createDocument(
  DATABASE_ID, 'posts', ID.unique(),
  { title: 'My Post', content: '...' },
  [
    Permission.read(Role.any()),               // Public read
    Permission.update(Role.user(currentUserId)), // Only author can update
    Permission.delete(Role.user(currentUserId)), // Only author can delete
  ]
)
```

> ⚠️ **Critical**: If `document_security` is `false`, document-level permissions are
> completely ignored. The collection permissions apply to ALL documents.

---

## Common Permission Patterns

### Public Blog / CMS
```typescript
// Collection: public read, authenticated create
[Permission.read(Role.any()), Permission.create(Role.users())]

// Each document: public read, author update/delete
[
  Permission.read(Role.any()),
  Permission.update(Role.user(authorId)),
  Permission.delete(Role.user(authorId)),
]
```

### Private User Data (Profile, Settings)
```typescript
// Collection: no public read
[Permission.create(Role.users())]

// Each document: user-only access
[
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]
```

### Team / Organization Data
```typescript
// Collection: team-managed
[
  Permission.read(Role.team(teamId)),
  Permission.create(Role.team(teamId, 'member')),
]

// Documents: read by all members, write by owners only
[
  Permission.read(Role.team(teamId)),
  Permission.update(Role.team(teamId, 'owner')),
  Permission.delete(Role.team(teamId, 'owner')),
]
```

### Admin-Only Data
```typescript
// Use server-side label assignment
await users.updateLabels(userId, ['admin']) // Server-side only!

// Collection: admin-gated write
[
  Permission.read(Role.any()),
  Permission.create(Role.label('admin')),
  Permission.update(Role.label('admin')),
  Permission.delete(Role.label('admin')),
]
```

---

## API Key Security

### Scope Principle of Least Privilege
```
❌ WRONG: Create API key with all scopes enabled
✅ RIGHT: Enable only the exact scopes your function/service needs

Example for a read-only analytics service:
  ✓ databases.read
  ✗ databases.write
  ✗ users.read
  ✗ storage.write
```

### Key Rotation Policy
```typescript
// Best practice: rotate API keys every 30-90 days
// Set expiry when creating keys in Appwrite Console:
//   Settings → API Keys → Create API Key → Set Expiration

// In code: use env vars so rotation only requires env update
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!) // Updated via env, no code change
```

---

## Authentication Security Patterns

### Never Trust Client-Side User Data
```typescript
// ❌ BAD: Trusting userId from request body in a Function
export default async ({ req, res }) => {
  const { userId, data } = JSON.parse(req.body)
  // userId came from client — could be forged!
  await databases.createDocument(db, col, ID.unique(), { ...data, userId })
}

// ✅ GOOD: Always extract userId from verified session header
export default async ({ req, res }) => {
  const jwt = req.headers['x-appwrite-user-jwt']
  // Verify JWT to get real userId — or use Appwrite Users service
  const userClient = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setJWT(jwt)
  const account = new Account(userClient)
  const user = await account.get()         // verified userId
  await databases.createDocument(db, col, ID.unique(),
    { ...data, userId: user.$id }           // trusted source
  )
}
```

### OAuth Provider Setup
```typescript
// Configure OAuth in Appwrite Console → Auth → OAuth2 providers
// In code — no secrets needed client-side:
const account = new Account(client)
await account.createOAuth2Session(
  OAuthProvider.Google,
  'https://yourapp.com/auth/callback',    // success redirect
  'https://yourapp.com/auth/failure',     // failure redirect
)
```

### Session Management
```typescript
// ✅ Always check session validity before sensitive operations
try {
  const user = await account.get()
  // proceed with authenticated operation
} catch (error) {
  if (error.code === 401) {
    // redirect to login
    await account.deleteSession('current')
  }
}

// ✅ List and revoke stale sessions
const sessions = await account.listSessions()
for (const session of sessions.sessions) {
  if (isExpired(session)) {
    await account.deleteSession(session.$id)
  }
}
```

---

## Input Validation & Sanitization in Functions

```typescript
// ✅ Always validate inputs in Functions — never trust raw req.body
export default async ({ req, res, log, error }) => {
  let body: unknown
  try {
    body = JSON.parse(req.body || '{}')
  } catch {
    return res.json({ error: 'Invalid JSON body' }, 400)
  }

  // Type guard / validation
  if (!isValidCreatePostPayload(body)) {
    return res.json({ error: 'Missing required fields: title, content' }, 400)
  }

  const { title, content } = body as CreatePostPayload

  // Sanitize string lengths
  if (title.length > 255 || content.length > 10_000) {
    return res.json({ error: 'Input too long' }, 400)
  }

  // Process safely...
}

interface CreatePostPayload {
  title: string
  content: string
}

function isValidCreatePostPayload(data: unknown): data is CreatePostPayload {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return typeof d.title === 'string' && typeof d.content === 'string'
}
```

---

## Storage Bucket Security

```typescript
// ✅ Configure bucket with security settings
await storage.createBucket(
  ID.unique(),
  'user-uploads',
  [
    Permission.create(Role.users()),     // Only logged-in users upload
    Permission.read(Role.any()),         // Public read (for profile pics etc.)
  ],
  true,                                  // file_security: per-file permissions
  true,                                  // enabled
  5 * 1024 * 1024,                       // max 5MB
  ['jpg', 'jpeg', 'png', 'webp', 'gif'], // allowed extensions
  Compression.Gzip,                      // compression
  true,                                  // encryption
  true                                   // antivirus
)

// ✅ Set per-file permissions on upload
await storage.createFile(
  BUCKET_ID, ID.unique(),
  InputFile.fromPath('./avatar.png', 'avatar.png'),
  [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
)
```

---

## Security Checklist

- [ ] API keys never in client-side code (frontend, mobile apps)
- [ ] API keys scoped to minimum required permissions
- [ ] API keys have expiry dates set
- [ ] `document_security: true` on all user-owned collections
- [ ] Per-document permissions set on sensitive documents
- [ ] Function inputs validated and sanitized
- [ ] `userId` extracted from verified JWT — never from request body
- [ ] Storage buckets have `encryption: true` for sensitive data
- [ ] Storage buckets have `antivirus: true`
- [ ] `maximum_file_size` and `allowed_file_extensions` set on every bucket
- [ ] OAuth redirect URLs whitelisted in Appwrite Console
- [ ] Environment variables used for all secrets (no hardcoding)
- [ ] Functions use least-privilege API keys
- [ ] Audit logs reviewed periodically (Appwrite Console → Health)
