<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import SlideButton from '$lib/components/SlideButton.svelte';

	import { fetchServices, updateService } from '$lib/actions.svelte.js';
	import { currentUser, services } from '$lib/store.svelte.js';
	import { permissions } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	let updatedServices = $state([...$services]);
</script>

<HeaderLine title="Service settings" />

<div style="overflow-x: auto">
	<table class="table-base table-alternate-colors table-narrow">
		<tbody>
			{#each updatedServices as service}
				<tr>
					<td>
						{capitalize(service['name'])}
					</td>
					<td>
						<SlideButton
							bind:checked={service['status']}
							disabled={!$currentUser.can(permissions.ADMIN)}
						/>
					</td>
				</tr>
			{/each}
		</tbody>
		{#if $currentUser.can(permissions.OPERATE)}
			<tbody>
				<tr>
					<td colspan="2" style="text-align: center; vertical-align: middle">
						<button
							class="text-button"
							onclick={() => {
								let anyUpdated = false;
								for (const serviceIndex in $services) {
									const service = $services[serviceIndex];
									const updatedService = updatedServices[serviceIndex];
									if (service['status'] !== updatedService['status']) {
										updateService(updatedService['name'], updatedService['status']).then(() => {
											anyUpdated = true;
										});
									}
								}
								if (anyUpdated) {
									fetchServices(false).then((data) => {
										$services = data;
										updatedServices = [...$services];
									});
								}
							}}
						>
							Update services
						</button>
					</td>
				</tr>
			</tbody>
		{/if}
	</table>
</div>
