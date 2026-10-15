/**
 * One append-only journal line. The line records what the book did.
 *
 * @param {string} kind - include, register, revise, retire, place, or mismatch_opened
 * @param {object} payload - opaque event body
 * @returns {object} frozen journal entry
 *
 * @example
 *   const line = entry('register', { key: 'c-1', id: 's-1' });
 *   line.kind;
 */
export default function entry(kind, payload) {
    return Object.freeze({
        kind,
        payload: Object.freeze({ ...payload })
    });
}
