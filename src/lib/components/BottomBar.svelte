<script>
	import { page } from '$app/stores';

	import { ecosystems, engines, pingServerStatus } from '$lib/store.js';
	import { CONNECTION_STATUS } from '$lib/utils/consts.js';
	import { getEcosystemUID } from '$lib/utils/functions.js';

	export let menuWidth = 210;

	// Enums
	const PAGE_TYPE = {
		SERVER: 0,
		DEFAULT: 0,
		ENGINE: 1,
		ECOSYSTEM: 2
	};

	// Page type and UID
	let ecosystemOrEngineUID = undefined;

	const computePageType = function (url) {
		if (url.includes('/ecosystem/')) {
			ecosystemOrEngineUID = getEcosystemUID($ecosystems, $page.params['ecosystem']);
			return PAGE_TYPE.ECOSYSTEM;
		} else if (url.includes('/engine/')) {
			ecosystemOrEngineUID = $page.params['engine'];  // Rem: will be undefined for overview page
			return PAGE_TYPE.ENGINE;
		} else {
			ecosystemOrEngineUID = undefined;
			return PAGE_TYPE.DEFAULT;
		}
	};

	$: pageType = computePageType($page.url.pathname);
</script>

<div class="bottom-bar" style="--menu-width:{menuWidth}">
	{#if $pingServerStatus === CONNECTION_STATUS.DISCONNECTED}
		<div class="disconnected center-content">Disconnected from the server</div>
	{:else if $pingServerStatus === CONNECTION_STATUS.RECONNECTED}
		<div class="reconnecting center-content">Reconnected to the server</div>
	{:else if pageType === PAGE_TYPE.ENGINE && ecosystemOrEngineUID !== undefined}
		{@const connectionStatus = $engines[ecosystemOrEngineUID]
			? $engines[ecosystemOrEngineUID]['connected']
			: CONNECTION_STATUS.DISCONNECTED}
		{#if connectionStatus === CONNECTION_STATUS.DISCONNECTED}
			<div class="disconnected center-content">The engine is currently disconnected from GAIA</div>
		{:else if connectionStatus === CONNECTION_STATUS.RECONNECTED}
			<div class="reconnecting center-content">The engine has reconnected to GAIA</div>
		{/if}
	{:else if pageType === PAGE_TYPE.ECOSYSTEM}
		{@const connectionStatus = $ecosystems[ecosystemOrEngineUID]
			? $ecosystems[ecosystemOrEngineUID]['connected']
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
			width: calc(100% - var(--menu-width) * 1px);
			margin-left: calc(var(--menu-width) * 1px);
		}
	}
</style>
