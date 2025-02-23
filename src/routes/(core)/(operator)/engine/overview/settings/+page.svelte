<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Table from '$lib/components/Table.svelte';

	import { engines, enginesState } from '$lib/store.svelte.js';
	import { formatDateTime } from '$lib/utils/functions.js';

	let fullEngines = $derived.by(() => {
		let enginesCopy = structuredClone($engines)
		enginesCopy = Object.values(enginesCopy)
		enginesCopy.forEach((engine) => {
			engine['last_seen'] = $enginesState[engine['uid']]['last_seen'];
			engine['connected'] = $enginesState[engine['uid']]['connected']
		})
		return enginesCopy
	})
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
