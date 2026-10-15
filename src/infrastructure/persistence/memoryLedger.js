import { book } from '../../domain/book.js';

/**
 * In-memory book ledger. Tests and first HTTP runs use this.
 * Postgres jsonb is a later adapter with the same load/save pair.
 *
 * @param {string} rootId - plant node identifier
 * @returns {object} frozen ledger
 *
 * @example
 *   const ledger = memoryLedger('plant');
 *   ledger.save(register(ledger.load(), request));
 */
export default function memoryLedger(rootId) {
    let stock = book(rootId);
    return Object.freeze({
        load() {
            return stock;
        },
        save(next) {
            stock = next;
        }
    });
}
