<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { crudRequest } from '$lib/actions.js';
	import { warnings } from '$lib/store.js';

	// Crud-related variables and functions
	let closeModal;
	let crudDataIndex = null;

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
			{ label: 'Level', key: 'level' },
			{ label: 'Ecosystem', key: 'created_by' },
			{ label: 'Title', key: 'title' },
			{ label: 'Description', key: 'description' },
			{ label: 'Created on', key: 'created_on', isTime: true }
		]}
		data={$warnings}
		editable={true}
		crudOptions={['delete']}
		on:crud={(event) => {
			setCrudData(event['detail']['rowIndex']);
		}}
	/>
	<Modal
		bind:closeModal
		showModal={crudDataIndex !== null}
		title="Remove a warning"
		on:close={resetCrudData}
		confirmationButtons={true}
		on:confirm={() => {
			const warningID = $warnings[crudDataIndex]['id'];
			crudRequest(`gaia/warning/u/${warningID}/mark_as_solved`, 'create');
			closeModal();
		}}
	>
		Are you sure you want to remove the warning '{$warnings[crudDataIndex]
			? $warnings[crudDataIndex]['title']
			: ''}' created by the ecosystem '{$warnings[crudDataIndex]
			? $warnings[crudDataIndex]['created_by']
			: ''}'?
	</Modal>
{:else}
	No warnings
{/if}
