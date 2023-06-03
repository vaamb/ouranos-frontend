<script>
  import { onMount } from "svelte";

  import MaintenanceScreen from "$lib/components/screens/Maintenance.svelte";

  import { connectSocketio, disconnectSocketio } from "$lib/socketio.js";
  import { currentUser, serverLastSeen } from "$lib/store.js";
  import { CONTENT, SERVER_STATUS } from "$lib/utils/consts.js";
  import { User } from "$lib/utils/factories.js";

  export let data;
  const { development, maintenance, serverStatus, userData } = data;

  const user = User(userData);
  currentUser.set(user);

  let content;
  if (development) {
    content = CONTENT.display;
  } else if (maintenance || serverStatus === SERVER_STATUS.unreachable) {
    content = CONTENT.maintenance;
  } else {
    content = CONTENT.display;
  }

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

{#if content === CONTENT.maintenance}
  <MaintenanceScreen />
{:else if content === CONTENT.display}
  <slot />
{/if}
