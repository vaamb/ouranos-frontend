import type { HeaderItem } from '$lib/types.ts';

import { appState } from '$lib/store.svelte.ts';

// Which page currently owns the header slot. A plain module variable, NOT
// `$state`: it is bookkeeping, and making it reactive would add a spurious
// dependency to every effect that touches it.
let currentOwner: object | null = null;

/**
 * Publish this page's chips into `Header`'s contextual zone.
 *
 * Takes a **function**, not an array, and that is the whole point: the effect
 * re-runs it whenever anything it reads changes, so live values stay live.
 * Passing an already-built array would snapshot those values at call time and
 * never update them again.
 *
 *     useHeaderItems(() => [
 *         { id: 'server', label: 'Server', value: appState.pingServerLatency, unit: 'ms' }
 *     ]);
 *
 * Call it once, at the top level of a page's `<script>` (it registers an
 * `$effect`, so it inherits that component's lifetime). The slot clears when
 * the page is destroyed.
 */
export function useHeaderItems(getItems: () => Array<HeaderItem>) {
	const token = {};

	$effect(() => {
		currentOwner = token;
		appState.headerItems = getItems();

		return () => {
			// Only clear if no other page has claimed the slot in the meantime.
			// Teardown of the outgoing page is not guaranteed to run before the
			// incoming page's effects, and an unguarded reset blanks the new
			// page's chips instead of the old page's.
			if (currentOwner === token) {
				currentOwner = null;
				appState.headerItems = [];
			}
		};
	});
}
