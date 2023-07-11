<script>
	import { page } from '$app/stores';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SlideButton from '$lib/components/SlideButton.svelte';
	import Table from '$lib/components/Table.svelte';

	import { ecosystemsIds, ecosystemsManagement } from '$lib/store.js';
	import { capitalize, getEcosystemUid, getParamStatus, isNumber } from '$lib/utils/functions.js';
	import { climateParameters, hardwareLevel, hardwareType } from '$lib/utils/consts.js';
	import {
		fetchEcosystemEnvironmentParameters,
		fetchEcosystemHardware,
		crudRequest
	} from '$lib/actions.js';

	const managementChoices = [
		'sensors',
		'light',
		'climate',
		'watering',
		'health',
		'alarms',
		'webcam',
		'database'
	];

	$: ecosystemName = $page['params']['ecosystem'];
	$: ecosystemUID = getEcosystemUid($ecosystemsIds, ecosystemName);

	let crudAction = undefined;
	let crudTable = undefined;
	let crudTablePrimaryKey = undefined;
	let crudDataIndex = 0;

	const setCrudInfo = function (parameter, action, target, rowIndex) {
		crudAction = action;
		crudTable = parameter;
		crudTablePrimaryKey = target;
		crudDataIndex = rowIndex;
	};

	const resetModal = function () {
		crudAction = undefined;
		crudTable = undefined;
		crudTablePrimaryKey = undefined;
		crudDataIndex = 0;
	};

	const createTitle = function (parameter) {
		if (crudAction === 'create') {
			return 'Add a new ' + parameter.replace('_', ' ');
		} else {
			return capitalize(crudAction) + ' ' + crudTablePrimaryKey;
		}
	};

	$: modalTitle = createTitle(crudTable);

	const getValue = function (data, key) {
		return data[crudDataIndex][key];
	};

	const updateManagement = function () {
		const payload = {};
		for (const management of managementChoices) {
			payload[management] = getParamStatus($ecosystemsManagement, ecosystemUID, management);
		}
		const route = `gaia/ecosystem/u/${ecosystemUID}/management`;
		crudRequest(route, 'update', payload);
	};

	const sendRequest = function (action, table, payload) {
		let route;
		if (table === 'climate_parameter') {
			if (action === 'create') {
				route = `gaia/ecosystem/u/${ecosystemUID}/environment_parameters`;
			} else {
				route = `gaia/ecosystem/u/${ecosystemUID}/environment_parameters/${crudTablePrimaryKey}`;
			}
		} else if (table === 'hardware') {
			if (action === 'create') {
				route = `gaia/ecosystem/u/${ecosystemUID}/hardware`;
			} else {
				route = `gaia/hardware/u/${crudTablePrimaryKey}`;
			}
		}
		crudRequest(route, action, payload);
		resetModal();
	};
</script>

<HeaderLine title="{ecosystemName} settings" />
<h2>Managements</h2>
<table>
	<tbody>
		{#each managementChoices as management}
			<tr>
				<td>
					{capitalize(management)}
				</td>
				<td>&nbsp; &nbsp;</td>
				<td><SlideButton bind:checked={$ecosystemsManagement[ecosystemUID][management]} /></td>
			</tr>
		{/each}
	</tbody>
</table>
<div style="margin-top: 14px">
	<button on:click={() => updateManagement()}>
		Update {ecosystemName}' management
	</button>
</div>

{#await fetchEcosystemEnvironmentParameters(ecosystemUID) then environmentParameters}
	<h2>Environment parameters</h2>
	<Table
		tableID="environmentParametersTable"
		columns={[
			{ label: 'Parameter', key: 'parameter' },
			{ label: 'Day', key: 'day' },
			{ label: 'Night', key: 'night' },
			{ label: 'Hysteresis', key: 'hysteresis' }
		]}
		data={environmentParameters}
		editable={true}
		on:crud={(event) => {
			setCrudInfo(
				'climate_parameter',
				event['detail']['action'],
				event['detail']['rowIndex'] !== undefined
					? environmentParameters[event['detail']['rowIndex']]['parameter']
					: undefined,
				event['detail']['rowIndex']
			);
		}}
	/>
	{#if crudTable === 'climate_parameter'}
		<Modal showModal={true} on:close={resetModal} title={modalTitle}>
			{#if crudAction === 'create'}
				<Form
					data={[
						{ label: 'Parameter', key: 'parameter', selectFrom: climateParameters },
						{ label: 'Day', key: 'day', validate: isNumber },
						{ label: 'Night', key: 'night', validate: isNumber },
						{ label: 'Hysteresis', key: 'hysteresis', validate: isNumber }
					]}
					on:confirm={(event) => sendRequest('create', 'climate_parameter', event.detail)}
					on:cancel={resetModal}
				/>
			{:else if crudAction === 'update'}
				<Form
					data={[
						{
							label: 'Parameter',
							key: 'parameter',
							value: getValue(environmentParameters, 'parameter'),
							disabled: true
						},
						{
							label: 'Day',
							key: 'day',
							value: getValue(environmentParameters, 'day'),
							validate: isNumber
						},
						{
							label: 'Night',
							key: 'night',
							value: getValue(environmentParameters, 'night'),
							validate: isNumber
						},
						{
							label: 'Hysteresis',
							key: 'hysteresis',
							value: getValue(environmentParameters, 'hysteresis'),
							validate: isNumber
						}
					]}
					on:confirm={(event) => sendRequest('update', 'climate_parameter', event.detail)}
					on:cancel={resetModal}
				/>
			{:else if crudAction === 'delete'}
				<p>Are you sure you want to delete the {crudTablePrimaryKey} environment parameter?</p>
				<ConfirmButtons
					on:confirm={(event) => sendRequest('delete', 'climate_parameter', event.detail)}
					on:cancel={resetModal}
				/>
			{/if}
		</Modal>
	{/if}
{/await}

{#await fetchEcosystemHardware(ecosystemUID) then hardware}
	<h2>Hardware</h2>
	<Table
		tableID="hardwareTable"
		columns={[
			{ label: 'Name', key: 'name' },
			{ label: 'UID', key: 'uid' },
			{ label: 'Level', key: 'level' },
			{ label: 'Type', key: 'type' },
			{ label: 'Model', key: 'model' },
			{ label: 'Address', key: 'address' },
			{ label: 'Last log entry', key: 'last_log', isTime: true }
		]}
		data={hardware}
		editable={true}
		on:crud={(event) => {
			setCrudInfo(
				'hardware',
				event['detail']['action'],
				event['detail']['rowIndex'] !== undefined
					? hardware[event['detail']['rowIndex']]['uid']
					: undefined,
				event['detail']['rowIndex']
			);
		}}
	/>
	{#if crudTable === 'hardware'}
		<Modal showModal={true} on:close={resetModal} title={modalTitle}>
			{#if crudAction === 'create'}
				<Form
					data={[
						{ label: 'Name', key: 'name' },
						{ label: 'Level', key: 'level', selectFrom: hardwareLevel },
						{ label: 'Type', key: 'type', selectFrom: hardwareType },
						{ label: 'Model', key: 'model' },
						{ label: 'Address', key: 'address' }
					]}
					on:confirm={(event) => sendRequest('create', 'hardware', event.detail)}
					on:cancel={resetModal}
				/>
			{:else if crudAction === 'update'}
				<Form
					data={[
						{ label: 'Name', key: 'name', value: getValue(hardware, 'name') },
						{ label: 'UID', key: 'uid', value: getValue(hardware, 'uid'), disabled: true },
						{
							label: 'Level',
							key: 'level',
							value: getValue(hardware, 'level'),
							selectFrom: hardwareLevel
						},
						{
							label: 'Type',
							key: 'type',
							value: getValue(hardware, 'type'),
							selectFrom: hardwareType,
							disabled: true
						},
						{ label: 'Model', key: 'model', value: getValue(hardware, 'model'), disabled: true },
						{ label: 'Address', key: 'address', value: getValue(hardware, 'address') }
					]}
					on:confirm={(event) => sendRequest('update', 'hardware', event.detail)}
					on:cancel={resetModal}
				/>
			{:else if crudAction === 'delete'}
				<p>Are you sure you want to delete the {crudTablePrimaryKey} hardware?</p>
				<ConfirmButtons
					on:confirm={(event) => sendRequest('delete', 'hardware', event.detail)}
					on:cancel={resetModal}
				/>
			{/if}
		</Modal>
	{/if}
{/await}

<style>
	button {
		background-color: var(--derived-50);
		border: none;
		color: #f9f9fb;
		padding: 0.7em 1.4em;
		margin: 0 25px;
		text-align: center;
		border-radius: 7px;
		font-size: 1rem;
		cursor: pointer;
	}
</style>
