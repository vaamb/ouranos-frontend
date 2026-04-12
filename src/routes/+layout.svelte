<script>
	import { onMount } from 'svelte';

	import MaintenanceScreen from '$lib/components/screens/Maintenance.svelte';
	import UnreachableScreen from '$lib/components/screens/Unreachable.svelte';

	import { refreshSessionCookie } from '$lib/actions.svelte.js';
	import {
		connectSocketio,
		disconnectSocketio,
		logInSocketio,
		logOutSocketio
	} from '$lib/socketio.svelte.js';
	import { appState } from '$lib/store.svelte.js';
	import { APP_MODE, SERVER_STATUS } from '$lib/utils/consts.js';
	import { User } from '$lib/utils/factories.js';

	let { data, children } = $props();
	const { appMode, serverStatus, userData } = data;

	appState.currentUser = User(userData);

	if (serverStatus === SERVER_STATUS.connected) {
		appState.pingServerLastSeen = new Date();
	}

	onMount(async () => {
		if (serverStatus === SERVER_STATUS.connected) {
			connectSocketio();
			if (appState.currentUser.isAuthenticated) {
				logInSocketio(appState.currentUser.sessionToken);
				await refreshSessionCookie();
			}
		}

		return () => {
			disconnectSocketio();
			if (appState.currentUser.isAuthenticated) {
				logOutSocketio(appState.currentUser.sessionToken);
			}
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
