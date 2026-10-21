# Bite — Hybrid Restaurant POS, Kitchen & Inventory

Bite is a local-first restaurant operating system built with HTML5, Tailwind CSS, vanilla ES2022 modules, Chart.js, a service worker and a PHP 8 + MySQL sync API. It keeps taking orders and printing bills when the internet is down, then reconciles every change with the central database when connectivity returns.

```
┌──────────────────────── Browser (offline-first) ────────────────────────┐
│ Tables & POS · Kitchen KOT · Menu · Inventory · Bills · Staff           │
│ State: localStorage (users, menu, stock, orders, invoices, syncQueue)   │
│ Cache: sw.js pre-caches shell, fonts, Tailwind, Chart.js and modules    │
│                                │                                        │
│                      POST api/sync.php (X-Bite-Key)                     │
│                                ▼                                        │
│ ┌──────────────────────── PHP 8 + MySQL 8 ────────────────────────────┐ │
│ │ idempotent batch upserts · sync_log · pull · ping · PIN hashing     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Feature map

| Area | What is included |
| --- | --- |
| **Shell & aesthetic** | Centered 1240 px workspace, 24 px radius, open charcoal gutters with hand-drawn monochrome burger, club, sub, fries, pizza and iced-coffee SVGs (grayscale, blur, 16% opacity). |
| **Offline-first** | Every entity lives in `localStorage`. Mutations are durable before they are sent. The service worker caches the entire app shell. |
| **Sync queue** | Orders, KOTs, payments, menu/category edits, stock changes and staff edits queue as `PENDING_LOCAL`; the header shows a live pending counter. Online events and a 60-second heartbeat flush automatically with retry/backoff. |
| **Authentication** | Touchscreen PIN keypad, one-tap staff cards, 12-hour sessions, role permissions, five-attempt lockout, staff CRUD with shifts and enable/disable. |
| **Live tables** | T-01…T-10 plus Takeaway & Delivery. Each table shows guest count, waiter, running total, kitchen phase and its current items. |
| **Kitchen display** | Station filters, cooking → ready → served one-tap bumps, ticket-age warnings, full screen, table-wise notes. |
| **Menu & categories** | Dish CRUD, availability toggles, station assignment, dynamic category add/rename/delete and a recipe builder linked to inventory. |
| **Inventory** | 35 seeded materials, minimum alerts, unit cost/value, supplier, movement audit, recipe deductions, +5 Buy / −1 Waste, CSV export. |
| **Billing** | Subtotal, discount, VAT/service %, cash/card/mobile, change validation, invoice numbering, stock settlement, 80 mm receipt with barcode and print CSS. |
| **Analytics** | Seven-day revenue, payment mix, category mix, top sellers, KPI cards and a reprintable invoice ledger. |
| **Data safety** | Full `.JSON` backup/restore, sales `.CSV`, stock movement `.CSV`, confirmed reset and corrupt-storage recovery. |

## Quick start

### Requirements

- PHP **8.1+** with `pdo_mysql` (tested on PHP 8.5)
- MySQL **8.0+** (tested on MySQL 9.6)
- A modern browser; Chrome/Edge kiosk mode is ideal for a fixed terminal

### 1. Create the database

```bash
mysql -u root -p < database/schema.sql
```

This creates `bite_pos`, all schema tables and indexes, plus the 12 default restaurant tables (T-01…T-10, Takeaway and Delivery). It is safe to re-run (`CREATE TABLE IF NOT EXISTS` / `INSERT IGNORE`).

### 2. Configure the API

`api/config.php` reads environment variables with development defaults:

| Variable | Default | Notes |
| --- | --- | --- |
| `BITE_DB_HOST` | `127.0.0.1` | MySQL host |
| `BITE_DB_PORT` | `3306` | |
| `BITE_DB_NAME` | `bite_pos` | |
| `BITE_DB_USER` | `root` | Use a least-privilege app user in production |
| `BITE_DB_PASS` | *(empty)* | |
| `BITE_SYNC_KEY` | `bite-dev-key` | **Change before deployment** |
| `BITE_ALLOWED_ORIGIN` | *(empty)* | Optional CORS origin for a separate UI host |

Example Apache configuration:

```apache
SetEnv BITE_DB_USER bite_app
SetEnv BITE_DB_PASS 'strong-database-password'
SetEnv BITE_SYNC_KEY 'long-random-shared-key'
```

Open **Sync Center** in the top bar, enter the same key and press **Test connection**. The key travels in the `X-Bite-Key` header. Server-side PINs are hashed with `password_hash()` and are never returned by `pull`.

### 3. Serve the app

```bash
cd /path/to/Bite
php -S 127.0.0.1:8787 -t .
```

Open <http://127.0.0.1:8787>. Or use `./tools/serve.sh`.

For Apache/Nginx, point the document root at the project root so `api/sync.php` stays under `/api/`. The included `.htaccess` files deny direct access to SQL, Markdown, shell scripts and the database/tools folders. On Nginx add:

```nginx
location ~* \.(sql|md|sh|log)$ { deny all; }
```

> ES modules do not run from `file://`. Always serve over HTTP(S).

### 4. Optional: install as a PWA

Serve over HTTPS (or localhost), then use the browser's install action. The service worker pre-caches every module, font, Tailwind and Chart.js, so a previously loaded terminal can boot fully offline.

## Demo staff & PINs

| Profile | Role | PIN | Shift |
| --- | --- | --- | --- |
| Rina Kapoor | Admin | `1234` | Morning |
| Marco Silva | Manager | `2345` | Mid |
| Ayesha Noor | Cashier | `3456` | Evening |
| Leo Chen | Waiter | `4567` | Morning |
| Dev Patel | Chef | `5678` | Evening |
| Sofia Marino | Waiter | `6789` | Evening |

Quick-login cards are intentionally one tap. PIN entry, backspace and Enter also work on a physical keyboard. Five failed PINs lock the keypad for 30 seconds.

## Where data lives

```
localStorage['bite.pos.v1']     → the entire workspace (JSON)
localStorage['bite.session.v1'] → signed-in user + timestamp (12 h expiry)
```

Server IDs are the client-generated IDs, which makes every event idempotent. `sync_log.client_event_id` is unique, so a retried event is acknowledged without being applied twice.

### Queue event types

| Event | Payload | Applied server-side |
| --- | --- | --- |
| `ORDER_UPSERT` | `{ order }` | Upsert order + replace line items |
| `KOT_SENT` | `{ order }` | Same, with kitchen statuses |
| `ORDER_STATUS` | `{ order, from, to }` | Same, with new line statuses |
| `ORDER_CANCEL` | `{ orderId }` | Delete order (cascade items) |
| `INVOICE_CREATED` | `{ invoice }` | Upsert invoice + replace invoice items |
| `CATEGORY_UPSERT` / `CATEGORY_DELETE` | `{ category }` / `{ id }` | Category CRUD |
| `MENU_UPSERT` / `MENU_DELETE` | `{ item }` / `{ id }` | Dish + recipe replacement |
| `INVENTORY_PUSH` | `{ item, log }` | Stock upsert + immutable movement |
| `INVENTORY_DELETE` | `{ id }` | Item + movement removal |
| `USER_UPSERT` / `USER_DELETE` | `{ user }` / `{ id }` | Staff CRUD, PIN hashed |
| `MASTER_BOOTSTRAP` | `{ categories, inventory, users, menu }` | One-shot full catalogue push |

Stock is deducted **once per line** at KOT time (`stockDeducted`); only undeducted lines are settled at payment, preventing double deductions. Each line deducts `recipe ratio × quantity`.

The first time a workspace signs in, Bite enqueues one `MASTER_BOOTSTRAP` event so the seeded catalogue reaches MySQL. **Push master data** in Sync Center re-sends it on demand.

## API

All actions require the shared key.

```bash
# Health check
curl -H 'X-Bite-Key: bite-dev-key' \
  'http://127.0.0.1:8787/api/sync.php?action=ping'

# Push a batch (max 200 events, max 5 MB)
curl -X POST \
  -H 'Content-Type: application/json' \
  -H 'X-Bite-Key: bite-dev-key' \
  --data-binary @tools/sync-smoke.json \
  'http://127.0.0.1:8787/api/sync.php?action=push'

# Pull master data changed since a timestamp
curl -H 'X-Bite-Key: bite-dev-key' \
  'http://127.0.0.1:8787/api/sync.php?action=pull&since=1970-01-01T00:00:00Z'
```

Push response:

```json
{
  "ok": true,
  "results": [
    { "id": "q_abc", "status": "synced", "type": "ORDER_UPSERT" },
    { "id": "q_def", "status": "failed", "type": "MENU_UPSERT", "error": "Menu item name is required." }
  ],
  "counts": { "applied": 1, "failed": 1, "duplicates": 0 },
  "serverTime": "2026-10-20T14:14:54+00:00"
}
```

Each event uses a MySQL savepoint, so one bad record does not roll back valid records. Failed events remain queued on the client and retry with exponential backoff.

### Pull semantics

`pull` returns categories, menu with recipes, inventory, staff (without hashes) and tables. The client only merges master records where the server `updatedAt` is newer; open orders, invoices and the sync queue are left untouched. Deletions should be performed from the terminal so individual delete events reach the server. Conflicts are last-write-wins by `updatedAt`.

## Printing 80 mm receipts

Click **Print 80mm** after taking payment or from an invoice row. `@page { size: 80mm auto }` and print-only CSS hide the app shell, dialogs and gutters, leaving a monospace receipt with restaurant details, line items, VAT, service, payment, change, a deterministic barcode and the invoice number. Set the browser printer to 80 mm, margins **None**, scale **100%**, and disable headers/footers for the cleanest output.

## Project structure

```
Bite/
├── index.html                  app shell, SVG icon + sketch sprites
├── manifest.webmanifest        PWA metadata and shortcuts
├── sw.js                       pre-cache, navigation fallback, API handling
├── assets/
│   ├── css/app.css             design system, responsive + 80 mm print CSS
│   ├── fonts/                  self-hosted Fraunces & Manrope
│   ├── img/                    favicon + PWA icon
│   ├── js/
│   │   ├── app.js              boot, routing, header, role-aware nav, SW
│   │   ├── store.js            localStorage state, seed, totals, stock
│   │   ├── sync.js             queue, flush, retry, pull, bootstrap
│   │   ├── sync-ui.js          Sync Center modal
│   │   ├── auth.js             PIN login, sessions, staff CRUD
│   │   ├── pos.js              tables, menu, cart, KOT firing
│   │   ├── kitchen.js          live kitchen board
│   │   ├── menu.js             dish & category management
│   │   ├── inventory.js        stock, adjustments, movement audit
│   │   ├── billing.js          payments, receipts, backup/restore, CSV
│   │   ├── analytics.js        Chart.js dashboards + invoice ledger
│   │   └── utils.js            formatting, dialogs, toasts, downloads
│   └── vendor/                 self-hosted Tailwind runtime + Chart.js
├── api/
│   ├── config.php              PDO, API-key guard, CORS, helpers
│   └── sync.php                ping / push / pull, savepoints, idempotency
├── database/schema.sql         MySQL 8+ schema + default tables
├── tools/
│   ├── serve.sh                `php -S` convenience runner
│   └── sync-smoke.json         sample batch for API verification
└── README.md
```

## Roles

| Action | Admin | Manager | Cashier | Waiter | Chef |
| --- | :-: | :-: | :-: | :-: | :-: |
| Tables & orders | ✓ | ✓ | ✓ | ✓ | — |
| Fire KOT | ✓ | ✓ | ✓ | ✓ | — |
| Bump kitchen tickets | ✓ | ✓ | — | — | ✓ |
| Menu & categories | ✓ | ✓ | read | — | ✓ |
| Inventory & stock | ✓ | ✓ | read | — | ✓ |
| Settle bills & reprint | ✓ | ✓ | ✓ | — | — |
| Analytics | ✓ | ✓ | ✓ | — | — |
| Staff & access | ✓ | ✓ | — | — | — |
| Backups & restore | ✓ | ✓ | — | — | — |
| Sync Center | ✓ | ✓ | ✓ | ✓ | ✓ |

Managers cannot create or edit `admin` profiles; only an admin can. A profile cannot disable or delete itself, and the last active admin is protected.

## Customising the restaurant

The seeded identity, tax defaults and feature settings live in `defaultSettings()` inside `assets/js/store.js`:

```js
restaurant: {
  name: 'Bite Kitchen & Bar',
  address: '14 Harbor Lane, Portside',
  phone: '+1 (555) 014-8842',
  taxId: 'VAT-884-221',
  receiptFooter: 'Thank you for eating with us. See you soon!',
},
currency: '$',
vatPct: 5,
servicePct: 5,
invoicePrefix: 'BT',
```

VAT and service can also be changed per bill inside Checkout. Changing seed data affects a **fresh** workspace or **Reset demo workspace**. For a live workspace, edit the exported `.JSON` backup and restore it. `store.js` ships 35 inventory items, 20 dishes, 6 categories and seven days of demo invoices.

Each change follows the same pipeline:

```text
button click → mutate localStorage state → enqueue sync event → UI refresh
             → (online) debounce 700 ms → POST api/sync.php → SYNCED
             → (offline) PENDING_LOCAL → header counter → flush on reconnect
```

## Production checklist

- [ ] Change `BITE_SYNC_KEY` and the Sync Center key; use a long random value.
- [ ] Serve over HTTPS (required for PWA install and protects the key and receipts).
- [ ] Create a MySQL app user limited to `SELECT, INSERT, UPDATE, DELETE` on `bite_pos`.
- [ ] Deny public access to `database/` and `tools/` (Apache rules included; add Nginx equivalents).
- [ ] Back up MySQL daily and export a terminal `.JSON` before clearing browser storage.
- [ ] Pin Chrome/Edge kiosk mode, disable sleep, and configure the 80 mm printer.
- [ ] Verify `pdo_mysql` is enabled, MySQL strict mode is on, and PHP uses UTC.
- [ ] Decide currency/VAT/restaurant identity before going live.
- [ ] Test offline → online recovery on every device; confirm the pending counter returns to 0.
- [ ] Rotate the API key if a device is retired and clear its local storage.

## Security model & limitations

Bite is designed for a **trusted restaurant terminal**. Staff PINs are stored locally in plain text because offline PIN verification must work without a server; the server stores only `password_hash()` values and never returns them. One-tap quick login deliberately bypasses PIN for fast shift changes, as specified. For internet-facing or multi-tenant use, put the app behind a proper identity provider and device management, and disable quick login.

The sync API is protected by a shared key compared with `hash_equals()`. There is no per-user server session, so anyone holding the key can push events. Use HTTPS, keep the key out of public repos, restrict CORS (`BITE_ALLOWED_ORIGIN`) when hosting the UI separately, and prefer a VPN/zero-trust tunnel over exposing the register to the open internet.

Browser storage can be cleared by the user or OS. Persistent storage is requested on boot where supported, but **backups remain the source of truth**. Server sync is last-write-wins by `updatedAt`, not a real-time multi-master CRDT. Avoid editing the same table from two terminals simultaneously.

Invoice numbers are allocated locally (`BT-1047`). For more than one billing terminal, give each terminal a distinct `invoicePrefix` in `defaultSettings()`/its backup so the server's unique invoice number constraint is never hit.

## Verification

```bash
# PHP syntax
php -l api/config.php && php -l api/sync.php

# Schema + API
mysql -u root < database/schema.sql
php -S 127.0.0.1:8787 -t . &
curl -H 'X-Bite-Key: bite-dev-key' \
  'http://127.0.0.1:8787/api/sync.php?action=ping'
curl -X POST -H 'Content-Type: application/json' -H 'X-Bite-Key: bite-dev-key' \
  --data-binary @tools/sync-smoke.json \
  'http://127.0.0.1:8787/api/sync.php?action=push'
```

`tools/sync-smoke.json` exercises category, inventory + movement, staff, menu recipe, order and invoice upserts. Posting it twice returns `duplicate: true` for every event, proving idempotency.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| **Blank screen** | Serve over HTTP, not `file://`. Check DevTools → Console for the module error. |
| **401 from Sync Center** | The key does not match `BITE_SYNC_KEY`. Save the key, then Test connection. |
| **Database connection failed** | MySQL is stopped, the database is missing, or credentials in `api/config.php` are wrong. Check the PHP error log. |
| **Charts missing** | Verify `assets/vendor/chart.umd.min.js` loads; clear an older service worker if the cache is inconsistent. |
| **Old UI after edits** | Bump `VERSION` in `sw.js`, reload, or DevTools → Application → Service Workers → Update. |
| **Receipt clips** | Set 80 mm paper, margins None, scale 100%; disable browser headers/footers. |
| **Pending counter never clears** | The API is unreachable or events are failing. Open Sync Center for per-event errors and Retry failed. |
| **“Local storage is full”** | Export JSON + CSV, then reset or restore a trimmed workspace. |
| **PIN lost after pull** | Fixed: pull preserves local PINs because hashes are never sent to the client. Quick login always works. |

## Credits

Typography: Fraunces and Manrope (SIL Open Font License). Charts: Chart.js (MIT). Styling: Tailwind CSS runtime (MIT). Food sketches and interface: custom SVG/CSS, no external image dependencies.


# bite_resturent
