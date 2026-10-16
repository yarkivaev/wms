import { execFile } from 'node:child_process';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { GenericContainer, Wait } from 'testcontainers';
import { register } from '../../../src/domain/book.js';
import postgresLedger from '../../../src/infrastructure/persistence/postgresLedger.js';
import { note } from '../../e2e/note.js';

const live = await dockered();

describe('postgresLedger on Postgres', function() {
    it('loads a unit saved by another ledger', { skip: !live, timeout: 120000 }, async function() {
        const plant = `завод-${Math.random()}`;
        const id = `форма-${Math.random()}`;
        let container;
        let pool;
        let stock;
        try {
            container = await new GenericContainer('postgres:16-alpine')
                .withEnvironment({
                    POSTGRES_PASSWORD: 'test',
                    POSTGRES_DB: 'wms'
                })
                .withExposedPorts(5432)
                .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
                .withStartupTimeout(90000)
                .start();
            pool = new pg.Pool({
                host: container.getHost(),
                port: container.getMappedPort(5432),
                user: 'postgres',
                password: 'test',
                database: 'wms'
            });
            const writer = postgresLedger(pool, plant);
            await writer.save(register(await writer.load(), note({
                id,
                kind: 'sample',
                attrs: { lot: 'партія' },
                holder: plant
            })));
            stock = await postgresLedger(pool, plant).load();
        } finally {
            if (pool) {
                await pool.end();
            }
            if (container) {
                await container.stop();
            }
        }
        assert.equal(stock.items[0].id, id, 'a new ledger missed the saved unit');
    });
});

/**
 * Reports whether a Docker daemon answers.
 *
 * @returns {Promise<boolean>} true when docker info succeeds
 */
function dockered() {
    return new Promise((resolve) => {
        execFile('docker', ['info'], { timeout: 3000 }, (error) => {
            resolve(!error);
        });
    });
}
