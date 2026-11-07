---
name: telegram-serverless
description: Use when building, testing, deploying, or maintaining Telegram bots and Mini Apps on Telegram's official Serverless infrastructure (tgcloud CLI, V8 sandbox, built-in SQLite, Mini App endpoints).
---

# Telegram Serverless (`tgcloud`)

## Overview
Telegram Serverless executes bot update handlers and Mini App backend endpoints directly inside Telegram's V8 infrastructure adjacent to the Bot API and a dedicated SQLite database. It eliminates external VPS hosting, manual webhook configuration, and container maintenance.

## When to Use
- Developing Telegram bots or Mini App backends hosted natively on Telegram's infrastructure.
- Interacting with `@tgcloud/cli` (commands: `init`, `login`, `push`, `migrate`, `run`, `webhook`).
- Writing database schemas and migrations using Telegram's built-in SQLite Drizzle-like DSL (`tgcloud/schema.js`).
- Handling Telegram update events in isolated handlers (`tgcloud/handlers/<update_type>.js`).
- Building Mini App RPC endpoints (`tgcloud/endpoints/<name>.js`) invoked via `Telegram.WebApp.Serverless.call`.
- Deploying Mini App static front-ends to `https://app<app_id>.tgcloud.ai/` via `tgcloud.jsonc`.

## When NOT to Use
- Long-running daemons, WebSockets, or persistent TCP background processes (runtime is short-lived V8 sandbox).
- Bots requiring external npm dependencies inside the runtime sandbox (runtime strictly exposes only `sdk` and local modules).
- Systems requiring database engines other than the platform-provided SQLite.
- Traditional VPS hosting with long polling or self-managed webhooks.

---

## Architecture & Project Anatomy (CLI v0.2.0+)

All serverless application code resides in the `tgcloud/` folder:

```
my-bot/
├── tgcloud/
│   ├── handlers/            # Entry points for Telegram update types (flat)
│   │   ├── message.js
│   │   ├── callback_query.js
│   │   └── inline_query.js
│   ├── endpoints/           # RPC functions called by Mini Apps (flat)
│   │   └── getProfile.js
│   ├── lib/                 # Shared project modules (subdirectories allowed)
│   │   ├── db-helpers.js
│   │   └── payments/stripe.js
│   └── schema.js            # SQLite database schema definition
├── dist/                    # Built Mini App static assets (if applicable)
├── tgcloud.jsonc            # Project & static hosting configuration
├── package.json
└── .tgcloud/                # Local CLI cache and credentials (git-ignored)
```

### Module Resolution Rules
1. **Isolated Runtime**: Modules can ONLY import `sdk` (or submodules `sdk/db`, `sdk/api`, `sdk/fetch`) and modules within `tgcloud/`. No external `npm` packages, Node.js built-ins (`fs`, `path`, `crypto`), or filesystem access exist.
2. **Import Styles**:
   - Bare imports by module name: `import { api } from 'sdk';`, `import { users } from 'schema';`, `import { fmt } from 'lib/fmt';`.
   - Relative imports with extensions: `import { users } from '../schema.js';`, `import { util } from './internal.js';`.
3. **Flat vs Nested**:
   - `handlers/` and `endpoints/` must remain completely flat (no subdirectories).
   - `lib/` supports arbitrary subdirectories.

---

## Handlers (`tgcloud/handlers/`)

Telegram routes incoming updates directly to the matching handler file. An update type is processed **only if its file exists and is non-empty**; all other update types are ignored by Telegram.

### Signature & Contract
```js
// tgcloud/handlers/message.js
import { api, db } from 'sdk';
import { users } from 'schema';
import { eq } from 'sdk/db';

export default async function (payload, ctx) {
  // payload: Unwrapped update payload (e.g., Message, CallbackQuery)
  const chatId = payload.chat.id;
  const rawUpdate = ctx.update; // Complete Telegram Update object (contains update_id, etc.)

  await api.sendMessage({
    chat_id: chatId,
    text: `Echo: ${payload.text ?? '(media)'}`,
  });
}
```

- **Arguments**:
  - `payload`: The specific update object unwrapped (`update.message`, `update.callback_query`, etc.).
  - `ctx`: Per-invocation context carrying `ctx.update` (raw Update object).
- Scaffold new handlers: `npx tgcloud add handlers/<update_type>` (e.g., `callback_query`, `inline_query`, `chat_member`).

---

## Mini App Endpoints (`tgcloud/endpoints/`)

Endpoints are backend RPC functions invoked exclusively by Telegram Mini Apps.

### Signature & Contract
```js
// tgcloud/endpoints/getUserData.js
import { db, EndpointError } from 'sdk';
import { users } from '../schema.js';
import { eq } from 'sdk/db';

export default async function (input, ctx) {
  // input: JSON object sent from the Mini App
  // ctx.initData: Cryptographically pre-verified Telegram init data (user, auth_date, etc.)
  const user = ctx.initData.user;
  if (!user) {
    throw new EndpointError('User authentication failed');
  }

  const profile = await db.select().from(users).where(eq(users.tgId, user.id)).get();
  if (!profile) {
    throw new EndpointError('User profile not found', { userId: user.id, code: 'NOT_FOUND' });
  }

  return { success: true, profile }; // Returned value is serialized to JSON
}
```

### Front-End Invocation (Mini App)
Mini Apps call endpoints using the official `telegram-web-app.js` SDK:
```js
Telegram.WebApp.Serverless.call('getUserData', { lang: 'fa' }, function (err, result) {
  if (err) {
    if (err.type === 'ENDPOINT_ERROR') {
      console.error(err.message, err.parameters); // Business error from EndpointError
    } else {
      console.error('System / Auth error:', err.type); // e.g., 'UNAUTHORIZED'
    }
    return;
  }
  console.log('Result:', result);
});
```

---

## Database System (`tgcloud/schema.js`)

Every bot has a dedicated SQLite database. Schemas are declared using a Drizzle-like typed DSL.

### Strict Constraints
1. **NO FOREIGN KEYS ALLOWED**: The runtime operates with `PRAGMA foreign_keys = off`. Calling `.references()` or `foreignKey()` **throws an exception at definition time** and prevents deployment. Relationships must be maintained in application logic.
2. **ALL QUERIES ARE ASYNC**: Every terminal method (`.all()`, `.get()`, `.values()`, `.run()`, `db.$count()`) returns a Promise and **must be awaited**.

### Schema DSL Definition
```js
// tgcloud/schema.js
import { table, integer, text, boolean, real, blob, json, index, sql } from 'sdk/db';

export const users = table('users', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  tgId:      integer('tg_id').unique().notNull(),
  username:  text('username'),
  balance:   real('balance').default(0.0),
  isActive:  boolean('is_active').default(true),
  metadata:  json('metadata'),
  avatar:    blob('avatar'), // Uint8Array
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  // Deprecating fields:
  legacyField: text('legacy_field').deprecated('replaced by metadata'),
}, (t) => ({
  tgIdIdx: index('idx_users_tg_id').on(t.tgId),
  activeIdx: index('idx_active_users').on(t.createdAt).where(sql`is_active = 1`),
}));
```

### Querying with `db`
```js
import { db } from 'sdk';
import { users } from 'schema';
import { eq, and, gt, sql, count } from 'sdk/db';

// Select
const allUsers = await db.select().from(users).all();
const singleUser = await db.select().from(users).where(eq(users.tgId, 12345)).get();

// Insert / Upsert
const [newUser] = await db.insert(users)
  .values({ tgId: 12345, username: 'agent' })
  .onConflictDoUpdate({
    target: users.tgId,
    set: { username: 'agent' }
  })
  .returning()
  .run();

// Count
const totalActive = await db.$count(users, eq(users.isActive, true));

// Update & Delete
await db.update(users).set({ balance: 50.0 }).where(eq(users.tgId, 12345)).run();
await db.delete(users).where(eq(users.tgId, 12345)).run();

// Raw SQL
await db.run('UPDATE users SET balance = balance + :amt WHERE tg_id = :id', { ':amt': 10, ':id': 12345 });
const rows = await db.all(sql`SELECT * FROM users WHERE balance > ${10}`);
```

---

## Two-Step Deployment & Migration Model

Deploying code and altering database schemas are deliberately decoupled to prevent accidental data corruption:

1. **Step 1: Deploy code and schema declaration**
   ```bash
   npx tgcloud push
   ```
   - Bundles all `.js` files in `tgcloud/` and updates the cloud state.
   - If `schema.js` has changes, `push` reports pending migrations but **does not alter the database**.

2. **Step 2: Review and apply database migrations**
   ```bash
   npx tgcloud migrate
   ```
   - Change categories:
     - **safe**: Additive changes (new table, new column, new index) applied in batch.
     - **warning**: Destructive changes (drops, column removals) prompted individually.
     - **manual**: Incompatible changes (type changes) requiring manual SQL data copy.
     - **undocumented**: Objects present in DB but missing from `schema.js`.
   - Migration flags:
     - `--dry-run`: View diff without applying.
     - `--safe`: Apply safe changes automatically and skip warnings.
     - `--yes`: Apply safe changes and confirm all warnings (use with caution).
     - `--local`: Diff against local unpushed `schema.js`.

3. **Safe Deletion Protocol**:
   - Never delete a column or table directly from `schema.js` without deprecation; doing so makes it "undocumented" rather than dropped.
   - Mark with `.deprecated('reason')`. Run `npx tgcloud push` then `npx tgcloud migrate` to confirm drop. Then remove the line from `schema.js`.

---

## SDK Capabilities Reference (`sdk`)

### Telegram Bot API (`api`)
- All Bot API methods are exposed via `api.<methodName>(params)`.
- Method results are **automatically unwrapped** (no `{ ok: true, result: ... }` envelope).
- Uses standard Bot API `snake_case` keys (`chat_id`, `reply_markup`).
- Failures throw `BotApiError`:
  ```js
  import { api, BotApiError } from 'sdk';
  try {
    await api.sendMessage({ chat_id: 123, text: 'Hi' });
  } catch (err) {
    if (err instanceof BotApiError) {
      console.error(err.code, err.description, err.method, err.parameters);
    }
  }
  ```

### File Uploads & Downloads
- **Upload (`InputFile`)**:
  ```js
  import { api, InputFile } from 'sdk';
  const file = new InputFile(uint8Bytes, 'report.pdf', { type: 'application/pdf' });
  await api.sendDocument({ chat_id: 123, document: file });
  ```
  Upload limits: 50MB per file, 10MB per photo.
- **Download**:
  ```js
  const bytes = await api.getFileContent(file_id); // Uint8Array (max 20MB)
  const { file, body } = await api.getFileStream(file_id);
  ```

### HTTP Requests (`fetch`)
- Outbound HTTP client for third-party APIs and AI endpoints:
  ```js
  import { fetch } from 'sdk';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ...' },
    body: fetch.body.json({ model: 'gpt-4o', messages: [...] }),
  });
  const data = await res.json();
  ```
- Supports body helpers: `fetch.body.json()`, `fetch.body.form()`, `fetch.body.text()`.
- Supports streaming via `for await (const chunk of res.body)`.
- **Response limit: 30MB maximum**.

---

## Static Hosting & `tgcloud.jsonc` (Mini Apps)

The build output of a Mini App front-end is served at `https://app<app_id>.tgcloud.ai/`:
```jsonc
{
  "$schema": "./node_modules/@tgcloud/cli/schema/tgcloud.json",
  "static": {
    "source": "dist",
    "spa": true,
    "immutable": ["/assets/*"],
    "headers": [{ "path": "/*", "set": { "Referrer-Policy": "no-referrer" } }],
    "redirects": [{ "from": "/old", "to": "/new", "status": 301 }]
  }
}
```
- `tgcloud push` deploys both `tgcloud/` modules and static `dist` files.
- The same host serves Mini App endpoints under `/api/` (do not place static files in `/api/`).
- Never set `X-Frame-Options: DENY` (Telegram Web runs Mini Apps in iframes).

---

## CLI Command Cheat Sheet

| Command | Action | Key Notes |
|---|---|---|
| `npx tgcloud login` | Authenticate CLI with bot | Requires CLI access token (`app<id>:<secret>`) from @BotFather |
| `npx tgcloud init` | Initialize serverless scaffold | Creates `tgcloud/`, `tgcloud.jsonc`, `AGENTS.md` |
| `npx tgcloud add <target>` | Add handler, endpoint, or lib | e.g. `handlers/callback_query`, `endpoints/getProfile`, `lib/cache` |
| `npx tgcloud status` | Check working tree vs cloud | Runs offline |
| `npx tgcloud diff` | Show line-by-line diff | Runs offline |
| `npx tgcloud run <module> [args]` | Test handler/endpoint locally | Runs locally on platform V8 isolate without deploying |
| `npx tgcloud push [targets]` | Deploy modules and static files | Atomic deployment |
| `npx tgcloud migrate` | Apply schema migrations | Separated from `push`; requires review |
| `npx tgcloud webhook sync` | Realign webhook & `allowed_updates` | Auto-detects deployed handlers; use `--drop-pending` if needed |
| `npx tgcloud upgrade` | Upgrade pre-0.2.0 layout | Moves root modules into `tgcloud/` |

### Testing with `npx tgcloud run`
```bash
# Test message handler:
npx tgcloud run handlers/message '{ chat: { id: 100 }, text: "/start" }'

# Test endpoint with simulated context:
npx tgcloud run endpoints/getUserData '{"lang": "fa"}' --ctx '{ initData: { user: { id: 100, first_name: "Ali" } } }'
```

---

## Red Flags & Common Rationalizations

| Rationalization / Mistake | Reality & Remedy |
|---|---|
| "I will `npm install axios` or other libraries" | **FORBIDDEN**. Runtime sandbox cannot access node_modules. Use `fetch` from `sdk`. |
| "I'll add `.references()` to enforce foreign keys" | **FATAL ERROR**. Throws exception at declaration time. Enforce integrity in application code. |
| "Running `tgcloud push` updated my database" | **FALSE**. `push` only updates code. Always follow with `tgcloud migrate`. |
| "I'll call `setWebhook` via the Bot API" | **ANTIPATTERN**. Telegram Serverless manages webhooks automatically. Run `tgcloud webhook sync`. |
| "I forgot `await` on `db.select()`" | Queries return unexecuted Promises. Always `await db...`. |
| "I used relative path `./schema` without `.js`" | If using relative paths, `.js` extension is mandatory (`../schema.js`). Or use bare import (`'schema'`). |
| "I placed a subfolder inside `handlers/`" | `handlers/` must be completely flat. Move nested code into `lib/`. |
