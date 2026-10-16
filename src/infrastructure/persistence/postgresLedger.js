import { book } from '../../domain/book.js';
import claim from '../../domain/claim.js';
import entry from '../../domain/entry.js';
import item from '../../domain/item.js';

const SCHEMA = `CREATE TABLE IF NOT EXISTS wms_book (
  plant text PRIMARY KEY,
  book jsonb NOT NULL,
  version integer NOT NULL DEFAULT 0
)`;
const SELECT = 'SELECT book, version FROM wms_book WHERE plant = $1';
const UPSERT = `INSERT INTO wms_book (plant, book, version) VALUES ($1, $2::jsonb, 1)
ON CONFLICT (plant) DO UPDATE
SET book = EXCLUDED.book, version = wms_book.version + 1
WHERE wms_book.version = $3`;

/**
 * Postgres jsonb book ledger. One row per plant. Optimistic version on save.
 * The pool is injected; this package does not depend on pg.
 *
 * @param {object} pool - queryable with query(text, params)
 * @param {string} plant - plant node identifier
 * @returns {object} frozen ledger
 *
 * @example
 *   const ledger = postgresLedger(pool, 'plant');
 *   await ledger.save(register(await ledger.load(), request));
 */
export default function postgresLedger(pool, plant) {
    let stamp = 0;
    return Object.freeze({
        async load() {
            await ensure(pool);
            const found = await pool.query(SELECT, [plant]);
            if (found.rows.length === 0) {
                stamp = 0;
                return book(plant);
            }
            stamp = found.rows[0].version;
            return stored(found.rows[0].book);
        },
        async save(next) {
            await ensure(pool);
            const written = await pool.query(UPSERT, [plant, dumped(next), stamp]);
            if (written.rowCount === 0) {
                throw rewritten(plant);
            }
            stamp += 1;
        }
    });
}

/**
 * Creates the jsonb book table when it is missing.
 *
 * @param {object} pool - queryable
 * @returns {Promise<void>}
 */
async function ensure(pool) {
    await pool.query(SCHEMA);
}

/**
 * Plain jsonb payload. Dates become ISO strings.
 *
 * @param {object} stock - domain book
 * @returns {object} JSON-safe book
 */
function dumped(stock) {
    return JSON.parse(JSON.stringify(stock));
}

/**
 * Domain book from a jsonb row. Claim time is a Date again.
 *
 * @param {object} raw - stored book
 * @returns {object} frozen book
 */
function stored(raw) {
    return Object.freeze({
        items: Object.freeze(raw.items.map(rowed)),
        claims: Object.freeze(raw.claims.map(filed)),
        entries: Object.freeze(raw.entries.map(lined)),
        tree: nested(raw.tree)
    });
}

/**
 * Restores one item snapshot.
 *
 * @param {object} row - stored item
 * @returns {object} frozen item
 */
function rowed(row) {
    return item(row.id, row.kind, row.attrs, row.status, row.holder);
}

/**
 * Restores one claim and revives `at`.
 *
 * @param {object} row - stored claim
 * @returns {object} frozen claim
 */
function filed(row) {
    return claim({ ...row, at: new Date(row.at) }, row.verdict);
}

/**
 * Restores one journal line.
 *
 * @param {object} row - stored entry
 * @returns {object} frozen entry
 */
function lined(row) {
    return entry(row.kind, row.payload);
}

/**
 * Restores the storage tree, including a null plant parent.
 *
 * @param {object} places - stored tree
 * @returns {object} frozen tree
 */
function nested(places) {
    return Object.freeze({
        root: places.root,
        nodes: Object.freeze(places.nodes.map(placed))
    });
}

/**
 * Restores one holder node.
 *
 * @param {object} row - stored node
 * @returns {object} frozen node
 */
function placed(row) {
    return Object.freeze({
        id: row.id,
        parent: row.parent
    });
}

/**
 * Optimistic-lock failure when the stored version moved.
 *
 * @param {string} plant - plant identifier
 * @returns {Error} conflict error
 */
function rewritten(plant) {
    const error = new Error(`book was rewritten ${plant}`);
    error.code = 'VERSION';
    return error;
}
