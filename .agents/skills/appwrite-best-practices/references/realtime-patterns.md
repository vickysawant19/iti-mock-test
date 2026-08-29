# Appwrite Realtime Patterns

## Channel Reference

Appwrite Realtime uses hierarchical channel strings. Subscribe to specific channels
to minimize unnecessary event processing.

### Channel Formats
```
accounts                                         — Current user account events
databases.[DATABASE_ID].collections.[COL_ID].documents              — All docs in collection
databases.[DATABASE_ID].collections.[COL_ID].documents.[DOC_ID]     — Single document
storage.[BUCKET_ID].files                        — All files in bucket
storage.[BUCKET_ID].files.[FILE_ID]              — Single file
teams                                            — Current user's teams
functions.[FUNCTION_ID].executions               — Function execution events

# Use wildcard * carefully — it matches all IDs at that level
databases.*.collections.*.documents             — All docs in ALL collections (expensive)
```

---

## Basic Subscription Pattern

```typescript
import { Client, RealtimeResponseEvent } from 'appwrite'

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)

// ✅ Subscribe to specific collection
const unsubscribe = client.subscribe(
  [`databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`],
  (response: RealtimeResponseEvent<unknown>) => {
    const events = response.events

    if (events.some(e => e.includes('.create'))) {
      console.log('Document created:', response.payload)
    }
    if (events.some(e => e.includes('.update'))) {
      console.log('Document updated:', response.payload)
    }
    if (events.some(e => e.includes('.delete'))) {
      console.log('Document deleted:', response.payload)
    }
  }
)

// ✅ Always unsubscribe when done
unsubscribe()
```

---

## React Realtime Hook Pattern

```typescript
import { useEffect, useState, useCallback } from 'react'
import { client, databases } from './appwrite'
import { Query } from 'appwrite'

interface UseRealtimeCollectionOptions<T> {
  databaseId: string
  collectionId: string
  queries?: string[]
}

function useRealtimeCollection<T extends { $id: string }>(
  options: UseRealtimeCollectionOptions<T>
) {
  const { databaseId, collectionId, queries = [] } = options
  const [documents, setDocuments] = useState<T[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<Error | null>(null)

  // Initial fetch
  useEffect(() => {
    let cancelled = false

    databases.listDocuments(databaseId, collectionId, queries)
      .then(res => {
        if (!cancelled) {
          setDocuments(res.documents as T[])
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [databaseId, collectionId])

  // Realtime updates
  useEffect(() => {
    const channel = `databases.${databaseId}.collections.${collectionId}.documents`

    const unsubscribe = client.subscribe(channel, (response) => {
      const payload = response.payload as T

      if (response.events.some(e => e.includes('.create'))) {
        setDocuments(prev => [payload, ...prev])
      }
      if (response.events.some(e => e.includes('.update'))) {
        setDocuments(prev => prev.map(d => d.$id === payload.$id ? payload : d))
      }
      if (response.events.some(e => e.includes('.delete'))) {
        setDocuments(prev => prev.filter(d => d.$id !== payload.$id))
      }
    })

    // ✅ Critical: unsubscribe on unmount to prevent memory leaks
    return () => unsubscribe()
  }, [databaseId, collectionId])

  return { documents, loading, error }
}

// Usage
function MessageList() {
  const { documents: messages, loading } = useRealtimeCollection<Message>({
    databaseId: DATABASE_ID,
    collectionId: 'messages',
    queries: [Query.orderDesc('$createdAt'), Query.limit(50)],
  })

  if (loading) return <Spinner />
  return <ul>{messages.map(m => <MessageItem key={m.$id} message={m} />)}</ul>
}
```

---

## Version Document Pattern (Selective Re-fetch)

Use this pattern when you want realtime triggers but need to re-fetch complex data
(joins, aggregations) instead of relying on raw document payloads.

```typescript
// ✅ Create a lightweight 'version tracker' document
// Schema: { resourceType: string, resourceId: string, version: number }

// Subscribe to version tracker — tiny payload, triggers re-fetch
const unsubscribe = client.subscribe(
  [`databases.${db}.collections.version_tracker.documents`],
  async (response) => {
    if (!response.events.some(e => e.includes('.update'))) return

    const tracker = response.payload as VersionTracker
    if (tracker.resourceType === 'leaderboard') {
      // Re-fetch the complex leaderboard data
      const leaderboard = await fetchLeaderboardWithJoins()
      setLeaderboard(leaderboard)
    }
  }
)

// Server-side (Function/API): bump version after writes
async function updateLeaderboard(/* ... */) {
  await databases.updateDocument(db, 'version_tracker', 'leaderboard-v1', {
    version: Date.now(),
  })
}
```

---

## Account & Auth Events

```typescript
// Subscribe to current user's account events
const unsubscribe = client.subscribe('account', (response) => {
  if (response.events.some(e => e.includes('sessions.create'))) {
    console.log('New session created — user logged in')
  }
  if (response.events.some(e => e.includes('sessions.delete'))) {
    console.log('Session deleted — user logged out')
    redirectToLogin()
  }
  if (response.events.some(e => e.includes('account.update'))) {
    console.log('Account updated:', response.payload)
    refreshUserProfile()
  }
})
```

---

## Multiple Channel Subscription

```typescript
// ✅ Subscribe to multiple channels in one call
const unsubscribe = client.subscribe(
  [
    `databases.${db}.collections.messages.documents`,
    `databases.${db}.collections.notifications.documents`,
    `storage.${BUCKET_ID}.files`,
  ],
  (response) => {
    // Determine which channel triggered the event
    const channel = response.channels[0] ?? ''

    if (channel.includes('messages')) {
      handleMessageUpdate(response)
    } else if (channel.includes('notifications')) {
      handleNotificationUpdate(response)
    } else if (channel.includes('files')) {
      handleFileUpdate(response)
    }
  }
)
```

---

## Realtime Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Subscribing to `databases.*.*.*` wildcard | Receives ALL events — CPU/memory spike | Subscribe to specific collection channels |
| Not calling `unsubscribe()` on unmount | WebSocket leaks, duplicate listeners | Always return `unsubscribe` from `useEffect` |
| Mutating state directly in subscription | React stale closure issues | Use functional state updates: `setState(prev => ...)` |
| Polling + realtime simultaneously | Duplicate updates, race conditions | Choose one: realtime OR polling, not both |
| Heavy computation in subscription handler | Blocks event processing | Debounce heavy ops or push to a queue |
| Re-subscribing on every render | Creates multiple subscriptions | Put `subscribe` in `useEffect` with stable deps |

---

## Subscription Lifecycle Management (Vue 3)

```typescript
// composables/useRealtimeDoc.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useRealtimeDocument<T>(
  databaseId: string,
  collectionId: string,
  documentId: string
) {
  const doc = ref<T | null>(null)
  let unsubscribe: (() => void) | null = null

  onMounted(async () => {
    // Initial fetch
    doc.value = await databases.getDocument(databaseId, collectionId, documentId) as T

    // Subscribe to changes
    unsubscribe = client.subscribe(
      `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`,
      (response) => {
        doc.value = response.payload as T
      }
    )
  })

  onUnmounted(() => {
    unsubscribe?.() // ✅ Clean up on component unmount
  })

  return { doc }
}
```
