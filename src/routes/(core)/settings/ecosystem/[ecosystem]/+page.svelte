<script>
	import { page } from '$app/stores';

	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SlideButton from '$lib/components/SlideButton.svelte';
	import Table from '$lib/components/Table.svelte';

	import { ecosystemsIds, ecosystemsManagement } from '$lib/store.js';
	import { capitalize, getEcosystemUid, getParamStatus, isNumber } from '$lib/utils/functions.js';
	import { climateParameters, hardwareLevels, hardwareTypes } from '$lib/utils/consts.js';
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
		'pictures',
		'database'
	];

	$: ecosystemName = $page['params']['ecosystem'];
	$: ecosystemUID = getEcosystemUid($ecosystemsIds, ecosystemName);

	const getValue = function (data, key) {
		return data[crudDataIndex][key];
	};

	// Management crud-related function
	const crudUpdateManagement = function () {
		const payload = {};
		for (const management of managementChoices) {
			payload[management] = getParamStatus($ecosystemsManagement, ecosystemUID, management);
		}
		crudRequest(`gaia/ecosystem/u/${ecosystemUID}/management`, 'update', payload);
	};

	// General crud-related variables and functions
	let crudAction = undefined;
	let crudTable = undefined;
	let crudTablePrimaryKey = undefined;
	let crudDataIndex = 0;

	const setCrudData = function (parameter, action, target, rowIndex) {
		crudAction = action;
		crudTable = parameter;
		crudTablePrimaryKey = target;
		crudDataIndex = rowIndex;
	};

	const resetCrudData = function () {
		crudAction = undefined;
		crudTable = undefined;
		crudTablePrimaryKey = undefined;
		crudDataIndex = 0;
	};

	let closeModals = {};
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
	<button on:click={() => crudUpdateManagement()}>
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
			setCrudData(
				'climate_parameter',
				event['detail']['action'],
				event['detail']['rowIndex'] !== undefined
					? environmentParameters[event['detail']['rowIndex']]['parameter']
					: undefined,
				event['detail']['rowIndex']
			);
		}}
	/>
	<Modal
		bind:closeModal={closeModals['1']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'create'}
		title="Add a new climate parameter"
		on:close={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Parameter', key: 'parameter', selectFrom: climateParameters },
				{ label: 'Day', key: 'day', validate: isNumber },
				{ label: 'Night', key: 'night', validate: isNumber },
				{ label: 'Hysteresis', key: 'hysteresis', validate: isNumber }
			]}
			on:confirm={(event) => {
				const payload = event.detail;
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/environment_parameters`, 'create', payload);
			}}
			on:cancel={closeModals['1']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['2']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'update'}
		title="Update {crudTablePrimaryKey}"
		on:close={resetCrudData}
	>
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
			on:confirm={(event) => {
				const payload = event.detail;
				crudRequest(
					`gaia/ecosystem/u/${ecosystemUID}/environment_parameters/${crudTablePrimaryKey}`,
					'update',
					payload
				);
			}}
			on:cancel={closeModals['2']}
		/>
	</Modal>
	<Modal
		showModal={crudTable === 'climate_parameter' && crudAction === 'delete'}
		title="Delete {crudTablePrimaryKey}"
		confirmationButtons={true}
		on:close={resetCrudData}
		on:confirm={() => {
			crudRequest(
				`gaia/ecosystem/u/${ecosystemUID}/environment_parameters/${crudTablePrimaryKey}`,
				'delete'
			);
		}}
	>
		<p>Are you sure you want to delete the {crudTablePrimaryKey} environment parameter?</p>
	</Modal>
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
			setCrudData(
				'hardware',
				event['detail']['action'],
				event['detail']['rowIndex'] !== undefined
					? hardware[event['detail']['rowIndex']]['uid']
					: undefined,
				event['detail']['rowIndex']
			);
		}}
	/>
	<Modal
		bind:closeModal={closeModals['3']}
		showModal={crudTable === 'hardware' && crudAction === 'create'}
		title="Add a new hardware"
		on:close={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Name', key: 'name' },
				{ label: 'Level', key: 'level', selectFrom: hardwareLevels },
				{ label: 'Type', key: 'type', selectFrom: hardwareTypes },
				{ label: 'Model', key: 'model' },
				{ label: 'Address', key: 'address' }
			]}
			on:confirm={(event) => {
				const payload = event.detail;
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/hardware`, 'create', payload);
			}}
			on:cancel={closeModals['3']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['4']}
		showModal={crudTable === 'hardware' && crudAction === 'update'}
		title="Update {crudTablePrimaryKey}"
		on:close={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Name', key: 'name', value: getValue(hardware, 'name') },
				{ label: 'UID', key: 'uid', value: getValue(hardware, 'uid'), disabled: true },
				{
					label: 'Level',
					key: 'level',
					value: getValue(hardware, 'level'),
					selectFrom: hardwareLevels
				},
				{
					label: 'Type',
					key: 'type',
					value: getValue(hardware, 'type'),
					selectFrom: hardwareTypes,
					disabled: true
				},
				{ label: 'Model', key: 'model', value: getValue(hardware, 'model'), disabled: true },
				{ label: 'Address', key: 'address', value: getValue(hardware, 'address') }
			]}
			on:confirm={(event) => {
				const payload = event.detail;
				crudRequest(`gaia/hardware/u/${crudTablePrimaryKey}`, 'update', payload);
			}}
			on:cancel={closeModals['4']}
		/>
	</Modal>
	<Modal
		showModal={crudTable === 'hardware' && crudAction === 'delete'}
		title="Delete {crudTablePrimaryKey}"
		confirmationButtons={true}
		on:close={resetCrudData}
		on:confirm={() => {
			crudRequest(`gaia/hardware/u/${crudTablePrimaryKey}`, 'delete');
		}}
	>
		<p>Are you sure you want to delete the {crudTablePrimaryKey} hardware?</p>
	</Modal>
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
