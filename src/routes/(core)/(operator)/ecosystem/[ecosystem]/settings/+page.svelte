<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import Fa from 'svelte-fa';

	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SlideButton from '$lib/components/SlideButton.svelte';
	import Table from '$lib/components/Table.svelte';

	import { currentUser, ecosystems, ecosystemsManagement } from '$lib/store.js';
	import { permissions } from '$lib/utils/consts.js';
	import {
		capitalize,
		computeEcosystemStatusClass,
		getEcosystemUID,
		isNumber,
		isTime,
		timeStringToDate
	} from '$lib/utils/functions.js';
	import { climateParameters, hardwareLevels, hardwareTypes } from '$lib/utils/consts.js';
	import {
		fetchEcosystemEnvironmentParameters,
		fetchEcosystemHardware,
		crudRequest
	} from '$lib/actions.js';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	$: ecosystemName = $page['params']['ecosystem'];
	$: ecosystemUID = getEcosystemUID($ecosystems, ecosystemName);
	$: ecosystem = { ...$ecosystems[ecosystemUID] };

	// Management crud-related function
	$: ecosystemManagement = { ...$ecosystemsManagement[ecosystemUID] };

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

	// General crud-related variables and functions
	let crudAction = undefined;
	let crudTable = undefined;
	let crudIndex = undefined;

	const setCrudData = function (parameter, action, rowIndex) {
		crudAction = action;
		crudTable = parameter;
		crudIndex = rowIndex;
	};

	const resetCrudData = function () {
		crudAction = undefined;
		crudTable = undefined;
		crudIndex = undefined;
	};

	let closeModals = {};

	// Data to populate the tables and modals
	let environmentParameters = undefined;
	$: environmentParameter =
		environmentParameters !== undefined &&
		crudTable === 'climate_parameter' &&
		crudIndex !== undefined
			? environmentParameters[crudIndex]
			: {};

	let hardwareObjects = undefined;
	$: hardware =
		hardwareObjects !== undefined && crudTable === 'hardware' && crudIndex !== undefined
			? hardwareObjects[crudIndex]
			: {};

	onMount(async () => {
		environmentParameters = await fetchEcosystemEnvironmentParameters(ecosystemUID);
		hardwareObjects = await fetchEcosystemHardware(ecosystemUID);
	});
</script>

<HeaderLine title="{ecosystemName} settings" />
<h2>Base info</h2>
<div style="overflow-x: auto">
	<table class="table-base table-alternate-colors table-narrow" style="padding-bottom: 35px;">
		<tbody>
			<tr>
				<td>Name</td>
				<td>
					{ecosystem['name']} &nbsp;
					<Fa icon={faCircle} class={computeEcosystemStatusClass(ecosystem)} />
				</td>
			</tr>
			<tr>
				<td>UID</td>
				<td>{ecosystem['uid']}</td>
			</tr>
			<tr>
				<td>Registration date</td>
				<td>{timeStringToDate(ecosystem['registration_date'])}</td>
			</tr>
			<tr>
				<td>Last seen</td>
				<td>{timeStringToDate(ecosystem['last_seen'])}</td>
			</tr>
			<tr>
				<td>Lighting method</td>
				<td>{ecosystem['lighting_method']}</td>
			</tr>
			<tr>
				<td>Day start</td>
				<td>{ecosystem['day_start']}</td>
			</tr>
			<tr>
				<td>Day end</td>
				<td>{ecosystem['night_start']}</td>
			</tr>
		</tbody>
		{#if $currentUser.can(permissions.OPERATE)}
			<tbody>
				<tr>
					<td colspan="2" style="text-align: center; vertical-align: middle">
						<button
							class="text-button"
							on:click={() => {
								setCrudData('base_info', undefined, undefined);
							}}
						>
							Modify the base info
						</button>
					</td>
				</tr>
			</tbody>
		{/if}
	</table>
</div>
<Modal
	bind:closeModal={closeModals['base_info']}
	showModal={crudTable === 'base_info'}
	title="Update {ecosystemName}' base info"
	on:close={resetCrudData}
>
	<Form
		data={[
			{ label: 'Name', key: 'name', value: ecosystem['name'] },
			{
				label: 'Lighting method',
				key: 'lighting_method',
				value: ecosystem['lighting_method'],
				selectFrom: ['fixed', 'elongate', 'mimic']
			},
			{
				label: 'Day start',
				key: 'day_start',
				value: ecosystem['day_start'],
				validate: isTime,
				hint: 'Time in the HH:MM format'
			},
			{
				label: 'Day end',
				key: 'night_start',
				value: ecosystem['night_start'],
				validate: isTime,
				hint: 'Time in the HH:MM format'
			}
		]}
		on:confirm={(event) => {
			const payload = event.detail;
			crudRequest(`gaia/ecosystem/u/${ecosystemUID}`, 'update', payload);
			closeModals['base_info']();
		}}
		on:cancel={closeModals['base_info']}
	/>
</Modal>

<h2>Managements</h2>
<div style="overflow-x: auto">
	<table class="table-base table-alternate-colors table-narrow">
		<tbody>
			{#each managementChoices as management}
				<tr>
					<td>
						{capitalize(management)}
					</td>
					<td>
						<SlideButton
							bind:checked={ecosystemManagement[management]}
							disabled={!$currentUser.can(permissions.OPERATE)}
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
							on:click={() => {
								setCrudData('management', undefined, undefined);
							}}
						>
							Update {ecosystemName}' management
						</button>
					</td>
				</tr>
			</tbody>
		{/if}
	</table>
</div>
<Modal
	bind:closeModal={closeModals['management']}
	showModal={crudTable === 'management'}
	title="Update {ecosystemName}' management"
	confirmationButtons={true}
	on:close={resetCrudData}
	on:confirm={() => {
		crudRequest(`gaia/ecosystem/u/${ecosystemUID}/management`, 'update', ecosystemManagement);
		closeModals['management']();
	}}
>
	<p>Are you sure you want to update {ecosystemName}' subroutines management?</p>
</Modal>

{#if environmentParameters !== undefined && ($currentUser.can(permissions.OPERATE) || environmentParameters.length > 0)}
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
			setCrudData('climate_parameter', event['detail']['action'], event['detail']['rowIndex']);
		}}
	/>
	<Modal
		bind:closeModal={closeModals['climate_parameter_create']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'create'}
		title="Add a new environment parameter"
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
				closeModals['climate_parameter_create']();
			}}
			on:cancel={closeModals['climate_parameter_create']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['climate_parameter_update']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'update'}
		title="Update {environmentParameter['parameter']} environment parameter"
		on:close={resetCrudData}
	>
		<Form
			data={[
				{
					label: 'Parameter',
					key: 'parameter',
					value: environmentParameter['parameter'],
					disabled: true
				},
				{
					label: 'Day',
					key: 'day',
					value: environmentParameter['day'],
					validate: isNumber
				},
				{
					label: 'Night',
					key: 'night',
					value: environmentParameter['night'],
					validate: isNumber
				},
				{
					label: 'Hysteresis',
					key: 'hysteresis',
					value: environmentParameter['hysteresis'],
					validate: isNumber
				}
			]}
			on:confirm={(event) => {
				const parameter = environmentParameter['parameter'];
				const payload = event.detail;
				crudRequest(
					`gaia/ecosystem/u/${ecosystemUID}/environment_parameters/${parameter}`,
					'update',
					payload
				);
				closeModals['climate_parameter_update']();
			}}
			on:cancel={closeModals['climate_parameter_update']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['climate_parameter_delete']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'delete'}
		title="Delete {environmentParameter['parameter']} environment parameter"
		confirmationButtons={true}
		on:close={resetCrudData}
		on:confirm={() => {
			const parameter = environmentParameter['parameter'];
			crudRequest(`gaia/ecosystem/u/${ecosystemUID}/environment_parameters/${parameter}`, 'delete');
			closeModals['climate_parameter_delete']();
		}}
	>
		<p>
			Are you sure you want to delete the {environmentParameter['parameter']} environment parameter?
		</p>
	</Modal>
{/if}

{#if hardwareObjects !== undefined && ($currentUser.can(permissions.OPERATE) || hardwareObjects.length > 0)}
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
		data={hardwareObjects}
		editable={true}
		on:crud={(event) => {
			setCrudData('hardware', event['detail']['action'], event['detail']['rowIndex']);
		}}
	/>
	<Modal
		bind:closeModal={closeModals['hardware_create']}
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
				closeModals['hardware_create']();
			}}
			on:cancel={closeModals['hardware_create']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['hardware_update']}
		showModal={crudTable === 'hardware' && crudAction === 'update'}
		title="Update '{hardware['name']}' hardware"
		on:close={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Name', key: 'name', value: hardware['name'] },
				{ label: 'UID', key: 'uid', value: hardware['uid'], disabled: true },
				{
					label: 'Level',
					key: 'level',
					value: hardware['level'],
					selectFrom: hardwareLevels
				},
				{
					label: 'Type',
					key: 'type',
					value: hardware['type'],
					selectFrom: hardwareTypes,
					disabled: true
				},
				{ label: 'Model', key: 'model', value: hardware['model'], disabled: true },
				{ label: 'Address', key: 'address', value: hardware['address'] }
			]}
			on:confirm={(event) => {
				const uid = hardware['uid'];
				const payload = event.detail;
				crudRequest(`gaia/hardware/u/${uid}`, 'update', payload);
				closeModals['hardware_update']();
			}}
			on:cancel={closeModals['hardware_update']}
		/>
	</Modal>
	<Modal
		bind:closeModal={closeModals['hardware_delete']}
		showModal={crudTable === 'hardware' && crudAction === 'delete'}
		title="Delete '{hardware['name']}' hardware"
		confirmationButtons={true}
		on:close={resetCrudData}
		on:confirm={() => {
			const uid = hardware['uid'];
			crudRequest(`gaia/hardware/u/${uid}`, 'delete');
			closeModals['hardware_delete']();
		}}
	>
		<p>Are you sure you want to delete '{hardware['name']}' hardware ?</p>
	</Modal>
{/if}
