<script>
	import { onDestroy, onMount } from 'svelte';

	import Header from '$lib/components/header/Header.svelte';
	import StatusBanner from '$lib/components/StatusBanner.svelte';
	import ContractBanner from '$lib/components/ContractBanner.svelte';
	import NavLine from '$lib/components/nav/NavLine.svelte';
	import { generateNavigation } from '$lib/components/nav/functions.js';
	import Toasts from '$lib/components/Toasts.svelte';

	import { CONNECTION_STATUS, CONNECTION_TIMEOUT } from '$lib/utils/consts.js';

	import { appState, gaiaState, infraState, servicesState } from '$lib/store.svelte.ts';

	// Fill stores with pre-fetched data
	let { data, children } = $props();

	data.warnings.forEach((warning) => {
		if (data.ecosystems[warning['created_by']]) {
			warning['created_by'] = data.ecosystems[warning['created_by']]['name'];
		}
	});

	gaiaState.ecosystems = data.ecosystems;
	gaiaState.ecosystemsManagement = data.ecosystemsManagement;
	gaiaState.ecosystemsState = data.ecosystemsState;
	gaiaState.engines = data.engines;
	gaiaState.enginesState = data.enginesState;
	gaiaState.warnings = data.warnings;
	infraState.servers = data.servers;
	servicesState.services = data.services;
	servicesState.wikiTopics = data.wikiTopics;

	let navigation = $derived(
		generateNavigation(
			appState.currentUser,
			gaiaState.ecosystemsIds,
			gaiaState.ecosystemsManagement,
			gaiaState.ecosystemsState,
			gaiaState.enginesIds,
			gaiaState.enginesState,
			servicesState.services,
			infraState.serversIds,
			servicesState.wikiTopics
		)
	);

	// Ping server, engine and ecosystem connection status
	const updateStatus = function () {
		// Utility function
		const getStatus = function (lastSeen, previousStatus, timeout) {
			if (new Date() - lastSeen < timeout * 1000) {
				return previousStatus === CONNECTION_STATUS.DISCONNECTED
					? CONNECTION_STATUS.RECONNECTED
					: CONNECTION_STATUS.CONNECTED;
			} else {
				return CONNECTION_STATUS.DISCONNECTED;
			}
		};

		// Ping server
		const newServerStatus = getStatus(
			appState.pingServerLastSeen,
			appState.pingServerStatus,
			CONNECTION_TIMEOUT
		);
		if (appState.pingServerStatus !== newServerStatus) {
			appState.pingServerStatus = newServerStatus;
		}

		// Engines
		for (const engineUID in gaiaState.engines) {
			const engine = gaiaState.engines[engineUID];
			const newEngineStatus = getStatus(engine['last_seen'], engine['connected'], 90);
			if (gaiaState.engines[engineUID]['connected'] !== newEngineStatus) {
				gaiaState.engines[engineUID]['connected'] = newEngineStatus;
			}
		}

		// Ecosystems
		for (const ecosystemUID in gaiaState.ecosystemsState) {
			const ecosystem = gaiaState.ecosystemsState[ecosystemUID];
			const newEcosystemStatus = getStatus(ecosystem['last_seen'], ecosystem['connected'], 90);
			if (ecosystem['connected'] !== newEcosystemStatus) {
				gaiaState.ecosystemsState[ecosystemUID]['connected'] = newEcosystemStatus;
			}
		}
	};

	let updateStatusInterval = undefined;

	onMount(async () => {
		updateStatusInterval = setInterval(updateStatus, 5 * 1000);
	});

	onDestroy(() => {
		if (updateStatusInterval) {
			clearInterval(updateStatusInterval);
		}
	});
</script>

<div
	class="wrap"
	style="
		--bottom-banner-height-mobile: {appState.anyContractMismatch ? '50px' : '0px'};
		--bottom-banner-height: {appState.anyContractMismatch ? '37px' : '0px'};
	"
>
	<Header />
	<NavLine siteViews={navigation['siteViews']} groups={navigation['groups']} />
	{@render children?.()}
</div>

<div class="bottom-stack">
	<Toasts />
	<StatusBanner />
	<ContractBanner />
</div>

<style>
	.wrap {
		max-width: 1120px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 34px) clamp(14px, 3vw, 30px)
			calc(60px + var(--bottom-banner-height-mobile, 0px));
	}

	.bottom-stack {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		/* The stack spans the viewport, but only the banners and the toasts are
		   solid: everything between them lets clicks through to the page. */
		pointer-events: none;
	}

	@media only screen and (min-width: 992px) {
		.wrap {
			padding-bottom: calc(60px + var(--bottom-banner-height, 0px));
		}
	}
</style>
