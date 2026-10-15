/**
 * Builds one claim request with a fresh key.
 *
 * @param {object} fields - request fields besides key, at, and actor
 * @returns {object} claim request
 */
export function note(fields) {
    return { key: `claim-${Math.random()}`, at: new Date(), actor: 'ада', ...fields };
}

/**
 * Opens a plant book.
 *
 * @param {object} kit - book kit
 * @returns {string} plant identifier
 */
export function opened(kit) {
    const plant = `plant-${Math.random()}`;
    kit.open(plant);
    return plant;
}

/**
 * Hangs a bay under a parent.
 *
 * @param {object} kit - book kit
 * @param {string} parent - parent node
 * @returns {string} bay identifier
 */
export function hang(kit, parent) {
    const id = `bay-${Math.random()}`;
    kit.include(note({ id, holder: parent }));
    return id;
}

/**
 * Registers a sample item.
 *
 * @param {object} kit - book kit
 * @param {string} plant - plant node
 * @param {object} attrs - attributes
 * @param {string} holder - holder node
 * @returns {{ id: string, stock: object }} item and snapshot
 */
export function sample(kit, plant, attrs, holder) {
    const id = `unit-${Math.random()}`;
    const stock = kit.register(note({ id, kind: 'sample', attrs, holder: holder || plant }));
    return { id, stock };
}
