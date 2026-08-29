# Appwrite Best Practices — Compiled Reference

This file is the compiled version of all references for quick agent access.
For detailed guidance, see the individual reference files.

## Critical Security Rules
- NEVER expose API keys client-side — use only in server/Functions
- ALWAYS enable `document_security: true` on user-owned collections
- ALWAYS validate inputs in Functions before processing
- ALWAYS use environment variables for all secrets

## Database Quick Reference
- Use typed attributes (email, url, enum, integer) not everything as string
- Index every attribute you filter or sort on
- Use `Query.cursorAfter()` for pagination on large collections (> 1000 docs)
- Use `Query.select([...fields])` to reduce payload
- Use `Query.limit(n)` on every query — never unbounded

## Permissions Quick Reference
- `Role.any()` = everyone | `Role.users()` = logged-in | `Role.user(id)` = specific user
- `Role.team(id)` = team members | `Role.team(id, 'role')` = team role
- `Role.label('admin')` = users with label (server-assigned only)
- Collection = defaults | Document = overrides (when `document_security: true`)

## Storage Quick Reference
- Enable `Compression.Zstd` on buckets for text/JSON files
- Serve images via Preview API with `output=webp&quality=85`
- Set `maximum_file_size` and `allowed_file_extensions` on every bucket
- Use CDN in front of Appwrite for media delivery

## Performance Quick Reference
- Initialize Appwrite client at module level in Functions (not inside handler)
- Use Realtime subscriptions instead of polling
- Cache frequently-read data with TTL (client-side Map or Redis)
- Use cursor pagination for large collections

## Index Types
- `key` = equality & range queries
- `unique` = uniqueness enforcement
- `fulltext` = search() queries
- `array` = array attribute queries

## Common Error Codes
400=validation | 401=unauthorized | 403=forbidden | 404=not_found
409=conflict/duplicate | 413=too_large | 429=rate_limited | 500=server_error

## Full References
- [Database Design](references/database-design.md)
- [Security & Permissions](references/security-permissions.md)
- [Storage Optimization](references/storage-optimization.md)
- [Performance](references/performance-optimization.md)
- [Realtime Patterns](references/realtime-patterns.md)
- [Error Handling](references/error-handling.md)
- [Testing & Monitoring](references/testing-monitoring.md)
- [Migration & Backup](references/migration-backup.md)
