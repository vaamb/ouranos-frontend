<script>
	import { onMount } from 'svelte';

	import MaintenanceScreen from '$lib/components/screens/Maintenance.svelte';
	import UnreachableScreen from '$lib/components/screens/Unreachable.svelte';

	import {
		connectSocketio,
		disconnectSocketio,
		logInSocketio,
		logOutSocketio
	} from '$lib/socketio.svelte.js';
	import { currentUser, pingServerLastSeen } from '$lib/store.svelte.js';
	import { APP_MODE, SERVER_STATUS } from '$lib/utils/consts.js';
	import { User } from '$lib/utils/factories.js';

	let { data, children } = $props();
	const { appMode, serverStatus, userData } = data;

	const user = User(userData);
	currentUser.set(user);

	if (serverStatus === SERVER_STATUS.connected) {
		pingServerLastSeen.set(new Date());
	}

	onMount(async () => {
		if (serverStatus === SERVER_STATUS.connected) {
			connectSocketio();
			if ($currentUser.isAuthenticated) {
				logInSocketio($currentUser.sessionToken);
			}
		}

		return () => {
			disconnectSocketio();
			if ($currentUser.isAuthenticated) {
				logOutSocketio($currentUser.sessionToken);
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
