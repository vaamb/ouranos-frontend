<script>
	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import Graph from '$lib/components/Graph.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Switch from '$lib/components/Switch.svelte';

	import {
		fetchEcosystemActuatorRecords,
		fetchEcosystemActuatorsState,
		updateActuatorMode
	} from '$lib/actions.svelte.js';
	import {
		ecosystemsActuatorsRecords,
		ecosystemsActuatorsState,
		getStoreDataKey
	} from '$lib/store.svelte.js';

	import { actuatorTypes } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';
	import { colors } from '$lib/utils/styling.js';

	let { data } = $props();

	let ecosystemName = data['ecosystemName'];
	let ecosystemUID = data['ecosystemUID'];

	const hasBeenActive = function (ecosystemsActuatorsRecords) {
		const active = (element) => element[1];
		return ecosystemsActuatorsRecords['values'].some(active);
	};

	const convertModeToBool = function (mode) {
		return mode === 'automatic';
	};

	const patchActuatorRecords = function (records, actuatorName) {
		if (records['values'].length > 0) {
			return records;
		} else {
			const currentState = $ecosystemsActuatorsState[ecosystemUID][actuatorName];
			records['values'].push([
				records['span'][1],
				currentState['active'],
				currentState['mode'],
				currentState['status'],
				currentState['level']
			]);
			return records;
		}
	};

	const formatRecords = function (data) {
		const records = data['values'];
		// Pre-populate data with the first bound (so they all start at the same time)
		const labels = [new Date(data['span'][0])];
		const modes = [convertModeToBool(records[0][2])];
		const statuses = [records[0][3]];
		// Fill datasets from record data
		// To have nice graphs, we need to create "pre" data points and fill it with data from the last record and a
		// date a few microseconds earlier
		let lastRecord = records[0];
		for (const record of records) {
			const date = new Date(record[0]);
			const preDate = new Date(date - 5000);
			labels.push(preDate, date);
			modes.push(convertModeToBool(lastRecord[2]), convertModeToBool(record[2]));
			statuses.push(lastRecord[3], record[3]);
			lastRecord = record;
		}
		// Post populate data with the last bound (so they all end at the same time)
		labels.push(new Date(data['span'][1]));
		modes.push(convertModeToBool(lastRecord[2]));
		statuses.push(lastRecord[3]);
		return {
			labels: labels,
			datasets: [
				{
					label: 'status',
					data: statuses,
					borderColor: colors.yellow,
					backgroundColor: colors.yellow + '60', // Add alpha
					borderWidth: 0.75,
					fill: true
				},
				{
					label: 'mode',
					data: modes,
					borderColor: colors.blue,
					backgroundColor: colors.blue + '40', // Add alpha
					borderWidth: 0.75,
					fill: true
				}
			]
		};
	};
</script>

<HeaderLine title="Actuators in {ecosystemName}" />

{#await fetchEcosystemActuatorsState(ecosystemUID) then actuatorsState_notUsed}
	{#each actuatorTypes as actuator}
		{#await fetchEcosystemActuatorRecords(ecosystemUID, actuator) then ecosystemsActuatorsRecords_notUsed}
			{#if $ecosystemsActuatorsState[ecosystemUID][actuator]['active'] || hasBeenActive($ecosystemsActuatorsRecords[getStoreDataKey(ecosystemUID, actuator)])}
				{@const actuatorRecords = $ecosystemsActuatorsRecords[getStoreDataKey(ecosystemUID, actuator)]}
				{@const drawGraph = actuatorRecords.values.length >= 3}
				<Box title={capitalize(actuator)} direction="row" maxWidth={drawGraph ? null : '325px'}>
					{#if $ecosystemsActuatorsState[ecosystemUID][actuator]['active']}
						<BoxItem maxWidth={drawGraph ? '305px' : null}>
							<Switch
								actuatorType={actuator}
								status={$ecosystemsActuatorsState[ecosystemUID][actuator]['status']}
								mode={$ecosystemsActuatorsState[ecosystemUID][actuator]['mode']}
								useTimer={true}
								on:switch={(event) => {
									updateActuatorMode(
										ecosystemUID,
										event['detail']['actuatorType'],
										event['detail']['mode'],
										event['detail']['countdown']
									);
								}}
							/>
						</BoxItem>
					{/if}
					{@const actuatorRecords =
						$ecosystemsActuatorsRecords[getStoreDataKey(ecosystemUID, actuator)]}
					{@const patchedActuatorRecords = patchActuatorRecords(actuatorRecords, actuator)}
					<BoxItem>
						{@const formattedActuatorRecords = formatRecords(patchedActuatorRecords)}
						<Graph
							datasets={formattedActuatorRecords.datasets}
							labels={formattedActuatorRecords.labels}
							suggestedMax="1"
							height="200px"
							legend={{
								display: true,
								position: 'right'
							}}
						/>
					</BoxItem>
				</Box>
			{/if}
		{/await}
	{/each}
{/await}
