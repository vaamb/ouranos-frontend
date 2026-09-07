import { AsyncLocalStorage } from 'node:async_hooks';

import { client } from '$lib/queries.js';

const requestContext = new AsyncLocalStorage();

// Store the "x-forwarded-for" header in a request context if it is present.
export function handle({ event, resolve }) {
	const forwardedFor = event.request.headers.get('x-forwarded-for');
	// No header: the request did not come through the proxy, continue.
	if (forwardedFor === null) {
		return resolve(event);
	}
	// Plain http is used between the proxy and the server so the original scheme also needs to be
	// stored and forwarded.
	const forwardedProto = event.request.headers.get('x-forwarded-proto') ?? 'http';
	return requestContext.run({ forwardedFor, forwardedProto }, () => resolve(event));
}

client.interceptors.request.use((config) => {
	const store = requestContext.getStore();
	// No store: the request was made outside a request context, nothing to forward.
	if (store !== undefined) {
		config.headers.set('X-Forwarded-For', store['forwardedFor']);
		config.headers.set('X-Forwarded-Proto', store['forwardedProto']);
	}
	return config;
});
