<script>
	import Table from '$lib/components/Table.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { gaiaState } from '$lib/store.svelte.js';
	import { formatDateTime } from '$lib/utils/functions.js';

	let fullEngines = $derived.by(() => {
		return Object.values(gaiaState.engines).map((engine) => ({
			...engine,
			last_seen: gaiaState.enginesState[engine['uid']]['last_seen'],
			connected: gaiaState.enginesState[engine['uid']]['connected'],
		}));
	});
</script>

<TitleBar title="Ecosystem engines overview" />

<Table
	tableID="linkedEnvironmentsTable"
	columns={[
		{ label: 'UID', key: 'uid' },
		{ label: 'SID', key: 'sid' },
		{
			label: 'Connected',
			key: 'connected',
			isStatus: true,
			statusLabels: ['Connected', 'Disconnected']
		},
		{ label: 'Last Seen', key: 'last_seen', serializer: formatDateTime },
		{ label: 'Link', key: 'uid', isLink: true, serializer: (value) => `/engine/${value}/settings` }
	]}
	data={fullEngines}
/>
