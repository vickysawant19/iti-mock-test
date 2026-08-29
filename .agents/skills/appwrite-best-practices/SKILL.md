---
name: appwrite-best-practices
version: 1.0.0
description: >
  Production best practices for Appwrite BaaS — covering database schema design,
  indexing strategy, security & permissions, storage optimization, real-time usage,
  performance tuning, error handling, testing, and monitoring. Use when building,
  reviewing, or optimizing any Appwrite-backed application.
author: community
license: MIT
homepage: https://appwrite.io/docs
tags:
  - appwrite
  - backend
  - baas
  - database
  - security
  - performance
  - best-practices
  - production
metadata:
  created: 2026-03-03
  last_reviewed: 2026-03-03
  review_interval_days: 90
  appwrite_version: "1.6+"
  dependencies:
    - url: https://appwrite.io/docs
      name: Appwrite Documentation
      type: docs
    - url: https://appwrite.io/docs/products/databases/queries
      name: Appwrite Queries
      type: api
triggers:
  - "appwrite"
  - "appwrite database"
  - "appwrite schema"
  - "appwrite security"
  - "appwrite permissions"
  - "appwrite performance"
  - "appwrite optimize"
  - "appwrite production"
  - "appwrite best practice"
  - "appwrite storage"
  - "appwrite realtime"
  - "appwrite index"
  - "appwrite collection"
  - "review appwrite"
  - "optimize appwrite"
use_when:
  - Designing or reviewing Appwrite database schemas or collections
  - Writing queries against Appwrite Databases
  - Implementing permissions and document-level security
  - Configuring Storage buckets for production
  - Setting up Appwrite Functions for any runtime
  - Implementing real-time subscriptions
  - Optimizing Appwrite API usage and costs
  - Debugging Appwrite permission or performance issues
  - Building authentication flows with Appwrite Auth
references:
  - references/database-design.md
  - references/security-permissions.md
  - references/storage-optimization.md
  - references/performance-optimization.md
  - references/realtime-patterns.md
  - references/error-handling.md
  - references/testing-monitoring.md
  - references/migration-backup.md
---

# Appwrite Best Practices

Production guidelines for building secure, scalable applications with Appwrite.
References are prioritized by impact — start with **Critical** items.

## Quick Reference Priority

| Category | Priority | Reference |
|---|---|---|
| Security & Permissions | **Critical** | [security-permissions.md](references/security-permissions.md) |
| Database Schema Design | **Critical** | [database-design.md](references/database-design.md) |
| Query & Index Optimization | **High** | [database-design.md](references/database-design.md) |
| Storage & File Handling | **High** | [storage-optimization.md](references/storage-optimization.md) |
| Performance & Caching | **High** | [performance-optimization.md](references/performance-optimization.md) |
| Real-time Subscriptions | **Medium** | [realtime-patterns.md](references/realtime-patterns.md) |
| Error Handling | **Medium** | [error-handling.md](references/error-handling.md) |
| Testing & Monitoring | **Medium** | [testing-monitoring.md](references/testing-monitoring.md) |
| Migration & Backup | **Low-Medium** | [migration-backup.md](references/migration-backup.md) |

---

## Critical Rules (Always Apply)

### 1. Never Expose API Keys Client-Side
```typescript
// ❌ NEVER — exposes your entire backend
const client = new Client()
  .setProject('PROJECT_ID')
  .setKey('YOUR_API_KEY') // API keys are server-only!

// ✅ CORRECT — client-side uses session-based auth only
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('PROJECT_ID')
// Sessions are set automatically after account.createEmailPasswordSession()
```

### 2. Always Enable Document Security for User-Owned Data
```typescript
// ✅ Enable document security on any user-specific collection
await databases.createCollection(
  DATABASE_ID,
  ID.unique(),
  'user_posts',
  [
    Permission.read(Role.any()),       // Public listing
    Permission.create(Role.users()),   // Any authenticated user can create
  ],
  true // ← document_security: true — per-document permissions override collection
)

// When creating the document, set per-document permissions
await databases.createDocument(
  DATABASE_ID, COLLECTION_ID, ID.unique(),
  { title: 'My Post', content: '...' },
  [
    Permission.read(Role.any()),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
)
```

### 3. Use Typed Queries — Never Fetch All
```typescript
// ❌ BAD — fetches everything, wastes bandwidth
const all = await databases.listDocuments(DB_ID, COL_ID)

// ✅ GOOD — filtered, paginated, indexed
const posts = await databases.listDocuments(DB_ID, COL_ID, [
  Query.equal('status', 'published'),
  Query.orderDesc('$createdAt'),
  Query.limit(20),
  Query.cursorAfter(lastDocumentId), // cursor pagination > offset for large sets
])
```

### 4. Create Indexes Before Querying
```typescript
// Always create an index for every attribute you filter or sort on
await databases.createIndex(
  DATABASE_ID, COLLECTION_ID,
  'status_created_idx',
  IndexType.Key,
  ['status', '$createdAt'],
  ['ASC', 'DESC']
)
```

### 5. Use Environment Variables — Never Hardcode Secrets
```typescript
// ✅ In Appwrite Functions and server code
const stripeKey   = process.env.STRIPE_SECRET_KEY
const webhookSec  = process.env.WEBHOOK_SECRET
const dbId        = process.env.DATABASE_ID
```

---

## Categories Overview

### Database Design (see [database-design.md](references/database-design.md))
- Define schema with correct attribute types before inserting data
- Create composite indexes for multi-attribute queries
- Use `cursor` pagination instead of `offset` for large datasets
- Prefer `enum` attributes for constrained value sets
- Use `relationship` attributes for linked collections instead of storing IDs manually
- Plan for full-text search with `fulltext` indexes

### Security & Permissions (see [security-permissions.md](references/security-permissions.md))
- Understand the 4 permission roles: `any`, `users`, `user:ID`, `team:ID/role`
- Collection-level permissions = defaults; document-level = overrides (when `document_security: true`)
- API keys must have minimal scopes and short expiry
- Always validate & sanitize inputs in Functions before processing
- Use Appwrite's built-in rate limiting awareness

### Storage Optimization (see [storage-optimization.md](references/storage-optimization.md))
- Enable `gzip` or `zstd` bucket compression (files < 20MB only)
- Serve images via Preview API with `width`, `quality`, `output=webp`
- Set `maximum_file_size` and `allowed_file_extensions` on every bucket
- Enable `antivirus` and `encryption` for sensitive buckets
- Use CDN (e.g., Cloudflare) in front of Appwrite for media delivery

### Performance (see [performance-optimization.md](references/performance-optimization.md))
- Use Realtime subscriptions instead of polling
- Implement client-side caching with expiry for static/slow-changing data
- Use server-side Redis caching for high-frequency reads
- Batch document operations using `createDocuments` bulk endpoint where available
- Deploy Appwrite in the region closest to your primary user base
- Set budget alerts in Appwrite Cloud Console

### Real-time (see [realtime-patterns.md](references/realtime-patterns.md))
- Subscribe to specific channels, not wildcards when possible
- Always `unsubscribe()` when component unmounts (React/Vue/Svelte)
- Use versioning document pattern for selective re-fetch triggers

### Error Handling (see [error-handling.md](references/error-handling.md))
- Handle Appwrite error codes: `400` validation, `401` unauthorized, `404` not found, `409` conflict
- Implement exponential backoff for transient failures
- Log structured errors in Functions using the `error()` context param

---

## Installation

```bash
npx skills add appwrite/agent-skills
```

Or install this skill directly:
```bash
git clone https://github.com/appwrite/agent-skills.git
# Copy appwrite-best-practices/ into your skills directory
```

## References
- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Queries](https://appwrite.io/docs/products/databases/queries)
- [Appwrite Permissions](https://appwrite.io/docs/advanced/platform/permissions)
- [Appwrite Realtime](https://appwrite.io/docs/apis/realtime)
- [Appwrite Functions](https://appwrite.io/docs/products/functions)
- [Serverless Best Practices Blog](https://appwrite.io/blog/post/serverless-functions-best-practices)
- [Optimization Guide Blog](https://appwrite.io/blog/post/how-to-optimize-your-appwrite-project)
