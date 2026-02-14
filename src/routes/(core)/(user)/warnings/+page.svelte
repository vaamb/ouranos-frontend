<script>
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';
	import { warnings } from '$lib/store.svelte.js';
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

<HeaderLine title="Ecosystem warnings" />

{#if $warnings.length > 0}
	<Table
		tableID="warnings"
		columns={[
			{ label: 'Level', key: 'level', serializer: (value) => capitalize(value) },
			{ label: 'Ecosystem', key: 'created_by' },
			{ label: 'Title', key: 'title' },
			{ label: 'Description', key: 'description' },
			{ label: 'Created on', key: 'created_on', serializer: formatDateTime }
		]}
		data={$warnings}
		editable={true}
		crudOptions={['delete']}
		oncrud={(payload) => {
			setCrudData(payload['rowIndex']);
		}}
	/>
	<Modal
		showModal={crudDataIndex !== null}
		title="Remove a warning"
		onclose={resetCrudData}
	>
		{#snippet children(closeModal)}
			Are you sure you want to remove the warning '{$warnings[crudDataIndex]
				? $warnings[crudDataIndex]['title']
				: ''}' created by the ecosystem '{$warnings[crudDataIndex]
				? $warnings[crudDataIndex]['created_by']
				: ''}'?
			<ConfirmButtons
				onconfirm={() => {
					const warningID = $warnings[crudDataIndex]['id'];
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
