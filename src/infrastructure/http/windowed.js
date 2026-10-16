/**
 * A limit-sized window over a list. `after` is the identity of the last seen row.
 *
 * @param {Array<object>} rows - full list
 * @param {string} field - identity key
 * @param {string} after - cursor, empty for the first page
 * @param {number} limit - page size, or a non-finite value for the whole list
 * @returns {{ rows: Array<object>, next: string }} page and next cursor
 *
 * @example
 *   windowed([{ id: 'a' }, { id: 'b' }], 'id', 'a', 1).rows[0].id;
 */
export default function windowed(rows, field, after, limit) {
    if (!Number.isFinite(limit) || limit <= 0) {
        return { rows, next: '' };
    }
    const start = started(rows, field, after);
    const slice = rows.slice(start, start + limit);
    const next = slice.length === limit ? String(slice[slice.length - 1][field]) : '';
    return { rows: slice, next };
}

/**
 * Index of the first row after the cursor.
 *
 * @param {Array<object>} rows - full list
 * @param {string} field - identity key
 * @param {string} after - cursor
 * @returns {number} start index
 */
function started(rows, field, after) {
    if (!after) {
        return 0;
    }
    const at = rows.findIndex((row) => {
        return String(row[field]) === String(after);
    });
    if (at < 0) {
        return rows.length;
    }
    return at + 1;
}
