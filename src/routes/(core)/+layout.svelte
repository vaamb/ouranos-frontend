<script>
	import Menu from '$lib/components/menu/Menu.svelte';
	import { generateMenuLayout } from '$lib/components/menu/functions.js';
	import Modal from '$lib/components/Modal.svelte';
	import TopBar from '$lib/components/TopBar.svelte';

	import {
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
	import { serviceEnabled } from '$lib/utils/functions.js';

	export let data;

	const {
		development,
		enginesValues,
		enginesIdsValues,
		ecosystemsValues,
		ecosystemsIdsValues,
		ecosystemsManagementValues,
		servicesValues,
		warningsValues
	} = data;
	engines.set(enginesValues);
	enginesIds.set(enginesIdsValues);
	ecosystems.set(ecosystemsValues);
	ecosystemsIds.set(ecosystemsIdsValues);
	ecosystemsManagement.set(ecosystemsManagementValues);
	services.set(servicesValues);
	warnings.set(warningsValues);

	let menuWidth = 210;

	const anyMessage = function (flashMessage) {
		return flashMessage.length > 0;
	};

	const getMessage = function (flashMessage) {
		if (showModal) {
			return {
				title: flashMessage[0].title,
				message: flashMessage[0].message
			};
		}
		return {
			title: undefined,
			message: undefined
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

<Modal bind:showModal on:close={sliceMessages} title={getMessage($flashMessage)['title']}>
	{getMessage($flashMessage)['message']}
</Modal>

<Menu layout={menuLayout} width={menuWidth} />
<div class="container" style="--margin-width:{menuWidth}">
	<TopBar {development} />
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
		background-color: var(--main-95);
	}

	.main {
		padding: 10px 20px 20px 20px;
		position: relative;
	}

	/* Large devices (laptops/desktops, 992px and up) */
	@media only screen and (min-width: 992px) {
		.container {
			margin-left: calc(var(--margin-width) * 1px);
		}

		.main {
			padding-right: 45px;
		}
	}
</style>
