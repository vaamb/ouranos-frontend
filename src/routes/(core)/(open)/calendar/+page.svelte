<script>
	import { onMount } from 'svelte';

	import Calendar from '$lib/components/Calendar.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';

	import { crudRequest, fetchCalendarEvents } from '$lib/actions.svelte.js';
	import { currentUser } from '$lib/store.svelte.js';

	const now = new Date();
	let month = $state(now.getMonth());
	let year = $state(now.getFullYear());
	let events = $state([]);

	onMount(() => {
		if ($currentUser.isAuthenticated) {
			fetchCalendarEvents(new Date(year, month, 1), new Date(year, month + 1, 1), null)
				.then((data) => {events = data});
		}
	})
</script>

<HeaderLine title="Calendar" />

<Calendar
    bind:month
    bind:year
    events={events}
    handleCrudEvent={
        (event, detail) => {
            if (event === 'create') {
                crudRequest('app/services/calendar', 'create', detail);
            } else if (event === 'update') {
                const eventID = detail['eventID'];
                delete detail['eventID'];
                crudRequest(`app/services/calendar/u/${eventID}`, 'update');
            } else if (event === 'delete') {
                const eventID = detail['eventID'];
                crudRequest(`app/services/calendar/u/${eventID}`, 'delete');
            }
        }
    }
/>
