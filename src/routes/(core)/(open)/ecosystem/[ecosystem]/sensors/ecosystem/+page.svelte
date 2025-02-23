<script>
	import Fa from 'svelte-fa';
	import { faArrowRight, faKitMedical } from '@fortawesome/free-solid-svg-icons';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import Graph from '$lib/components/Graph.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Image from '$lib/components/Image.svelte';
	import Row from '$lib/components/layout/Row.svelte';

	import {
		fetchEcosystemSensorsSkeleton,
		fetchSensorHistoricData,
		probePath
	} from '$lib/actions.svelte.js';
	import {
		ecosystemsSensorsDataHistoric,
		ecosystemsSensorsSkeleton,
		getStoreDataKey
	} from '$lib/store.svelte.js';
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';
	import { colors } from '$lib/utils/styling.js';

	let { data } = $props();

	let ecosystemName = data['ecosystemName'];
	let ecosystemUID = data['ecosystemUID'];

	let images = $state({});

	const formatHistoricData = function (data, measureName) {
		const records = data['values'];
		// Pre-populate data with a first bound (so they all start at the same time)
		const labels = [new Date(data['span'][0])];
		const values = [null];
		// Fill datasets from record data
		for (const record of records) {
			labels.push(record[0]);
			values.push(record[1]);
		}
		// Post populate data with a last bound (so they all end at the same time)
		labels.push(new Date(data['span'][1]));
		values.push(null);

		return {
			datasets: [
				{
					label: measureName,
					data: values,
					borderColor: colors.green,
					backgroundColor: colors.green + '10', // Add alpha
					fill: true
				}
			],
			labels: labels
		};
	};

	const computeTrendAngle = function (data) {
		const records = data['values'];
		const beginning = records.slice(0, 5);
		const end = records.slice(-5);
		const beginningAverage = beginning.reduce((a, b) => a + b[1], 0) / beginning.length;
		const endAverage = end.reduce((a, b) => a + b[1], 0) / end.length;
		const beginningStd = Math.sqrt(
			beginning.reduce((a, b) => a + (b[1] - beginningAverage) ** 2, 0) / beginning.length
		);
		const endStd = Math.sqrt(end.reduce((a, b) => a + (b[1] - endAverage) ** 2, 0) / end.length);
		if (endAverage - endStd > beginningAverage + beginningStd) {
			return -35;
		} else if (endAverage + endStd < beginningAverage - beginningStd) {
			return 35;
		} else if (endAverage > beginningAverage + beginningStd) {
			return -15;
		} else if (endAverage < beginningAverage - beginningStd) {
			return 15;
		} else {
			return 0;
		}
	};
</script>

<HeaderLine title={ecosystemName + ' ecosystem health'} />

{#await fetchEcosystemSensorsSkeleton(ecosystemUID, 'ecosystem') then sensorsSkeleton}
	{#each $ecosystemsSensorsSkeleton[getStoreDataKey(ecosystemUID, 'ecosystem')] as sensorsBone}
		<h2>{capitalize(sensorsBone['measure']).replace('_', ' ')}</h2>
		{#each sensorsBone['sensors'] as sensor}
			<Row>
				{#await fetchSensorHistoricData(ecosystemUID, sensor['uid'], sensorsBone['measure'], 31) then sensorData_notUsed}
					{@const historicSensorsData =
						$ecosystemsSensorsDataHistoric[getStoreDataKey(sensor['uid'], sensorsBone['measure'])]}
					{#if historicSensorsData}
						{@const imagePath = `${STATIC_URL}/ecosystem_health/${ecosystemUID}/${sensor['uid']}/${sensorsBone['measure']}.jpeg?${new Date().getTime()}`}
						<Box title={sensor['name']} direction="row" icon={faKitMedical}>
							{#await probePath(imagePath) then validPath}
								{#if validPath}
									<BoxItem maxWidth="225px">
										<Image
											bind:this={images[getStoreDataKey(sensor['uid'], sensorsBone['measure'])]}
											source={imagePath}
											width="200"
											height="200"
										/>
									</BoxItem>
								{/if}
							{/await}
							<BoxItem>
								{#if historicSensorsData && historicSensorsData['values'].length >= 2}
									{@const formattedHistoricSensorsData = formatHistoricData(
										historicSensorsData,
										sensorsBone['measure']
									)}
									<Graph
										datasets={formattedHistoricSensorsData['datasets']}
										labels={formattedHistoricSensorsData['labels']}
										height="200px"
										suggestedMax="1"
									/>
								{:else}
									<div style="margin: auto">
										<p style="margin-bottom: 0">
											There is not currently enough data points to draw a graph.
										</p>
										<p style="margin-bottom: 0">Please come back later to see your graph.</p>
									</div>
								{/if}
							</BoxItem>
							<BoxItem title="Trend" minWidth="150px" maxWidth="150px">
								<div style="margin: auto">
									<Fa
										icon={faArrowRight}
										rotate={computeTrendAngle(historicSensorsData)}
										style="height: 85px"
									/>
								</div>
							</BoxItem>
						</Box>
					{/if}
				{/await}
			</Row>
		{/each}
	{/each}
{/await}
