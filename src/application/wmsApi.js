import { routes } from '@yarkivaev/simple-server';
import claimRoute from '../infrastructure/http/claimRoute.js';
import entryRoute from '../infrastructure/http/entryRoute.js';
import holderRoute from '../infrastructure/http/holderRoute.js';
import itemRoute from '../infrastructure/http/itemRoute.js';

/**
 * Composable stock-book HTTP API. The plant package names kinds and holders.
 * Who may write is an injected predicate, not a role of this package.
 *
 * @param {string} basePath - URL prefix
 * @param {object} ledger - load/save book
 * @param {function} granted - write predicate of the request
 * @param {Array<object>} [extraRoutes] - plant routes such as catalogs
 * @returns {object} routes with list() and handle()
 *
 * @example
 *   const api = wmsApi('/wms', memoryLedger('plant'), () => true);
 */
export default function wmsApi(basePath, ledger, granted, extraRoutes) {
    const extra = extraRoutes || [];
    return routes([
        ...itemRoute(basePath, ledger),
        ...holderRoute(basePath, ledger),
        ...entryRoute(basePath, ledger),
        ...claimRoute(basePath, ledger, granted),
        ...extra
    ]);
}
