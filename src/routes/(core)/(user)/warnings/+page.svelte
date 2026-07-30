<script>
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';
	import { gaiaState } from '$lib/store.svelte.ts';
	import { capitalize, formatDateTime } from "$lib/utils/functions.js";

	// Crud-related variables and functions
	let crudDataIndex = $state(null);

	const setCrudData = function (rowIndex) {
		crudDataIndex = rowIndex !== undefined ? rowIndex : null;
	};

	const resetCrudData = function () {
		crudDataIndex = null;
	};
</script>

<!-- `TitleBar` draws its own separator dot as soon as it is handed a snippet, so
     the snippet is withheld entirely rather than rendered empty. -->
{#snippet active()}
	{gaiaState.warnings.length} active
{/snippet}

<TitleBar title="Ecosystem warnings" sideBloc={gaiaState.warnings.length ? active : null} />

{#if gaiaState.warnings.length > 0}
	<Table
		tableID="warnings"
		columns={[
			{ label: 'Level', key: 'level', isLevel: true, serializer: (value) => capitalize(value) },
			{ label: 'Ecosystem', key: 'created_by' },
			{ label: 'Title', key: 'title' },
			{ label: 'Description', key: 'description' },
			{ label: 'Created on', key: 'created_on', serializer: formatDateTime }
		]}
		data={gaiaState.warnings}
		editable={true}
		crudOptions={['delete']}
		emptyText="No active warnings."
		oncrud={(payload) => {
			setCrudData(payload['rowIndex']);
		}}
	/>
	<Modal
		showModal={crudDataIndex !== null}
		onclose={resetCrudData}
	>
		{#snippet title()}{"Remove a warning"}{/snippet}
		{#snippet children(closeModal)}
			Are you sure you want to remove the warning '{gaiaState.warnings[crudDataIndex]
				? gaiaState.warnings[crudDataIndex]['title']
				: ''}' created by the ecosystem '{gaiaState.warnings[crudDataIndex]
				? gaiaState.warnings[crudDataIndex]['created_by']
				: ''}'?
			<ConfirmButtons
				onconfirm={() => {
					const warningID = gaiaState.warnings[crudDataIndex]['id'];
					crudRequest(`gaia/warning/u/${warningID}/mark_as_solved`, 'create');
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{:else}
	No warnings
{/if}
