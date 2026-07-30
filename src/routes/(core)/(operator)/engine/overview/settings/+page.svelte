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

	let connectedEngines = $derived(fullEngines.filter((engine) => engine['connected']).length);
</script>

<!-- `TitleBar` draws its own separator dot as soon as it is handed a snippet, so
     the snippet is withheld entirely rather than rendered empty. -->
{#snippet census()}
	{fullEngines.length}
	{fullEngines.length === 1 ? 'engine' : 'engines'}
	· {connectedEngines ? `${connectedEngines} connected` : 'none connected'}
{/snippet}

<TitleBar title="Ecosystem engines overview" sideBloc={fullEngines.length ? census : null} />

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
