<script>
  import { onMount } from "svelte";

  import MaintenanceScreen from "$lib/components/screens/Maintenance.svelte";
  import UnreachableScreen from "$lib/components/screens/Unreachable.svelte";

  import { connectSocketio, disconnectSocketio } from "$lib/socketio.js";
  import { currentUser, serverLastSeen } from "$lib/store.js";
  import { APP_MODE, SERVER_STATUS } from "$lib/utils/consts.js";
  import { User } from "$lib/utils/factories.js";

  export let data;
  const { appMode, serverStatus, userData } = data;

  const user = User(userData);
  currentUser.set(user);

  if (serverStatus === SERVER_STATUS.connected) {
    serverLastSeen.set(new Date());
  }

  onMount(async () => {
    if (serverStatus === SERVER_STATUS.connected) {
      connectSocketio();
    }

    return () => {
      disconnectSocketio();
    };
  });
</script>

{#if appMode === APP_MODE.maintenance}
  <MaintenanceScreen />
{:else if serverStatus === SERVER_STATUS.connected}
  <slot />
{:else}
  <UnreachableScreen />
{/if}
