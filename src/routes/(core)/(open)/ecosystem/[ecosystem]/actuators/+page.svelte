<script>
	import { onDestroy, onMount } from 'svelte';

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

	import { socketio } from '$lib/socketio.svelte.js';
	import { actuatorTypes } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';
	import { colors } from '$lib/utils/styling.js';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	let endPoint = $state(Date.now());
	let startPoint = $derived(new Date(endPoint - 1000 * 60 * 60 * 24 * 7));

	let actuatorsRecords = $state({});
	let formatActuatorsRecords = function (actuatorRecords, actuatorState, startPoint, endPoint) {
		let formattedRecords = [];
		if (actuatorRecords['values'].length === 0) {
			// If there are no records, add start and end points only
			formattedRecords.push(
				[startPoint, actuatorState[1], actuatorState[2], actuatorState[3], actuatorState[4]],
				[endPoint, actuatorState[1], actuatorState[2], actuatorState[3], actuatorState[4]]
			);
		} else {
			// If there are records, first add start point ...
			let previousRecord = actuatorRecords['values'][0];
			formattedRecords.push([
				new Date(startPoint),
				previousRecord[1],
				previousRecord[2],
				previousRecord[3],
				previousRecord[4]
			]);
			// ... then, we need to create "pre" data points and fill them with data from the
			// previous record and a date a few microseconds before the current record ...
			for (const record of actuatorRecords['values']) {
				const recordDate = new Date(record[0]);
				const previousRecordDate = new Date(recordDate - 10);
				formattedRecords.push(
					[
						previousRecordDate,
						previousRecord[1],
						previousRecord[2],
						previousRecord[3],
						previousRecord[4]
					],
					[recordDate, record[1], record[2], record[3], record[4]]
				);
				previousRecord = record;
			}
			// ... and finally, add end point
			formattedRecords.push([
				new Date(endPoint),
				previousRecord[1],
				previousRecord[2],
				previousRecord[3],
				previousRecord[4]
			]);
		}
		return formattedRecords;
	};

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

	const updateActuatorsData = function (actuatorsData) {
		for (const actuatorData of actuatorsData) {
			if (actuatorData['ecosystem_uid'] !== ecosystemUID) {
				continue;
			}
			endPoint = Date.now();
			actuatorsRecords[actuatorData['type']]['values'].push([
				new Date(endPoint - 100).toISOString(),
				actuatorData['active'],
				actuatorData['mode'],
				actuatorData['status'],
				actuatorData['level']
			]);
		}
	};

	let timeUpdate = null;
	const updateTime = function () {
		endPoint = Date.now();
	};

	onMount(async () => {
		for (const actuatorType of actuatorTypes) {
			actuatorsRecords[actuatorType] = await fetchEcosystemActuatorRecords(
				ecosystemUID,
				actuatorType
			);
		}
		socketio.on('actuators_data', updateActuatorsData);
		timeUpdate = setInterval(updateTime, 1000 * 60 * 5);
	});

	onDestroy(async () => {
		socketio.off('actuators_data', updateActuatorsData);
		clearInterval(timeUpdate);
	});
</script>

<HeaderLine title="Actuators in {ecosystemName}" />

{#await fetchEcosystemActuatorsState(ecosystemUID) then actuatorsState_notUsed}
	{#each Object.entries(actuatorsRecords) as [actuator, actuatorRecords]}
		{@const actuatorState = $ecosystemsActuatorsState[ecosystemUID][actuator]}
		{#if actuatorState['active'] || hasBeenActive(actuatorRecords)}
			{@const drawGraph = actuatorRecords['values'].length >= 3}
			<Box title={capitalize(actuator)} direction="row" maxWidth={drawGraph ? null : '325px'}>
				{#if $ecosystemsActuatorsState[ecosystemUID][actuator]['active']}
					<BoxItem maxWidth={drawGraph ? '305px' : null}>
						<Switch
							actuatorType={actuator}
							status={$ecosystemsActuatorsState[ecosystemUID][actuator]['status']}
							mode={$ecosystemsActuatorsState[ecosystemUID][actuator]['mode']}
							useTimer={true}
							onswitch={(switchInfo) => {
								updateActuatorMode(
									ecosystemUID,
									switchInfo['actuatorType'],
									switchInfo['mode'],
									switchInfo['countdown']
								);
							}}
						/>
					</BoxItem>
				{/if}
				<BoxItem>
					{@const formattedActuatorRecords = formatActuatorsRecords(
						actuatorRecords,
						actuatorState,
						startPoint,
						endPoint
					)}
					{@const graphData = formatRecordsForGraphs(formattedActuatorRecords)}
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
	{/each}
{/await}
