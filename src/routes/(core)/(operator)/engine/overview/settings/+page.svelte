<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Table from '$lib/components/Table.svelte';

	import { gaiaState } from '$lib/store.svelte.js';
	import { formatDateTime } from '$lib/utils/functions.js';

	let fullEngines = $derived.by(() => {
		return Object.values(gaiaState.engines).map((ecosystem) => ({
			...ecosystem,
			last_seen: gaiaState.enginesState[ecosystem['uid']]['last_seen'],
			connected: gaiaState.enginesState[ecosystem['uid']]['connected'],
		}));
	});
</script>

<HeaderLine title="Ecosystem engines overview" />

<Table
	tableID="linkedEnvironmentsTable"
	columns={[
		{ label: 'UID', key: 'uid' },
		{ label: 'SID', key: 'sid' },
		{ label: 'Connected', key: 'connected', isStatus: true },
		{ label: 'Last Seen', key: 'last_seen', serializer: formatDateTime },
		{ label: 'Link', key: 'uid', isLink: true, serializer: (value) => `/engine/${value}/settings` }
	]}
	data={fullEngines}
/>
