import { errorResponse, jsonResponse, route } from '@yarkivaev/simple-server';
import {
    accept,
    include,
    register,
    retire,
    revise
} from '../../domain/book.js';
import claimed from './claimed.js';
import packed from './packed.js';

const verbs = {
    include,
    register,
    revise,
    retire,
    place: accept
};

/**
 * Mutation routes. Each POST files one claim through the book.
 *
 * @param {string} basePath - URL prefix
 * @param {object} ledger - load/save book
 * @param {function} granted - write predicate of the request
 * @returns {Array<object>} routes
 *
 * @example
 *   claimRoute('/wms', ledger, () => true);
 */
export default function claimRoute(basePath, ledger, granted) {
    return Object.keys(verbs).map((name) => {
        return route('POST', `${basePath}/${name}`, (req, res) => {
            return posted(req, res, ledger, granted, verbs[name]);
        });
    });
}

/**
 * Files one claim when the caller may write.
 *
 * @param {object} req - request
 * @param {object} res - response
 * @param {object} ledger - book store
 * @param {function} granted - write predicate
 * @param {function} command - book mutation
 * @returns {Promise<void>}
 */
async function posted(req, res, ledger, granted, command) {
    if (!granted(req)) {
        errorResponse('FORBIDDEN', `write role required for ${req.method}`, 403).send(res);
        return;
    }
    const next = command(await ledger.load(), await claimed(req));
    try {
        await ledger.save(next);
    } catch (error) {
        if (error.code !== 'VERSION') {
            throw error;
        }
        errorResponse('CONFLICT', 'book was rewritten', 409).send(res);
        return;
    }
    jsonResponse(packed(next)).send(res);
}
