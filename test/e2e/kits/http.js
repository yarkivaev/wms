import wmsApi from '../../../src/application/wmsApi.js';
import memoryLedger from '../../../src/infrastructure/persistence/memoryLedger.js';
import { exchange } from '../exchange.js';

/**
 * HTTP book factory for contract tests.
 * Mutations go through wmsApi. The returned snapshot is the ledger book.
 *
 * @returns {object} factory with name and spawn
 *
 * @example
 *   const kit = http().spawn();
 *   kit.open('plant');
 */
export default function http() {
    return Object.freeze({
        name: 'http',
        spawn
    });
}

/**
 * Opens a kit whose book is reached through HTTP.
 *
 * @returns {object} kit
 */
function spawn() {
    let ledger;
    let api;
    return Object.freeze({
        open(root) {
            ledger = memoryLedger(root);
            api = wmsApi('/wms', ledger, allowed);
            return shot(ledger);
        },
        include(request) {
            return posted(api, ledger, '/wms/include', request);
        },
        register(request) {
            return posted(api, ledger, '/wms/register', request);
        },
        revise(request) {
            return posted(api, ledger, '/wms/revise', request);
        },
        retire(request) {
            return posted(api, ledger, '/wms/retire', request);
        },
        accept(request) {
            return posted(api, ledger, '/wms/place', request);
        },
        async path(id) {
            const { body } = await exchange(api, 'GET', `/wms/holders/${encodeURIComponent(id)}`);
            return Object.freeze(body.path);
        }
    });
}

/**
 * Allows every write in contract tests.
 *
 * @returns {boolean} true
 */
function allowed() {
    return true;
}

/**
 * Posts a claim and returns the ledger snapshot.
 *
 * @param {object} api - HTTP api
 * @param {object} ledger - book store
 * @param {string} url - mutation path
 * @param {object} request - claim fields
 * @returns {Promise<object>} items, claims, entries
 */
async function posted(api, ledger, url, request) {
    await exchange(api, 'POST', url, request);
    return shot(ledger);
}

/**
 * Public snapshot of a book. The tree stays inside the kit.
 *
 * @param {object} ledger - book store
 * @returns {object} items, claims, entries
 */
function shot(ledger) {
    const stock = ledger.load();
    return Object.freeze({
        items: stock.items,
        claims: stock.claims,
        entries: stock.entries
    });
}
