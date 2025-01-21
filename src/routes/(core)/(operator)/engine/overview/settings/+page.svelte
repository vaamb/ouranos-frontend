<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Table from '$lib/components/Table.svelte';

	import { engines } from '$lib/store.svelte.js';
	import { formatDateTime } from "$lib/utils/functions.js";
</script>

<HeaderLine title="Ecosystem engines overview" />

<Table
	tableID="linkedEnvironmentsTable"
	columns={[
		{ label: 'UID', key: 'uid' },
		{ label: 'SID', key: 'sid' },
		{ label: 'Connected', key: 'connected', isStatus: true },
		{ label: 'Last Seen', key: 'last_seen', serializer: formatDateTime }
	]}
	data={Object.values($engines)}
/>
