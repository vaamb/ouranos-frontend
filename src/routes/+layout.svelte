<script>
	import { onMount } from 'svelte';

	import MaintenanceScreen from '$lib/components/screens/Maintenance.svelte';
	import UnreachableScreen from '$lib/components/screens/Unreachable.svelte';

	import { extendSessionCookie } from '$lib/actions.svelte.js';
	import {
		connectSocketio,
		disconnectSocketio,
		startUserHeartbeat,
		stopUserHeartbeat
	} from '$lib/socketio.svelte.js';
	import { appState } from '$lib/store.svelte.ts';
	import { useTheme } from '$lib/theme.svelte.ts';
	import { APP_MODE, REST_CONTRACT, SERVER_STATUS } from '$lib/utils/consts.js';
	import { createUser } from '$lib/utils/factories.js';
	import { isContractCompatible } from '$lib/utils/functions.js';

	let { data, children } = $props();
	// Read once, on purpose: these describe the app the page was served for, and
	// any change to them swaps the whole tree, which only a full load can do.
	// svelte-ignore state_referenced_locally
	const { appMode, restContract, serverStatus, userData } = data;

	appState.currentUser = createUser(userData);

	// Applied here rather than in `Header`, so the routes that render no header
	// (the whole `auth` tree) are themed too.
	useTheme();

	if (serverStatus === SERVER_STATUS.connected) {
		appState.pingServerLastSeen = new Date();
	}

	if (serverStatus === SERVER_STATUS.connected) {
		appState.pingServerLastSeen = new Date();

		if (!isContractCompatible(REST_CONTRACT, restContract)) {
			appState.contractsMismatch['rest'] = true;
			console.error(
				`Incompatible REST contract: frontend expects ${REST_CONTRACT}, server provides ${restContract}`
			);
		}
	}

	onMount(async () => {
		if (serverStatus === SERVER_STATUS.connected) {
			if (appState.currentUser.isAuthenticated) {
				await extendSessionCookie();
			}
			connectSocketio();
			if (appState.currentUser.isAuthenticated) {
				startUserHeartbeat();
			}
		}

		return () => {
			if (appState.currentUser.isAuthenticated) {
				stopUserHeartbeat();
			}
			disconnectSocketio();
		};
	});
</script>

{#if appMode === APP_MODE.maintenance}
	<MaintenanceScreen />
{:else if serverStatus === SERVER_STATUS.connected}
	{@render children?.()}
{:else}
	<UnreachableScreen />
{/if}
