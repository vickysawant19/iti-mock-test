# Appwrite Server-Side Authentication & JWT

## Server-Side Client Setup

```typescript
// node-appwrite (NOT the browser 'appwrite' package)
import { Client, Users, Databases, Account } from 'node-appwrite'

// Admin client — full API key access
const adminClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)   // Server-only! Never client-side.

// User-scoped client — respects user's permissions
function createUserClient(jwt: string) {
  return new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setJWT(jwt) // User JWT — operations run as the user
}
```

---

## JWT-Based Auth in Functions

```typescript
// Client: generate JWT and send with requests
const jwt = await account.createJWT()
// JWT valid for 15 minutes

// Send to Function
await functions.createExecution(
  'my-function',
  JSON.stringify({ action: 'create-post', title: 'Hello' }),
  false,
  '/',
  ExecutionMethod.Post,
  { 'x-appwrite-user-jwt': jwt.jwt } // pass JWT in header
)
```

```typescript
// Function: verify JWT and act as user
export default async ({ req, res, error }) => {
  const jwt = req.headers['x-appwrite-user-jwt']

  if (!jwt) {
    return res.json({ error: 'Authentication required' }, 401)
  }

  try {
    // Create user-scoped client from JWT
    const userClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setJWT(jwt)

    // Verify JWT by fetching account — throws 401 if invalid
    const userAccount = new Account(userClient)
    const user = await userAccount.get()

    // Now operate with user's permissions
    const userDatabases = new Databases(userClient)
    const body = JSON.parse(req.body)

    // Documents created here respect the user's session permissions
    const doc = await userDatabases.createDocument(
      process.env.DATABASE_ID!, 'posts', ID.unique(),
      { title: body.title, authorId: user.$id },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ]
    )

    return res.json({ success: true, postId: doc.$id })
  } catch (err) {
    if ((err as AppwriteException).code === 401) {
      return res.json({ error: 'Invalid or expired token' }, 401)
    }
    error(`JWT auth error: ${(err as Error).message}`)
    return res.json({ error: 'Internal server error' }, 500)
  }
}
```

---

## Server-Side User Management (Admin API)

```typescript
import { Users, ID, Query } from 'node-appwrite'

const usersService = new Users(adminClient)

// Create user (server-side — bypasses client restrictions)
const user = await usersService.create(
  ID.unique(),
  'user@example.com',  // email
  undefined,           // phone
  'SecurePass!1',      // password
  'Jane Doe'           // name
)

// List users with search/filter
const users = await usersService.list([
  Query.search('query', 'john'),
  Query.equal('emailVerification', true),
  Query.limit(25),
])

// Get user by ID
const user = await usersService.get(userId)

// Get user by email
const users = await usersService.list([Query.equal('email', 'user@example.com')])
const user = users.users[0]

// Update user details
await usersService.updateName(userId, 'New Name')
await usersService.updateEmail(userId, 'new@example.com')
await usersService.updatePassword(userId, 'NewSecurePass!2')
await usersService.updatePhone(userId, '+1234567890')

// Manage email/phone verification
await usersService.updateEmailVerification(userId, true)  // mark as verified
await usersService.updatePhoneVerification(userId, true)

// Assign labels (for label-based permissions)
await usersService.updateLabels(userId, ['admin', 'beta'])

// Block/unblock user
await usersService.updateStatus(userId, false) // false = blocked
await usersService.updateStatus(userId, true)  // true = active

// Delete user
await usersService.delete(userId)

// List user's sessions
const sessions = await usersService.listSessions(userId)

// Delete all sessions (force logout)
await usersService.deleteSessions(userId)

// Delete specific session
await usersService.deleteSession(userId, sessionId)
```

---

## Session Management (Client-Side)

```typescript
// List all active sessions
const sessions = await account.listSessions()
// Sessions include: device, IP, geo, createdAt, expiresAt

// Get current session details
const current = await account.getSession('current')
console.log(current.provider, current.ip, current.countryName)

// Delete current session (logout)
await account.deleteSession('current')

// Delete a specific session (logout from device)
await account.deleteSession(sessionId)

// Delete ALL sessions (logout from everywhere)
const { sessions } = await account.listSessions()
await Promise.all(sessions.map(s => account.deleteSession(s.$id)))
```

---

## MFA (Multi-Factor Authentication)

```typescript
// Step 1: Enable MFA for the account
await account.updateMFA(true)

// Step 2: Add TOTP authenticator
const totp = await account.createMfaAuthenticator(AuthenticatorType.Totp)
// totp.secret = TOTP secret to show user (for authenticator app QR code)
// totp.uri    = otpauth:// URI for QR code

// Step 3: Verify TOTP to confirm setup
await account.updateMfaAuthenticator(
  AuthenticatorType.Totp,
  totpCode // 6-digit code from user's authenticator app
)

// Step 4: Generate recovery codes
const recoveryCodes = await account.createMfaRecoveryCodes()
// Show these to user ONCE — cannot be retrieved again

// Login flow when MFA is enabled:
// 1. Create email/password session (returns 401 with mfa_required if MFA enabled)
// 2. List available MFA factors
const factors = await account.listMfaFactors()
// 3. Create MFA challenge
const challenge = await account.createMfaChallenge(AuthenticationFactor.Totp)
// 4. Verify challenge with TOTP code
await account.updateMfaChallenge(challenge.$id, totpCode)
// 5. Session is now fully authenticated
```

---

## Auth State Persistence Strategies

```typescript
// Web: Appwrite uses httpOnly cookies automatically — no extra setup
// The session cookie is set by Appwrite after createEmailPasswordSession()

// React Native / Mobile: Sessions persist in memory
// On app restart, check if session is still valid:
async function initializeAuth() {
  try {
    const user = await account.get()
    return user  // Valid session
  } catch (err) {
    if ((err as AppwriteException).code === 401) {
      return null  // Session expired — show login screen
    }
    throw err
  }
}

// ✅ NextJS App Router: Server-side session check
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('a_session')  // Appwrite session cookie
  if (!sessionCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}
```

---

## Session Security Best Practices

```
1. Session cookies are httpOnly and Secure by default — don't store JWTs in localStorage
2. JWTs expire in 15 minutes — generate fresh JWT before each sensitive operation
3. Force logout on suspicious activity: usersService.deleteSessions(userId)
4. Check emailVerification before allowing sensitive actions:
     if (!user.emailVerification) redirect('/verify-email')
5. Implement MFA for admin accounts and sensitive operations
6. Monitor and audit sessions: review usersService.listSessions(userId) periodically
7. Configure session length in Appwrite Console → Auth → Security Settings
8. For APIs: prefer JWT over session cookies — JWTs are stateless and easier to validate
```
