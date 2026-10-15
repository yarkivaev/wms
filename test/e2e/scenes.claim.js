import { hang, note, opened, sample } from './note.js';

/**
 * Places an item with a differing attribute.
 *
 * @param {object} kit - book kit
 * @returns {Promise<object>} scene
 */
export async function differing(kit) {
    const plant = opened(kit);
    const holder = await hang(kit, plant);
    const unit = await sample(kit, plant, { lot: 'к' });
    const stock = await kit.accept(note({ id: unit.id, holder, attrs: { lot: 'я' } }));
    return Object.freeze({ stock, plant, id: unit.id });
}

/**
 * Places an identifier that was never registered.
 *
 * @param {object} kit - book kit
 * @returns {Promise<object>} scene
 */
export async function unknownPlace(kit) {
    const plant = opened(kit);
    const stock = await kit.accept(note({ id: `missing-${Math.random()}`, holder: plant, attrs: { lot: 'к' } }));
    return Object.freeze({ stock, plant });
}

/**
 * Places an item after it has been retired.
 *
 * @param {object} kit - book kit
 * @returns {Promise<object>} scene
 */
export async function retiredPlace(kit) {
    const plant = opened(kit);
    const unit = await sample(kit, plant, { lot: 'к' });
    await kit.retire(note({ id: unit.id }));
    const stock = await kit.accept(note({ id: unit.id, holder: plant, attrs: { lot: 'к' } }));
    return Object.freeze({ stock, plant, id: unit.id });
}

/**
 * Retires an item on the plant.
 *
 * @param {object} kit - book kit
 * @returns {Promise<object>} scene
 */
export async function retired(kit) {
    const plant = opened(kit);
    const unit = await sample(kit, plant, { lot: 'к' });
    const stock = await kit.retire(note({ id: unit.id }));
    return Object.freeze({ stock, plant, id: unit.id });
}

/**
 * Registers the same identifier a second time.
 *
 * @param {object} kit - book kit
 * @returns {Promise<object>} scene
 */
export async function repeatedRegister(kit) {
    const plant = opened(kit);
    const unit = await sample(kit, plant, { lot: 'к' });
    const stock = await kit.register(note({ id: unit.id, kind: 'sample', attrs: { lot: 'я' }, holder: plant }));
    return Object.freeze({ stock, plant, id: unit.id });
}
