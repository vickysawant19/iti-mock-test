# Appwrite Session Management

## Session Lifecycle

```
Create Account → Create Session → Use Session → Refresh (auto) → Delete Session
```

## Session Configuration (Appwrite Console)

```
Console → Auth → Security Settings:
  Session Length:   24 hours (default), up to 1 year
  Session Limit:    10 concurrent sessions per user (configurable)
  Session Alerts:   Email notification on new session (recommended)
```

---

## Session Operations

```typescript
// Create session (login)
const session = await account.createEmailPasswordSession(email, password)
console.log(session.$id, session.provider, session.expire)

// Get current session info
const current = await account.getSession('current')
console.log({
  id:          current.$id,
  provider:    current.provider,       // 'email' | 'google' | etc.
  ip:          current.ip,
  country:     current.countryName,
  device:      current.deviceName,
  os:          current.osName,
  expire:      current.expire,
  createdAt:   current.$createdAt,
})

// List all active sessions
const { sessions } = await account.listSessions()
// Each session has: $id, provider, ip, deviceName, osName, expire, $createdAt

// Delete specific session (logout one device)
await account.deleteSession(sessionId)

// Delete current session (logout current device)
await account.deleteSession('current')

// Delete ALL sessions (logout from every device)
const { sessions } = await account.listSessions()
await Promise.all(sessions.map(s => account.deleteSession(s.$id)))
```

---

## Detecting Active Authentication

```typescript
// ✅ Pattern: check auth on app start, handle gracefully
class AuthService {
  private _user: Models.User<Models.Preferences> | null = null

  get user() { return this._user }
  get isAuthenticated() { return this._user !== null }

  async initialize(): Promise<void> {
    try {
      this._user = await account.get()
    } catch (err) {
      if ((err as AppwriteException).code === 401) {
        this._user = null // No active session — show login
      } else {
        throw err // Network error or other issue
      }
    }
  }

  async logout(): Promise<void> {
    await account.deleteSession('current')
    this._user = null
  }
}

// React example
function App() {
  const [user, setUser] = useState<Models.User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen />
  return user ? <AuthenticatedApp user={user} /> : <LoginScreen />
}
```

---

## Session Persistence in Different Environments

### Web (Browser)
```
Appwrite uses httpOnly, Secure cookies automatically.
No localStorage, no manual token storage needed.
Session survives page refreshes and browser restarts.
```

### React Native / Mobile
```typescript
// Sessions are in-memory — need to handle app restart
// Use SecureStore (Expo) or AsyncStorage to persist session
import * as SecureStore from 'expo-secure-store'

// After login — persist session info
const session = await account.createEmailPasswordSession(email, password)
await SecureStore.setItemAsync('session_id', session.$id)

// On app restart — check if session is still valid
const savedSessionId = await SecureStore.getItemAsync('session_id')
if (savedSessionId) {
  try {
    await account.getSession(savedSessionId)
    const user = await account.get()
    // Valid session — proceed
  } catch {
    // Session expired — show login
    await SecureStore.deleteItemAsync('session_id')
  }
}
```

### Next.js (SSR / App Router)
```typescript
// Server Component — check session server-side
// pages/api/me.ts or app/api/me/route.ts
import { cookies } from 'next/headers'
import { Client, Account } from 'node-appwrite'

export async function GET() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('a_session')?.value  // Appwrite session cookie name

  if (!sessionCookie) {
    return Response.json({ user: null }, { status: 401 })
  }

  // Verify session server-side
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!)
    .setSession(sessionCookie)  // Set the session cookie value

  try {
    const account = new Account(client)
    const user = await account.get()
    return Response.json({ user })
  } catch {
    return Response.json({ user: null }, { status: 401 })
  }
}
```

---

## Session Security Practices

```typescript
// ✅ Show user their active sessions — let them revoke suspicious ones
async function getActiveSessions() {
  const { sessions } = await account.listSessions()
  return sessions.map(s => ({
    id:        s.$id,
    isCurrent: s.current,
    device:    `${s.deviceName} (${s.osName})`,
    location:  `${s.countryName} — ${s.ip}`,
    signedIn:  new Date(s.$createdAt).toLocaleDateString(),
    expires:   new Date(s.expire).toLocaleDateString(),
    provider:  s.provider,
  }))
}

// ✅ Security action: revoke all OTHER sessions (keep current)
async function signOutOtherDevices() {
  const { sessions } = await account.listSessions()
  const otherSessions = sessions.filter(s => !s.current)
  await Promise.all(otherSessions.map(s => account.deleteSession(s.$id)))
}

// ✅ Require re-authentication for sensitive actions
async function requireRecentAuth(maxAgeMinutes = 15): Promise<boolean> {
  const session = await account.getSession('current')
  const sessionAge = (Date.now() - new Date(session.$createdAt).getTime()) / 60_000
  return sessionAge <= maxAgeMinutes
}
```
