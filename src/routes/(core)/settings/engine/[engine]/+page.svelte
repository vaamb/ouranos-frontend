<script>
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { engines } from '$lib/store.js';
	import { getStatusClass, isEmpty, timeStringToDate } from '$lib/utils/functions.js';
	import { crudRequest } from '$lib/actions.js';

	$: engineUID = $page['params']['engine'];
	$: engine = $engines[engineUID];

	// Crud-related variables and functions
	let crudAction = undefined;
	let crudEcosystemUID = '';
	let crudEcosystemName = '';

	const setCrudData = function (action, ecosystemUID, ecosystemName) {
		crudAction = action;
		crudEcosystemUID = ecosystemUID;
		crudEcosystemName = ecosystemName;
	};

	const resetCrudData = function () {
		crudAction = undefined;
		crudEcosystemUID = '';
		crudEcosystemName = '';
	};
</script>

<HeaderLine title="{engineUID} engine" />

<h2>Base info</h2>
<table>
	<tbody>
		<tr>
			<td>Connected</td>
			<td>&nbsp; &nbsp;</td>
			<td><Fa icon={faCircle} class={getStatusClass(engine['connected'])} /></td>
		</tr>
		<tr>
			<td>SID</td>
			<td>&nbsp; &nbsp;</td>
			<td>{engine['sid']}</td>
		</tr>
		<tr>
			<td>Registration date</td>
			<td>&nbsp; &nbsp;</td>
			<td>{timeStringToDate(engine['registration_date'])}</td>
		</tr>
		<tr>
			<td>Last seen</td>
			<td>&nbsp; &nbsp;</td>
			<td>{timeStringToDate(engine['last_seen'])}</td>
		</tr>
	</tbody>
</table>

{#if !isEmpty(engine['ecosystems'])}
	<h2>Linked ecosystems</h2>
	<Table
		tableID="linkedEnvironmentsTable"
		columns={[
			{ label: 'Name', key: 'name' },
			{ label: 'UID', key: 'uid' },
			{ label: 'Status', key: 'status', isStatus: true },
			{ label: 'Last Seen', key: 'last_seen', isTime: true }
		]}
		data={engine['ecosystems']}
		editable={true}
		crudOptions={['delete']}
		on:crud={(event) => {
			const rowIndex = event['detail']['rowIndex'];
			setCrudData(
				event['detail']['action'],
				event['detail']['rowIndex'] !== undefined
					? engine['ecosystems'][rowIndex]['uid']
					: undefined,
				event['detail']['rowIndex'] !== undefined
					? engine['ecosystems'][rowIndex]['name']
					: undefined
			);
		}}
	/>

	<Modal
		showModal={crudAction}
		title="Delete {crudEcosystemName}"
		on:close={resetCrudData}
		confirmationButtons={true}
		on:confirm={() => {
			crudRequest(`gaia/ecosystem/u/${crudEcosystemUID}`, 'delete');
			resetCrudData();
		}}
	>
		<p>Are you sure you want to delete the ecosystem {crudEcosystemName} ?</p>
	</Modal>
{:else}
	<p>No linked ecosystem found.</p>
{/if}
