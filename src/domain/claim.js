/**
 * Immutable record of one requested change and the book's verdict.
 * The record is fixed when the book files it.
 *
 * @param {object} request - key, action, id, holder, attrs, at, actor
 * @param {string} verdict - confirmed or mismatch
 * @returns {object} frozen claim
 *
 * @example
 *   const row = claim({ key: 'c-1', action: 'place', id: 's-1', holder: 'h-1', attrs: { lot: 'A' }, at: new Date(), actor: 'ada' }, 'mismatch');
 *   row.verdict;
 */
export default function claim(request, verdict) {
    return Object.freeze({
        key: request.key,
        action: request.action,
        id: request.id,
        holder: request.holder,
        attrs: Object.freeze({ ...request.attrs }),
        at: request.at,
        actor: request.actor,
        verdict
    });
}
