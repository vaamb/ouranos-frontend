<script>
	import { page } from '$app/stores';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Switch from '$lib/components/Switch.svelte';

	import { fetchEcosystemActuatorsData, updateActuatorMode } from '$lib/actions.js';
	import { ecosystemsIds, ecosystemsActuatorData } from '$lib/store.js';
	import { actuatorTypes } from '$lib/utils/consts.js';
	import { getEcosystemUid } from '$lib/utils/functions.js';

	$: ecosystemName = $page['params']['ecosystem'];
	$: ecosystemUID = getEcosystemUid($ecosystemsIds, ecosystemName);
</script>

<HeaderLine title="Actuator {ecosystemName}" />

{#await fetchEcosystemActuatorsData(ecosystemUID) then runningActuators}
	{#each actuatorTypes as actuator}
		{#if $ecosystemsActuatorData[ecosystemUID][actuator]['active']}
			<Switch
				actuatorType={actuator}
				status={$ecosystemsActuatorData[ecosystemUID][actuator]['status']}
				mode={$ecosystemsActuatorData[ecosystemUID][actuator]['mode']}
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
