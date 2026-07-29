<script>
	import Calendar from '$lib/components/Calendar.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';
	import { fetchCalendarEvents } from '$lib/queries.js';
	import { appState } from '$lib/store.svelte.ts';
	import { useHeaderItems } from '$lib/components/header/header.svelte.ts';
	import { formatDate } from '$lib/utils/functions.js';

	const now = new Date();
	let month = $state(now.getMonth());
	let year = $state(now.getFullYear());
	let events = $state([]);

	const refreshEvents = function () {
		fetchCalendarEvents(new Date(year, month, 1), new Date(year, month + 1, 1)).then(
			(data) => {
				events = data;
			}
		);
	};

	$effect(() => {
		if (appState.currentUser.isAuthenticated) {
			refreshEvents()
		}
	});

	useHeaderItems(() => {
		const running = events.filter(
			(event) => event['start_time'] <= now && now <= event['end_time']
		).length;

		return [
			{
				id: 'month-events',
				label: 'This month',
				value: events.length,
				description: `${events.length} events this month`
			},
			{
				id: 'running-events',
				label: 'Running now',
				value: running,
				tone: running > 0 ? 'good' : 'default',
				description: `${running} events in effect right now`
			}
		];
	});
</script>

{#snippet today()}
	{formatDate(now)}
{/snippet}

<TitleBar title="Calendar" sideBloc={today} />

<Calendar
	bind:month
	bind:year
	{events}
	handleCrudEvent={(event, detail) => {
		if (event === 'create') {
			crudRequest('app/services/calendar/u', 'create', detail);
			refreshEvents()
		} else if (event === 'update') {
			const eventID = detail['eventID'];
			delete detail['eventID'];
			crudRequest(`app/services/calendar/u/${eventID}`, 'update', detail);
			refreshEvents()
		} else if (event === 'delete') {
			const eventID = detail['eventID'];
			crudRequest(`app/services/calendar/u/${eventID}`, 'delete');
			refreshEvents()
		}
	}}
/>
