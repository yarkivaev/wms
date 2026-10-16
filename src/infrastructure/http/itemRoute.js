import { errorResponse, jsonResponse, route } from '@yarkivaev/simple-server';
import { path as walk } from '../../domain/book.js';

/**
 * Snapshot routes. Each item carries the holder path from the plant.
 *
 * @param {string} basePath - URL prefix
 * @param {object} ledger - load/save book
 * @returns {Array<object>} routes
 *
 * @example
 *   itemRoute('/wms', ledger);
 */
export default function itemRoute(basePath, ledger) {
    return [
        route('GET', `${basePath}/items`, async (req, res) => {
            const stock = await ledger.load();
            jsonResponse({ items: stock.items.map((row) => {
                return listed(stock, row);
            }) }).send(res);
        }),
        route('GET', `${basePath}/items/:id`, async (req, res, params) => {
            shown(res, await ledger.load(), decodeURIComponent(params.id));
        })
    ];
}

/**
 * Snapshot plus holder path.
 *
 * @param {object} stock - book
 * @param {object} row - item
 * @returns {object} item fields and path
 */
function listed(stock, row) {
    return { ...row, path: walk(stock, row.holder) };
}

/**
 * Sends one item or a missing-item error.
 *
 * @param {object} res - response
 * @param {object} stock - book
 * @param {string} id - item identifier
 * @returns {void}
 */
function shown(res, stock, id) {
    const row = stock.items.find((item) => {
        return item.id === id;
    });
    if (!row) {
        errorResponse('NOT_FOUND', `item is missing ${id}`, 404).send(res);
        return;
    }
    jsonResponse({ item: listed(stock, row) }).send(res);
}
