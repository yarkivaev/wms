/**
 * Compares only the keys the claim submitted. Extra snapshot keys stay irrelevant.
 * A submitted key missing from the snapshot disagrees.
 *
 * @param {object} stored - current attribute snapshot
 * @param {object} claimed - attributes submitted with the claim
 * @returns {boolean} true when every submitted key equals the snapshot
 *
 * @example
 *   agree({ lot: 'A', bin: '1' }, { lot: 'A' });
 */
export default function agree(stored, claimed) {
    return Object.keys(claimed).every((key) => {
        return Object.hasOwn(stored, key) && stored[key] === claimed[key];
    });
}
