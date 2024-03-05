<script>
	import { page } from '$app/stores';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import Gauge from '$lib/components/Gauge.svelte';
	import Graph from '$lib/components/Graph.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';

	import {
		fetchSensorCurrentData,
		fetchSensorHistoricData,
		fetchEcosystemSensorsSkeleton
	} from '$lib/actions.js';
	import {
		ecosystemsIds,
		ecosystemsSensorsDataCurrent,
		ecosystemsSensorsDataHistoric,
		ecosystemsSensorsSkeleton
	} from '$lib/store.js';
	import {
		capitalize,
		getEcosystemUid,
		getStoreDataKey
	} from '$lib/utils/functions.js';
	import { graphs } from '$lib/utils/styling.js';

	const generateTitle = function (level, ecosystemName) {
		if (level === 'environment') {
			return 'Environmental sensors in ' + ecosystemName;
		} else if (level === 'plants') {
			return 'Plants sensors in ' + ecosystemName;
		}
	};

	$: sensorsLevel = $page.params.level;
	$: ecosystemName = $page.params.ecosystem;
	$: pageTitle = generateTitle(sensorsLevel, ecosystemName);
	$: icons = graphs[sensorsLevel].icons;
	$: colors = graphs[sensorsLevel].colors;
	$: minValues = graphs[sensorsLevel].min_values;
	$: maxValues = graphs[sensorsLevel].max_values;
	$: ecosystemUid = getEcosystemUid($ecosystemsIds, ecosystemName);

	const fetchSensorData = async function (sensorUid, measure) {
		const current = await fetchSensorCurrentData(sensorUid, measure);
		const historic = await fetchSensorHistoricData(sensorUid, measure);
		return {
			current: current,
			historic: historic
		};
	};

	const formatCurrentData = function (currentData) {
		return {
			value: currentData['value']
		};
	};

	const formatHistoricData = function (historicData, measureName) {
		const labels = [];
		const data = [];
		for (const row of historicData['values']) {
			labels.push(row[0]);
			data.push(row[1]);
		}
		return {
			dataset: {
				label: measureName,
				data: data,
				borderColor: colors[measureName]
			},
			labels: labels
		};
	};
</script>

<HeaderLine title={pageTitle} />
{#await fetchEcosystemSensorsSkeleton(ecosystemUid, sensorsLevel) then sensorsSkeleton}
	{#each $ecosystemsSensorsSkeleton[getStoreDataKey(ecosystemUid, sensorsLevel)] as sensorsBone}
		<h2>{capitalize(sensorsBone.measure.replace("_", " "))}</h2>
		{#each sensorsBone.sensors as sensor}
			<Row>
				{#await fetchSensorData(sensor.uid, sensorsBone.measure) then sensorData}
					<Box title={sensor.name} direction="row" icon={icons[sensorsBone.measure]}>
						{#await $ecosystemsSensorsDataCurrent[getStoreDataKey(sensor.uid, sensorsBone.measure)] then rawCurrentData}
							{#if rawCurrentData}
								<BoxItem maxWidth="300px">
									{#await formatCurrentData(rawCurrentData) then currentData}
										<Gauge
												value={currentData.value.toFixed(2)}
												unit={sensor.unit}
												minValue={minValues[sensorsBone.measure]}
												maxValue={maxValues[sensorsBone.measure]}
										/>
									{/await}
								</BoxItem>
							{/if}
						{/await}
						<BoxItem>
							{#await $ecosystemsSensorsDataHistoric[getStoreDataKey(sensor.uid, sensorsBone.measure)] then rawHistoricData}
								{#if rawHistoricData.values.length > 5}
									{#await formatHistoricData(rawHistoricData, sensorsBone.measure) then historicData}
										<Graph
											datasets={[historicData.dataset]}
											labels={historicData.labels}
											suggestedMin={minValues[sensorsBone.measure]}
											suggestedMax={maxValues[sensorsBone.measure]}
											height="200px"
										/>
									{/await}
								{:else}
									<p>There is not currently enough data points to draw a graph.</p>
									<p>Please come back later to see your graph.</p>
								{/if}
							{/await}
						</BoxItem>
					</Box>
				{/await}
			</Row>
		{/each}
	{/each}
{/await}
