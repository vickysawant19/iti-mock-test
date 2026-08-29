# Appwrite OAuth2 Providers

## Supported Providers (30+)

```
Amazon, Apple, Auth0, Authentik, Autodesk, BitBucket, Bitly,
Box, Dailymotion, Discord, Disqus, Dropbox, Etsy, Facebook,
GitHub, GitLab, Google, LinkedIn, Microsoft, Notion, Okta,
PayPal, Podio, Salesforce, Slack, Spotify, Stripe, Trello,
Twitch, Twitter/X, WordPress, Yahoo, Yammer, Yandex, Zoom
```

## OAuth2 Setup

### Configuration (Console)
```
Appwrite Console → Auth → OAuth2 Providers → Select Provider
  → Enable → Enter Client ID + Client Secret
  → Add redirect URI: https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/{provider}/{projectId}
```

### Client-Side OAuth Flow

```typescript
import { OAuthProvider } from 'appwrite'

// Redirect to OAuth provider
await account.createOAuth2Session(
  OAuthProvider.Google,                          // provider
  'https://yourapp.com/auth/callback',           // success URL
  'https://yourapp.com/auth/failure',            // failure URL
  ['email', 'profile']                           // optional: extra OAuth scopes
)
// Browser redirects to Google, then back to success URL with session cookie
```

### Available Provider Constants
```typescript
OAuthProvider.Amazon    OAuthProvider.Apple      OAuthProvider.Auth0
OAuthProvider.Bitbucket OAuthProvider.Discord    OAuthProvider.Dropbox
OAuthProvider.Facebook  OAuthProvider.GitHub     OAuthProvider.GitLab
OAuthProvider.Google    OAuthProvider.LinkedIn   OAuthProvider.Microsoft
OAuthProvider.Notion    OAuthProvider.Slack      OAuthProvider.Spotify
OAuthProvider.Twitch    OAuthProvider.Twitter    OAuthProvider.Zoom
// ... see full list: https://appwrite.io/docs/products/auth/oauth2
```

---

## Google OAuth (Most Common)

```typescript
// Trigger Google login
async function loginWithGoogle() {
  await account.createOAuth2Session(
    OAuthProvider.Google,
    `${window.location.origin}/auth/callback`,
    `${window.location.origin}/auth/failure`,
    ['openid', 'email', 'profile']
  )
}

// In /auth/callback route — session is already created by Appwrite
// Just fetch the current user
async function handleOAuthCallback() {
  try {
    const user = await account.get()
    // User is logged in — redirect to app
    return user
  } catch {
    // OAuth failed or user denied
    return null
  }
}
```

---

## Apple OAuth (iOS / macOS)

```typescript
// Apple requires additional configuration:
// 1. Apple Developer Account → Certificates, IDs & Profiles → Services IDs
// 2. Configure "Sign in with Apple" with redirect URI
// 3. Add Services ID and team/key credentials in Appwrite Console

async function loginWithApple() {
  await account.createOAuth2Session(
    OAuthProvider.Apple,
    'https://yourapp.com/auth/callback',
    'https://yourapp.com/auth/failure'
  )
}
```

---

## GitHub OAuth

```typescript
// GitHub OAuth setup:
// GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
// Callback URL: https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/github/{projectId}

async function loginWithGitHub() {
  await account.createOAuth2Session(
    OAuthProvider.GitHub,
    'https://yourapp.com/dashboard',
    'https://yourapp.com/login?error=oauth_failed',
    ['user:email', 'read:user'] // request email access
  )
}
```

---

## OAuth2 Token (Access Provider's API)

```typescript
// Get OAuth2 access token to call provider's API directly
// e.g., call GitHub API, Google API with user's token

const session = await account.getSession('current')
const oauthToken      = session.providerAccessToken
const oauthExpiry     = session.providerAccessTokenExpiry
const oauthRefresh    = session.providerRefreshToken

// Use to call provider API
const githubUser = await fetch('https://api.github.com/user', {
  headers: { Authorization: `Bearer ${oauthToken}` }
}).then(r => r.json())
```

---

## Link Multiple OAuth Providers to One Account

```typescript
// User already logged in — link additional OAuth provider to their account
// They must be authenticated first
async function linkGoogleAccount() {
  // This adds Google as an alternative login method for the existing account
  // Redirects to Google, then back — no new account created
  window.location.href = `${APPWRITE_ENDPOINT}/account/sessions/oauth2/google`
    + `?project=${PROJECT_ID}`
    + `&success=${encodeURIComponent('https://yourapp.com/settings/linked')}`
    + `&failure=${encodeURIComponent('https://yourapp.com/settings?error=link_failed')}`
}

// List linked identities
const identities = await account.listIdentities()
// Returns array of linked OAuth providers

// Unlink a provider
await account.deleteIdentity(identityId)
```

---

## OAuth2 in React Native / Flutter

```typescript
// React Native — use InAppBrowser or deep links
import InAppBrowser from 'react-native-inappbrowser-reborn'

async function loginWithGoogle() {
  const successUrl = 'myapp://auth/callback'  // deep link scheme
  const failureUrl = 'myapp://auth/failure'

  const authUrl = await account.createOAuth2Token(
    OAuthProvider.Google,
    successUrl,
    failureUrl,
  )

  if (await InAppBrowser.isAvailable()) {
    const result = await InAppBrowser.openAuth(authUrl.href, successUrl)
    if (result.type === 'success') {
      // Extract userId and secret from deep link URL
      const url = new URL(result.url)
      const userId = url.searchParams.get('userId')!
      const secret = url.searchParams.get('secret')!
      await account.createSession(userId, secret)
    }
  }
}
```

---

## OAuth Security Best Practices

```
1. Always use HTTPS for redirect URIs — never HTTP in production
2. Whitelist exact redirect URIs in both Appwrite Console and OAuth provider
3. Never expose OAuth client secrets in frontend code
4. Store client credentials in Appwrite Function environment variables
5. Validate state parameter if implementing custom OAuth flow
6. Use short-lived access tokens — refresh when providerAccessTokenExpiry is near
7. Request only necessary OAuth scopes — follow least-privilege
```
