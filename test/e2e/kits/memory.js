import {
    accept as place,
    book,
    include as nest,
    path as walk,
    register as enroll,
    retire as withdraw,
    revise as amend
} from '../../../index.js';

/**
 * In-memory book factory for contract tests.
 * Spawn returns a fresh kit that talks to the domain book.
 *
 * @returns {object} factory with name and spawn
 *
 * @example
 *   const kit = memory().spawn();
 *   kit.open('plant');
 */
export default function memory() {
    return Object.freeze({
        name: 'memory',
        spawn
    });
}

/**
 * Opens a kit whose book lives only in memory.
 *
 * @returns {object} kit
 */
function spawn() {
    let stock;
    return Object.freeze({
        open(root) {
            stock = book(root);
            return shot(stock);
        },
        include(request) {
            stock = nest(stock, request);
            return shot(stock);
        },
        register(request) {
            stock = enroll(stock, request);
            return shot(stock);
        },
        revise(request) {
            stock = amend(stock, request);
            return shot(stock);
        },
        retire(request) {
            stock = withdraw(stock, request);
            return shot(stock);
        },
        accept(request) {
            stock = place(stock, request);
            return shot(stock);
        },
        path(id) {
            return walked(stock, id);
        }
    });
}

/**
 * Public snapshot of a book. The tree stays inside the kit.
 *
 * @param {object} stock - domain book
 * @returns {object} items, claims, entries
 */
function shot(stock) {
    return Object.freeze({
        items: stock.items,
        claims: stock.claims,
        entries: stock.entries
    });
}

/**
 * Path from the plant, or an empty list when the node is missing.
 *
 * @param {object} stock - domain book
 * @param {string} id - node identifier
 * @returns {Array<string>} frozen path
 */
function walked(stock, id) {
    try {
        return walk(stock, id);
    } catch {
        return Object.freeze([]);
    }
}
