import { jsonResponse, route } from '@yarkivaev/simple-server';

/**
 * Journal route. `kind` keeps only matching lines.
 *
 * @param {string} basePath - URL prefix
 * @param {object} ledger - load/save book
 * @returns {Array<object>} routes
 *
 * @example
 *   entryRoute('/wms', ledger);
 */
export default function entryRoute(basePath, ledger) {
    return [
        route('GET', `${basePath}/entries`, async (req, res) => {
            const kind = new URL(req.url, 'http://wms.local').searchParams.get('kind');
            const stock = await ledger.load();
            jsonResponse({ entries: picked(stock.entries, kind) }).send(res);
        })
    ];
}

/**
 * Filters journal lines when a kind is given.
 *
 * @param {Array<object>} rows - journal
 * @param {string|null} kind - entry kind
 * @returns {Array<object>} matching lines
 */
function picked(rows, kind) {
    if (!kind) {
        return rows;
    }
    return rows.filter((row) => {
        return row.kind === kind;
    });
}
