<script>
	import { page } from '$app/stores';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Switch from '$lib/components/Switch.svelte';

	import { fetchEcosystemActuatorsStatus, updateActuatorMode } from '$lib/actions.js';
	import { ecosystemsIds } from '$lib/store.js';
	import { actuatorType } from '$lib/utils/consts.js';
	import { getEcosystemUid } from '$lib/utils/functions.js';

	$: ecosystemName = $page['params']['ecosystem'];
	$: ecosystemUID = getEcosystemUid($ecosystemsIds, ecosystemName);
</script>

<HeaderLine title="Actuator {ecosystemName}" />

{#await fetchEcosystemActuatorsStatus(ecosystemUID) then runningActuators}
	{#each actuatorType as actuator}
		{#if runningActuators[actuator]['active']}
			<Switch
				actuatorType={actuator}
				status={runningActuators[actuator]['status']}
				mode={runningActuators[actuator]['mode']}
				on:switch={(event) => {
					updateActuatorMode(
						ecosystemUID,
						event['detail']['actuatorType'],
						event['detail']['mode']
					);
				}}
			/>
		{/if}
	{/each}
{/await}
