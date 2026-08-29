# Appwrite Migration & Backup Best Practices

## Schema Migration Strategy

```typescript
// Version-controlled schema migrations
const MIGRATIONS: Record<string, () => Promise<void>> = {
  '001_create_users_collection': async () => {
    const col = await databases.createCollection(db, 'users', 'Users', [
      Permission.create(Role.users()),
    ], true)
    await databases.createStringAttribute(db, 'users', 'name',  255, true)
    await databases.createEmailAttribute (db, 'users', 'email',      true)
    await databases.createBooleanAttribute(db,'users', 'isVerified', false, false)
    await databases.createIndex(db, 'users', 'email_unique', IndexType.Unique, ['email'])
  },

  '002_create_posts_collection': async () => {
    await databases.createCollection(db, 'posts', 'Posts', [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
    ], true)
    await databases.createStringAttribute(db, 'posts', 'title',   255, true)
    await databases.createEnumAttribute  (db, 'posts', 'status',  ['draft','published','archived'], true, 'draft')
    await databases.createStringAttribute(db, 'posts', 'authorId', 36,  true)
    await databases.createIndex(db, 'posts', 'status_created_idx', IndexType.Key, ['status', '$createdAt'], ['ASC','DESC'])
  },

  '003_add_posts_slug': async () => {
    await databases.createStringAttribute(db, 'posts', 'slug', 255, false)
    await databases.createIndex(db, 'posts', 'slug_unique_idx', IndexType.Unique, ['slug'])
  },
}

// Migration runner — tracks applied migrations in a 'migrations' collection
async function runMigrations(): Promise<void> {
  const appliedDocs = await databases.listDocuments(db, 'migrations', [Query.limit(100)])
  const applied     = new Set(appliedDocs.documents.map(d => d.migrationId as string))

  for (const [id, migrate] of Object.entries(MIGRATIONS)) {
    if (applied.has(id)) {
      console.log(`[SKIP] ${id}`)
      continue
    }
    console.log(`[RUN ] ${id}`)
    await migrate()
    await databases.createDocument(db, 'migrations', ID.unique(), {
      migrationId: id,
      appliedAt:   new Date().toISOString(),
    })
    console.log(`[DONE] ${id}`)
  }
}
```

---

## Data Backup / Export

```typescript
// Export all documents from a collection with pagination
async function exportCollection(
  databaseId: string,
  collectionId: string,
  outputPath: string
): Promise<number> {
  const documents: unknown[] = []
  let cursor: string | null = null
  const BATCH = 100
  let total = 0

  do {
    const queries: string[] = [Query.limit(BATCH), Query.orderAsc('$id')]
    if (cursor) queries.push(Query.cursorAfter(cursor))

    const result = await databases.listDocuments(databaseId, collectionId, queries)
    documents.push(...result.documents)
    total += result.documents.length

    cursor = result.documents.length === BATCH
      ? result.documents.at(-1)!.$id
      : null

    console.log(`Exported ${total} documents from ${collectionId}...`)
  } while (cursor)

  const backup = {
    collectionId,
    exportedAt: new Date().toISOString(),
    count: total,
    documents,
  }

  await fs.writeFile(outputPath, JSON.stringify(backup, null, 2))
  console.log(`Backup saved to ${outputPath}`)
  return total
}

// Export all collections
async function fullBackup(databaseId: string, backupDir: string): Promise<void> {
  await fs.mkdir(backupDir, { recursive: true })
  const db = await databases.getDatabase(databaseId)
  const collections = await databases.listCollections(databaseId, [Query.limit(100)])

  for (const col of collections.collections) {
    const file = path.join(backupDir, `${col.$id}.json`)
    await exportCollection(databaseId, col.$id, file)
  }

  console.log(`Full backup completed: ${collections.total} collections`)
}
```

---

## Data Restore Pattern

```typescript
async function restoreCollection(
  databaseId: string,
  collectionId: string,
  backupPath: string,
  options: { overwriteExisting?: boolean } = {}
): Promise<void> {
  const backup = JSON.parse(await fs.readFile(backupPath, 'utf-8'))
  const { documents } = backup

  let created = 0, skipped = 0, errors = 0

  for (const doc of documents) {
    const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = doc

    try {
      if (options.overwriteExisting) {
        // Try update first, create if not exists
        try {
          await databases.updateDocument(databaseId, collectionId, $id, data)
        } catch (e) {
          if ((e as AppwriteException).code === 404) {
            await databases.createDocument(databaseId, collectionId, $id, data, $permissions)
          } else throw e
        }
      } else {
        await databases.createDocument(databaseId, collectionId, $id, data, $permissions)
      }
      created++
    } catch (err) {
      if ((err as AppwriteException).code === 409) {
        skipped++ // Already exists, skip
      } else {
        errors++
        console.error(`Failed to restore ${$id}:`, (err as Error).message)
      }
    }
  }

  console.log(`Restore complete: ${created} created, ${skipped} skipped, ${errors} errors`)
}
```

---

## Appwrite Cloud Migrations (Built-in)

```
Appwrite Cloud provides built-in migration tools:
  Console → Project → Settings → Migrations

Supported sources:
  - Self-hosted Appwrite → Appwrite Cloud
  - Firebase (Auth users + Firestore data)
  - Supabase (Auth users + PostgreSQL data)
  - NHost (Auth + Hasura data)

What migrates automatically:
  ✓ User accounts & hashed passwords
  ✓ Database documents
  ✓ Storage files
  ✗ Functions (must redeploy)
  ✗ Custom domains (must reconfigure)
  ✗ Webhooks (must reconfigure)
```

---

## Backup Automation with Appwrite Functions

```typescript
// Schedule backup Function with cron: "0 2 * * *" (daily at 2 AM)
// Function runtime: Node.js 20.x
// Environment variables: DATABASE_ID, BACKUP_BUCKET_ID, APPWRITE_*

export default async ({ req, res, log, error }) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0]
    const collections = await databases.listCollections(process.env.DATABASE_ID!)

    for (const col of collections.collections) {
      const docs = await exportAllDocuments(col.$id)
      const json = JSON.stringify({ exportedAt: timestamp, count: docs.length, documents: docs })
      const buffer = Buffer.from(json)

      await storage.createFile(
        process.env.BACKUP_BUCKET_ID!,
        `${timestamp}/${col.$id}.json`,
        InputFile.fromBuffer(buffer, `${col.$id}.json`),
        [Permission.read(Role.label('admin'))] // only admins can access backups
      )
      log(`Backed up collection: ${col.name} (${docs.length} docs)`)
    }

    return res.json({ success: true, timestamp, collections: collections.total })
  } catch (err) {
    error(`Backup failed: ${(err as Error).message}`)
    return res.json({ error: 'Backup failed' }, 500)
  }
}
```

---

## Migration Checklist

- [ ] Schema migrations versioned and tracked in a migrations collection
- [ ] Backup exports run before any destructive schema changes
- [ ] Test restore procedure in staging before applying to production
- [ ] Migration scripts idempotent (safe to run multiple times)
- [ ] Automated daily backup Function scheduled with cron
- [ ] Backup files stored in separate Appwrite project or external storage
- [ ] Appwrite-built-in migration used when moving between platforms (Firebase/Supabase → Appwrite)
- [ ] Functions re-deployed after platform migration (not auto-migrated)
