<script>
	import { onDestroy, onMount } from 'svelte';

	import BottomBar from '$lib/components/BottomBar.svelte';
	import Menu from '$lib/components/menu/Menu.svelte';
	import { generateListOfMenuItems } from '$lib/components/menu/functions.js';
	import Modal from '$lib/components/Modal.svelte';
	import TopBar from '$lib/components/TopBar.svelte';

	import { CONNECTION_STATUS, CONNECTION_TIMEOUT } from '$lib/utils/consts.js';

	import {
		currentUser,
		ecosystems,
		ecosystemsIds,
		ecosystemsManagement,
		ecosystemsState,
		engines,
		enginesState,
		enginesIds,
		flashMessage,
		pingServerLastSeen,
		pingServerStatus,
		rawWarnings,
		servers,
		serversIds,
		services,
		wikiTopics
	} from '$lib/store.svelte.js';
	import { APP_MODE } from '$lib/utils/consts.js';

	// Fill stores with pre-fetched data
	let { data, children } = $props();

	ecosystems.set(data.ecosystems);
	ecosystemsManagement.set(data.ecosystemsManagement);
	ecosystemsState.set(data.ecosystemsState);
	engines.set(data.engines);
	enginesState.set(data.enginesState);
	servers.set(data.servers);
	services.set(data.services);
	rawWarnings.set(data.warnings);
	wikiTopics.set(data.wikiTopics);

	// Menu-related parameters
	let menuWidth = 210;
	let menuMinimized = $state(false);

	let menuItems = $derived(
		generateListOfMenuItems(
			$currentUser,
			$ecosystemsIds,
			$ecosystemsManagement,
			$enginesIds,
			$services,
			$serversIds,
			$wikiTopics
		)
	);

	// Modal-related functions and parameters
	let showModal = $state($flashMessage.length > 0);

	$effect(() => {
		showModal = $flashMessage.length > 0;
		// Hack required to update `showModal` after shifting the messages
		showModal;
	});

	const refreshModal = function () {
		$flashMessage.shift();
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
		const newServerStatus = getStatus($pingServerLastSeen, $pingServerStatus, CONNECTION_TIMEOUT);
		if ($pingServerStatus !== newServerStatus) {
			$pingServerStatus = newServerStatus;
		}

		// Engines
		for (const engineUID in $engines) {
			const engine = $engines[engineUID];
			const newEngineStatus = getStatus(engine['last_seen'], engine['connected'], 90);
			if ($engines[engineUID]['connected'] !== newEngineStatus) {
				$engines[engineUID]['connected'] = newEngineStatus;
			}
		}

		// Ecosystems
		for (const ecosystemUID in $ecosystemsState) {
			const ecosystem = $ecosystemsState[ecosystemUID];
			const newEcosystemStatus = getStatus(ecosystem['last_seen'], ecosystem['connected'], 90);
			if (ecosystem['connected'] !== newEcosystemStatus) {
				$ecosystemsState[ecosystemUID]['connected'] = newEcosystemStatus;
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
	bind:showModal
	onclose={refreshModal}
	title={$flashMessage.length > 0 ? $flashMessage[0]['title'] : ''}
	timeOut={$flashMessage.length > 0 ? $flashMessage[0]['timeOut'] : undefined}
>
	{$flashMessage.length > 0 ? $flashMessage[0]['message'] : ''}
</Modal>

<Menu items={menuItems} width={menuWidth} miniWidth={45} bind:minimized={menuMinimized} />
<div class="main" style="--margin-width:{menuWidth}" class:full-page={menuMinimized}>
	<TopBar development={data.appMode === APP_MODE.development} menuWidth={menuMinimized ? 45 : menuWidth} />
	<div class="padding-main">
		{@render children?.()}
	</div>
	<BottomBar menuWidth={menuMinimized ? 0 : menuWidth} />
</div>

<style>
	.main {
		margin-top: 65px;
		min-height: calc(100vh - 141px); /* 141px = Nav bar (65) + Top bar (45) + border (1) + padding (10+20) */
	}

	.padding-main {
		padding: 10px 20px 20px 20px;
	}

	/* Large devices (laptops/desktops, 992px and up) */
	@media only screen and (min-width: 992px) {
		.main {
			margin-top: 0;
			margin-left: calc(var(--margin-width) * 1px);
			min-height: calc(100vh - 76px); /* 76px = Top bar (45) + border (1) + padding (10+20) */
		}

		.full-page {
			margin-left: 25px;
		}

		.padding-main {
			padding-top: 56px; /* Top bar (45) + border (1) + base padding (10) */
			padding-right: 45px;
		}
	}
</style>
