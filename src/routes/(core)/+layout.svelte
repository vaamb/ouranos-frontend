<script>
	import { onDestroy, onMount, tick } from 'svelte';

	import BottomBar from '$lib/components/BottomBar.svelte';
	import Menu from '$lib/components/menu/Menu.svelte';
	import { generateListOfMenuItems } from '$lib/components/menu/functions.js';
	import Modal from '$lib/components/Modal.svelte';
	import TopBar from '$lib/components/TopBar.svelte';

	import { CONNECTION_STATUS, CONNECTION_TIMEOUT } from '$lib/utils/consts.js';

	import {
		appState,
		gaiaState,
		infraState,
		servicesState
	} from '$lib/store.svelte.js';
	import { APP_MODE } from '$lib/utils/consts.js';

	// Fill stores with pre-fetched data
	let { data, children } = $props();

	gaiaState.ecosystems = data.ecosystems;
	gaiaState.ecosystemsManagement = data.ecosystemsManagement;
	gaiaState.ecosystemsState = data.ecosystemsState;
	gaiaState.engines = data.engines;
	gaiaState.enginesState = data.enginesState;
	gaiaState.rawWarnings = data.warnings;
	infraState.servers = data.servers;
	servicesState.services = data.services;
	servicesState.wikiTopics = data.wikiTopics;

	// Menu-related parameters
	const menuWidth = 210;
	const menuMinimizedWidth = 45 + 20;
	let menuMinimized = $state(false);

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
	let anyFlashMessage = $state(appState.flashMessage.length > 0);

	const refreshModal = function () {
		anyFlashMessage = false;
		appState.flashMessage.shift();
		tick();
		anyFlashMessage = appState.flashMessage.length > 0;
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
		const newServerStatus = getStatus(appState.pingServerLastSeen, appState.pingServerStatus, CONNECTION_TIMEOUT);
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
	timeOut={anyFlashMessage ? appState.flashMessage[0]['timeOut'] : undefined}
>
	{#snippet title()}{appState.flashMessage[0]['title']}{/snippet}
	{appState.flashMessage[0]['message']}
</Modal>

<Menu items={menuItems} width={menuWidth} miniWidth={menuMinimizedWidth} bind:minimized={menuMinimized} />
<div class="content-wrapper" style="--margin-width:{menuWidth}" class:full-page={menuMinimized}>
	<TopBar
		development={data.appMode === APP_MODE.development}
		miniWidth={menuMinimizedWidth}
		fullPage={menuMinimized}
	/>
	<div class="transition-wrapper">
		<main>
			{@render children?.()}
		</main>
	</div>
	<BottomBar menuWidth={menuMinimized ? 0 : menuWidth} />
</div>

<style>
	main {
		padding: 10px 20px 20px 20px;
	}

	.content-wrapper {
		margin-top: 65px;
		min-height: calc(100vh - 141px); /* 141px = Nav bar (65) + Top bar (45) + border (1) + padding (10+20) */
	}

	/* Large devices (laptops/desktops, 992px and up) */
	@media only screen and (min-width: 992px) {
		main {
			padding-top: 56px; /* Top bar (45) + border (1) + base padding (10) */
			padding-right: 45px;
		}

		.content-wrapper {
			margin-top: 0;
			min-height: calc(100vh - 76px); /* 76px = Top bar (45) + border (1) + padding (10+20) */
			margin-left: auto;
			width: calc(100% - var(--margin-width) * 1px);

			transition: width 700ms ease-in-out;
		}

		.transition-wrapper {
			width: inherit;
			position: absolute;
			right: 0;
		}

		.full-page {
			width: 100%;
			margin-left: 25px;
		}
	}
</style>
