<script>
	import DataSheet from '$lib/components/DataSheet.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import SlideButton from '$lib/components/SlideButton.svelte';

	import { updateService } from '$lib/actions.svelte.js';
	import { fetchServices } from '$lib/queries.js';
	import { appState, servicesState } from '$lib/store.svelte.js';
	import { permissions } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	let updatedServices = $state([...servicesState.services]);

	const saveServices = function () {
		let anyUpdated = false;
		for (const serviceIndex in servicesState.services) {
			const service = servicesState.services[serviceIndex];
			const updatedService = updatedServices[serviceIndex];
			if (service['status'] !== updatedService['status']) {
				updateService(updatedService['name'], updatedService['status']).then(() => {
					anyUpdated = true;
				});
			}
		}
		if (anyUpdated) {
			fetchServices().then((data) => {
				servicesState.services = data;
				updatedServices = [...servicesState.services];
			});
		}
	};
</script>

<HeaderLine title="Service settings" />

{#snippet serviceToggle(row)}
	<SlideButton
		id={row['key']}
		bind:checked={updatedServices[row['index']]['status']}
		disabled={!appState.currentUser.can(permissions.ADMIN)}
	/>
{/snippet}
<DataSheet
	rows={updatedServices.map((service, index) => ({
		label: capitalize(service['name']),
		key: service['name'],
		index: index,
		labelId: `${service['name']}Button`,
		content: serviceToggle
	}))}
	actionLabel="Save services"
	onaction={saveServices}
/>
