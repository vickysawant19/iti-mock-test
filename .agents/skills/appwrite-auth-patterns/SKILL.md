---
name: appwrite-auth-patterns
version: 1.0.0
description: >
  Comprehensive Appwrite authentication patterns — covering email/password auth,
  OAuth2 with 30+ providers, magic links, phone OTP, JWT verification, session
  management, MFA, team-based access control, and secure server-side auth.
  Use when implementing any authentication or authorization flow with Appwrite.
author: community
license: MIT
homepage: https://appwrite.io/docs/products/auth
tags:
  - appwrite
  - auth
  - authentication
  - authorization
  - oauth
  - jwt
  - sessions
  - security
  - teams
  - mfa
  - magic-link
  - phone-otp
metadata:
  created: 2026-03-03
  last_reviewed: 2026-03-03
  review_interval_days: 90
  appwrite_version: "1.6+"
  dependencies:
    - url: https://appwrite.io/docs/products/auth
      name: Appwrite Auth Docs
      type: docs
    - url: https://appwrite.io/docs/products/auth/oauth2
      name: OAuth2 Docs
      type: docs
triggers:
  - "appwrite auth"
  - "appwrite authentication"
  - "appwrite login"
  - "appwrite signup"
  - "appwrite oauth"
  - "appwrite session"
  - "appwrite jwt"
  - "appwrite magic link"
  - "appwrite phone auth"
  - "appwrite mfa"
  - "appwrite teams"
  - "appwrite user management"
  - "appwrite account"
  - "appwrite permissions role"
use_when:
  - Building login, signup, or logout flows
  - Implementing OAuth2 social login (Google, GitHub, Apple, etc.)
  - Setting up magic link or phone OTP authentication
  - Managing user sessions across web and mobile
  - Implementing JWT-based auth in Appwrite Functions
  - Setting up team-based role access control
  - Enabling MFA (multi-factor authentication)
  - Managing user accounts server-side with Admin API
references:
  - references/auth-flows.md
  - references/oauth2-providers.md
  - references/session-management.md
  - references/teams-roles.md
  - references/server-side-auth.md
---

# Appwrite Auth Patterns

Complete authentication & authorization reference for Appwrite applications.

## Quick Reference

| Topic | Reference |
|---|---|
| Email, Magic Link, Phone OTP auth | [auth-flows.md](references/auth-flows.md) |
| OAuth2 social login (30+ providers) | [oauth2-providers.md](references/oauth2-providers.md) |
| Session management & MFA | [session-management.md](references/session-management.md) |
| Teams, roles & access control | [teams-roles.md](references/teams-roles.md) |
| Server-side auth & JWT verification | [server-side-auth.md](references/server-side-auth.md) |

---

## Auth Method Comparison

| Method | UX | Security | Use Case |
|---|---|---|---|
| Email + Password | Standard | High | Most applications |
| Magic Link (Email OTP) | Frictionless | High | No-password apps |
| OAuth2 | Familiar | High | Social login |
| Phone OTP (SMS) | Mobile-friendly | High | Mobile-first apps |
| Anonymous Session | Zero friction | Medium | Try-before-signup |
| JWT (SSO) | Seamless | High | Enterprise SSO |

---

## Quickstart: Email/Password Auth

```typescript
import { Client, Account, ID } from 'appwrite'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('YOUR_PROJECT_ID')

const account = new Account(client)

// Sign up
const user = await account.create(
  ID.unique(),     // userId
  'user@email.com', // email
  'SecurePass123!', // password
  'Jane Doe'        // name (optional)
)

// Log in
const session = await account.createEmailPasswordSession(
  'user@email.com',
  'SecurePass123!'
)

// Get current user
const me = await account.get()

// Log out (current session)
await account.deleteSession('current')

// Log out all sessions
const sessions = await account.listSessions()
await Promise.all(sessions.sessions.map(s => account.deleteSession(s.$id)))
```

---

## Installation

```bash
# Web
npm install appwrite

# React Native
npm install react-native-appwrite

# Flutter
flutter pub add dart_appwrite

# Node.js server
npm install node-appwrite
```

## Resources
- [Auth Documentation](https://appwrite.io/docs/products/auth)
- [OAuth2 Providers List](https://appwrite.io/docs/products/auth/oauth2)
- [Teams & Roles](https://appwrite.io/docs/products/auth/teams)
- [MFA Setup](https://appwrite.io/docs/products/auth/mfa)
