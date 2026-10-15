import assert from 'node:assert/strict';

/**
 * Asserts the scene matches. The message is the contract failure reason.
 *
 * @param {*} actual - scene under test
 * @param {function} matcher - predicate of the scene
 * @param {string} message - negatively toned failure
 * @returns {void}
 *
 * @example
 *   assertThat(warehouse(kit), nested(), 'the shop and machine were not nested under the plant');
 */
export function assertThat(actual, matcher, message) {
    assert.ok(matcher(actual), message);
}

/**
 * Last claim of the scene.
 *
 * @param {object} scene - scene snapshot
 * @returns {object} last claim
 */
export function last(scene) {
    return scene.stock.claims.at(-1);
}

/**
 * Matcher for a nested shop and machine.
 *
 * @returns {function} matcher
 */
export function nested() {
    return (scene) => {
        const lined = scene.stock.entries.length === 2 && scene.stock.entries.every((line, index) => {return line.kind === 'include' && line.payload.key === scene.stock.claims[index].key});
        const walked = scene.path[0] === scene.plant && scene.path[1] === scene.shop && scene.path[2] === scene.machine;
        return walked && lined && scene.stock.claims.every((row) => {return row.verdict === 'confirmed'});
    };
}

/**
 * Matcher for a repeated node that kept its path.
 *
 * @returns {function} matcher
 */
export function keptNode() {
    return (scene) => {
        const walked = scene.path[0] === scene.plant && scene.path[1] === scene.shop && scene.path.length === 2;
        return walked && last(scene).verdict === 'mismatch' && last(scene).action === 'include';
    };
}

/**
 * Matcher for a node refused under a missing parent.
 *
 * @returns {function} matcher
 */
export function refusedNode() {
    return (scene) => {
        return scene.path.length === 0 && last(scene).verdict === 'mismatch' && last(scene).action === 'include';
    };
}

/**
 * Matcher for an in-service item on its node.
 *
 * @returns {function} matcher
 */
export function serving() {
    return (scene) => {
        const row = scene.stock.items[0];
        return row && row.status === 'in_service' && row.holder === scene.plant && row.id === scene.id && last(scene).action === 'register' && last(scene).verdict === 'confirmed';
    };
}

/**
 * Matcher for a register that created no item.
 *
 * @returns {function} matcher
 */
export function unregistered() {
    return (scene) => {
        return scene.stock.items.length === 0 && last(scene).verdict === 'mismatch' && last(scene).action === 'register';
    };
}

/**
 * Matcher for a confirmed place that did not grow the tree.
 *
 * @returns {function} matcher
 */
export function placed() {
    return (scene) => {
        const included = scene.stock.claims.filter((row) => {return row.action === 'include' && row.verdict === 'confirmed'}).length === 1;
        return scene.stock.items[0].holder === scene.holder && last(scene).verdict === 'confirmed' && last(scene).action === 'place' && scene.stock.entries.at(-1).kind === 'place' && included;
    };
}

/**
 * Matcher for a submitted key that is missing from the snapshot.
 *
 * @returns {function} matcher
 */
export function missingKey() {
    return (scene) => {
        const row = scene.stock.items[0];
        return last(scene).verdict === 'mismatch' && row.holder === scene.plant && !Object.hasOwn(row.attrs, scene.added);
    };
}

/**
 * Matcher for a place whose holder is outside the tree.
 *
 * @returns {function} matcher
 */
export function unmoved() {
    return (scene) => {
        return scene.stock.items[0].holder === scene.plant && last(scene).verdict === 'mismatch' && scene.stock.entries.at(-1).kind === 'mismatch_opened';
    };
}

/**
 * Matcher for a revise that keeps the holder and the previous place claim.
 *
 * @returns {function} matcher
 */
export function passportKept() {
    return (scene) => {
        const row = scene.stock.items[0];
        const place = scene.stock.claims.find((claim) => {return claim.action === 'place'});
        return row.attrs.lot === 'я' && row.id === scene.id && row.holder === scene.holder && place.verdict === 'confirmed' && place === scene.placed.claims.at(-1);
    };
}

/**
 * Matcher for a revise of a retired item.
 *
 * @returns {function} matcher
 */
export function reviseRefused() {
    return (scene) => {
        const row = scene.stock.items[0];
        return row.attrs.lot === 'к' && row.status === 'retired' && last(scene).verdict === 'mismatch' && last(scene).action === 'revise';
    };
}

/**
 * Matcher for a revise of an unknown identifier.
 *
 * @returns {function} matcher
 */
export function unknownRefused() {
    return (scene) => {
        return scene.stock.items.length === 0 && last(scene).verdict === 'mismatch' && last(scene).action === 'revise';
    };
}

/**
 * Matcher for a journal that traces one item through its claims.
 *
 * @returns {function} matcher
 */
export function traced() {
    return (scene) => {
        const kinds = ['include', 'register', 'place', 'revise', 'retire'];
        const linked = scene.stock.entries.every((line, index) => {return line.kind === kinds[index] && line.payload.key === scene.stock.claims[index].key && scene.stock.claims[index].verdict === 'confirmed'});
        return linked && scene.stock.claims.length === 5 && scene.stock.claims[0] === scene.first && scene.first.verdict === 'confirmed';
    };
}
