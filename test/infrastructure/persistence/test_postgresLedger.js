import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { book, register } from '../../../src/domain/book.js';
import postgresLedger from '../../../src/infrastructure/persistence/postgresLedger.js';
import { note } from '../../e2e/note.js';

describe('postgresLedger', function() {
    it('opens an empty book when the plant row is missing', async function() {
        const plant = `завод-${Math.random()}`;
        const stock = await postgresLedger(fakePool(), plant).load();
        assert.equal(stock.tree.root, plant, 'a missing plant row did not open a book');
    });

    it('restores item attributes after a jsonb round-trip', async function() {
        const plant = `завод-${Math.random()}`;
        const pool = fakePool();
        const ledger = postgresLedger(pool, plant);
        const lot = `партія-${Math.random()}`;
        await ledger.save(register(await ledger.load(), note({
            id: `форма-${Math.random()}`,
            kind: 'sample',
            attrs: { lot },
            holder: plant
        })));
        const stock = await postgresLedger(pool, plant).load();
        assert.equal(stock.items[0].attrs.lot, lot, 'item attributes did not survive jsonb');
    });

    it('restores claim time as a Date after a jsonb round-trip', async function() {
        const plant = `завод-${Math.random()}`;
        const pool = fakePool();
        const ledger = postgresLedger(pool, plant);
        const at = new Date('2026-03-14T09:26:53.123Z');
        await ledger.save(register(await ledger.load(), note({
            id: `форма-${Math.random()}`,
            kind: 'sample',
            attrs: { lot: 'партія' },
            holder: plant,
            at
        })));
        const stock = await postgresLedger(pool, plant).load();
        assert.equal(stock.claims[0].at.getTime(), at.getTime(), 'claim time was not restored');
    });

    it('restores a null plant parent after a jsonb round-trip', async function() {
        const plant = `завод-${Math.random()}`;
        const pool = fakePool();
        const ledger = postgresLedger(pool, plant);
        await ledger.save(await ledger.load());
        const stock = await postgresLedger(pool, plant).load();
        assert.equal(stock.tree.nodes[0].parent, null, 'the plant parent was dropped');
    });

    it('does not save when another ledger already wrote', async function() {
        const plant = `завод-${Math.random()}`;
        const pool = fakePool();
        const left = postgresLedger(pool, plant);
        const right = postgresLedger(pool, plant);
        await left.load();
        await right.load();
        await left.save(register(book(plant), note({
            id: `форма-${Math.random()}`,
            kind: 'sample',
            attrs: { lot: 'партія' },
            holder: plant
        })));
        let failed = false;
        try {
            await right.save(register(book(plant), note({
                id: `форма-${Math.random()}`,
                kind: 'sample',
                attrs: { lot: 'партія' },
                holder: plant
            })));
        } catch {
            failed = true;
        }
        assert.equal(failed, true, 'a rewritten book was saved');
    });
});

/**
 * Queryable that stores one jsonb row and turns Dates into strings on read.
 *
 * @returns {object} fake pool
 */
function fakePool() {
    let row = null;
    return Object.freeze({
        async query(text, params) {
            if (text.includes('CREATE TABLE')) {
                return { rows: [], rowCount: 0 };
            }
            if (text.includes('SELECT')) {
                return selected(row);
            }
            if (text.includes('INSERT')) {
                const next = upserted(row, params);
                row = next.row;
                return next.reply;
            }
            throw new Error(`query is unknown ${text}`);
        }
    });
}

/**
 * SELECT reply that mimics a jsonb column.
 *
 * @param {object|null} row - stored plant row
 * @returns {object} pg-like result
 */
function selected(row) {
    if (!row) {
        return { rows: [], rowCount: 0 };
    }
    return {
        rows: [{ book: JSON.parse(JSON.stringify(row.book)), version: row.version }],
        rowCount: 1
    };
}

/**
 * INSERT ON CONFLICT reply with optimistic version.
 *
 * @param {object|null} row - stored plant row
 * @param {Array} params - plant, book, expected version
 * @returns {{ row: object|null, reply: object }} next row and pg-like result
 */
function upserted(row, params) {
    if (!row) {
        const created = { book: params[1], version: 1 };
        return { row: created, reply: { rows: [created], rowCount: 1 } };
    }
    if (row.version !== params[2]) {
        return { row, reply: { rows: [], rowCount: 0 } };
    }
    const written = { book: params[1], version: row.version + 1 };
    return { row: written, reply: { rows: [written], rowCount: 1 } };
}
