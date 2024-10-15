<script>
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { currentUser, ecosystems, engines } from '$lib/store.js';
	import { permissions } from '$lib/utils/consts.js';
	import {
		getStatusClass,
		isEmpty,
		isTime,
		timeStringToDate
	} from '$lib/utils/functions.js';
	import { crudRequest } from '$lib/actions.js';

	const getEcosystemsArray = function (engineUID, ecosystemsStore) {
		if (!ecosystemsStore) {
			return [];
		}
		const array = Object.values(ecosystemsStore);
		return array.filter((ecosystem) => ecosystem['engine_uid'] === engineUID);
	};

	$: engineUID = $page['params']['engine'];
	$: engine = $engines[engineUID];
	$: ecosystemsArray = getEcosystemsArray(engineUID, $ecosystems);
	$: ecosystemArray = crudIndex !== undefined ? ecosystemsArray[crudIndex] : [];

	// Crud-related variables and functions
	let crudAction = undefined;
	let crudIndex = undefined;
	let crudEcosystemUID = '';
	let crudEcosystemName = '';

	const setCrudData = function (action, index, ecosystemUID, ecosystemName) {
		crudAction = action;
		crudIndex = index;
		crudEcosystemUID = ecosystemUID;
		crudEcosystemName = ecosystemName;
	};

	const resetCrudData = function () {
		crudAction = undefined;
		crudIndex = undefined;
		crudEcosystemUID = '';
		crudEcosystemName = '';
	};

	let closeModals = {};
</script>

<HeaderLine title="{engineUID} engine" />
<h2>Base info</h2>
<div style="overflow-x: auto">
	<table class="table-base table-alternate-colors table-narrow">
		<tbody>
			<tr>
				<td>UID</td>
				<td
					>{engineUID} &nbsp; <Fa
						icon={faCircle}
						class={getStatusClass(engine['connected'])}
					/></td
				>
			</tr>
			<tr>
				<td>SID</td>
				<td>{engine['sid']}</td>
			</tr>
			<tr>
				<td>Registration date</td>
				<td>{timeStringToDate(engine['registration_date'])}</td>
			</tr>
			<tr>
				<td>Last seen</td>
				<td>{timeStringToDate(engine['last_seen'])}</td>
			</tr>
		</tbody>
		<tbody>
			<tr>
				<td colspan="2" style="text-align: center; vertical-align: middle">
					<button
						class="text-button"
						on:click={() => {
							setCrudData('base_info', undefined, undefined, undefined);
						}}
					>
						Update {engineUID}' base info
					</button>
				</td>
			</tr>
		</tbody>
	</table>
</div>
<Modal
	bind:closeModal={closeModals['base_info']}
	showModal={crudAction === 'base_info'}
	title="Update {engineUID}' base info"
	on:close={resetCrudData}
>
	<Form
		data={[{ label: 'Uid', key: 'uid', value: engineUID }]}
		on:confirm={(event) => {
			const payload = event.detail;
			crudRequest(`gaia/engine/u/${engineUID}`, 'update', payload);
			closeModals['base_info']();
		}}
		on:cancel={closeModals['base_info']}
	/>
</Modal>

{#if $currentUser.can(permissions.OPERATE) || !isEmpty(engine['ecosystems'])}
	<h2>Linked ecosystems</h2>
	<Table
		tableID="linkedEnvironmentsTable"
		columns={[
			{ label: 'Name', key: 'name' },
			{ label: 'UID', key: 'uid' },
			{ label: 'Status', key: 'status', isStatus: true },
			{ label: 'Last Seen', key: 'last_seen', isTime: true }
		]}
		data={ecosystemsArray}
		editable={true}
		crudOptions={['create', 'delete']}
		on:crud={(event) => {
			const rowIndex = event['detail']['rowIndex'];
			setCrudData(
				event['detail']['action'],
				rowIndex,
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
		bind:closeModal={closeModals['create']}
		showModal={crudAction === 'create'}
		title="Create a new ecosystem"
		on:close={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Name', key: 'name' },
				{
					label: 'Day start',
					key: 'day_start',
					validate: isTime,
					hint: 'Time in the HH:MM format'
				},
				{
					label: 'Night start',
					key: 'night_start',
					validate: isTime,
					hint: 'Time in the HH:MM format'
				},
				{ label: 'Status', key: 'status', value: true, selectFrom: [true, false] }
			]}
			on:confirm={(event) => {
				const payload = event.detail;
				payload['engine_uid'] = engineUID;
				crudRequest(`gaia/ecosystem/u`, 'create', payload);
				closeModals['create']();
			}}
			on:cancel={closeModals['create']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['delete']}
		showModal={crudAction === 'delete'}
		title="Delete {crudEcosystemName}"
		on:close={resetCrudData}
		confirmationButtons={true}
		on:confirm={() => {
			crudRequest(`gaia/ecosystem/u/${crudEcosystemUID}`, 'delete');
			closeModals['delete']();
		}}
	>
		<p>
			Are you sure you want to delete the ecosystem {ecosystemArray['uid']} - {ecosystemArray[
				'name'
			]} ?
		</p>
	</Modal>
{:else}
	<p>No linked ecosystem found.</p>
{/if}
