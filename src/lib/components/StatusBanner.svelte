<script>
	import { page } from '$app/state';

	import { appState, gaiaState } from '$lib/store.svelte.js';
	import { CONNECTION_STATUS } from '$lib/utils/consts.js';
	import { slugify } from '$lib/utils/functions.js';

	// Enums
	const PAGE_TYPE = {
		SERVER: 1,
		DEFAULT: 1,
		ENGINE: 2,
		ECOSYSTEM: 4
	};

	// Page type
	const computePageType = function (url) {
		if (url.includes('/ecosystem/')) {
			const ecosystem = Object.values(gaiaState.ecosystems).find((ecosystem) => {
				return slugify(ecosystem['name']) === page.params['ecosystem'];
			});
			return {
				pageType: PAGE_TYPE.ECOSYSTEM,
				ecosystemOrEngineUID: ecosystem ? ecosystem.uid : undefined
			};
		} else if (url.includes('/engine/')) {
			if (url === '/engine/overview/settings') {
				return {
					pageType: PAGE_TYPE.DEFAULT,
					ecosystemOrEngineUID: undefined
				};
			}
			return {
				pageType: PAGE_TYPE.ENGINE,
				ecosystemOrEngineUID: page.params['engine']
			};
		} else {
			return {
				pageType: PAGE_TYPE.DEFAULT,
				ecosystemOrEngineUID: undefined
			};
		}
	};
	let { pageType, ecosystemOrEngineUID } = $derived(computePageType(page.url.pathname));
</script>

<div class="status-banner" role="status">
	{#if appState.pingServerStatus === CONNECTION_STATUS.DISCONNECTED}
		<div class="disconnected center-content">Disconnected from the server</div>
	{:else if appState.pingServerStatus === CONNECTION_STATUS.RECONNECTED}
		<div class="reconnecting center-content">Reconnected to the server</div>
	{:else if (pageType & (PAGE_TYPE.ENGINE | PAGE_TYPE.ECOSYSTEM)) === pageType}
		{@const label = pageType === PAGE_TYPE.ENGINE ? 'engine' : 'ecosystem'}
		{@const stateStore =
			pageType === PAGE_TYPE.ENGINE ? gaiaState.enginesState : gaiaState.ecosystemsState}
		{@const connectionStatus =
			stateStore[ecosystemOrEngineUID]?.connected ?? CONNECTION_STATUS.DISCONNECTED}
		{#if connectionStatus === CONNECTION_STATUS.DISCONNECTED}
			<div class="disconnected center-content">The {label} is currently disconnected from GAIA</div>
		{:else if connectionStatus === CONNECTION_STATUS.RECONNECTED}
			<div class="reconnecting center-content">The {label} has reconnected to GAIA</div>
		{/if}
	{/if}
</div>

<style>
	/* A live region has to exist before its content changes for a screen reader
	   to announce it, so the wrapper always renders. It takes its height from
	   whatever is inside it: with nothing to say it is 0px tall and covers no
	   part of the page. */
	.status-banner {
		font-size: 1rem;
		font-weight: bold;
	}

	.disconnected,
	.reconnecting {
		/* the `display: flex` is handled by center-content */
		pointer-events: auto;
		height: 37px;
	}

	.disconnected {
		background: var(--transition-orange);
		color: var(--transition-orange-dark);
	}

	.reconnecting {
		background: var(--good-green);
		color: var(--good-green-dark);
	}
</style>
