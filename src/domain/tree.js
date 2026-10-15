/**
 * Organization storage tree. The root is the plant. Every other holder hangs under a parent.
 *
 * @example
 *   const places = include(tree('plant'), 'plant', 'bay-1');
 *   path(places, 'bay-1');
 */

/**
 * A tree whose single node is the plant root.
 *
 * @param {string} rootId - plant node identifier
 * @returns {object} frozen tree
 */
export function tree(rootId) {
    if (!rootId) {
        throw new Error(`root is missing ${rootId}`);
    }
    return Object.freeze({
        root: rootId,
        nodes: Object.freeze([Object.freeze({ id: rootId, parent: null })])
    });
}

/**
 * Hangs a new holder under an existing node.
 *
 * @param {object} current - tree
 * @param {string} parentId - existing node identifier
 * @param {string} id - new node identifier
 * @returns {object} frozen tree
 */
export function include(current, parentId, id) {
    if (!id || has(current, id)) {
        throw new Error(`node is already in the tree ${id}`);
    }
    if (!has(current, parentId)) {
        throw new Error(`node is missing ${parentId}`);
    }
    const node = Object.freeze({ id, parent: parentId });
    return Object.freeze({
        root: current.root,
        nodes: Object.freeze(current.nodes.concat([node]))
    });
}

/**
 * Reports whether the identifier is a holder node.
 *
 * @param {object} current - tree
 * @param {string} id - node identifier
 * @returns {boolean} true when the node is in the tree
 */
export function has(current, id) {
    return current.nodes.some((row) => {
        return row.id === id;
    });
}

/**
 * Lists node identifiers from the plant root down to the given holder.
 *
 * @param {object} current - tree
 * @param {string} id - node identifier
 * @returns {Array<string>} frozen path, root first
 */
export function path(current, id) {
    const chain = [];
    let cursor = id;
    let steps = 0;
    while (cursor) {
        const found = located(current, cursor);
        if (!found || steps > current.nodes.length) {
            throw new Error(`node is missing ${id}`);
        }
        chain.push(found.id);
        cursor = found.parent;
        steps += 1;
    }
    return Object.freeze(chain.reverse());
}

/**
 * Finds a node by identifier.
 *
 * @param {object} current - tree
 * @param {string} id - node identifier
 * @returns {object|undefined} node
 */
function located(current, id) {
    return current.nodes.find((row) => {
        return row.id === id;
    });
}
