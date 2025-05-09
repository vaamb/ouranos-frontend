<script>
	import { onMount } from 'svelte';

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
	import { ecosystemsActuatorsState } from '$lib/store.svelte.js';

	import { actuatorTypes } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';
	import { colors } from '$lib/utils/styling.js';

	let { data } = $props();

	let ecosystemName = data['ecosystemName'];
	let ecosystemUID = data['ecosystemUID'];

	let actuatorsRecords = $state({});
	let formattedActuatorsRecords = $derived.by(() => {
		const endPoint = Date.now();
		const startPoint = Date.now() - 1000 * 60 * 60 * 24 * 7;
		let formattedRecords = {}
		for (const actuatorType of actuatorTypes) {
			if (!actuatorsRecords[actuatorType]) {
				continue;
			}
			formattedRecords[actuatorType] = [];
			if (actuatorsRecords[actuatorType]['values'].length === 0) {
				// If there are no records, add start and end points only
				formattedRecords[actuatorType].push(
					// TODO: use current state values but don't refresh when they change
					[startPoint, false, 'automatic', false, 0],
					[endPoint, false, 'automatic', false, 0]
				);
			} else {
				// If there are records, first add start point ...
				let previousRecord = actuatorsRecords[actuatorType]['values'][0];
				formattedRecords[actuatorType].push(
					[startPoint, previousRecord[1], previousRecord[2], previousRecord[3], previousRecord[4]]
				)
				// ... then, we need to create "pre" data points and fill them with data from the
				// previous record and a date a few microseconds before the current record ...
				for (const record of actuatorsRecords[actuatorType]['values']) {
					const recordDate = new Date(record[0]);
					const previousRecordDate = new Date(recordDate - 10);
					formattedRecords[actuatorType].push(
						[previousRecordDate, previousRecord[1], previousRecord[2], previousRecord[3], previousRecord[4]],
						[recordDate, record[1], record[2], record[3], record[4]]
					)
					previousRecord = record;
				}
				// ... and finally, add end point
				formattedRecords[actuatorType].push(
					[endPoint, previousRecord[1], previousRecord[2], previousRecord[3], previousRecord[4]]
				);
			}
		}
		return formattedRecords;
	});

	const hasBeenActive = function (actuatorsRecords) {
		const active = (element) => element[1];
		return actuatorsRecords['values'].some(active);
	};

	const convertModeToBool = function (mode) {
		return mode === 'automatic';
	};

	const formatRecordsForGraphs = function (records) {
		// Pre-populate data with the first bound (so they all start at the same time)
		const labels = [];
		const modes = [];
		const statuses = [];
		for (const record of records) {
			labels.push(record[0]);
			modes.push(convertModeToBool(record[2]));
			statuses.push(record[3]);
		}
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

	onMount(async () => {
		for (const actuatorType of actuatorTypes) {
			actuatorsRecords[actuatorType] = await fetchEcosystemActuatorRecords(ecosystemUID, actuatorType);
		}
	});
</script>

<HeaderLine title="Actuators in {ecosystemName}" />

{#await fetchEcosystemActuatorsState(ecosystemUID) then actuatorsState_notUsed}
	{#each actuatorTypes as actuator}
		{#if actuatorsRecords[actuator]}
			{#if $ecosystemsActuatorsState[ecosystemUID][actuator]['active'] || hasBeenActive(actuatorsRecords[actuator])}
				{@const formattedActuatorsRecord = formattedActuatorsRecords[actuator]}
				{@const drawGraph = formattedActuatorsRecord.length >= 5}
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
					<BoxItem>
						{@const graphData = formatRecordsForGraphs(formattedActuatorsRecord)}
						<Graph
							datasets={graphData.datasets}
							labels={graphData.labels}
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
		{/if}
	{/each}
{/await}
