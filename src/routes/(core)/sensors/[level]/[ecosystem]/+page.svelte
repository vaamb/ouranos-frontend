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
		ecosystemsSensorsDataHistoric
	} from '$lib/store.js';
	import {
		capitalize,
		formatSensorsSkeleton,
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
{#await fetchEcosystemSensorsSkeleton(ecosystemUid, sensorsLevel) then rawSensorsSkeleton}
	{#each formatSensorsSkeleton(rawSensorsSkeleton, sensorsLevel) as measure}
		<h2>{capitalize(measure.name)}</h2>
		{#each measure.sensors as sensor}
			<Row>
				{#await fetchSensorData(sensor.uid, measure.name) then sensorData}
					<Box title={sensor.name} direction="row" icon={icons[measure.name]}>
						{#await $ecosystemsSensorsDataCurrent[getStoreDataKey(sensor.uid, measure.name)] then rawCurrentData}
							{#if rawCurrentData}
								<BoxItem maxWidth="300px">
									{#await formatCurrentData(rawCurrentData) then currentData}
										<Gauge value={currentData.value} unit={measure.unit} />
									{/await}
								</BoxItem>
							{/if}
						{/await}
						<BoxItem>
							{#await $ecosystemsSensorsDataHistoric[getStoreDataKey(sensor.uid, measure.name)] then rawHistoricData}
								{#if rawHistoricData.values.length > 5}
									{#await formatHistoricData(rawHistoricData, measure.name) then historicData}
										<Graph
											datasets={[historicData.dataset]}
											labels={historicData.labels}
											suggestedMax={maxValues[measure.name]}
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
