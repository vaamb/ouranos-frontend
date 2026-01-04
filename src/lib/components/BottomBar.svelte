<script>
	import { page } from '$app/state';

	import {
		ecosystems,
		ecosystemsState,
		enginesState,
		pingServerStatus
	} from '$lib/store.svelte.js';
	import { CONNECTION_STATUS } from '$lib/utils/consts.js';
	import { slugify } from '$lib/utils/functions.js';

	// Enums
	const PAGE_TYPE = {
		SERVER: 0,
		DEFAULT: 0,
		ENGINE: 1,
		ECOSYSTEM: 2
	};

	// Page type
	const computePageType = function (url) {
		if (url.includes('/ecosystem/')) {
			const ecosystem = Object.values($ecosystems).find((ecosystem) => {
				return slugify(ecosystem['name']) === page.params['ecosystem'];
			});
			return {
				pageType: PAGE_TYPE.ECOSYSTEM,
				ecosystemOrEngineUID: ecosystem ? ecosystem.uid : undefined
			};
		} else if (url.includes('/engine/')) {
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

<div class="bottom-bar">
	{#if $pingServerStatus === CONNECTION_STATUS.DISCONNECTED}
		<div class="disconnected center-content">Disconnected from the server</div>
	{:else if $pingServerStatus === CONNECTION_STATUS.RECONNECTED}
		<div class="reconnecting center-content">Reconnected to the server</div>
	{:else if pageType === PAGE_TYPE.ENGINE && ecosystemOrEngineUID !== undefined}
		{@const connectionStatus = $enginesState[ecosystemOrEngineUID]
			? $enginesState[ecosystemOrEngineUID]['connected']
			: CONNECTION_STATUS.DISCONNECTED}
		{#if connectionStatus === CONNECTION_STATUS.DISCONNECTED}
			<div class="disconnected center-content">The engine is currently disconnected from GAIA</div>
		{:else if connectionStatus === CONNECTION_STATUS.RECONNECTED}
			<div class="reconnecting center-content">The engine has reconnected to GAIA</div>
		{/if}
	{:else if pageType === PAGE_TYPE.ECOSYSTEM}
		{@const connectionStatus = $ecosystemsState[ecosystemOrEngineUID]
			? $ecosystemsState[ecosystemOrEngineUID]['connected']
			: CONNECTION_STATUS.DISCONNECTED}
		{#if connectionStatus === CONNECTION_STATUS.DISCONNECTED}
			<div class="disconnected center-content">
				The ecosystem is currently disconnected from GAIA
			</div>
		{:else if connectionStatus === CONNECTION_STATUS.RECONNECTED}
			<div class="reconnecting center-content">The ecosystem has reconnected to GAIA</div>
		{/if}
	{/if}
</div>

<style>
	.bottom-bar {
		position: fixed;
		bottom: 0;
		right: 0;
		font-size: 1rem;
		font-weight: bold;
		height: 37px;
		width: 100%;
		z-index: 10;
	}

	.disconnected {
		/* the `display: flex` is handled by center-content */
		background: var(--red);
		color: hsl(9, 85%, 20%);
	}

	.reconnecting {
		/* the `display: flex` is handled by center-content */
		background: var(--green);
		color: hsl(122, 85%, 20%);
	}

	@media only screen and (min-width: 992px) {
		.bottom-bar {
			width: inherit;
		}
	}
</style>
