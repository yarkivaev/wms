import {
    lifetime,
    missingHolder,
    missingParent,
    moved,
    outsideTree,
    registered,
    repeatedNode,
    replaced,
    retiredRevise,
    unknownKey,
    unknownRevise,
    warehouse
} from './scenes.js';
import {
    differing,
    repeatedRegister,
    retired,
    retiredPlace,
    unknownPlace
} from './scenes.claim.js';
import {
    keptNode,
    missingKey,
    nested,
    passportKept,
    placed,
    refusedNode,
    reviseRefused,
    serving,
    traced,
    unknownRefused,
    unmoved,
    unregistered
} from './matchers.js';
import {
    differed,
    firstKept,
    ghost,
    parked,
    stillParked
} from './matchers.claim.js';

/**
 * Book contracts. The first cell is the negatively toned failure message.
 *
 * @returns {Array<Array>} contract rows
 *
 * @example
 *   matrix([memory()], contracts());
 */
export default function contracts() {
    return [
        ['the shop and machine were not nested under the plant', warehouse, nested],
        ['a repeated node changed the path or hid the mismatch', repeatedNode, keptNode],
        ['a missing parent nested a node or skipped the claim', missingParent, refusedNode],
        ['the item was not registered in service on the node', registered, serving],
        ['an item appeared on a holder outside the tree', missingHolder, unregistered],
        ['a second register replaced the snapshot or skipped the claim', repeatedRegister, firstKept],
        ['a matching claim left the previous holder or grew the tree', moved, placed],
        ['a differing claim moved the item or hid the mismatch', differing, differed],
        ['a submitted key missing from the snapshot entered the item or moved it', unknownKey, missingKey],
        ['an unknown claim created an item', unknownPlace, ghost],
        ['a holder outside the tree moved the item or skipped the claim', outsideTree, unmoved],
        ['revise dropped the holder or changed the previous place claim', replaced, passportKept],
        ['retire cleared the holder or left the item in service', retired, parked],
        ['a retired item was confirmed', retiredPlace, stillParked],
        ['a retired item changed its attributes or skipped the claim', retiredRevise, reviseRefused],
        ['an unknown revise created an item or skipped the claim', unknownRevise, unknownRefused],
        ['the lifetime journal lost a claim or changed the first one', lifetime, traced]
    ];
}
