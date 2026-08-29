# Appwrite Functions Expert — Compiled Reference

## Golden Rules
- Initialize Appwrite client at MODULE LEVEL (not inside handler)
- Always return res.json(), res.send(), or res.empty() from every code path
- Use log()/error() context params — NOT console.log()
- Never hardcode secrets — use environment variables
- Single responsibility: one function, one task

## Handler Signature (TypeScript/Node.js)
```
export default async ({ req, res, log, error }) => { ... }
```

## req Object
body (string), headers (lowercase), method, path, query, bodyJson (pre-parsed)

## res Methods
res.json(data, status=200)  |  res.send(body, status)  |  res.empty()
res.binary(bytes, status)   |  res.redirect(url, status)

## Trigger Types
HTTP: always active, callable via SDK or HTTPS
Event: set events[] in appwrite.json — e.g. "users.*.create"
Cron: set schedule in appwrite.json — e.g. "0 9 * * 1"

## Common Cron Patterns
"0 * * * *" = hourly  |  "0 9 * * *" = daily 9AM
"0 9 * * 1" = Mon 9AM  |  "*/15 * * * *" = every 15min

## Cold Start Ranking (fastest → slowest)
Bun → Go/C++ → Dart → Node.js(bundled) → Deno → Python → PHP → Ruby → Kotlin → Java

## Key Optimizations
- Module-level client init (survives warm invocations)
- ESBuild bundle for Node.js (1 file vs 100+ modules)
- Lazy-load heavy deps only when needed
- Reuse DB/Redis connections at module level

## Runtime Selection
User-facing API → Bun or Node.js 20
Data processing → Python 3.11+
High-performance → Go 1.21
Flutter/Dart app → Dart 3.x
TypeScript secure → Deno 1.x

## Event Channel Format
databases.{dbId}.collections.{colId}.documents.*.create
users.*.create | users.*.sessions.*.create
buckets.{bucketId}.files.*.create

## Full References
- [Function Structure & Context API](references/function-structure.md)
- [Runtimes Guide](references/runtimes-guide.md)
- [Triggers & Events](references/triggers-events.md)
- [Cold Start Optimization](references/cold-start-optimization.md)
- [Deployment & CI/CD](references/deployment-cicd.md)
