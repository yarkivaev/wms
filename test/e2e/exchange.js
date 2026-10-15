/**
 * Fake HTTP response that collects the JSON body.
 *
 * @returns {object} Node-like response
 */
export function mockRes() {
    return {
        statusCode: 200,
        body: null,
        headersSent: false,
        writeHead(code) {
            this.statusCode = code;
        },
        end(data) {
            this.body = data;
        }
    };
}

/**
 * Fake HTTP request that emits a JSON body when read.
 *
 * @param {string} method - HTTP method
 * @param {string} url - request URL
 * @param {object} [payload] - JSON body
 * @param {object} [headers] - request headers
 * @returns {object} Node-like request
 */
export function mockReq(method, url, payload, headers) {
    const listeners = {};
    const req = {
        method,
        url,
        headers: headers || {},
        on(event, fn) {
            listeners[event] = fn;
            if (listeners.data && listeners.end) {
                queueMicrotask(() => {
                    emit(listeners, payload);
                });
            }
            return req;
        }
    };
    return req;
}

/**
 * Sends the payload then ends the fake request.
 *
 * @param {object} listeners - registered handlers
 * @param {object} [payload] - JSON body
 * @returns {void}
 */
function emit(listeners, payload) {
    if (payload !== undefined) {
        listeners.data(JSON.stringify(payload));
    }
    listeners.end();
}

/**
 * Dispatches one request against the API.
 *
 * @param {object} api - wmsApi handle
 * @param {string} method - HTTP method
 * @param {string} url - request URL
 * @param {object} [payload] - JSON body
 * @param {object} [headers] - request headers
 * @returns {Promise<{ status: number, body: object }>} parsed response
 */
export async function exchange(api, method, url, payload, headers) {
    const res = mockRes();
    await api.handle(mockReq(method, url, payload, headers), res);
    return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : {} };
}
