import { describe, it } from 'node:test';
import { assertThat } from './matchers.js';

/**
 * Registers one test for each factory and contract pair.
 * The first cell is the failure message.
 *
 * @param {Array<object>} factories - book factories with name and spawn
 * @param {Array<Array>} rows - [message, scene, matcher]
 * @returns {void}
 *
 * @example
 *   matrix([memory()], [['the shop and machine were not nested under the plant', warehouse, nested]]);
 */
export default function matrix(factories, rows) {
    factories.forEach((factory) => {
        describe(factory.name, function() {
            rows.forEach((row) => {
                it(row[0], async function() {
                    assertThat(await row[1](factory.spawn()), row[2](), row[0]);
                });
            });
        });
    });
}
