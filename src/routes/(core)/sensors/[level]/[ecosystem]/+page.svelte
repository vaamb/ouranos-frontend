<script>
	import { onMount } from 'svelte';
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
		fetchEcosystemsSensorsSkeleton
	} from '$lib/actions.js';
	import { ecosystemsIds, ecosystemsSensorsSkeleton } from '$lib/store.js';
	import { capitalize, formatSensorsSkeleton, getEcosystemUid } from '$lib/utils/functions.js';
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
	$: sensorTree = formatSensorsSkeleton($ecosystemsSensorsSkeleton, ecosystemUid, sensorsLevel);

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
				borderColor: colors[measureName],
			},
			labels: labels
		};
	};

	onMount(async () => {
		await fetchEcosystemsSensorsSkeleton();
	});
</script>

<HeaderLine title={pageTitle} />
{#each sensorTree as measureInfo}
	<h2>{capitalize(measureInfo.measure)}</h2>
	{#each measureInfo.sensors as sensor}
		<Row>
			{#await fetchSensorData(sensor.uid, measureInfo.measure) then sensorData}
				<Box title={sensor.name} direction="row" icon={icons[measureInfo.measure]}>
					{#if sensorData.current}
						<BoxItem maxWidth="300px" align="center">
							{#await formatCurrentData(sensorData.current) then currentData}
								<Gauge value={currentData.value} unit={measureInfo.unit} />
							{/await}
						</BoxItem>
					{/if}
					<BoxItem align="center">
						{#if sensorData.historic.values.length > 5}
							{#await formatHistoricData(sensorData.historic, measureInfo.measure) then historicData}
								<Graph
									datasets={[historicData.dataset]}
									labels={historicData.labels}
									suggestedMax={maxValues[measureInfo.measure]}
									height="200px"
								/>
							{/await}
						{:else}
							<p>There is not currently enough data points to draw a graph.</p>
							<p>Please come back later to see your graph.</p>
						{/if}
					</BoxItem>
				</Box>
			{/await}
		</Row>
	{/each}
{/each}
