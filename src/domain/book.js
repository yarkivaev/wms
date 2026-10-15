/**
 * Stock book. Every mutation is filed as a claim, then journaled.
 * The journal is appended and never edits a snapshot by itself.
 *
 * @example
 *   const stock = register(book('plant'), { key: 'c-1', id: 's-1', kind: 'sample', attrs: { lot: 'A' }, holder: 'plant', at: new Date(), actor: 'ada' });
 *   stock.items[0].status;
 */
import item from './item.js';
import claim from './claim.js';
import entry from './entry.js';
import agree from './agree.js';
import { has, include as nest, tree, path as walk } from './tree.js';

/**
 * Book whose storage tree contains only the plant root.
 *
 * @param {string} rootId - plant node identifier
 * @returns {object} frozen book
 */
export function book(rootId) {
    return packed([], [], [], tree(rootId));
}

/**
 * Files a request to hang a holder under an existing node.
 *
 * @param {object} current - book
 * @param {object} request - key, id, holder, at, actor
 * @returns {object} next book
 */
export function include(current, request) {
    const verdict = request.id && !has(current.tree, request.id) && has(current.tree, request.holder) ? 'confirmed' : 'mismatch';
    const places = verdict === 'confirmed' ? nest(current.tree, request.holder, request.id) : current.tree;
    return filed(current, { ...request, action: 'include', attrs: {} }, verdict, current.items, places);
}

/**
 * Lists holder identifiers from the plant root down to the node.
 *
 * @param {object} current - book
 * @param {string} id - node identifier
 * @returns {Array<string>} frozen path, root first
 */
export function path(current, id) {
    return walk(current.tree, id);
}

/**
 * Files a request to register an in-service item on a holder node.
 *
 * @param {object} current - book
 * @param {object} request - key, id, kind, attrs, holder, at, actor
 * @returns {object} next book
 */
export function register(current, request) {
    const verdict = !listed(current.items, request.id) && has(current.tree, request.holder) ? 'confirmed' : 'mismatch';
    const created = item(request.id, request.kind, request.attrs, 'in_service', request.holder);
    const items = verdict === 'confirmed' ? current.items.concat([created]) : current.items;
    return filed(current, { ...request, action: 'register' }, verdict, items, current.tree);
}

/**
 * Files a request to replace attributes of an in-service item.
 *
 * @param {object} current - book
 * @param {object} request - key, id, attrs, at, actor
 * @returns {object} next book
 */
export function revise(current, request) {
    const found = listed(current.items, request.id);
    const verdict = found && found.status === 'in_service' ? 'confirmed' : 'mismatch';
    const items = verdict === 'confirmed'
        ? swapped(current.items, item(found.id, found.kind, request.attrs, found.status, found.holder))
        : current.items;
    const holder = found ? found.holder : request.holder;
    return filed(current, { ...request, action: 'revise', holder }, verdict, items, current.tree);
}

/**
 * Files a request to retire an in-service item on its current holder.
 *
 * @param {object} current - book
 * @param {object} request - key, id, at, actor
 * @returns {object} next book
 */
export function retire(current, request) {
    const found = listed(current.items, request.id);
    const verdict = found && found.status === 'in_service' ? 'confirmed' : 'mismatch';
    const items = verdict === 'confirmed'
        ? swapped(current.items, item(found.id, found.kind, found.attrs, 'retired', found.holder))
        : current.items;
    const holder = found ? found.holder : request.holder;
    return filed(current, { ...request, action: 'retire', attrs: found ? found.attrs : {}, holder }, verdict, items, current.tree);
}

/**
 * Files a request to place an item on a holder when the submitted keys match.
 *
 * @param {object} current - book
 * @param {object} request - key, id, holder, attrs, at, actor
 * @returns {object} next book
 */
export function accept(current, request) {
    const found = listed(current.items, request.id);
    const verdict = has(current.tree, request.holder) && decision(found, request.attrs) === 'confirmed' ? 'confirmed' : 'mismatch';
    const items = verdict === 'confirmed'
        ? swapped(current.items, item(found.id, found.kind, found.attrs, found.status, request.holder))
        : current.items;
    return filed(current, { ...request, action: 'place' }, verdict, items, current.tree);
}

/**
 * Finds an item by identifier.
 *
 * @param {Array<object>} rows - items
 * @param {string} id - item identifier
 * @returns {object|undefined} matching item
 */
function listed(rows, id) {
    return rows.find((row) => {
        return row.id === id;
    });
}

/**
 * Decides a placement without writing.
 *
 * @param {object|undefined} found - current item
 * @param {object} attrs - submitted attributes
 * @returns {string} confirmed or mismatch
 */
function decision(found, attrs) {
    if (!found || found.status !== 'in_service' || !agree(found.attrs, attrs)) {
        return 'mismatch';
    }
    return 'confirmed';
}

/**
 * Replaces one item in a frozen list.
 *
 * @param {Array<object>} rows - items
 * @param {object} next - replacement snapshot
 * @returns {Array<object>} frozen list
 */
function swapped(rows, next) {
    return Object.freeze(rows.map((row) => {
        return row.id === next.id ? next : row;
    }));
}

/**
 * Stores the claim and journals it. The snapshot changes only on confirmed.
 *
 * @param {object} current - book
 * @param {object} request - claim fields including action
 * @param {string} verdict - confirmed or mismatch
 * @param {Array<object>} items - next snapshots
 * @param {object} places - next tree
 * @returns {object} next book
 */
function filed(current, request, verdict, items, places) {
    const stored = claim(request, verdict);
    const kind = verdict === 'confirmed' ? request.action : 'mismatch_opened';
    return packed(
        items,
        current.claims.concat([stored]),
        current.entries.concat([entry(kind, { key: request.key, id: request.id })]),
        places
    );
}

/**
 * Freezes the book collections and its storage tree.
 *
 * @param {Array<object>} items - snapshots
 * @param {Array<object>} claims - stored claims
 * @param {Array<object>} entries - journal
 * @param {object} places - storage tree
 * @returns {object} frozen book
 */
function packed(items, claims, entries, places) {
    return Object.freeze({
        items: Object.freeze(items),
        claims: Object.freeze(claims),
        entries: Object.freeze(entries),
        tree: places
    });
}
