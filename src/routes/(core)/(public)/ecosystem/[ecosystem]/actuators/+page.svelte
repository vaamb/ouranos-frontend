<script>
	import { onDestroy, onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import {
		faDroplet,
		faDropletSlash,
		faFan,
		faFire,
		faLightbulb,
		faSnowflake
	} from '@fortawesome/free-solid-svg-icons';

	import ActuatorHistory from '$lib/components/ActuatorHistory.svelte';
	import Switch from '$lib/components/Switch.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { useHeaderItems } from '$lib/components/header/header.svelte.ts';
	import {
		syncEcosystemActuatorsState,
		syncEcosystemNycthemeralCycleData,
		updateActuatorMode
	} from '$lib/actions.svelte.js';
	import { fetchEcosystemActuatorRecords } from '$lib/queries.js';
	import { gaiaState, getKey } from '$lib/store.svelte.ts';

	import { socketio } from '$lib/socketio.svelte.js';
	import { actuatorTypes } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	const icons = {
		light: faLightbulb,
		heater: faFire,
		cooler: faSnowflake,
		humidifier: faDroplet,
		dehumidifier: faDropletSlash,
		fan: faFan
	};

	// The lane shows whole days, so a five-minute clock is plenty to keep the
	// "now" edge and the "since" readout honest.
	let now = $state(Date.now());
	let actuatorsRecords = $state({});

	let actuatorsState = $derived(gaiaState.ecosystemsActuatorsState[getKey(ecosystemUID)] || {});
	let nycthemeralCycle = $derived(gaiaState.ecosystemsNycthemeralCycle[getKey(ecosystemUID)] || {});

	// An actuator belongs on the page when it is fitted now, or when it was fitted
	// at some point during the records' span. Absent hardware is simply not
	// rendered — never rendered greyed out. (`record[1]` is `active`: a record is
	// written every cycle, so mere presence proves nothing.)
	const hasBeenActive = function (actuatorType) {
		const records = actuatorsRecords[actuatorType];
		return Boolean(records?.['values']?.some((record) => record[1]));
	};

	let fittedActuators = $derived(
		actuatorTypes.filter((actuatorType) => {
			const state = actuatorsState[actuatorType];
			return Boolean(state) && (state['active'] || hasBeenActive(actuatorType));
		})
	);

	let missingActuators = $derived(
		actuatorTypes.filter((actuatorType) => !fittedActuators.includes(actuatorType))
	);

	let runningCount = $derived(
		fittedActuators.filter((actuatorType) => actuatorsState[actuatorType]['status']).length
	);

	const updateActuatorsData = function (actuatorsData) {
		for (const actuatorData of actuatorsData) {
			if (actuatorData['ecosystem_uid'] !== ecosystemUID) {
				continue;
			}
			if (!actuatorsRecords[actuatorData['type']]?.['values']) {
				// The initial fetch failed or has not landed yet: nothing to append to.
				continue;
			}
			now = Date.now();
			actuatorsRecords[actuatorData['type']]['values'].push([
				new Date(now - 100).toISOString(),
				actuatorData['active'],
				actuatorData['mode'],
				actuatorData['status'],
				actuatorData['level']
			]);
		}
	};

	let timeUpdate = null;
	const updateTime = function () {
		now = Date.now();
	};

	// The page's chip in the header's contextual zone: what is drawing power here,
	// right now.
	useHeaderItems(() => {
		if (!fittedActuators.length) {
			return [];
		}
		return [
			{
				id: 'actuators-running',
				label: 'Running',
				value: `${runningCount} of ${fittedActuators.length}`,
				dot: true,
				tone: runningCount ? 'good' : 'default'
			}
		];
	});

	onMount(async () => {
		await Promise.all([
			syncEcosystemActuatorsState(ecosystemUID),
			syncEcosystemNycthemeralCycleData(ecosystemUID),
			...actuatorTypes.map(async (actuatorType) => {
				actuatorsRecords[actuatorType] = await fetchEcosystemActuatorRecords(
					ecosystemUID,
					actuatorType
				);
			})
		]);
		socketio.on('actuators_data', updateActuatorsData);
		timeUpdate = setInterval(updateTime, 1000 * 60 * 5);
	});

	onDestroy(async () => {
		socketio.off('actuators_data', updateActuatorsData);
		clearInterval(timeUpdate);
	});
</script>

{#snippet fitted()}
	{#if fittedActuators.length}
		{fittedActuators.length}
		{fittedActuators.length === 1 ? 'actuator' : 'actuators'} fitted
	{/if}
{/snippet}

<TitleBar
	title="Actuators"
	docTitle="Actuators in {ecosystemName}"
	sideBloc={fitted}
/>

{#if fittedActuators.length}
	<p class="legend">
		<span><i class="ran"></i>Ran</span>
		<span><i class="running"></i>Running now</span>
		<span><i class="dark"></i>Dark period</span>
		<span><i class="held"></i>Held by hand</span>
		<span class="scale">Last 7 days</span>
	</p>

	{#each fittedActuators as actuatorType (actuatorType)}
		{@const actuatorState = actuatorsState[actuatorType]}
		<article class="actuator" class:running={actuatorState['status']}>
			<header>
				<span class="name">
					<Fa icon={icons[actuatorType]} />
					{capitalize(actuatorType)}
				</span>
				<!-- A proportional actuator says how hard it is working; a level of 0
				     while it is off would only repeat what the panel already says. -->
				{#if actuatorState['status'] && typeof actuatorState['level'] === 'number' && actuatorState['level'] < 100}
					<span class="level">
						level <b>{Math.round(actuatorState['level'] * 10) / 10}%</b>
					</span>
				{/if}
			</header>
			<div class="body">
				<Switch
					{actuatorType}
					status={actuatorState['status']}
					mode={actuatorState['mode']}
					useTimer={true}
					onswitch={(payload) => {
						updateActuatorMode(
							ecosystemUID,
							payload['actuatorType'],
							payload['mode'],
							payload['countdown']
						);
					}}
				/>
				<ActuatorHistory
					records={actuatorsRecords[actuatorType]?.['values'] || []}
					status={actuatorState['status']}
					mode={actuatorState['mode']}
					{nycthemeralCycle}
					{now}
				/>
			</div>
		</article>
	{/each}

	{#if missingActuators.length}
		<p class="missing">
			Not fitted in {ecosystemName}: <b>{missingActuators.join(', ')}</b>.
		</p>
	{/if}
{:else}
	<div class="nothing">
		<h2>No actuator in {ecosystemName}</h2>
		<p>
			Nothing here can be switched. Fit a light, a heater or a fan to this ecosystem and its lane
			appears on this page.
		</p>
	</div>
{/if}

<style>
	.legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		margin-bottom: 14px;
		font-size: 0.72rem;
		color: var(--text-dim-solid);
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.legend i {
		display: inline-block;
		width: 15px;
		height: 8px;
		border-radius: 2px;
	}

	.legend .ran {
		background: color-mix(in srgb, var(--text-dim-solid) 72%, transparent);
	}

	.legend .running {
		background: var(--good-green);
	}

	.legend .dark {
		background: var(--night-shade);
		outline: 1px solid var(--border);
	}

	.legend .held {
		height: 3px;
		background: var(--amber);
	}

	.legend .scale {
		margin-left: auto;
	}

	.actuator {
		position: relative;
		margin-bottom: 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
		overflow: hidden;
		/* the panel and the day strip key off the card's width, not the viewport */
		container-type: inline-size;
	}

	/* `Table`'s and `DataSheet`'s rail, painted only while the actuator draws
	   power: its absence is the information. */
	.actuator::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 3px;
		background: transparent;
	}

	.actuator.running::before {
		background: var(--good-green);
	}

	header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 11px 16px 9px;
		border-bottom: 1px solid var(--border);
	}

	.name {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text);
	}

	.name :global(svg) {
		color: var(--text-dim-solid);
	}

	.actuator.running .name :global(svg) {
		color: var(--good-green);
	}

	.level {
		margin-left: auto;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.78rem;
		color: var(--text-dim-solid);
	}

	.level b {
		color: var(--text);
		font-weight: 600;
	}

	/* Control panel then record, the way the page has always been split — the
	   panel keeps its own ground and draws its own edge (`Switch` mirrors this
	   620px breakpoint). */
	.body {
		display: grid;
		grid-template-columns: 300px minmax(0, 1fr);
	}

	@container (max-width: 620px) {
		.body {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.missing {
		margin-bottom: 14px;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
	}

	.missing b {
		color: var(--text);
		font-weight: 700;
	}

	.nothing {
		padding: 26px 20px;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
		background: var(--surface);
		text-align: center;
	}

	.nothing h2 {
		margin-bottom: 4px;
	}

	.nothing p {
		font-size: 0.85rem;
		color: var(--text-dim-solid);
	}
</style>
