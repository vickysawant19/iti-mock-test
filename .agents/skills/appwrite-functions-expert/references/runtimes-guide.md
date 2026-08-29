# Appwrite Functions Runtime Guide

## Supported Runtimes (as of Appwrite 1.6+)

| Runtime | ID | Cold Start | Best For |
|---|---|---|---|
| Node.js 20 | `node-20.0` | Fast | APIs, webhooks, general purpose |
| Node.js 18 | `node-18.0` | Fast | Legacy Node.js projects |
| Deno 1.x | `deno-1.40` | Very Fast | TypeScript-first, secure by default |
| Bun 1.x | `bun-1.0` | Fastest | Maximum speed, modern JS |
| Python 3.11 | `python-3.11` | Medium | Data processing, ML, scripting |
| Python 3.12 | `python-3.12` | Medium | Latest Python features |
| Go 1.21 | `go-1.21` | Fastest (compiled) | High-performance, low latency |
| Dart 3.x | `dart-3.3` | Fast (compiled) | Flutter/Dart full-stack apps |
| PHP 8.2 | `php-8.2` | Medium | PHP ecosystems, Laravel-adjacent |
| Ruby 3.3 | `ruby-3.3` | Slow | Ruby on Rails teams |
| Swift 5.9 | `swift-5.9` | Fast (compiled) | Apple ecosystem teams |
| Kotlin 1.9 | `kotlin-1.9` | Medium (JVM) | Android/JVM teams |
| Java 21 | `java-21.0` | Slow (JVM) | Enterprise Java, Spring |
| C++ 17 | `cpp-17.0` | Fastest | Ultra-performance compute |

---

## Runtime-Specific Templates

### Node.js 20 (TypeScript)
```typescript
// src/main.ts
import { Client, Databases, ID } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)

export default async ({ req, res, log, error }: any) => {
  try {
    const body = req.bodyJson ?? JSON.parse(req.body || '{}')
    log('Received:', JSON.stringify(body))
    return res.json({ ok: true })
  } catch (err) {
    error(`Error: ${err.message}`)
    return res.json({ error: 'Internal server error' }, 500)
  }
}
```

```json
// package.json
{
  "main": "src/main.ts",
  "scripts": { "build": "tsc" },
  "dependencies": { "node-appwrite": "^15.0.0" },
  "devDependencies": { "typescript": "^5.0.0", "@types/node": "^20.0.0" }
}
```

### Python 3.11
```python
# main.py
from appwrite.client import Client
from appwrite.services.databases import Databases
import os, json

# Module-level — survives warm invocations
client = (Client()
    .set_endpoint(os.environ['APPWRITE_ENDPOINT'])
    .set_project(os.environ['APPWRITE_PROJECT_ID'])
    .set_key(os.environ['APPWRITE_API_KEY']))

databases = Databases(client)

def main(context):
    try:
        body = json.loads(context.req.body or '{}')
        context.log(f'Received: {body}')
        return context.res.json({'ok': True})
    except Exception as e:
        context.error(f'Error: {str(e)}')
        return context.res.json({'error': 'Internal server error'}, 500)
```

```
# requirements.txt
appwrite>=5.0.0
```

### Go 1.21
```go
// main.go
package handler

import (
    "encoding/json"
    "fmt"
    "os"
    "github.com/appwrite/sdk-for-go/appwrite"
    "github.com/appwrite/sdk-for-go/databases"
)

// Module-level client — reused across warm invocations
var client *appwrite.Client
var db     *databases.Databases

func init() {
    client = appwrite.NewClient(
        appwrite.WithEndpoint(os.Getenv("APPWRITE_ENDPOINT")),
        appwrite.WithProject(os.Getenv("APPWRITE_PROJECT_ID")),
        appwrite.WithKey(os.Getenv("APPWRITE_API_KEY")),
    )
    db = databases.New(client)
}

func Main(context appwrite.Context) error {
    var body map[string]interface{}
    if err := json.Unmarshal([]byte(context.Req.Body), &body); err != nil {
        return context.Res.Json(map[string]string{"error": "Invalid JSON"}, 400, nil)
    }
    context.Log(fmt.Sprintf("Received: %v", body))
    return context.Res.Json(map[string]bool{"ok": true}, 200, nil)
}
```

```go
// go.mod
module handler
go 1.21
require github.com/appwrite/sdk-for-go v0.1.0
```

### Dart 3.x
```dart
// lib/main.dart
import 'dart:convert';
import 'package:dart_appwrite/dart_appwrite.dart';

// Module-level — warm invocations reuse this
late final Client _client;
late final Databases _databases;

// Called once on container start
void _init() {
  _client = Client()
    ..setEndpoint(Platform.environment['APPWRITE_ENDPOINT']!)
    ..setProject(Platform.environment['APPWRITE_PROJECT_ID']!)
    ..setKey(Platform.environment['APPWRITE_API_KEY']!);
  _databases = Databases(_client);
}

final bool _initialized = (() { _init(); return true; })();

Future<dynamic> main(final context) async {
  try {
    final body = jsonDecode(context.req.body as String? ?? '{}');
    context.log('Received: $body');
    return context.res.json({'ok': true});
  } catch (e) {
    context.error('Error: $e');
    return context.res.json({'error': 'Internal server error'}, 500);
  }
}
```

### PHP 8.2
```php
<?php
// index.php
use Appwrite\Client;
use Appwrite\Services\Databases;

// Module-level initialization
$client = (new Client())
    ->setEndpoint($_ENV['APPWRITE_ENDPOINT'])
    ->setProject($_ENV['APPWRITE_PROJECT_ID'])
    ->setKey($_ENV['APPWRITE_API_KEY']);

$databases = new Databases($client);

return function ($context) use ($databases) {
    try {
        $body = json_decode($context->req->body ?? '{}', true) ?? [];
        $context->log('Received: ' . json_encode($body));
        return $context->res->json(['ok' => true]);
    } catch (\Exception $e) {
        $context->error('Error: ' . $e->getMessage());
        return $context->res->json(['error' => 'Internal server error'], 500);
    }
};
```

```
# composer.json
{
  "require": {
    "appwrite/appwrite": "^13.0"
  }
}
```

---

## Runtime Selection Guide

```
User-facing real-time API  →  Bun or Node.js 20 (fastest warm start)
Data processing / ML       →  Python 3.11/3.12 (rich ecosystem)
High-performance compute   →  Go 1.21 or C++ (compiled, minimal overhead)
Flutter/Dart mobile app    →  Dart 3.x (share models with app)
Android/JVM team           →  Kotlin 1.9
Apple platform team        →  Swift 5.9
PHP/Laravel team           →  PHP 8.2
Enterprise Java team       →  Java 21
TypeScript-first security  →  Deno 1.x (no node_modules, sandbox by default)
```

---

## Build Configuration per Runtime

### Node.js — Bundle with ESBuild (Faster Cold Start)
```json
// package.json
{
  "scripts": {
    "build": "esbuild src/main.ts --bundle --outfile=dist/main.js --platform=node --target=node20 --external:node-appwrite"
  }
}
```

```json
// appwrite.json function config
{
  "entrypoint": "dist/main.js",
  "buildCommand": "npm ci && npm run build"
}
```

### Python — Use requirements.txt
```
# requirements.txt — pin exact versions for reproducibility
appwrite==6.0.0
httpx==0.27.0
pydantic==2.7.0
```

### Go — Single Binary Output
```
// appwrite.json
"buildCommand": "go build -o main .",
"entrypoint": "main"
```
