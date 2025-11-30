<script>
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';

	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SlideButton from '$lib/components/SlideButton.svelte';
	import Table from '$lib/components/Table.svelte';

	import {
		currentUser,
		ecosystems,
		ecosystemsNycthemeralCycle,
		ecosystemsManagement,
		ecosystemsState,
		getStoreDataKey
	} from '$lib/store.svelte.js';
	import {
		climateParameters,
		hardwareLevels,
		hardwareTypes,
		permissions,
		weatherParameters
	} from '$lib/utils/consts.js';
	import {
		capitalize,
		computeEcosystemStatusClass,
		computeLightingHours,
		formatDateTime
	} from '$lib/utils/functions.js';
	import {
		crudRequest,
		fetchEcosystemEnvironmentParameters,
		fetchEcosystemHardware,
		fetchEcosystemNycthemeralCycleData,
		fetchEcosystemWeatherEvents
	} from '$lib/actions.svelte.js';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	let ecosystem = $derived({ ...$ecosystems[ecosystemUID] });
	let ecosystemState = $derived($ecosystemsState[ecosystemUID]);

	const valueOrNone = function (value) {
		return value === null ? 'None' : value;
	};

	// Management crud-related function
	let ecosystemManagement = $state({ ...$ecosystemsManagement[ecosystemUID] });

	$effect(() => {
		ecosystemManagement = { ...$ecosystemsManagement[ecosystemUID] };
	});

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
	let crudAction = $state(undefined);
	let crudTable = $state(undefined);
	let crudIndex = $state(undefined);

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

	let modals = $state({});

	// Data to populate the tables and modals
	let environmentParameters = $state(undefined);
	let environmentParameter = $derived(
		environmentParameters !== undefined &&
			crudTable === 'climate_parameter' &&
			crudIndex !== undefined
			? environmentParameters[crudIndex]
			: {}
	);

	let weatherEvents = $state(undefined);
	let weatherEvent = $derived(
		weatherEvents !== undefined && crudTable === 'weather_event' && crudIndex !== undefined
			? weatherEvents[crudIndex]
			: {}
	);

	let hardwareObjects = $state(undefined);
	let hardware = $derived(
		hardwareObjects !== undefined && crudTable === 'hardware' && crudIndex !== undefined
			? hardwareObjects[crudIndex]
			: {}
	);

	onMount(async () => {
		await fetchEcosystemNycthemeralCycleData(ecosystemUID);
		environmentParameters = await fetchEcosystemEnvironmentParameters(ecosystemUID);
		weatherEvents = await fetchEcosystemWeatherEvents(ecosystemUID);
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
					<Fa icon={faCircle} class={computeEcosystemStatusClass($ecosystemsState[ecosystemUID])} />
				</td>
			</tr>
			<tr>
				<td>UID</td>
				<td>{ecosystem['uid']}</td>
			</tr>
			<tr>
				<td>Registration date</td>
				<td>{formatDateTime(ecosystem['registration_date'])}</td>
			</tr>
			<tr>
				<td>Last seen</td>
				<td>{formatDateTime(ecosystemState['last_seen'])}</td>
			</tr>
		</tbody>
		{#if $currentUser.can(permissions.OPERATE)}
			<tbody>
				<tr>
					<td colspan="2" style="text-align: center; vertical-align: middle">
						<button
							class="text-button"
							onclick={() => {
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
	bind:this={modals['base_info']}
	showModal={crudTable === 'base_info'}
	title="Update {ecosystemName}' base info"
	onclose={resetCrudData}
>
	<Form
		data={[
			{ label: 'Name', key: 'name', value: ecosystem['name'] },
			{ label: 'Status', key: 'status', value: ecosystem['status'], selectFrom: [true, false] }
		]}
		onconfirm={(payload) => {
			crudRequest(`gaia/ecosystem/u/${ecosystemUID}`, 'update', payload);
			modals['base_info'].closeModal();
		}}
		oncancel={() => modals['base_info'].closeModal()}
	/>
</Modal>

{#if $ecosystemsNycthemeralCycle[getStoreDataKey(ecosystemUID)]}
	{@const nycthemeralCycle = $ecosystemsNycthemeralCycle[getStoreDataKey(ecosystemUID)]}
	<h2>Nycthemeral cycle info</h2>
	<div style="overflow-x: auto">
		<table class="table-base table-alternate-colors table-narrow" style="padding-bottom: 35px;">
			<tbody>
				<tr>
					<td>Span method</td>
					<td>{capitalize(nycthemeralCycle['span'])}</td>
				</tr>
				<tr>
					<td>Span target</td>
					<td
						>{nycthemeralCycle['target'] ? capitalize(nycthemeralCycle['target']) : 'No target'}</td
					>
				</tr>
				<tr>
					<td>Day start</td>
					<td>{nycthemeralCycle['day']}</td>
				</tr>
				<tr>
					<td>Night start</td>
					<td>{nycthemeralCycle['night']}</td>
				</tr>
				<tr>
					<td>Lighting method</td>
					<td>{capitalize(nycthemeralCycle['lighting'])}</td>
				</tr>
				<tr>
					<td>Lighting hours</td>
					<td>
						{#each computeLightingHours(nycthemeralCycle) as lightingHours}
							<p style="margin-bottom: 0">{lightingHours}</p>
						{/each}
					</td>
				</tr>
			</tbody>
			{#if $currentUser.can(permissions.OPERATE)}
				<tbody>
					<tr>
						<td colspan="2" style="text-align: center; vertical-align: middle">
							<button
								class="text-button"
								onclick={() => {
									setCrudData('nycthemeral_info', undefined, undefined);
								}}
							>
								Modify the nycthemeral info
							</button>
						</td>
					</tr>
				</tbody>
			{/if}
		</table>
	</div>
	<Modal
		bind:this={modals['nycthemeral_info']}
		showModal={crudTable === 'nycthemeral_info'}
		title="Update {ecosystemName}' nycthemeral info"
		onclose={resetCrudData}
	>
		<Form
			data={[
				{
					label: 'Span method',
					key: 'span',
					value: nycthemeralCycle['span'],
					selectFrom: ['fixed', 'mimic'],
					disabled: true
				},
				{
					label: 'Span target',
					key: 'target',
					value: nycthemeralCycle['target'],
					disabled: true
				},
				{
					label: 'Lighting method',
					key: 'lighting',
					value: nycthemeralCycle['lighting'],
					selectFrom: ['fixed', 'elongate']
				},
				{
					label: 'Day start fallback value',
					key: 'day',
					type: 'time',
					value: nycthemeralCycle['day']
				},
				{
					label: 'Day end fallback value',
					key: 'night',
					type: 'time',
					value: nycthemeralCycle['night']
				}
			]}
			onconfirm={(payload) => {
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/light`, 'update', payload);
				modals['nycthemeral_info'].closeModal();
			}}
			oncancel={() => modals['nycthemeral_info'].closeModal()}
		/>
	</Modal>
{/if}

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
							onclick={() => {
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
	bind:this={modals['management']}
	showModal={crudTable === 'management'}
	title="Update {ecosystemName}' management"
	confirmationButtons={true}
	onclose={resetCrudData}
	onconfirm={() => {
		crudRequest(`gaia/ecosystem/u/${ecosystemUID}/management`, 'update', ecosystemManagement);
		modals['management'].closeModal();
	}}
>
	<p>Are you sure you want to update {ecosystemName}' subroutines management?</p>
</Modal>

{#if environmentParameters !== undefined && ($currentUser.can(permissions.OPERATE) || environmentParameters.length > 0)}
	<h2>Environment parameters</h2>
	<Table
		tableID="environmentParametersTable"
		columns={[
			{ label: 'Parameter', key: 'parameter', serializer: capitalize },
			{ label: 'Day', key: 'day', serializer: (value) => value.toFixed(1) },
			{ label: 'Night', key: 'night', serializer: (value) => value.toFixed(1) },
			{ label: 'Hysteresis', key: 'hysteresis', serializer: (value) => value.toFixed(1) },
			{ label: 'Alarm', key: 'alarm', serializer: valueOrNone }
		]}
		data={environmentParameters}
		editable={true}
		oncrud={(payload) => {
			setCrudData('climate_parameter', payload['action'], payload['rowIndex']);
		}}
	/>
	<Modal
		bind:this={modals['climate_parameter_create']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'create'}
		title="Add a new environment parameter"
		onclose={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Parameter', key: 'parameter', selectFrom: climateParameters },
				{ label: 'Day', key: 'day', type: 'number', step: '0.1' },
				{ label: 'Night', key: 'night', type: 'number', step: '0.1' },
				{ label: 'Hysteresis', key: 'hysteresis', type: 'number', min: '0', step: '0.1' },
				{ label: 'Alarm', key: 'alarm', type: 'number', min: '0', step: '0.1', serializer: valueOrNone, required: false }
			]}
			onconfirm={(payload) => {
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/environment_parameter/u`, 'create', payload);
				modals['climate_parameter_create'].closeModal();
			}}
			oncancel={() => modals['climate_parameter_create'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['climate_parameter_update']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'update'}
		title="Update {environmentParameter['parameter']} environment parameter"
		onclose={resetCrudData}
	>
		<Form
			data={[
				{
					label: 'Parameter',
					key: 'parameter',
					value: environmentParameter['parameter'],
					selectFrom: climateParameters,
					disabled: true
				},
				{
					label: 'Day',
					key: 'day',
					type: 'number',
					step: '0.1',
					value: environmentParameter['day']
				},
				{
					label: 'Night',
					key: 'night',
					type: 'number',
					step: '0.1',
					value: environmentParameter['night']
				},
				{
					label: 'Hysteresis',
					key: 'hysteresis',
					type: 'number',
					min: '0',
					step: '0.1',
					value: environmentParameter['hysteresis']
				},
				{
					label: 'Alarm',
					key: 'alarm',
					type: 'number',
					min: '0',
					step: '0.1',
					serializer: valueOrNone,
					value: environmentParameter['alarm']
				}
			]}
			onconfirm={(payload) => {
				const parameter = environmentParameter['parameter'];
				crudRequest(
					`gaia/ecosystem/u/${ecosystemUID}/environment_parameter/u/${parameter}`,
					'update',
					payload
				);
				modals['climate_parameter_update'].closeModal();
			}}
			oncancel={() => modals['climate_parameter_update'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['climate_parameter_delete']}
		showModal={crudTable === 'climate_parameter' && crudAction === 'delete'}
		title="Delete {environmentParameter['parameter']} environment parameter"
		confirmationButtons={true}
		onclose={resetCrudData}
		onconfirm={() => {
			const parameter = environmentParameter['parameter'];
			crudRequest(
				`gaia/ecosystem/u/${ecosystemUID}/environment_parameter/u/${parameter}`,
				'delete'
			);
			modals['climate_parameter_delete'].closeModal();
		}}
	>
		<p>
			Are you sure you want to delete the {environmentParameter['parameter']} environment parameter?
		</p>
	</Modal>
{/if}

{#if weatherEvents !== undefined && ($currentUser.can(permissions.OPERATE) || weatherEvents.length > 0)}
	<h2>Weather events</h2>
	<Table
		tableID="weatherEventsTable"
		columns={[
			{ label: 'Parameter', key: 'parameter', serializer: capitalize },
			{ label: 'Pattern', key: 'pattern' },
			{ label: 'Duration', key: 'duration', serializer: (value) => value.toFixed(1) },
			{ label: 'Level', key: 'level', serializer: (value) => value.toFixed(1) },
			{ label: 'Linked actuator', key: 'linked_actuator', serializer: valueOrNone }
		]}
		data={weatherEvents}
		editable={true}
		oncrud={(payload) => {
			setCrudData('weather_event', payload['action'], payload['rowIndex']);
		}}
	/>
	<Modal
		bind:this={modals['weather_event_create']}
		showModal={crudTable === 'weather_event' && crudAction === 'create'}
		title="Add a new weather event"
		onclose={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Parameter', key: 'parameter', selectFrom: weatherParameters },
				{ label: 'Pattern', key: 'pattern', type: 'text' },
				{ label: 'Duration', key: 'duration', type: 'number', step: '0.1' },
				{ label: 'Level', key: 'level', type: 'number', min: '0', max: '100', step: '0.1' },
				{
					label: 'Linked actuator',
					key: 'linked_actuator',
					type: 'text',
					required: false,
					serializer: valueOrNone
				}
			]}
			onconfirm={(payload) => {
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/weather_event/u`, 'create', payload);
				modals['weather_event_create'].closeModal();
			}}
			oncancel={() => modals['weather_event_create'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['weather_event_update']}
		showModal={crudTable === 'weather_event' && crudAction === 'update'}
		title="Update {weatherEvent['parameter']} environment parameter"
		onclose={resetCrudData}
	>
		<Form
			data={[
				{
					label: 'Parameter',
					key: 'parameter',
					value: weatherEvent['parameter'],
					selectFrom: weatherParameters,
					disabled: true
				},
				{
					label: 'Pattern',
					key: 'pattern',
					type: 'text',
					value: weatherEvent['pattern']
				},
				{
					label: 'Duration',
					key: 'duration',
					type: 'number',
					step: '0.1',
					value: weatherEvent['duration']
				},
				{
					label: 'Level',
					key: 'level',
					type: 'number',
					min: '0',
					max: '100',
					step: '0.1',
					value: weatherEvent['level']
				},
				{
					label: 'Linked actuator',
					key: 'linked_actuator',
					type: 'text',
					required: false,
					serializer: valueOrNone,
					value: weatherEvent['linked_actuator']
				}
			]}
			onconfirm={(payload) => {
				const parameter = weatherEvent['parameter'];
				crudRequest(
					`gaia/ecosystem/u/${ecosystemUID}/weather_event/u/${parameter}`,
					'update',
					payload
				);
				modals['weather_event_update'].closeModal();
			}}
			oncancel={() => modals['weather_event_update'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['weather_event_delete']}
		showModal={crudTable === 'weather_event' && crudAction === 'delete'}
		title="Delete {weatherEvent['parameter']} weather event"
		confirmationButtons={true}
		onclose={resetCrudData}
		onconfirm={() => {
			const parameter = weatherEvent['parameter'];
			crudRequest(`gaia/ecosystem/u/${ecosystemUID}/weather_event/u/${parameter}`, 'delete');
			modals['weather_event_delete'].closeModal();
		}}
	>
		<p>
			Are you sure you want to delete the {weatherEvent['parameter']} weather event?
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
			{ label: 'Level', key: 'level', serializer: capitalize },
			{ label: 'Type', key: 'type', serializer: capitalize },
			{ label: 'Model', key: 'model' },
			{ label: 'Address', key: 'address' },
			{
				label: 'Last log entry',
				key: 'last_log',
				serializer: (value) => {
					if (!value) return '';
					const date = new Date(value);
					return formatDateTime(date);
				}
			}
		]}
		data={hardwareObjects}
		editable={true}
		oncrud={(payload) => {
			setCrudData('hardware', payload['action'], payload['rowIndex']);
		}}
	/>
	<Modal
		bind:this={modals['hardware_create']}
		showModal={crudTable === 'hardware' && crudAction === 'create'}
		title="Add a new hardware"
		onclose={resetCrudData}
	>
		<Form
			data={[
				{ label: 'Name', key: 'name' },
				{ label: 'Level', key: 'level', selectFrom: hardwareLevels },
				{ label: 'Type', key: 'type', selectFrom: hardwareTypes },
				{ label: 'Model', key: 'model' },
				{ label: 'Address', key: 'address' }
			]}
			onconfirm={(payload) => {
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/hardware`, 'create', payload);
				modals['hardware_create'].closeModal();
			}}
			oncancel={() => modals['hardware_create'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['hardware_update']}
		showModal={crudTable === 'hardware' && crudAction === 'update'}
		title="Update '{hardware['name']}' hardware"
		onclose={resetCrudData}
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
			onconfirm={(payload) => {
				const uid = hardware['uid'];
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/hardware/u/${uid}`, 'update', payload);
				modals['hardware_update'].closeModal();
			}}
			oncancel={() => modals['hardware_update'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['hardware_delete']}
		showModal={crudTable === 'hardware' && crudAction === 'delete'}
		title="Delete '{hardware['name']}' hardware"
		confirmationButtons={true}
		onclose={resetCrudData}
		onconfirm={() => {
			const uid = hardware['uid'];
			crudRequest(`gaia/ecosystem/u/${ecosystemUID}/hardware/u/${uid}`, 'delete');
			modals['hardware_delete'].closeModal();
		}}
	>
		<p>Are you sure you want to delete '{hardware['name']}' hardware ?</p>
	</Modal>
{/if}
