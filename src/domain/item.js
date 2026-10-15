/**
 * Current stock snapshot. Attributes stay opaque for the plant package.
 *
 * @param {string} id - unique item identifier
 * @param {string} kind - opaque item category
 * @param {object} attrs - opaque attribute snapshot
 * @param {string} status - in_service or retired
 * @param {string} holder - identifier of a node in the storage tree
 * @returns {object} frozen item
 *
 * @example
 *   const row = item('s-1', 'sample', { lot: 'A' }, 'in_service', 'plant');
 *   row.holder;
 */
export default function item(id, kind, attrs, status, holder) {
    return Object.freeze({
        id,
        kind,
        attrs: Object.freeze({ ...attrs }),
        status,
        holder
    });
}
