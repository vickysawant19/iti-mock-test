---
name: appwrite-functions-expert
version: 1.0.0
description: >
  Deep expertise in Appwrite Serverless Functions — covering function structure,
  all supported runtimes, cold-start optimization, event triggers, scheduled jobs,
  environment variables, security, deployment via CLI/Git, testing, and production
  patterns. Use when writing, debugging, or optimizing Appwrite Functions in any language.
author: community
license: MIT
homepage: https://appwrite.io/docs/products/functions
tags:
  - appwrite
  - functions
  - serverless
  - cloud-functions
  - node
  - python
  - deno
  - go
  - dart
  - php
  - ruby
  - swift
  - kotlin
  - cpp
  - cicd
  - deployment
metadata:
  created: 2026-03-03
  last_reviewed: 2026-03-03
  review_interval_days: 90
  appwrite_version: "1.6+"
  dependencies:
    - url: https://appwrite.io/docs/products/functions
      name: Appwrite Functions Docs
      type: docs
    - url: https://appwrite.io/docs/advanced/platform/events
      name: Appwrite Events
      type: docs
triggers:
  - "appwrite function"
  - "appwrite serverless"
  - "appwrite functions"
  - "write an appwrite function"
  - "create appwrite function"
  - "deploy appwrite function"
  - "appwrite trigger"
  - "appwrite cron"
  - "appwrite scheduled function"
  - "appwrite event function"
  - "cold start appwrite"
  - "appwrite function runtime"
  - "appwrite function environment"
  - "appwrite function logging"
use_when:
  - Writing any Appwrite Function in any runtime
  - Debugging Function behavior or error handling
  - Setting up event triggers or scheduled cron jobs
  - Optimizing Function cold-start or performance
  - Configuring Function environment variables and secrets
  - Deploying Functions via CLI or Git integration
  - Implementing webhooks or third-party integrations via Functions
  - Building background jobs or async processing pipelines
references:
  - references/function-structure.md
  - references/runtimes-guide.md
  - references/triggers-events.md
  - references/cold-start-optimization.md
  - references/deployment-cicd.md
---

# Appwrite Functions Expert

Complete reference for writing production-grade Appwrite Serverless Functions.

## Quick Reference

| Topic | Reference |
|---|---|
| Function anatomy & context API | [function-structure.md](references/function-structure.md) |
| Runtime comparison & selection | [runtimes-guide.md](references/runtimes-guide.md) |
| Event triggers & cron scheduling | [triggers-events.md](references/triggers-events.md) |
| Cold start & performance | [cold-start-optimization.md](references/cold-start-optimization.md) |
| Deployment & CI/CD | [deployment-cicd.md](references/deployment-cicd.md) |

---

## Golden Rules for Appwrite Functions

### 1. Single Responsibility
```
Each function does ONE thing.
  ✓ process-payment
  ✓ send-welcome-email
  ✓ resize-uploaded-image
  ✗ do-everything-function (400 lines, multiple concerns)
```

### 2. Initialize at Module Level
```typescript
// ✅ Module-level — created once per container lifetime
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)
const databases = new Databases(client)

// ✗ Inside handler — recreated on EVERY invocation (slow + wasteful)
export default async ({ req, res }) => {
  const client = new Client()... // DON'T DO THIS
}
```

### 3. Always Return a Response
```typescript
// Every code path MUST return res.json(), res.send(), or res.empty()
export default async ({ req, res }) => {
  if (someCondition) return res.json({ done: true })
  // ✗ Missing return — function hangs until timeout
}
```

### 4. Use Context for Logging (Not console.log)
```typescript
// ✅ Appears in Appwrite Console function logs
export default async ({ req, res, log, error }) => {
  log('Processing request')        // info-level log
  error('Something went wrong')    // error-level log
  // ✗ console.log — not captured in Appwrite Console
}
```

### 5. Never Hardcode Secrets
```typescript
// ✅ Always from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
// ✗ const stripe = new Stripe('sk_live_...')
```

---

## Minimal Production-Ready Function (TypeScript)

```typescript
import { Client, Databases, ID } from 'node-appwrite'

// Module-level initialization — warm invocations skip this
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)
const databases = new Databases(client)

interface RequestPayload {
  email: string
  name: string
}

function isValidPayload(data: unknown): data is RequestPayload {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return typeof d.email === 'string' && typeof d.name === 'string'
}

export default async ({ req, res, log, error }) => {
  // 1. Parse body
  let body: unknown
  try {
    body = JSON.parse(req.body || '{}')
  } catch {
    return res.json({ error: 'Invalid JSON' }, 400)
  }

  // 2. Validate
  if (!isValidPayload(body)) {
    return res.json({ error: 'Missing required fields: email, name' }, 400)
  }

  // 3. Process
  try {
    const user = await databases.createDocument(
      process.env.DATABASE_ID!,
      'users',
      ID.unique(),
      { email: body.email, name: body.name }
    )
    log(`Created user ${user.$id}`)
    return res.json({ success: true, userId: user.$id })
  } catch (err) {
    error(`Failed: ${(err as Error).message}`)
    return res.json({ error: 'Internal server error' }, 500)
  }
}
```

---

## Installation

```bash
# Install Appwrite CLI
npm install -g appwrite-cli@latest

# Login
appwrite login

# Initialize function
appwrite init function

# Run locally
appwrite run function --functionId YOUR_FUNCTION_ID

# Deploy
appwrite deploy function --functionId YOUR_FUNCTION_ID
```

## Resources
- [Functions Documentation](https://appwrite.io/docs/products/functions)
- [Appwrite Events Reference](https://appwrite.io/docs/advanced/platform/events)
- [Functions Templates](https://github.com/appwrite/templates)
- [Serverless Best Practices Blog](https://appwrite.io/blog/post/serverless-functions-best-practices)
- [Appwrite CLI Reference](https://appwrite.io/docs/tooling/command-line/functions)
