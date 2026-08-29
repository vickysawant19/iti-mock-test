# Appwrite Authentication Flows

## Email & Password Authentication

```typescript
import { Client, Account, ID, AppwriteException } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

const account = new Account(client)

// Registration with validation
async function register(email: string, password: string, name: string) {
  // Validate password strength before sending to Appwrite
  if (password.length < 8) throw new Error('Password must be at least 8 characters')
  if (!/[A-Z]/.test(password)) throw new Error('Password must contain an uppercase letter')
  if (!/[0-9]/.test(password)) throw new Error('Password must contain a number')

  try {
    await account.create(ID.unique(), email, password, name)
    // Auto-login after registration
    await account.createEmailPasswordSession(email, password)
    return await account.get()
  } catch (err) {
    if (err instanceof AppwriteException) {
      if (err.code === 409) throw new Error('An account with this email already exists')
      if (err.code === 400) throw new Error('Invalid email or password format')
    }
    throw err
  }
}

// Login
async function login(email: string, password: string) {
  try {
    await account.createEmailPasswordSession(email, password)
    return await account.get()
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 401) {
      throw new Error('Invalid email or password')
    }
    throw err
  }
}

// Logout current session
async function logout() {
  await account.deleteSession('current')
}

// Get current user (null if not authenticated)
async function getCurrentUser() {
  try {
    return await account.get()
  } catch {
    return null
  }
}
```

---

## Magic Link (Email OTP) — No Password Required

```typescript
// Step 1: Send magic link to email
async function sendMagicLink(email: string) {
  const token = await account.createMagicURLToken(
    ID.unique(),          // userId — use ID.unique() for new users
    email,
    'https://yourapp.com/auth/magic-callback', // success redirect URL
    false                 // phrase: false = standard link, true = 6-digit code
  )
  return token // token.$id needed for verification step
}

// Step 2: Verify the magic link token (from URL params after redirect)
async function verifyMagicLink(userId: string, secret: string) {
  // These come from the redirect URL query params: ?userId=...&secret=...
  const session = await account.createSession(userId, secret)
  return session
}

// Usage in callback handler (e.g., Next.js app router)
// app/auth/magic-callback/page.tsx
async function MagicCallbackPage({ searchParams }) {
  const { userId, secret } = searchParams
  if (userId && secret) {
    await account.createSession(userId, secret)
    redirect('/dashboard')
  }
  return <div>Invalid or expired link</div>
}
```

---

## Phone OTP Authentication

```typescript
// Step 1: Send OTP to phone number
async function sendPhoneOTP(phone: string) {
  // phone must be in E.164 format: +1234567890
  const token = await account.createPhoneToken(
    ID.unique(), // userId
    phone        // E.164 format
  )
  return token.$id // store this userId for verification
}

// Step 2: Verify OTP code entered by user
async function verifyPhoneOTP(userId: string, otp: string) {
  const session = await account.createSession(userId, otp)
  return session
}

// Full React flow example
function PhoneAuthFlow() {
  const [userId, setUserId] = useState<string>('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')

  async function handlePhoneSubmit(phone: string) {
    const token = await sendPhoneOTP(phone)
    setUserId(token) // In practice, Appwrite returns the userId from the token
    setStep('otp')
  }

  async function handleOTPSubmit(code: string) {
    await verifyPhoneOTP(userId, code)
    // Session is now active — redirect to app
  }
}
```

---

## Anonymous Sessions

```typescript
// Create a session without any credentials — great for "try before you sign up"
async function startAnonymousSession() {
  const session = await account.createAnonymousSession()
  return session
}

// Convert anonymous user to permanent account (preserves all data)
async function convertAnonymousToPermanent(email: string, password: string) {
  // User remains logged in — their data stays linked to the same userId
  await account.updateEmail(email, password)
  // Now set a password
  await account.updatePassword(password)
}
```

---

## Email Verification Flow

```typescript
// Send verification email
async function sendEmailVerification() {
  await account.createVerification(
    'https://yourapp.com/auth/verify-email' // redirect after clicking link
  )
}

// Verify from redirect URL params
async function confirmEmailVerification(userId: string, secret: string) {
  await account.updateVerification(userId, secret)
}

// Check if email is verified
async function isEmailVerified(): Promise<boolean> {
  const user = await account.get()
  return user.emailVerification
}
```

---

## Password Reset Flow

```typescript
// Step 1: Request password reset
async function requestPasswordReset(email: string) {
  await account.createRecovery(
    email,
    'https://yourapp.com/auth/reset-password' // redirect URL
  )
}

// Step 2: Set new password (from URL params: ?userId=...&secret=...)
async function confirmPasswordReset(
  userId: string,
  secret: string,
  newPassword: string
) {
  await account.updateRecovery(userId, secret, newPassword)
}
```

---

## Update Account Details

```typescript
// Update display name
await account.updateName('New Name')

// Update email (requires current password)
await account.updateEmail('new@email.com', 'currentPassword')

// Update password
await account.updatePassword('newSecurePass!1', 'oldPassword')

// Update user preferences (arbitrary JSON)
await account.updatePrefs({
  theme:         'dark',
  language:      'en',
  emailDigest:   true,
  onboarding:    { completed: true, step: 5 },
})

// Read preferences
const user = await account.get()
const prefs = user.prefs as { theme: string; language: string }
```

---

## Auth State Management (React Context)

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { Models } from 'appwrite'

interface AuthContextType {
  user:    Models.User<Models.Preferences> | null
  loading: boolean
  login:   (email: string, password: string) => Promise<void>
  logout:  () => Promise<void>
  register:(email: string, password: string, name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    await account.createEmailPasswordSession(email, password)
    setUser(await account.get())
  }

  const logout = async () => {
    await account.deleteSession('current')
    setUser(null)
  }

  const register = async (email: string, password: string, name: string) => {
    await account.create(ID.unique(), email, password, name)
    await login(email, password)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```
