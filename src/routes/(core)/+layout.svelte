<script>
	import Menu from '$lib/components/menu/Menu.svelte';
	import { generateMenuLayout } from '$lib/components/menu/functions.js';
	import Modal from '$lib/components/Modal.svelte';
	import TopBar from '$lib/components/TopBar.svelte';

	import {
		calendarEvents,
		currentUser,
		ecosystems,
		ecosystemsIds,
		ecosystemsManagement,
		engines,
		enginesIds,
		flashMessage,
		services,
		warnings
	} from '$lib/store.js';
	import {APP_MODE} from "$lib/utils/consts.js";
	import { serviceEnabled } from '$lib/utils/functions.js';

	export let data;

	const {
		appMode,
		calendarEventsValues,
		enginesIdsValues,
		enginesValues,
		ecosystemsIdsValues,
		ecosystemsManagementValues,
		ecosystemsValues,
		servicesValues,
		warningsValues
	} = data;
	calendarEvents.set(calendarEventsValues);
	engines.set(enginesValues);
	enginesIds.set(enginesIdsValues);
	ecosystems.set(ecosystemsValues);
	ecosystemsIds.set(ecosystemsIdsValues);
	ecosystemsManagement.set(ecosystemsManagementValues);
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

	let menuWidth = 210;

	const anyMessage = function (flashMessage) {
		return flashMessage.length > 0;
	};

	const getMessage = function (flashMessage) {
		if (showModal) {
			return {
				title: flashMessage[0].title,
				message: flashMessage[0].message,
				timeOut: flashMessage[0].timeOut
			};
		}
		return {
			title: undefined,
			message: undefined,
			timeOut: undefined
		};
	};

	$: weatherEnabled = serviceEnabled($services, 'weather');
	$: menuLayout = generateMenuLayout(
		$currentUser,
		$ecosystemsIds,
		$ecosystemsManagement,
		$enginesIds,
		weatherEnabled
	);
	$: showModal = anyMessage($flashMessage);

	const sliceMessages = function () {
		let msgs = $flashMessage;
		msgs.shift();
		flashMessage.set(msgs);
	};
</script>

<Modal
	bind:showModal
	on:close={sliceMessages}
	title={getMessage($flashMessage)['title']}
	timeOut={getMessage($flashMessage)['timeOut']}
>
	{getMessage($flashMessage)['message']}
</Modal>

<Menu layout={menuLayout} width={menuWidth} />
<div class="container" style="--margin-width:{menuWidth}">
	<TopBar development={appMode === APP_MODE.development} />
	<div class="main">
		<slot />
	</div>
</div>

<style>
	.container {
		position: absolute;
		left: 0;
		right: 0;
		margin-left: 0;
		display: flex;
		flex-direction: column;
		background-color: var(--main-95);
	}

	.main {
		min-height: calc(
			100vh - 141px
		); /* 141px = Nav bar (65) + Top bar (45) + border (1) + padding (10+20) */
		padding: 10px 20px 20px 20px;
		position: relative;
	}

	/* Large devices (laptops/desktops, 992px and up) */
	@media only screen and (min-width: 992px) {
		.container {
			margin-left: calc(var(--margin-width) * 1px);
		}

		.main {
			min-height: calc(100vh - 76px); /* 76px = Top bar (45) + border (1) + padding (10+20) */
			padding-right: 45px;
		}
	}
</style>
