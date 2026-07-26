<script>
	import { onDestroy, onMount, tick } from 'svelte';

	import Header from '$lib/components/header/Header.svelte';
	import BottomBar from '$lib/components/BottomBar.svelte';
	import ContractBanner from '$lib/components/ContractBanner.svelte';
	import Menu from '$lib/components/menu/Menu.svelte';
	import { generateListOfMenuItems } from '$lib/components/menu/functions.js';
	import Modal from '$lib/components/Modal.svelte';

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

	// Menu-related parameters
	const menuWidth = 210;
	const menuMinimizedWidth = 45 + 20;
	let menuMinimized = $state(true);

	let menuItems = $derived(
		generateListOfMenuItems(
			appState.currentUser,
			gaiaState.ecosystemsIds,
			gaiaState.ecosystemsManagement,
			gaiaState.enginesIds,
			servicesState.services,
			infraState.serversIds,
			servicesState.wikiTopics
		)
	);

	// Modal-related functions and parameters
	let anyFlashMessage = $state(appState.flashMessages.length > 0);

	const refreshModal = function () {
		anyFlashMessage = false;
		appState.flashMessages.shift();
		tick();
		anyFlashMessage = appState.flashMessages.length > 0;
	};

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

<Modal
	showModal={anyFlashMessage}
	onclose={refreshModal}
	timeOut={anyFlashMessage ? appState.flashMessages[0]['timeOut'] : undefined}
>
	{#snippet title()}{appState.flashMessages[0]['title']}{/snippet}
	{appState.flashMessages[0]['message']}
</Modal>

<Menu
	items={menuItems}
	width={menuWidth}
	miniWidth={menuMinimizedWidth}
	bind:minimized={menuMinimized}
/>

<div class="wrap">
	<Header />
	{@render children?.()}
	<BottomBar />
	<ContractBanner />
</div>

<style>
	main {
		padding: 10px 20px calc(20px + var(--bottom-banner-height-mobile, 0px)) 20px;
	}

	.wrap {
		max-width: 1120px;
		margin: 0 auto;
		padding: clamp(16px, 3vw, 34px) clamp(14px, 3vw, 30px) 60px;
	}
</style>
