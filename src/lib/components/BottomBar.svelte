<script>
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';

	import { ecosystems, ecosystemsIds, engines, pingServerLastSeen } from '$lib/store.js';
	import { getEcosystemUid } from '$lib/utils/functions.js';
	import { onDestroy, onMount } from 'svelte';

	export let menuWidth = 210;

	// Enums
	const PAGE_TYPE = {
		SERVER: 0,
		DEFAULT: 0,
		ENGINE: 1,
		ECOSYSTEM: 2
	};

	const CONNECTION_STATUS = {
		DISCONNECTED: -1,
		RECONNECTED: 0,
		CONNECTED: 1,
		NOT_NEEDED: 1
	};

	// Page type and UID
	let ecosystemOrEngineUID = undefined;

	const computePageType = function (url) {
		if (url.includes('/ecosystem/')) {
			ecosystemOrEngineUID = getEcosystemUid($ecosystemsIds, $page.params['ecosystem']);
			return PAGE_TYPE.ECOSYSTEM;
		}
		if (url.includes('/engine/')) {
			ecosystemOrEngineUID = $page.params['engine'];
			return PAGE_TYPE.ENGINE;
		} else {
			ecosystemOrEngineUID = undefined;
			return PAGE_TYPE.DEFAULT;
		}
	};

	$: pageType = computePageType($page.url.pathname);

	// Server status
	const serverStatus = writable(CONNECTION_STATUS.CONNECTED);

	const updateServerStatus = function () {
		if (new Date() - $pingServerLastSeen < 30 * 1000) {
			if ($serverStatus === CONNECTION_STATUS.DISCONNECTED) {
				serverStatus.set(CONNECTION_STATUS.RECONNECTED);
			} else {
				serverStatus.set(CONNECTION_STATUS.CONNECTED);
			}
		} else {
			serverStatus.set(CONNECTION_STATUS.DISCONNECTED);
		}
	};

	let updateServerStatusInterval = undefined;

	// Ecosystem or engine status
	const ecosystemOrEngineStatus = writable(CONNECTION_STATUS.NOT_NEEDED);

	const updateEcosystemOrEngineStatus = function () {
		if (pageType === PAGE_TYPE.DEFAULT) {
			ecosystemOrEngineStatus.set(CONNECTION_STATUS.NOT_NEEDED);
		} else {
			// Get the last time the ecosystem or engine was seen
			let lastSeen;
			if (pageType === PAGE_TYPE.ECOSYSTEM) {
				lastSeen = $ecosystems[ecosystemOrEngineUID]
					? $ecosystems[ecosystemOrEngineUID]['last_seen']
					: new Date(0);
			} else if (pageType === PAGE_TYPE.ENGINE) {
				lastSeen = $engines[ecosystemOrEngineUID]
					? $engines[ecosystemOrEngineUID]['last_seen']
					: new Date(0);
			}
			// Compute its status
			if (new Date() - lastSeen < 30 * 1000) {
				if ($ecosystemOrEngineStatus === CONNECTION_STATUS.DISCONNECTED) {
					ecosystemOrEngineStatus.set(CONNECTION_STATUS.RECONNECTED);
				} else {
					ecosystemOrEngineStatus.set(CONNECTION_STATUS.CONNECTED);
				}
			} else {
				ecosystemOrEngineStatus.set(CONNECTION_STATUS.DISCONNECTED);
			}
		}
	};

	let updateEcosystemOrEngineStatusInterval = undefined;

	// Mount and destroy
	onMount(async () => {
		updateServerStatusInterval = setInterval(updateServerStatus, 5 * 1000);
		updateEcosystemOrEngineStatusInterval = setInterval(updateEcosystemOrEngineStatus, 5 * 1000);
	});

	onDestroy(async () => {
		clearInterval(updateServerStatusInterval);
		clearInterval(updateEcosystemOrEngineStatusInterval);
	});
</script>

<div class="bottom-bar" style="--menu-width:{menuWidth}">
	{#if $serverStatus !== CONNECTION_STATUS.CONNECTED}
		{#if $serverStatus === CONNECTION_STATUS.RECONNECTED}
			<div class="reconnecting center-content">Reconnected to the server</div>
		{:else}
			<div class="disconnected center-content">Disconnected from the server</div>
		{/if}
	{:else if pageType !== PAGE_TYPE.DEFAULT && $ecosystemOrEngineStatus !== CONNECTION_STATUS.CONNECTED}
		{#if $ecosystemOrEngineStatus === CONNECTION_STATUS.RECONNECTED}
			<div class="reconnecting center-content">
				The {pageType === PAGE_TYPE.ECOSYSTEM ? 'ecosystem' : 'engine'} has reconnected to GAIA
			</div>
		{:else}
			<div class="disconnected center-content">
				The {pageType === PAGE_TYPE.ECOSYSTEM ? 'ecosystem' : 'engine'} is currently disconnected from GAIA
			</div>
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
