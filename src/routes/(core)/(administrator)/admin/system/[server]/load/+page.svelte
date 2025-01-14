<script>
	import { page } from '$app/stores';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import Gauge from '$lib/components/Gauge.svelte';
	import Graph from '$lib/components/Graph.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Row from '$lib/components/layout/Row.svelte';

	import { fetchServerCurrentData, fetchServerHistoricData } from '$lib/actions.svelte.js';
	import {
		getStoreDataKey,
		servers,
		serversCurrentData,
		serversHistoricData
	} from '$lib/store.svelte.js';
	import { capitalize } from '$lib/utils/functions.js';
	import { graphs } from '$lib/utils/styling.js';

	let serverName = $derived($page.params.server);
	let serverInfo = $derived($servers[serverName]);

	const fetchServerData = async function (serverName) {
		await fetchServerCurrentData(serverName);
		await fetchServerHistoricData(serverName);
	};

	const dataKeys = ['CPU_used', 'CPU_temp', 'RAM_process', 'RAM_used', 'DISK_used'];

	const labels = graphs['server'].labels;
	const colors = graphs['server'].colors;
	const icons = graphs['server'].icons;
	const units = graphs['server'].units;

	const getMax = function (categoryKey) {
		if (categoryKey === 'DISK_used') {
			return serverInfo['DISK_total'];
		} else if (categoryKey === 'RAM_process' || categoryKey === 'RAM_used') {
			return serverInfo['RAM_total'];
		} else if (categoryKey === 'CPU_temp') {
			return 75;
		}
		return 100;
	};

	const formatHistoricData = function (historicData) {
		const rv = {
			labels: []
		};
		for (const key of dataKeys) {
			rv[key] = {
				label: labels[key],
				data: [],
				borderColor: colors[key]
			};
		}
		for (const row of historicData) {
			rv['labels'].push(row[0]);
			for (let i = 0; i < dataKeys.length; i++) {
				rv[dataKeys[i]]['data'].push(row[i + 1]);
			}
		}
		return rv;
	};
</script>

<HeaderLine title="Server load of {capitalize(serverName).replace('_', ' ')}" />

{#await fetchServerData(serverName) then serverData_notUsed}
	{@const currentData = $serversCurrentData[getStoreDataKey(serverName)]}
	{@const rawHistoricData = $serversHistoricData[getStoreDataKey(serverName)]}
	{@const formattedHistoricData = formatHistoricData(rawHistoricData)}
	{#each dataKeys as dataKey}
		{#if currentData[dataKey] !== null}
			<Row>
				<Box title={labels[dataKey]} direction="row" icon={icons[dataKey]}>
					{#if currentData}
						<BoxItem maxWidth="300px">
							<Gauge
								value={currentData[dataKey]}
								unit={units[dataKey]}
								minValue="0"
								maxValue={getMax(dataKey)}
							/>
						</BoxItem>
					{/if}
					<BoxItem>
						<Graph
							datasets={[formattedHistoricData[dataKey]]}
							labels={formattedHistoricData['labels']}
							suggestedMin="0"
							suggestedMax={getMax(dataKey)}
							height="200px"
						/>
					</BoxItem>
				</Box>
			</Row>
		{/if}
	{/each}
{/await}
