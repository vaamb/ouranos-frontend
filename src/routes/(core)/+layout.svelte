<script>
	import { onDestroy, onMount } from 'svelte';

	import BottomBar from '$lib/components/BottomBar.svelte';
	import Menu from '$lib/components/menu/Menu.svelte';
	import { generateListOfMenuItems } from '$lib/components/menu/functions.js';
	import Modal from '$lib/components/Modal.svelte';
	import TopBar from '$lib/components/TopBar.svelte';

	import { CONNECTION_STATUS, CONNECTION_TIMEOUT } from '$lib/utils/consts.js';

	import {
		calendarEvents,
		currentUser,
		ecosystems,
		ecosystemsIds,
		ecosystemsManagement,
		engines,
		enginesIds,
		flashMessage,
		pingServerLastSeen,
		pingServerStatus,
		servers,
		serversIds,
		services,
		warnings
	} from '$lib/store.js';
	import { APP_MODE } from '$lib/utils/consts.js';

	// Fill stores with pre-fetched data
	export let data;

	const {
		appMode,
		calendarEventsValues,
		enginesIdsValues,
		enginesValues,
		ecosystemsIdsValues,
		ecosystemsManagementValues,
		ecosystemsValues,
		serversValues,
		serversIdsValues,
		servicesValues,
		warningsValues
	} = data;
	calendarEvents.set(calendarEventsValues);
	engines.set(enginesValues);
	enginesIds.set(enginesIdsValues);
	ecosystems.set(ecosystemsValues);
	ecosystemsIds.set(ecosystemsIdsValues);
	ecosystemsManagement.set(ecosystemsManagementValues);
	servers.set(serversValues);
	serversIds.set(serversIdsValues);
	services.set(servicesValues);
	warnings.set(warningsValues);

	const addEcosystemNameToWarnings = function (warnings, ecosystems) {
		warnings.forEach((warning) => {
			if (ecosystems[warning['created_by']]) {
				warning['created_by'] = ecosystems[warning['created_by']]['name'];
			}
		});
		return warnings;
	};
	addEcosystemNameToWarnings($warnings, $ecosystems);

	// Menu-related parameters
	let menuWidth = 210;

	$: menuItems = generateListOfMenuItems(
		$currentUser,
		$ecosystemsIds,
		$ecosystemsManagement,
		$enginesIds,
		$services,
		$serversIds
	);

	// Modal-related functions and parameters
	let showModal;
	$: showModal = $flashMessage.length > 0;

	// Ping server, engine and ecosystem connection status
	const updateStatus = function () {
		// Utility function
		const getStatus = function (lastSeen, previousStatus) {
			if (new Date() - lastSeen < CONNECTION_TIMEOUT * 1000) {
				return previousStatus === CONNECTION_STATUS.DISCONNECTED
					? CONNECTION_STATUS.RECONNECTED
					: CONNECTION_STATUS.CONNECTED;
			} else {
				return CONNECTION_STATUS.DISCONNECTED;
			}
		};

		// Ping server
		$pingServerStatus = getStatus($pingServerLastSeen, $pingServerStatus);

		// Engines
		for (const engineUID in $engines) {
			const engine = $engines[engineUID];
			$engines[engineUID]['connected'] = getStatus(engine['last_seen'], engine['connected']);
		}

		// Ecosystems
		for (const ecosystemUID in $ecosystems) {
			const ecosystem = $ecosystems[ecosystemUID];
			$ecosystems[ecosystemUID]['connected'] = getStatus(ecosystem['last_seen'], ecosystem['connected']);
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
	on:close={() => {
		$flashMessage.shift();
	}}
	title={$flashMessage.length > 0 ? $flashMessage[0]['title'] : ''}
	timeOut={$flashMessage.length > 0 ? $flashMessage[0]['timeOut'] : undefined}
>
	{$flashMessage.length > 0 ? $flashMessage[0]['message'] : ''}
</Modal>

<Menu items={menuItems} width={menuWidth} />
<TopBar development={appMode === APP_MODE.development} {menuWidth} />
<div class="main" style="--margin-width:{menuWidth}">
	<slot />
</div>
<BottomBar {menuWidth} />

<style>
	.main {
		min-height: calc(100vh - 141px); /* 141px = Nav bar (65) + Top bar (45) + border (1) + padding (10+20) */
		padding: 10px 20px 20px 20px;
	}

	/* Large devices (laptops/desktops, 992px and up) */
	@media only screen and (min-width: 992px) {
		.main {
			margin-top: 46px; /* Top bar (45) + border (1) */
			margin-left: calc(var(--margin-width) * 1px);
			min-height: calc(100vh - 76px); /* 76px = Top bar (45) + border (1) + padding (10+20) */
			padding-right: 45px;
		}
	}
</style>
