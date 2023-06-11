<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Table from '$lib/components/Table.svelte';

	import { engines, enginesIds } from '$lib/store.js';
	import { isEmpty } from '$lib/utils/functions.js';
</script>

<HeaderLine title="Ecosystem engines overview" />

{#each $enginesIds as { uid, sid }}
	<h2>Engine {uid}</h2>
	<h3>Overview</h3>
	<Table
		tableID="linkedEnvironmentsTable"
		columns={[
			{ label: 'UID', key: 'uid' },
			{ label: 'SID', key: 'sid' },
			{ label: 'Connected', key: 'connected', isStatus: true },
			{ label: 'Last Seen', key: 'last_seen', isTime: true }
		]}
		data={[$engines[uid]]}
	/>
	{#if !isEmpty($engines[uid]['ecosystems'])}
		<h3>Linked ecosystems</h3>
		<Table
			tableID="linkedEnvironmentsTable"
			columns={[
				{ label: 'Name', key: 'name' },
				{ label: 'UID', key: 'uid' },
				{ label: 'Status', key: 'status', isStatus: true },
				{ label: 'Last Seen', key: 'last_seen', isTime: true }
			]}
			data={$engines[uid]['ecosystems']}
		/>
	{/if}
{/each}
