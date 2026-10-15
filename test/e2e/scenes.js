import { hang, note, opened, sample } from './note.js';

/**
 * Hangs a shop and a machine under the plant.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function warehouse(kit) {
    const plant = opened(kit);
    const shop = `shop-${Math.random()}`;
    const machine = `machine-${Math.random()}`;
    kit.include(note({ id: shop, holder: plant }));
    const stock = kit.include(note({ id: machine, holder: shop }));
    return Object.freeze({ stock, plant, shop, machine, path: kit.path(machine) });
}

/**
 * Hangs the same shop twice.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function repeatedNode(kit) {
    const plant = opened(kit);
    const shop = `shop-${Math.random()}`;
    kit.include(note({ id: shop, holder: plant }));
    const stock = kit.include(note({ id: shop, holder: plant }));
    return Object.freeze({ stock, plant, shop, path: kit.path(shop) });
}

/**
 * Hangs a shop under a parent that is not in the tree.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function missingParent(kit) {
    const plant = opened(kit);
    const shop = `shop-${Math.random()}`;
    const stock = kit.include(note({ id: shop, holder: `gone-${Math.random()}` }));
    return Object.freeze({ stock, plant, shop, path: kit.path(shop) });
}

/**
 * Registers an item on the plant.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function registered(kit) {
    const plant = opened(kit);
    const unit = sample(kit, plant, { lot: 'к' });
    return Object.freeze({ stock: unit.stock, plant, id: unit.id });
}

/**
 * Registers an item on a holder that is not in the tree.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function missingHolder(kit) {
    const plant = opened(kit);
    const unit = sample(kit, plant, { lot: 'к' }, `bay-${Math.random()}`);
    return Object.freeze({ stock: unit.stock, plant, id: unit.id });
}

/**
 * Places an item on another existing node when submitted keys match.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function moved(kit) {
    const plant = opened(kit);
    const holder = hang(kit, plant);
    const unit = sample(kit, plant, { lot: 'к', bin: '9' });
    const stock = kit.accept(note({ id: unit.id, holder, attrs: { lot: 'к' } }));
    return Object.freeze({ stock, plant, holder, id: unit.id, path: kit.path(holder) });
}

/**
 * Places an item with a key that the snapshot does not have.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function unknownKey(kit) {
    const plant = opened(kit);
    const holder = hang(kit, plant);
    const unit = sample(kit, plant, { lot: 'к' });
    const stock = kit.accept(note({ id: unit.id, holder, attrs: { extra: 'я' } }));
    return Object.freeze({ stock, plant, holder, id: unit.id, added: 'extra' });
}

/**
 * Places an item on a holder that is not in the tree.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function outsideTree(kit) {
    const plant = opened(kit);
    const unit = sample(kit, plant, { lot: 'к' });
    const stock = kit.accept(note({ id: unit.id, holder: `bay-${Math.random()}`, attrs: { lot: 'к' } }));
    return Object.freeze({ stock, plant, id: unit.id });
}

/**
 * Replaces attributes after a confirmed place.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function replaced(kit) {
    const plant = opened(kit);
    const holder = hang(kit, plant);
    const unit = sample(kit, plant, { lot: 'к' });
    const placed = kit.accept(note({ id: unit.id, holder, attrs: { lot: 'к' } }));
    const stock = kit.revise(note({ id: unit.id, attrs: { lot: 'я' } }));
    return Object.freeze({ stock, plant, holder, id: unit.id, placed });
}

/**
 * Revises an item after it has been retired.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function retiredRevise(kit) {
    const plant = opened(kit);
    const unit = sample(kit, plant, { lot: 'к' });
    kit.retire(note({ id: unit.id }));
    const stock = kit.revise(note({ id: unit.id, attrs: { lot: 'я' } }));
    return Object.freeze({ stock, plant, id: unit.id });
}

/**
 * Revises an identifier that was never registered.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function unknownRevise(kit) {
    const plant = opened(kit);
    const stock = kit.revise(note({ id: `missing-${Math.random()}`, attrs: { lot: 'я' } }));
    return Object.freeze({ stock, plant });
}

/**
 * Walks one item through include, register, place, revise, and retire.
 *
 * @param {object} kit - book kit
 * @returns {object} scene
 */
export function lifetime(kit) {
    const plant = opened(kit);
    const holder = `bay-${Math.random()}`;
    const hung = kit.include(note({ id: holder, holder: plant }));
    const unit = sample(kit, plant, { lot: 'к' }, holder);
    kit.accept(note({ id: unit.id, holder: plant, attrs: { lot: 'к' } }));
    kit.revise(note({ id: unit.id, attrs: { lot: 'я' } }));
    const stock = kit.retire(note({ id: unit.id }));
    return Object.freeze({ stock, first: hung.claims[0] });
}
