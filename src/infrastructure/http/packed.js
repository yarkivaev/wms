/**
 * Public JSON of a book. The tree stays behind holder routes.
 *
 * @param {object} stock - domain book
 * @returns {object} items, claims, entries
 *
 * @example
 *   packed(ledger.load());
 */
export default function packed(stock) {
    return {
        items: stock.items,
        claims: stock.claims,
        entries: stock.entries
    };
}
