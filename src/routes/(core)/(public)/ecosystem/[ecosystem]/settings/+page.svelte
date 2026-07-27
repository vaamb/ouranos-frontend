<script>
	import { onMount } from 'svelte';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import DataSheet from '$lib/components/DataSheet.svelte';
	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SlideButton from '$lib/components/SlideButton.svelte';
	import Table from '$lib/components/Table.svelte';

	import {
		crudRequest,
		syncEcosystemNycthemeralCycleData
	} from '$lib/actions.svelte.js';
	import {
		fetchEcosystemEnvironmentParameters,
		fetchEcosystemHardware,
		fetchEcosystemWeatherEvents
	} from '$lib/queries.js';

	import {
		appState,
		gaiaState,
		getKey
	} from '$lib/store.svelte.ts';
	import {
		climateParameters,
		ecosystemOperationStatus,
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

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	let ecosystem = $derived({ ...gaiaState.ecosystems[ecosystemUID] });
	let ecosystemState = $derived(gaiaState.ecosystemsState[ecosystemUID]);
	let ecosystemStatusClass = $derived(computeEcosystemStatusClass(ecosystemState));

	const valueOrNone = function (value) {
		return value === null ? 'None' : value;
	};

	const statusWord = function (statusClass) {
		if (statusClass === ecosystemOperationStatus.disconnected) {
			return 'Disconnected';
		}
		return statusClass === ecosystemOperationStatus.on ? 'Running' : 'Stopped';
	};

	// Management crud-related function
	// The switches edit this local draft and 'Save managements' sends it. It has
	// to be `$state` and not a `$derived` copy: `bind:checked` needs a reactive
	// object to write into, and a plain spread is not one.
	let ecosystemManagement = $state({ ...gaiaState.ecosystemsManagement[data['ecosystemUID']] });

	// Re-seed the draft when the ecosystem changes or the server sends new values.
	$effect(() => {
		ecosystemManagement = { ...gaiaState.ecosystemsManagement[ecosystemUID] };
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
		await syncEcosystemNycthemeralCycleData(ecosystemUID);
		environmentParameters = await fetchEcosystemEnvironmentParameters(ecosystemUID);
		weatherEvents = await fetchEcosystemWeatherEvents(ecosystemUID);
		hardwareObjects = await fetchEcosystemHardware(ecosystemUID);
	});
</script>

<HeaderLine title="{ecosystemName} settings" />
<h2>Base info</h2>
<DataSheet
	rows={[
		{ label: 'Name', value: ecosystem['name'] },
		{ label: 'UID', value: ecosystem['uid'] },
		{
			label: 'Status',
			value: statusWord(ecosystemStatusClass),
			statusClass: ecosystemStatusClass
		},
		{ label: 'Registration date', value: formatDateTime(ecosystem['registration_date']) },
		{ label: 'Last seen', value: formatDateTime(ecosystemState['last_seen']) }
	]}
	actionLabel="Edit base info"
	onaction={() => {
		setCrudData('base_info', undefined, undefined);
	}}
/>
<Modal
	showModal={crudTable === 'base_info'}
	onclose={resetCrudData}
>
	{#snippet title()}{`Update ${ecosystemName}' base info`}{/snippet}
	{#snippet children(closeModal)}
		<Form
			data={[
				{ label: 'Name', key: 'name', value: ecosystem['name'] },
				{ label: 'Status', key: 'status', value: ecosystem['status'], selectFrom: [true, false] }
			]}
			onconfirm={(payload) => {
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}`, 'update', payload);
				closeModal();
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>

{#if gaiaState.ecosystemsNycthemeralCycle[getKey(ecosystemUID)]}
	{@const nycthemeralCycle = gaiaState.ecosystemsNycthemeralCycle[getKey(ecosystemUID)]}
	<h2>Nycthemeral cycle info</h2>
	<DataSheet
		rows={[
			{ label: 'Span method', value: capitalize(nycthemeralCycle['span']) },
			{
				label: 'Span target',
				value: nycthemeralCycle['target'] ? capitalize(nycthemeralCycle['target']) : 'No target'
			},
			{ label: 'Day start', value: nycthemeralCycle['day'] },
			{ label: 'Night start', value: nycthemeralCycle['night'] },
			{ label: 'Lighting method', value: capitalize(nycthemeralCycle['lighting']) },
			{ label: 'Lighting hours', value: computeLightingHours(nycthemeralCycle) }
		]}
		actionLabel="Edit nycthemeral cycle"
		onaction={() => {
			setCrudData('nycthemeral_info', undefined, undefined);
		}}
	/>
	<Modal
		showModal={crudTable === 'nycthemeral_info'}
		onclose={resetCrudData}
	>
		{#snippet title()}{`Update ${ecosystemName}' nycthemeral info`}{/snippet}
		{#snippet children(closeModal)}
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
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}

<h2>Managements</h2>
{#snippet managementToggle(row)}
	<SlideButton
		id={row['key']}
		bind:checked={ecosystemManagement[row['key']]}
		disabled={!appState.currentUser.can(permissions.OPERATE)}
	/>
{/snippet}
<DataSheet
	rows={managementChoices.map((management) => ({
		label: capitalize(management),
		key: management,
		labelId: `${management}Button`,
		content: managementToggle
	}))}
	actionLabel="Save managements"
	onaction={() => {
		setCrudData('management', undefined, undefined);
	}}
/>
<Modal
	showModal={crudTable === 'management'}
	onclose={resetCrudData}
>
	{#snippet title()}{`Update ${ecosystemName}' management`}{/snippet}
	{#snippet children(closeModal)}
		<p>Are you sure you want to update {ecosystemName}' subroutines management?</p>
		<ConfirmButtons
			onconfirm={() => {
				crudRequest(`gaia/ecosystem/u/${ecosystemUID}/management`, 'update', ecosystemManagement);
				closeModal();
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>

{#if environmentParameters !== undefined && (appState.currentUser.can(permissions.OPERATE) || environmentParameters.length > 0)}
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
		showModal={crudTable === 'climate_parameter' && crudAction === 'create'}
		onclose={resetCrudData}
	>
		{#snippet title()}{"Add a new environment parameter"}{/snippet}
		{#snippet children(closeModal)}
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
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudTable === 'climate_parameter' && crudAction === 'update'}
		onclose={resetCrudData}
	>
		{#snippet title()}{`Update ${environmentParameter['parameter']} environment parameter`}{/snippet}
		{#snippet children(closeModal)}
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
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudTable === 'climate_parameter' && crudAction === 'delete'}
		onclose={resetCrudData}
	>
		{#snippet title()}{`Delete ${environmentParameter['parameter']} environment parameter`}{/snippet}
		{#snippet children(closeModal)}
			<p>
				Are you sure you want to delete the {environmentParameter['parameter']} environment parameter?
			</p>
			<ConfirmButtons
				onconfirm={() => {
					const parameter = environmentParameter['parameter'];
					crudRequest(
						`gaia/ecosystem/u/${ecosystemUID}/environment_parameter/u/${parameter}`,
						'delete'
					);
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}

{#if weatherEvents !== undefined && (appState.currentUser.can(permissions.OPERATE) || weatherEvents.length > 0)}
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
		showModal={crudTable === 'weather_event' && crudAction === 'create'}
		onclose={resetCrudData}
	>
		{#snippet title()}{"Add a new weather event"}{/snippet}
		{#snippet children(closeModal)}
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
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudTable === 'weather_event' && crudAction === 'update'}
		onclose={resetCrudData}
	>
		{#snippet title()}{`Update ${weatherEvent['parameter']} weather event`}{/snippet}
		{#snippet children(closeModal)}
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
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudTable === 'weather_event' && crudAction === 'delete'}
		onclose={resetCrudData}
	>
		{#snippet title()}{`Delete ${weatherEvent['parameter']} weather event`}{/snippet}
		{#snippet children(closeModal)}
			<p>
				Are you sure you want to delete the {weatherEvent['parameter']} weather event?
			</p>
			<ConfirmButtons
				onconfirm={() => {
					const parameter = weatherEvent['parameter'];
					crudRequest(`gaia/ecosystem/u/${ecosystemUID}/weather_event/u/${parameter}`, 'delete');
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}

{#if hardwareObjects !== undefined && (appState.currentUser.can(permissions.OPERATE) || hardwareObjects.length > 0)}
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
		showModal={crudTable === 'hardware' && crudAction === 'create'}
		onclose={resetCrudData}
	>
		{#snippet title()}{"Add a new hardware"}{/snippet}
		{#snippet children(closeModal)}
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
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudTable === 'hardware' && crudAction === 'update'}
		onclose={resetCrudData}
	>
		{#snippet title()}{`Update '${hardware['name']}' hardware`}{/snippet}
		{#snippet children(closeModal)}
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
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudTable === 'hardware' && crudAction === 'delete'}
		onclose={resetCrudData}
	>
		{#snippet title()}{`Delete '${hardware['name']}' hardware`}{/snippet}
		{#snippet children(closeModal)}
			<p>Are you sure you want to delete '{hardware['name']}' hardware ?</p>
			<ConfirmButtons
				onconfirm={() => {
					const uid = hardware['uid'];
					crudRequest(`gaia/ecosystem/u/${ecosystemUID}/hardware/u/${uid}`, 'delete');
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}
