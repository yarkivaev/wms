import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Renders the wms chart with an extra values file.
 *
 * @param {string} body - YAML values
 * @returns {string} rendered manifests
 */
function render(body) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wms-chart-'));
    const file = path.join(dir, 'values.yaml');
    fs.writeFileSync(file, body);
    return execFileSync('helm', [
        'template', 'book', path.join(root, 'charts/wms'),
        '--namespace', 'wms',
        '-f', file
    ], { encoding: 'utf8' });
}

describe('wms chart', function() {
    it('mounts the plant catalog from values', function() {
        const holder = `bay-${Math.random().toString(36).slice(2, 8)}`;
        const rendered = render([
            'image: example.invalid/wms:1',
            'catalog:',
            `  holder: ${holder}`
        ].join('\n'));
        assert.ok(rendered.includes(holder), 'the chart dropped the plant catalog');
    });

    it('reads the book URL from the named secret', function() {
        const secret = `wms-${Math.random().toString(36).slice(2, 8)}`;
        const rendered = render(`image: example.invalid/wms:1\nsecret: ${secret}\n`);
        assert.ok(rendered.includes(`name: ${secret}`), 'the chart did not reference the book secret');
    });
});
