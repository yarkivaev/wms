/**
 * Generic stock book.
 *
 * Plant packages name items, attribute keys, and holders.
 * This package does not.
 *
 * @example
 *   import { book, register, wmsApi, memoryLedger, postgresLedger } from '@yarkivaev/wms';
 *   const stock = register(book('plant'), { key: 'c-1', id: 's-1', kind: 'sample', attrs: { lot: 'A' }, holder: 'plant', at: new Date(), actor: 'ada' });
 */
export { book, include, path, register, revise, retire, accept } from './src/domain/book.js';
export { default as wmsApi } from './src/application/wmsApi.js';
export { default as memoryLedger } from './src/infrastructure/persistence/memoryLedger.js';
export { default as postgresLedger } from './src/infrastructure/persistence/postgresLedger.js';
