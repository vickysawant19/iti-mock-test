# Appwrite Function Triggers & Events

## Trigger Types

| Trigger | Description | Configuration |
|---|---|---|
| **HTTP** | HTTPS endpoint — call from anywhere | Default, always available |
| **Event** | Triggered by Appwrite platform events | Set in `events` array |
| **Schedule** | Cron-based recurring execution | Set `schedule` with cron expression |

---

## HTTP Trigger

```typescript
// HTTP trigger is always active — call via:
// POST https://cloud.appwrite.io/v1/functions/{functionId}/executions
// or via SDK: functions.createExecution(functionId, body, async)

export default async ({ req, res, log }) => {
  // req.method will be the HTTP method used
  // req.body will contain the request body
  return res.json({ message: 'Hello from HTTP trigger' })
}
```

```typescript
// Client-side: trigger a Function via SDK
const functions = new Functions(client)

// Synchronous (waits for response — max 30s)
const execution = await functions.createExecution(
  'FUNCTION_ID',
  JSON.stringify({ email: 'user@example.com' }), // body
  false,                                           // async: false = sync
  '/api/v1/welcome',                               // path
  ExecutionMethod.Post,                            // method
  { 'x-custom-header': 'value' }                  // headers
)
console.log(execution.responseBody)

// Asynchronous (fire and forget — returns immediately)
await functions.createExecution('FUNCTION_ID', body, true)
```

---

## Event Trigger Reference

```
Databases Events:
  databases.{databaseId}.collections.{collectionId}.documents.*.create
  databases.{databaseId}.collections.{collectionId}.documents.*.update
  databases.{databaseId}.collections.{collectionId}.documents.*.delete
  databases.{databaseId}.collections.*.create
  databases.{databaseId}.collections.*.delete

Auth/Users Events:
  users.*.create          — New user registered
  users.*.update          — User profile updated
  users.*.delete          — User account deleted
  users.*.sessions.*.create   — User logged in
  users.*.sessions.*.delete   — User logged out
  users.*.verification.*.create — Email verification sent

Storage Events:
  buckets.{bucketId}.files.*.create  — File uploaded
  buckets.{bucketId}.files.*.update  — File metadata updated
  buckets.{bucketId}.files.*.delete  — File deleted

Functions Events:
  functions.{functionId}.deployments.*.create  — New deployment
  functions.{functionId}.executions.*.create   — Execution started

Teams Events:
  teams.*.create          — Team created
  teams.*.memberships.*.create  — Member added
  teams.*.memberships.*.delete  — Member removed
```

### Wildcards in Event Patterns
```
* = any single ID segment
databases.* = all databases
databases.*.collections.* = all collections in all databases
databases.DB_ID.* = all events for a specific database
```

---

## Event-Triggered Function Examples

### Send Welcome Email on User Registration
```typescript
// Function config: events: ["users.*.create"]
export default async ({ req, res, log, error }) => {
  const user = JSON.parse(req.body)  // new user document

  log(`New user registered: ${user.email}`)

  try {
    await sendWelcomeEmail(user.email, user.name)
    log(`Welcome email sent to ${user.email}`)
  } catch (err) {
    error(`Failed to send welcome email to ${user.email}: ${err.message}`)
    // Don't return 500 — event triggers ignore the response code
  }

  return res.empty()  // event triggers ignore response, but we must return
}
```

### Process File Upload
```typescript
// Function config: events: ["buckets.PROFILE_BUCKET_ID.files.*.create"]
export default async ({ req, res, log, error }) => {
  const file = JSON.parse(req.body)  // file document payload

  log(`New file uploaded: ${file.$id}, size: ${file.sizeOriginal} bytes`)

  try {
    // Generate thumbnail / validate / extract metadata
    await processUploadedFile(file.$id, file.bucketId, file.mimeType)
    log(`Processed file ${file.$id}`)
  } catch (err) {
    error(`Failed to process file ${file.$id}: ${err.message}`)
  }

  return res.empty()
}
```

### Trigger on Document Create (Post-processing)
```typescript
// Function config: events: ["databases.MAIN_DB.collections.orders.documents.*.create"]
export default async ({ req, res, log, error }) => {
  const order = JSON.parse(req.body)

  log(`New order: ${order.$id}, amount: ${order.amount}`)

  try {
    // Update inventory, send receipt, notify fulfillment
    await Promise.all([
      updateInventory(order.items),
      sendOrderReceipt(order.customerEmail, order),
      notifyFulfillmentTeam(order.$id),
    ])
    log(`Order ${order.$id} processing complete`)
  } catch (err) {
    error(`Order processing failed for ${order.$id}: ${err.message}`)
  }

  return res.empty()
}
```

---

## Scheduled Functions (Cron)

```typescript
// Function config: schedule: "0 9 * * 1"  (every Monday at 9:00 AM UTC)
// Cron syntax: minute hour day-of-month month day-of-week

export default async ({ req, res, log, error }) => {
  log(`Weekly report job started at ${new Date().toISOString()}`)

  try {
    const report = await generateWeeklyReport()
    await emailReport(report, ['team@company.com'])
    log(`Weekly report sent: ${report.items} items processed`)
    return res.json({ success: true, itemsProcessed: report.items })
  } catch (err) {
    error(`Weekly report failed: ${err.message}`)
    return res.json({ error: 'Report generation failed' }, 500)
  }
}
```

### Common Cron Expressions

```
"* * * * *"       Every minute
"0 * * * *"       Every hour (at :00)
"0 9 * * *"       Every day at 9:00 AM UTC
"0 9 * * 1"       Every Monday at 9:00 AM UTC
"0 0 1 * *"       First day of every month at midnight
"0 0 * * 0"       Every Sunday at midnight
"*/15 * * * *"    Every 15 minutes
"0 9,17 * * 1-5"  Weekdays at 9 AM and 5 PM
"0 2 * * *"       Every day at 2:00 AM UTC (good for backups)
```

---

## Function Execution via appwrite.json

```json
{
  "functions": [
    {
      "functionId": "welcome-email",
      "name": "Welcome Email",
      "runtime": "node-20.0",
      "events": ["users.*.create"],
      "schedule": "",
      "timeout": 15
    },
    {
      "functionId": "weekly-report",
      "name": "Weekly Report",
      "runtime": "node-20.0",
      "events": [],
      "schedule": "0 9 * * 1",
      "timeout": 300
    },
    {
      "functionId": "process-payment",
      "name": "Process Payment",
      "runtime": "node-20.0",
      "events": [],
      "schedule": "",
      "execute": ["any"],
      "timeout": 30
    }
  ]
}
```

---

## Execution Context for Event vs HTTP Triggers

```typescript
export default async ({ req, res, log }) => {
  // Detect trigger type
  const isEventTrigger = req.headers['x-appwrite-event'] !== undefined
  const isCronTrigger  = req.headers['x-appwrite-trigger'] === 'schedule'
  const isHttpTrigger  = !isEventTrigger && !isCronTrigger

  if (isEventTrigger) {
    const eventType = req.headers['x-appwrite-event']
    log(`Event trigger: ${eventType}`)
    const payload = JSON.parse(req.body)
    await handleEvent(eventType, payload)
    return res.empty()
  }

  if (isCronTrigger) {
    log('Cron trigger — running scheduled job')
    await runScheduledJob()
    return res.json({ jobCompleted: true })
  }

  // HTTP trigger — process as API request
  return handleApiRequest(req, res, log)
}
```
