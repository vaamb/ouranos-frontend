<script>
	import { page } from '$app/stores';

	import Box from "$lib/components/layout/Box.svelte";
	import BoxItem from "$lib/components/layout/BoxItem.svelte";
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Switch from '$lib/components/Switch.svelte';

	import { fetchEcosystemActuatorsData, updateActuatorMode } from '$lib/actions.js';
	import { ecosystemsIds, ecosystemsActuatorData } from '$lib/store.js';
	import { actuatorTypes } from '$lib/utils/consts.js';
	import { capitalize, getEcosystemUid } from '$lib/utils/functions.js';

	$: ecosystemName = $page['params']['ecosystem'];
	$: ecosystemUID = getEcosystemUid($ecosystemsIds, ecosystemName);
</script>

<HeaderLine title="Actuators in {ecosystemName}" />

{#await fetchEcosystemActuatorsData(ecosystemUID) then runningActuators}
	{#each actuatorTypes as actuator}
		{#if $ecosystemsActuatorData[ecosystemUID][actuator]['active']}
			<Box title="{capitalize(actuator)}" maxWidth="350px">
				<BoxItem>
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
				</BoxItem>
			</Box>

		{/if}
	{/each}
{/await}
