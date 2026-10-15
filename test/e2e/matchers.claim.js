import { last } from './matchers.js';

/**
 * Matcher for a place whose submitted attribute differs.
 *
 * @returns {function} matcher
 */
export function differed() {
    return (scene) => {
        const row = scene.stock.items[0];
        return row.holder === scene.plant && row.attrs.lot === 'к' && last(scene).verdict === 'mismatch';
    };
}

/**
 * Matcher for a place of an unknown identifier.
 *
 * @returns {function} matcher
 */
export function ghost() {
    return (scene) => {
        return scene.stock.items.length === 0 && last(scene).verdict === 'mismatch' && last(scene).action === 'place';
    };
}

/**
 * Matcher for a place of a retired item.
 *
 * @returns {function} matcher
 */
export function stillParked() {
    return (scene) => {
        return scene.stock.items[0].status === 'retired' && last(scene).verdict === 'mismatch' && last(scene).action === 'place';
    };
}

/**
 * Matcher for a retire that keeps the holder.
 *
 * @returns {function} matcher
 */
export function parked() {
    return (scene) => {
        const row = scene.stock.items[0];
        return row.status === 'retired' && row.holder === scene.plant && last(scene).action === 'retire' && last(scene).verdict === 'confirmed';
    };
}

/**
 * Matcher for a second register that keeps the first snapshot.
 *
 * @returns {function} matcher
 */
export function firstKept() {
    return (scene) => {
        const row = scene.stock.items[0];
        return scene.stock.items.length === 1 && row.attrs.lot === 'к' && last(scene).verdict === 'mismatch' && last(scene).action === 'register';
    };
}
