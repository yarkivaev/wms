import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import windowed from '../../../src/infrastructure/http/windowed.js';

describe('windowed', function() {
    it('keeps the row after the cursor', function() {
        const first = `a-${Math.random()}`;
        const second = `b-${Math.random()}`;
        const page = windowed([{ id: first }, { id: second }], 'id', first, 1);
        assert.equal(page.rows[0].id, second, 'the window repeated the cursor row');
    });

    it('names the next cursor after a full page', function() {
        const first = `a-${Math.random()}`;
        const second = `b-${Math.random()}`;
        const page = windowed([{ id: first }, { id: second }], 'id', '', 1);
        assert.equal(page.next, first, 'a full page hid the next cursor');
    });

    it('does not name a next cursor when the page is short', function() {
        const id = `unit-${Math.random()}`;
        const page = windowed([{ id }], 'id', '', 4);
        assert.equal(page.next, '', 'a short page still offered another cursor');
    });

    it('keeps every row when the limit is not a page size', function() {
        const id = `unit-${Math.random()}`;
        const page = windowed([{ id }], 'id', '', Number.NaN);
        assert.equal(page.rows[0].id, id, 'a missing limit dropped the list');
    });
});
