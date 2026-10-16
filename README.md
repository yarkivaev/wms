# wms

Generic stock book (`@yarkivaev/wms`).

The package is plant-agnostic: it does not know moulds, diameters, or shops. A plant package names item types, attribute keys, and holders.

The book is immutable. A command returns the next book and does not edit the previous one. Every mutation is a claim. The book records the claim and a journal line first, then changes the snapshot or the tree only when the verdict is `confirmed`. A refusal stays in history: verdict `mismatch`, journal step `mismatch_opened`, snapshot and tree unchanged.

Repository: `https://github.com/yarkivaev/wms`

## Install

```bash
npm install @yarkivaev/wms
```

Node.js 22+, ES modules.

## Quick start

```javascript
import { accept, book, include, path, register } from '@yarkivaev/wms';

const stock = register(include(book('plant'), {
    key: 'n-1', id: 'bay-1', holder: 'plant', at: new Date(), actor: 'ada'
}), {
    key: 'c-1',
    id: 's-1',
    kind: 'sample',
    attrs: { lot: 'A' },
    holder: 'bay-1',
    at: new Date(),
    actor: 'ada'
});
const next = accept(stock, {
    key: 'c-2',
    id: 's-1',
    holder: 'plant',
    attrs: { lot: 'A' },
    at: new Date(),
    actor: 'ada'
});
path(next, 'bay-1');
```

## Book

`book(rootId)` opens a book whose tree has one node: the plant root. That node appears with the book and is not filed as a claim. The book then has four parts:

- `items` — current item snapshots
- `claims` — every claim, confirmed or mismatch
- `entries` — journal. One line per claim, with the claim key in the payload
- `tree` — storage topology. The root is the plant. Every other holder hangs under it

The book is the only place a snapshot may change. A claim and a journal line do not move an item. The command does, and only when the verdict is `confirmed`.

## Storage tree

The tree is the organization's warehouse: where an item may stand. `book(rootId)` sets the root. That node is the plant. Its `parent` is empty because nothing sits above the plant. An item `holder` is never empty: the plant is a holder too.

Each further node is filed with `include`. `holder` is an existing parent. `id` is the new node. A shop hangs under the plant, a machine under a shop, a shelf under a bay. Depth is unbounded. A duplicate `id` or a missing parent does not change the tree: the claim gets `mismatch`.

A node stores:

- `id` — holder identifier. Written on the item and on place claims
- `parent` — parent identifier. `null` on the root

An item `holder` is a node id, not a path. `path(book, id)` lists ids from the plant down, root first. For `bay-1` under `shop` under `plant` the path is `['plant', 'shop', 'bay-1']`.

Any node may hold many items. An item stands on one node. `register` and a confirmed `place` require that node to already exist. Include first, then place. Moving an item does not change the tree: only `holder` changes. This book has no command to drop a node or move a branch.

## Item

The current truth about one thing. History is not on the item: it lives in claims and in the journal.

- `id` — unique identifier. A second `register` with the same `id` does not create a second item and does not change the first. The claim gets `mismatch`
- `kind` — item type. The library stores the string and does not interpret it. The plant package gives it meaning
- `attrs` — attribute snapshot. The library does not know key names and does not give them fields. A place claim compares only the pairs it submitted
- `status` — `in_service` or `retired`. A new item is always `in_service`
- `holder` — node id in the storage tree. It is never empty. An item has one holder. The tree root is the plant, and an item may stand there too. A warehouse, shop, or machine is the same kind of node under the root, filed by the plant package with `include`

`register` creates an in-service item on an existing node. `revise` replaces `attrs` as a whole and leaves `status` and `holder`. `retire` sets `retired` and leaves the item on the same node. A retired or unknown item cannot be revised or confirmed: `revise`, `retire`, and `place` write `mismatch` and leave the snapshot. A holder that is not in the tree is not applied: that claim is `mismatch` too.

## Claim

An immutable record of one mutation and the book's verdict at that moment. After the command the claim does not change: it is not reviewed and not closed. The next passport, node, or holder edit is a new claim. The old one stays as it was.

- `key` — claim key. The journal points at it
- `action` — mutation filed: `include`, `register`, `revise`, `retire`, or `place`
- `id` — new node, or the item that was claimed
- `holder` — tree node. For `include` this is the parent of the new node. For `register` and `place` this is the node the item is put on. For `revise` and `retire` this is the item's current holder, if the item was found
- `attrs` — claimed attributes. On `include` and `retire` the claim attributes are empty or equal to the current item snapshot. On `place` only submitted keys are compared. Extra snapshot keys do not block the claim. A submitted key missing from the snapshot is a mismatch
- `at` — when it was claimed
- `actor` — who claimed it
- `verdict` — the book's answer at accept time: `confirmed` or `mismatch`. It does not change later

`place` is confirmed only when the item exists, it is `in_service`, the claimed node is in the tree, and every submitted key equals the snapshot. Then the item holder becomes the claimed node, and the previous holder loses it, because holder is one field. Otherwise the verdict is `mismatch`: snapshot and holder do not move. An unknown `id` does not create an item. A mismatch is that claim, not a separate queue.

## Journal entry

One step the book took. The line itself does not edit a snapshot. There are as many lines as claims, in the same order. `payload` always has the claim `key` and `id`.

- `kind` — step name. On a confirmed mutation it equals the claim `action`. On a refusal it is `mismatch_opened`

Step names:

- `include` — a node was nested
- `register` — an item was created
- `revise` — the attribute snapshot was replaced
- `retire` — an item was retired
- `place` — an item was put on the claimed node
- `mismatch_opened` — the claim was not applied, snapshot and tree unchanged

## Commands

Every mutation uses the same envelope: `key`, `at`, `actor`, and the fields of that mutation.

- `book(rootId)` — a book with one node, the plant. No claim
- `include(book, { key, id, holder, at, actor })` — claim to nest node `id` under node `holder`
- `path(book, id)` — identifiers from the plant down to that node. Does not change the book
- `register(book, { key, id, kind, attrs, holder, at, actor })` — claim to create an item on a tree node
- `revise(book, { key, id, attrs, at, actor })` — claim to replace attributes of an in-service item
- `retire(book, { key, id, at, actor })` — claim to retire an item and leave it on the same node
- `accept(book, { key, id, holder, attrs, at, actor })` — `place` claim: move the item to the claimed node when the snapshot matches

## HTTP

`wmsApi(basePath, ledger, granted)` is a `plantApi`-style route factory on `@yarkivaev/simple-server`. The plant package names kinds and holders. Who may write is the injected `granted` predicate, not a role of this package. Routes `await` `ledger.load` / `ledger.save`. `memoryLedger` is sync. `postgresLedger(pool, plant)` is the jsonb adapter: one row per plant, optimistic `version`. Inject a `pg.Pool` or any queryable; this package does not depend on `pg`.

```javascript
import { postgresLedger, wmsApi } from '@yarkivaev/wms';

const ledger = postgresLedger(pool, 'plant');
const api = wmsApi('/wms', ledger, (req) => {
    return req.headers['remote-groups'] === 'wms';
});
```

- `GET {base}/items?limit=&after=&holder=&kind=&q=` — snapshots and holder path; `limit` windows after cursor `after`
- `GET {base}/items/:id` — one snapshot and holder path
- `GET {base}/holders`, `GET {base}/holders/:id` — tree nodes and path from the plant
- `GET {base}/entries?kind=` — journal, optional kind filter
- `POST {base}/include|register|revise|retire|place` — one claim, `actor` in the body

A refused write does not file a claim. A POST answers 409 when the stored book version moved.

## CI/CD

GitHub Actions via `yarkivaev/npm-workflows` (lint, test, version check). A push to `main` tags `v*` and publishes `@yarkivaev/wms` to npm.
