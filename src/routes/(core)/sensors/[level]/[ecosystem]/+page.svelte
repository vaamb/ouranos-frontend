<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import axios from 'axios';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import Gauge from '$lib/components/Gauge.svelte';
	import Graph from '$lib/components/Graph.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';

	import { fetchEcosystemsSensorsSkeleton } from '$lib/actions.js';
	import {
		ecosystemsIds,
		ecosystemsSensorsDataCurrent,
		ecosystemsSensorsDataHistoric,
		ecosystemsSensorsSkeleton
	} from '$lib/store.js';
	import { capitalize, getEcosystemUid, isEmpty } from '$lib/utils/functions.js';
	import { graphs } from '$lib/utils/styling.js';
	import { API_URL } from '$lib/utils/consts.js';

	const generateTitle = function (level, ecosystemName) {
		if (level === 'environment') {
			return 'Environmental sensors in ' + ecosystemName;
		} else if (level === 'plants') {
			return 'Plants sensors in ' + ecosystemName;
		}
	};

	const updateEcosystemSensorsSkeleton = async function () {
		if (isEmpty($ecosystemsSensorsSkeleton)) {
			const { ecosystemsSensorsSkeleton: ecosystemsSensorsSkeletonValues } =
				await fetchEcosystemsSensorsSkeleton();
			ecosystemsSensorsSkeleton.set(ecosystemsSensorsSkeletonValues);
		}
	};

	const computeSensorsTree = function (ecosystemsSensorsSkeleton, ecosystemUid, sensorsLevel) {
		const order = graphs[sensorsLevel].order;
		if (ecosystemsSensorsSkeleton && ecosystemsSensorsSkeleton[ecosystemUid]) {
			let sensorsSkeletonArray = ecosystemsSensorsSkeleton[ecosystemUid]['sensors_skeleton'];
			if (!isEmpty(sensorsSkeletonArray)) {
				const accumulator = [];
				for (const measure of sensorsSkeletonArray) {
					if (order.includes(measure.measure) && !isEmpty(measure.sensors)) {
						// Order sensors by their name
						measure.sensors = measure.sensors.sort((a, b) => {
							return a.name > b.name;
						});
						// Order measures by or custom order in styling.js
						const index = order.indexOf(measure.measure);
						accumulator[index] = measure;
					}
				}
				return accumulator;
			}
		}
		return [];
	};

	$: sensorsLevel = $page.params.level;
	$: ecosystemName = $page.params.ecosystem;
	$: ecosystemUid = getEcosystemUid($ecosystemsIds, ecosystemName);
	$: pageTitle = generateTitle(sensorsLevel, ecosystemName);
	$: icons = graphs[sensorsLevel].icons;
	$: colors = graphs[sensorsLevel].colors;
	$: maxValues = graphs[sensorsLevel].max_values;
	$: sensorTree = computeSensorsTree($ecosystemsSensorsSkeleton, ecosystemUid, sensorsLevel);

	const getStorageKey = function (sensorUid, measure) {
		return ecosystemUid + '_' + sensorUid + '_' + measure;
	};

	const checkRecency = function (sensorData, timeFrame) {
		return true; // TODO: make some ckecks here
	};

	const getStoredSensorData = function (sensorUid, measure, timeFrame) {
		const storageKey = getStorageKey(sensorUid, measure);
		let data = undefined;
		if (timeFrame === 'current') {
			data = $ecosystemsSensorsDataCurrent[storageKey];
		} else if (timeFrame === 'historic') {
			data = $ecosystemsSensorsDataHistoric[storageKey];
		}
		if (checkRecency(data, timeFrame)) {
			return data;
		} else {
			return undefined;
		}
	};

	const storeSensorData = function (data, sensorUid, measure, timeFrame) {
		const storageKey = getStorageKey(sensorUid, measure);
		if (timeFrame === 'current') {
			const storedData = $ecosystemsSensorsDataCurrent;
			ecosystemsSensorsDataCurrent.set({ ...storedData, ...{ [storageKey]: data } });
		} else if (timeFrame === 'historic') {
			const storedData = $ecosystemsSensorsDataHistoric;
			ecosystemsSensorsDataHistoric.set({ ...storedData, ...{ [storageKey]: data } });
		}
	};

	const fetchCurrentSensorData = function (sensorUid, measure) {
		const storedData = getStoredSensorData(sensorUid, measure, 'current');
		if (storedData !== undefined) {
			return storedData;
		}
		return axios
			.get(`${API_URL}/gaia/sensor/u/${sensorUid}/data/current`, {
				params: { measures: measure }
			})
			.then((response) => {
				if (response.status === 200) {
					const data = {
						unit: response.data[0].unit,
						values: response.data[0].values[0]
					};
					storeSensorData(data, sensorUid, measure, 'current');
					return data;
				}
			})
			.catch(() => {
				storeSensorData({}, sensorUid, measure, 'current');
				return {};
			});
	};

	const fetchHistoricSensorData = function (sensorUid, measure) {
		const storedData = getStoredSensorData(sensorUid, measure, 'historic');
		if (storedData !== undefined) {
			return storedData;
		}
		return axios
			.get(`${API_URL}/gaia/sensor/u/${sensorUid}/data/historic`, {
				params: { measures: measure }
			})
			.then((response) => {
				if (response.status === 200) {
					const data = {
						unit: response.data[0].unit,
						span: response.data[0].span,
						values: response.data[0].values
					};
					storeSensorData(data, sensorUid, measure, 'historic');
					return data;
				}
			})
			.catch(() => {
				storeSensorData({}, sensorUid, measure, 'historic');
				return {};
			});
	};

	const fetchSensorData = async function (sensorUid, measure) {
		const current = await fetchCurrentSensorData(sensorUid, measure);
		const historic = await fetchHistoricSensorData(sensorUid, measure);
		return {
			current: current,
			historic: historic
		};
	};

	const formatCurrentData = function (currentData) {
		return {
			unit: currentData['unit'],
			value: currentData['values'][1]
		};
	};

	const formatHistoricData = function (historicData, measureName) {
		const labels = [];
		const data = [];
		for (const row of historicData.values) {
			labels.push(row[0]);
			data.push(row[1]);
		}
		return {
			dataset: {
				label: measureName,
				data: data
			},
			labels: labels
		};
	};

	onMount(async () => {
		await updateEcosystemSensorsSkeleton();
	});
</script>

<HeaderLine title={pageTitle} />
{#each sensorTree as measureRecords}
	<h2>{capitalize(measureRecords.measure)}</h2>
	{#each measureRecords.sensors as sensor}
		<Row>
			{#await fetchSensorData(sensor.uid, measureRecords.measure) then sensorData}
				<Box title={sensor.name} direction="row" icon={icons[measureRecords.measure]}>
					<BoxItem maxWidth="300px" align="center">
						{#await formatCurrentData(sensorData.current) then currentData}
							<Gauge value={currentData.value} unit={currentData.unit} />
						{/await}
					</BoxItem>
					<BoxItem align="center">
						{#await formatHistoricData(sensorData.historic, measureRecords.measure) then historicData}
							<Graph
								datasets={[historicData.dataset]}
								labels={historicData.labels}
								suggestedMax={maxValues[measureRecords.measure]}
								height="200px"
							/>
						{/await}
					</BoxItem>
				</Box>
			{/await}
		</Row>
	{/each}
{/each}
