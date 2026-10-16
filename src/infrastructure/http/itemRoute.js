import { errorResponse, jsonResponse, route } from '@yarkivaev/simple-server';
import { path as walk } from '../../domain/book.js';
import windowed from './windowed.js';

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
        route('GET', `${basePath}/items`, async (req, res, params, query) => {
            const stock = await ledger.load();
            jsonResponse(paged(stock, query || {})).send(res);
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
 * Filtered item page. A missing limit keeps the whole list.
 *
 * @param {object} stock - book
 * @param {object} query - limit, after, holder, kind, q
 * @returns {object} items and next cursor
 */
function paged(stock, query) {
    const rows = stock.items.filter((row) => {
        return kept(stock, row, query);
    }).map((row) => {
        return listed(stock, row);
    });
    const page = windowed(rows, 'id', query.after || '', Number(query.limit));
    return { items: page.rows, next: page.next };
}

/**
 * Whether an item matches holder, status and name query.
 *
 * @param {object} stock - book
 * @param {object} row - item
 * @param {object} query - holder, kind, q
 * @returns {boolean} kept
 */
function kept(stock, row, query) {
    const holder = query.holder || '';
    const kind = query.kind || '';
    const needle = query.q || '';
    return within(stock, holder, row.holder)
        && (kind === '' || row.status === kind)
        && String(row.id).toLocaleLowerCase().includes(String(needle).toLocaleLowerCase());
}

/**
 * Whether a holder sits on the selected node or below it.
 *
 * @param {object} stock - book
 * @param {string} root - selected holder
 * @param {string} holder - item holder
 * @returns {boolean} kept
 */
function within(stock, root, holder) {
    if (root === '') {
        return true;
    }
    try {
        return walk(stock, holder).includes(root);
    } catch {
        return false;
    }
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
