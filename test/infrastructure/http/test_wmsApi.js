import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { book, register } from '../../../src/domain/book.js';
import wmsApi from '../../../src/application/wmsApi.js';
import memoryLedger from '../../../src/infrastructure/persistence/memoryLedger.js';
import { exchange } from '../../e2e/exchange.js';
import { note } from '../../e2e/note.js';

describe('wmsApi', function() {
    it('does not file a claim when write is refused', async function() {
        const plant = `plant-${Math.random()}`;
        const ledger = memoryLedger(plant);
        const api = wmsApi('/wms', ledger, denied);
        await exchange(api, 'POST', '/wms/register', note({
            id: `unit-${Math.random()}`,
            kind: 'sample',
            attrs: { lot: 'к' },
            holder: plant
        }));
        assert.equal(ledger.load().items.length, 0, 'a refused write created an item');
    });

    it('lists the registered snapshot on the plant path', async function() {
        const plant = `plant-${Math.random()}`;
        const id = `unit-${Math.random()}`;
        const ledger = memoryLedger(plant);
        const api = wmsApi('/wms', ledger, allowed);
        ledger.save(register(ledger.load(), note({
            id,
            kind: 'sample',
            attrs: { lot: 'к' },
            holder: plant
        })));
        const { body } = await exchange(api, 'GET', '/wms/items');
        assert.deepEqual(body.items[0].path, [plant], 'the item list dropped the plant path');
    });

    it('windows the item list after a cursor', async function() {
        const plant = `plant-${Math.random()}`;
        const first = `unit-${Math.random()}`;
        const second = `unit-${Math.random()}`;
        const ledger = memoryLedger(plant);
        const api = wmsApi('/wms', ledger, allowed);
        ledger.save(register(ledger.load(), note({
            id: first,
            kind: 'sample',
            attrs: { lot: 'к' },
            holder: plant
        })));
        ledger.save(register(ledger.load(), note({
            id: second,
            kind: 'sample',
            attrs: { lot: 'к' },
            holder: plant
        })));
        const { body } = await exchange(api, 'GET', `/wms/items?limit=1&after=${encodeURIComponent(first)}`);
        assert.equal(body.items[0].id, second, 'the item window repeated the cursor');
    });

    it('keeps only mismatch journal lines when kind is set', async function() {
        const plant = `plant-${Math.random()}`;
        const ledger = memoryLedger(plant);
        const api = wmsApi('/wms', ledger, allowed);
        await exchange(api, 'POST', '/wms/register', note({
            id: `unit-${Math.random()}`,
            kind: 'sample',
            attrs: { lot: 'к' },
            holder: `gone-${Math.random()}`
        }));
        const { body } = await exchange(api, 'GET', '/wms/entries?kind=mismatch_opened');
        assert.equal(body.entries.length, 1, 'the kind filter dropped the mismatch line');
    });

    it('finds an item when the identifier is percent-encoded', async function() {
        const plant = `plant-${Math.random()}`;
        const id = `Ф-${Math.random()}`;
        const ledger = memoryLedger(plant);
        const api = wmsApi('/wms', ledger, allowed);
        ledger.save(register(ledger.load(), note({
            id,
            kind: 'sample',
            attrs: { lot: 'к' },
            holder: plant
        })));
        const { body } = await exchange(api, 'GET', `/wms/items/${encodeURIComponent(id)}`);
        assert.equal(body.item.id, id, 'a percent-encoded item identifier was not found');
    });

    it('answers an empty path for a holder that is not in the tree', async function() {
        const plant = `plant-${Math.random()}`;
        const missing = `bay-${Math.random()}`;
        const api = wmsApi('/wms', memoryLedger(plant), allowed);
        const { body } = await exchange(api, 'GET', `/wms/holders/${encodeURIComponent(missing)}`);
        assert.deepEqual(body.path, [], 'a missing holder returned a path');
    });

    it('does not file a claim when the book was rewritten', async function() {
        const plant = `plant-${Math.random()}`;
        const api = wmsApi('/wms', conflicted(plant), allowed);
        const { status } = await exchange(api, 'POST', '/wms/register', note({
            id: `unit-${Math.random()}`,
            kind: 'sample',
            attrs: { lot: 'к' },
            holder: plant
        }));
        assert.equal(status, 409, 'a rewritten book was accepted');
    });
});

/**
 * Ledger whose save reports an optimistic-lock failure.
 *
 * @param {string} plant - plant identifier
 * @returns {object} frozen ledger
 */
function conflicted(plant) {
    return Object.freeze({
        async load() {
            return book(plant);
        },
        async save() {
            const error = new Error(`book was rewritten ${plant}`);
            error.code = 'VERSION';
            throw error;
        }
    });
}

/**
 * Refuses every write.
 *
 * @returns {boolean} false
 */
function denied() {
    return false;
}

/**
 * Allows every write.
 *
 * @returns {boolean} true
 */
function allowed() {
    return true;
}
