<script>
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { ecosystems, ecosystemsState, engines, enginesState } from '$lib/store.svelte.js';
	import { formatDateTime, getStatusClass, isEmpty, slugify } from '$lib/utils/functions.js';
	import { crudRequest } from '$lib/actions.svelte.js';

	let engineUID = $derived($page['params']['engine']);
	let engine = $derived($engines[engineUID]);
	let engineState = $derived($enginesState[engineUID]);
	let fullEcosystems = $derived.by(() => {
		let ecosystemsCopy = structuredClone($ecosystems);
		ecosystemsCopy = Object.values(ecosystemsCopy);
		ecosystemsCopy.forEach((ecosystem) => {
			ecosystem['last_seen'] = $ecosystemsState[ecosystem['uid']]['last_seen'];
			ecosystem['status'] = $ecosystemsState[ecosystem['uid']]['status'];
		});
		return ecosystemsCopy;
	});

	let modals = $state({});

	// Crud-related variables and functions
	let crudAction = $state(undefined);
	let crudIndex = $state(undefined);
	let crudEcosystemUID = $state('');
	let crudEcosystemName = $state('');

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

	let ecosystemArray = $derived(crudIndex !== undefined ? fullEcosystems[crudIndex] : []);
</script>

<HeaderLine title="{engineUID} engine" />
<h2>Base info</h2>
<div style="overflow-x: auto">
	<table class="table-base table-alternate-colors table-narrow">
		<tbody>
			<tr>
				<td>UID</td>
				<td>
					{engineUID} &nbsp;
					<Fa icon={faCircle} class={getStatusClass(engineState['connected'])} />
				</td>
			</tr>
			<tr>
				<td>SID</td>
				<td>{engine['sid']}</td>
			</tr>
			<tr>
				<td>Registration date</td>
				<td>{formatDateTime(engine['registration_date'])}</td>
			</tr>
			<tr>
				<td>Last seen</td>
				<td>{formatDateTime(engineState['last_seen'])}</td>
			</tr>
		</tbody>
		<tbody>
			<tr>
				<td colspan="2" style="text-align: center; vertical-align: middle">
					<button
						class="text-button"
						onclick={() => {
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
	bind:this={modals['base_info']}
	showModal={crudAction === 'base_info'}
	title="Update {engineUID}' base info"
	on:close={resetCrudData}
>
	<Form
		data={[{ label: 'Uid', key: 'uid', value: engineUID }]}
		on:confirm={(event) => {
			const payload = event.detail;
			crudRequest(`gaia/engine/u/${engineUID}`, 'update', payload);
			modals['base_info'].closeModal();
		}}
		on:cancel={() => modals['base_info'].closeModal()}
	/>
</Modal>

{#if !isEmpty(engine['ecosystems'])}
	<h2>Linked ecosystems</h2>
	<Table
		tableID="linkedEnvironmentsTable"
		columns={[
			{ label: 'Name', key: 'name' },
			{ label: 'UID', key: 'uid' },
			{ label: 'Status', key: 'status', isStatus: true },
			{ label: 'Last Seen', key: 'last_seen', serializer: formatDateTime },
			{
				label: 'Link',
				key: 'name',
				isLink: true,
				serializer: (value) => `/ecosystem/${slugify(value)}/settings`
			}
		]}
		data={fullEcosystems}
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
		bind:this={modals['create']}
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
					type: 'time',
					hint: 'Time in the HH:MM format'
				},
				{
					label: 'Night start',
					key: 'night_start',
					type: 'time',
					hint: 'Time in the HH:MM format'
				},
				{ label: 'Status', key: 'status', value: true, selectFrom: [true, false] }
			]}
			on:confirm={(event) => {
				const payload = event.detail;
				payload['engine_uid'] = engineUID;
				crudRequest(`gaia/ecosystem/u`, 'create', payload);
				modals['create'].closeModal();
			}}
			on:cancel={() => modals['create'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['delete']}
		showModal={crudAction === 'delete'}
		title="Delete {crudEcosystemName}"
		on:close={resetCrudData}
		confirmationButtons={true}
		on:confirm={() => {
			crudRequest(`gaia/ecosystem/u/${crudEcosystemUID}`, 'delete');
			modals['delete'].closeModal();
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
