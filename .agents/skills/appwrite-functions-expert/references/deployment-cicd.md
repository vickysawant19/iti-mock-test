# Appwrite Functions Deployment & CI/CD

## CLI Deployment

```bash
# Install Appwrite CLI globally
npm install -g appwrite-cli@latest

# Authenticate
appwrite login

# Initialize project (creates appwrite.json)
appwrite init project

# Initialize a new function
appwrite init function
# Prompts: function name, runtime, entrypoint, build command

# Run function locally (hot-reload)
appwrite run function --functionId YOUR_FUNCTION_ID

# Deploy single function
appwrite deploy function --functionId YOUR_FUNCTION_ID

# Deploy all functions in appwrite.json
appwrite deploy function

# Check function status
appwrite functions get --functionId YOUR_FUNCTION_ID

# List all executions
appwrite functions listExecutions --functionId YOUR_FUNCTION_ID --limit 10
```

---

## appwrite.json Structure

```json
{
  "projectId": "YOUR_PROJECT_ID",
  "projectName": "My App",
  "functions": [
    {
      "functionId": "welcome-email",
      "name": "Welcome Email",
      "runtime": "node-20.0",
      "path": "functions/welcome-email",
      "entrypoint": "src/main.js",
      "buildCommand": "npm ci && npm run build",
      "execute": [],
      "events": ["users.*.create"],
      "schedule": "",
      "timeout": 15,
      "enabled": true,
      "logging": true,
      "scopes": ["users.read", "messaging.write"],
      "vars": [
        { "key": "SENDGRID_API_KEY", "value": "" }
      ],
      "ignore": ["node_modules", ".env", "*.test.ts"],
      "installation": null
    },
    {
      "functionId": "process-payment",
      "name": "Process Payment",
      "runtime": "node-20.0",
      "path": "functions/process-payment",
      "entrypoint": "dist/main.js",
      "buildCommand": "npm ci && npm run build",
      "execute": ["any"],
      "events": [],
      "schedule": "",
      "timeout": 30,
      "scopes": ["databases.read", "databases.write"],
      "vars": [
        { "key": "STRIPE_SECRET_KEY", "value": "" },
        { "key": "STRIPE_WEBHOOK_SECRET", "value": "" }
      ]
    }
  ]
}
```

---

## Git-based Auto-Deployment

Appwrite Cloud supports automatic deployment from GitHub repositories.

```
Setup:
1. Appwrite Console → Function → Settings → Deployment
2. Connect GitHub account → select repository
3. Configure:
   - Production branch: main
   - Root directory: functions/my-function  (if monorepo)
   - Build command: npm ci && npm run build
   - Entrypoint: dist/main.js
4. Push to main branch → auto-deploy triggers

Branch strategy:
  main         → Production deployment (auto-deploy)
  staging      → Staging function (configure separate function)
  feature/*    → No auto-deploy (manual testing only)
```

---

## GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy-functions.yml
name: Deploy Appwrite Functions

on:
  push:
    branches: [main]
    paths:
      - 'functions/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: functions/*/package-lock.json

      - name: Install & Test all functions
        run: |
          for dir in functions/*/; do
            echo "Testing $dir"
            cd "$dir"
            npm ci
            npm test
            cd ../..
          done

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Appwrite CLI
        run: npm install -g appwrite-cli@latest

      - name: Deploy Functions
        env:
          APPWRITE_ENDPOINT:   ${{ secrets.APPWRITE_ENDPOINT }}
          APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
          APPWRITE_API_KEY:    ${{ secrets.APPWRITE_API_KEY }}
        run: |
          appwrite client \
            --endpoint "$APPWRITE_ENDPOINT" \
            --projectId "$APPWRITE_PROJECT_ID" \
            --key "$APPWRITE_API_KEY"
          appwrite deploy function --all --force
```

---

## Environment Variable Management

```bash
# Set env vars via CLI
appwrite functions updateVariables \
  --functionId process-payment \
  --key STRIPE_SECRET_KEY \
  --value "sk_live_..."

# Bulk set via script
VARS=(
  "STRIPE_SECRET_KEY=sk_live_..."
  "STRIPE_WEBHOOK_SECRET=whsec_..."
  "DATABASE_ID=main-db"
)
for var in "${VARS[@]}"; do
  key="${var%%=*}"
  value="${var#*=}"
  appwrite functions updateVariables --functionId process-payment --key "$key" --value "$value"
done
```

```typescript
// In your function — access env vars safely with validation
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

// Called at module level — fails fast if misconfigured
const STRIPE_KEY      = requireEnv('STRIPE_SECRET_KEY')
const DATABASE_ID     = requireEnv('DATABASE_ID')
const POSTS_COL_ID    = requireEnv('POSTS_COLLECTION_ID')
```

---

## Function Versioning & Rollback

```bash
# List deployments for a function
appwrite functions listDeployments --functionId process-payment

# Activate a specific deployment (rollback)
appwrite functions updateDeployment \
  --functionId process-payment \
  --deploymentId PREVIOUS_DEPLOYMENT_ID

# Via Console: Function → Deployments → click "Activate" on any previous build
```

---

## Monorepo Structure (Recommended)

```
your-app/
├── appwrite.json              ← project config
├── functions/
│   ├── welcome-email/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── main.ts
│   │   └── src/
│   │       └── main.test.ts
│   ├── process-payment/
│   │   ├── package.json
│   │   ├── src/main.ts
│   │   └── src/main.test.ts
│   ├── weekly-report/
│   │   ├── package.json
│   │   └── src/main.ts
│   └── shared/                ← shared utilities across functions
│       ├── appwrite-client.ts
│       ├── error-handler.ts
│       └── validators.ts
├── src/                       ← frontend app
└── package.json               ← root workspace
```

```json
// Root package.json — workspace setup
{
  "private": true,
  "workspaces": ["functions/*"],
  "scripts": {
    "test:functions": "for f in functions/*/; do cd $f && npm test && cd ../..; done",
    "deploy:functions": "appwrite deploy function --all --force"
  }
}
```

---

## Local Development Workflow

```bash
# 1. Start local Appwrite (Docker)
docker run -it --rm \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
  appwrite/appwrite self-install

# 2. Run specific function locally with hot-reload
appwrite run function --functionId welcome-email

# 3. Trigger locally via HTTP
curl -X POST http://localhost:3000/executions \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# 4. View local function logs
appwrite functions listExecutions --functionId welcome-email --limit 5
```

---

## Deployment Checklist

- [ ] All secrets stored as environment variables — not in code or appwrite.json
- [ ] `ignore` field in appwrite.json excludes `node_modules`, `.env`, test files
- [ ] Build command produces optimized output (bundled JS, compiled binary)
- [ ] Tests pass in CI before deployment (never deploy without test gate)
- [ ] Function `timeout` set per expected execution duration
- [ ] Function `scopes` set to minimum required permissions
- [ ] `logging: true` in dev/staging, consider disabling in production for sensitive functions
- [ ] Git-based auto-deployment configured for production branch
- [ ] Rollback procedure tested — know how to activate previous deployment
- [ ] Budget alerts set — deployment triggers can cause unexpected executions
