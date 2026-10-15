import { jsonResponse, route } from '@yarkivaev/simple-server';
import { path as walk } from '../../domain/book.js';

/**
 * Holder routes. A missing node answers with an empty path.
 *
 * @param {string} basePath - URL prefix
 * @param {object} ledger - load/save book
 * @returns {Array<object>} routes
 *
 * @example
 *   holderRoute('/wms', ledger);
 */
export default function holderRoute(basePath, ledger) {
    return [
        route('GET', `${basePath}/holders`, (req, res) => {
            const stock = ledger.load();
            jsonResponse({ holders: stock.tree.nodes.map((row) => {
                return located(stock, row);
            }) }).send(res);
        }),
        route('GET', `${basePath}/holders/:id`, (req, res, params) => {
            const id = decodeURIComponent(params.id);
            jsonResponse({ id, path: traced(ledger.load(), id) }).send(res);
        })
    ];
}

/**
 * One holder with its path from the plant.
 *
 * @param {object} stock - book
 * @param {object} row - tree node
 * @returns {object} id, parent, path
 */
function located(stock, row) {
    return { id: row.id, parent: row.parent, path: walk(stock, row.id) };
}

/**
 * Path from the plant, or empty when the node is missing.
 *
 * @param {object} stock - book
 * @param {string} id - node identifier
 * @returns {Array<string>} frozen path
 */
function traced(stock, id) {
    try {
        return walk(stock, id);
    } catch {
        return Object.freeze([]);
    }
}
