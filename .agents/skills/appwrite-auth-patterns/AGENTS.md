# Appwrite Auth Patterns — Compiled Reference

## Auth Methods Summary
email+password: account.create() + account.createEmailPasswordSession()
magic link: account.createMagicURLToken() → account.createSession(userId, secret)
phone OTP: account.createPhoneToken() → account.createSession(userId, otp)
oauth2: account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl)
anonymous: account.createAnonymousSession()

## Current User
await account.get() — throws 401 if not authenticated, returns Models.User

## Session Management
logout: account.deleteSession('current')
list: account.listSessions()
force logout all: await Promise.all(sessions.sessions.map(s => account.deleteSession(s.$id)))

## JWT for Functions
const jwt = await account.createJWT()  // 15 min expiry
// Send as header: 'x-appwrite-user-jwt': jwt.jwt
// In Function: new Client().setJWT(req.headers['x-appwrite-user-jwt'])

## Permissions Quick Reference
Role.any() | Role.users() | Role.user(id) | Role.guests()
Role.team(id) | Role.team(id, 'roleName') | Role.label('admin')

Permission.read(role) | Permission.create(role)
Permission.update(role) | Permission.delete(role)

## Teams
teams.create(ID.unique(), 'Name', ['owner','admin','member'])
teams.createMembership(teamId, ['editor'], email, undefined, undefined, redirectUrl)
teams.updateMembership(teamId, membershipId, ['admin'])
teams.deleteMembership(teamId, membershipId)

## Server-Side (Admin) User Management
usersService.create(ID.unique(), email, phone, password, name)
usersService.updateLabels(userId, ['admin'])  // labels are server-only
usersService.deleteSessions(userId)           // force logout all devices
usersService.updateStatus(userId, false)      // block user

## MFA
account.updateMFA(true)
account.createMfaAuthenticator(AuthenticatorType.Totp)  // returns QR secret
account.createMfaChallenge(AuthenticationFactor.Totp)
account.updateMfaChallenge(challenge.$id, totpCode)

## OAuth2 Providers (30+)
OAuthProvider.Google | OAuthProvider.GitHub | OAuthProvider.Apple
OAuthProvider.Discord | OAuthProvider.Microsoft | OAuthProvider.Slack
(full list: https://appwrite.io/docs/products/auth/oauth2)

## Full References
- [Auth Flows](references/auth-flows.md)
- [OAuth2 Providers](references/oauth2-providers.md)
- [Session Management](references/session-management.md)
- [Teams & Roles](references/teams-roles.md)
- [Server-Side Auth](references/server-side-auth.md)
