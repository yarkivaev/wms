import { readBody } from '@yarkivaev/simple-server';

/**
 * Reads one claim request from a JSON body.
 *
 * @param {object} req - Node HTTP request
 * @returns {Promise<object>} claim fields with `at` as Date
 *
 * @example
 *   const request = await claimed(req);
 */
export default async function claimed(req) {
    const body = JSON.parse(await readBody(req) || '{}');
    return {
        key: body.key,
        id: body.id,
        kind: body.kind,
        holder: body.holder,
        attrs: body.attrs || {},
        at: new Date(body.at),
        actor: body.actor
    };
}
