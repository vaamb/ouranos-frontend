<script>
	import { resolve } from '$app/paths';

	import Fa from 'svelte-fa';
	import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import EcosystemBand from '$lib/components/EcosystemBand.svelte';

	import { appState, gaiaState, getKey } from '$lib/store.svelte.ts';
	import { actuatorTypes, permissions } from '$lib/utils/consts.js';
	import {
		capitalize,
		computeEcosystemStatusClass,
		formatDateTime,
		isConnected,
		isEmpty,
		slugify,
		strHoursToDate
	} from '$lib/utils/functions.js';
	import { syncSensorCurrentData } from '$lib/actions.svelte.js';

	// A single ecosystem's home-page card. Reads everything else it needs from the
	// stores by `uid`; `now` (the page's shared clock) drives day/night + picture
	// freshness, and `cameraPicturesInfo` is this ecosystem's camera slice
	let { uid, now, cameraPicturesInfo = {} } = $props();

	// Operational status → panel accent + label. On = running (green),
	// off = stopped (red), disconnected = unknown state (neutral gray).
	const statusMeta = {
		on: { cls: 'running', label: 'Running' },
		off: { cls: 'stopped', label: 'Stopped' },
		deco: { cls: 'disconnected', label: 'Disconnected' }
	};

	let ecosystem = $derived(gaiaState.ecosystems[uid]);
	let ecosystemState = $derived(gaiaState.ecosystemsState[uid]);
	let cycle = $derived(gaiaState.ecosystemsNycthemeralCycle[uid]);
	let actuatorsState = $derived(gaiaState.ecosystemsActuatorsState[uid]);

	let name = $derived(ecosystem?.['name'] ?? '');
	let slug = $derived(slugify(name));
	let status = $derived(statusMeta[computeEcosystemStatusClass(ecosystemState)]);

	let connected = $derived(isConnected(ecosystemState));
	let running = $derived(!!ecosystemState?.['status']);
	let operational = $derived(connected && running);

	// Is the grow-light on right now? Drives the "lit" accent + ribbon tag.
	let lit = $derived.by(() => {
		const light = actuatorsState?.['light'];
		return operational && !!(light && light['active'] && light['status']);
	});

	// Inside the greenhouse's own day window? (defaults to daytime when the cycle is
	// unknown, so a card never reads "dark" merely for lack of data).
	let isDay = $derived.by(() => {
		if (isEmpty(cycle)) {
			return true;
		}
		return now >= strHoursToDate(cycle['day']) && now < strHoursToDate(cycle['night']);
	});

	// Does the ecosystem have a (configured, active) grow-light at all? So the
	// eyebrow says "Lights off" only when there ARE lights, not when there are none.
	let hasLight = $derived(!!actuatorsState?.['light']?.['active']);

	// Eyebrow = the greenhouse's live state: Day/Night from the nycthemeral cycle, plus
	// Lights on/off when the ecosystem has grow-lights.
	let eyebrowParts = $derived.by(() => {
		const parts = [];
		if (!isEmpty(cycle)) {
			parts.push(isDay ? 'Day' : 'Night');
		}
		if (hasLight) {
			parts.push(lit ? 'Lights on' : 'Lights off');
		}
		if (isEmpty(parts)) {
			if (connected) {
				parts.push("Connected")
			} else {
				parts.push("Disconnected")
			}
		}
		return parts;
	});

	// The top importance-ranked sensors to surface. The set is pluggable, so we
	// read the skeletons in order (environment first, then plants' substrate) and take
	// the first few rather than hardcoding any measure.
	let environmentSensors = $derived(gaiaState.ecosystemsSensorsSkeleton[getKey(uid, 'environment')] || []);
	let plantsSensors = $derived(gaiaState.ecosystemsSensorsSkeleton[getKey(uid, 'plants')] || []);
	let healthSensors = $derived(gaiaState.ecosystemsSensorsSkeleton[getKey(uid, 'ecosystem')] || []);

	// Tag each bone with its level so the readout key stays unique even when an air
	// measure and a substrate measure share a name (e.g. air vs. substrate temperature).
	let sensors = $derived.by(() => {
		return [
			...environmentSensors.map((bone) => ({ ...bone, level: 'environment' })),
			...plantsSensors.map((bone) => ({ ...bone, level: 'plants' }))
		].slice(0, 4);
	});

	let hasNoHardware = $derived(
		sensors.length === 0 && isEmpty(actuatorsState) && isEmpty(cameraPicturesInfo)
	);

	const recentPicture = function (timestamp) {
		return now - new Date(timestamp) < 5 * 60 * 1000;
	};

	let cameraFresh = $derived(
		!isEmpty(cameraPicturesInfo) &&
			Object.values(cameraPicturesInfo).some((camera) => recentPicture(camera['timestamp']))
	);

	// Fetch the latest current value for every sensor of a measure, then average
	// them for the readout.
	const fetchMeasure = async function (measure, measureSensors) {
		return Promise.all(
			measureSensors.map((sensor) =>
				syncSensorCurrentData(uid, sensor['uid'], measure.replace(' ', '_'))
			)
		);
	};

	// Fetched once per `sensors` change via `$effect`, not inline in the
	// template: an `{#await fetchMeasure(...)}` there re-evaluates (and
	// re-fires the fetch) on every re-render of the card, not just when the
	// sensor set actually changes.
	let currentDataLoaded = $state(false);

	$effect(() => {
		const bones = sensors;
		currentDataLoaded = false;
		Promise.all(bones.map((bone) => fetchMeasure(bone['measure'], bone['sensors']))).then(() => {
			currentDataLoaded = true;
		});
	});

	const averageMeasure = function (measureSensors, measure) {
		const values = [];
		for (const sensor of measureSensors) {
			const record = gaiaState.ecosystemsSensorsDataCurrent[getKey(uid, sensor['uid'], measure)];
			if (record) {
				values.push(record.value);
			}
		}
		if (values.length === 0) {
			return null;
		}
		return (values.reduce((a, b) => a + b) / values.length).toFixed(2);
	};

	const measureLabel = (measure) => capitalize(measure).replace('_', ' ');
</script>

<article class="panel" class:lit class:night={operational && !lit && !isDay}>
	<div class="panel-head">
		<div>
			<div class="eyebrow">{eyebrowParts.join(' · ')}</div>
			<h3>{name}</h3>
		</div>
		<span class="status {status.cls}"><span class="dot"></span>{status.label}</span>
	</div>

	{#if operational}
		{#if !isEmpty(cycle)}
			<EcosystemBand nycthemeralCycle={cycle} />
		{/if}

		{#if sensors.length > 0}
			<div
				class="readouts"
				title="Top sensors for this ecosystem (importance-ranked; the set is pluggable)"
			>
				{#each sensors as bone (`${uid}-${bone['level']}-${bone['measure']}`)}
					<div class="readout">
						<div class="rk">{measureLabel(bone['measure'])}</div>
						{#if !currentDataLoaded}
							<div class="rv faint">…</div>
						{:else}
							{@const value = averageMeasure(bone['sensors'], bone['measure'])}
							{#if value !== null}
								<div class="rv">{value}<u>{bone['units'][0]}</u></div>
							{:else}
								<div class="rv faint">—</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if !isEmpty(actuatorsState)}
			<div class="actuators">
				{#each actuatorTypes as actuatorType (`${uid}-${actuatorType}`)}
					{@const actuator = actuatorsState[actuatorType]}
					{#if actuator && actuator['active']}
						{@const auto = actuator['mode'] === 'automatic'}
						<span
							class="act"
							class:on={actuator['status']}
							title="{capitalize(actuatorType)} · {actuator['status'] ? 'on' : 'off'} · {auto
								? 'automatic'
								: 'manual'}"
						>
							<Fa icon={faSyncAlt} class="sc" spin={auto} />
							{capitalize(actuatorType)}
						</span>
					{/if}
				{/each}
			</div>
		{/if}

		{#if hasNoHardware}
			<div class="empty-state">
				<p>No sensors, actuators, or camera configured yet.</p>
				{#if appState.currentUser.can(permissions.OPERATE)}
					<a class="btn" href="{resolve(`/ecosystem/${slug}/settings`)}">Configure hardware →</a>
				{/if}
			</div>
		{:else}
			<div class="cap-strip">
				{#if environmentSensors.length > 0}
					<a class="cap" href="{resolve(`/ecosystem/${slug}/sensors/environment`)}">Environment</a>
				{/if}
				{#if plantsSensors.length > 0}
					<a class="cap" href="{resolve(`/ecosystem/${slug}/sensors/plants`)}">Plants</a>
				{/if}
				{#if healthSensors.length > 0}
					<a class="cap" href="{resolve(`/ecosystem/${slug}/sensors/health`)}">Health</a>
				{/if}
				{#if !isEmpty(actuatorsState)}
					<a class="cap" href="{resolve(`/ecosystem/${slug}/actuators`)}">Actuators</a>
				{/if}
				{#if !isEmpty(cameraPicturesInfo)}
					<a class="cap" href="{resolve(`/ecosystem/${slug}/camera`)}">
						Camera<span class="dot" class:on={cameraFresh} class:stale={!cameraFresh}></span>
					</a>
				{/if}
			</div>
		{/if}
	{:else if connected}
		<div class="empty-state">
			<p>This ecosystem is not currently running.</p>
			{#if appState.currentUser.can(permissions.OPERATE)}
				<a class="btn" href="{resolve(`/ecosystem/${slug}/settings`)}">Configure &amp; start →</a>
			{/if}
		</div>
	{:else}
		<div class="offline-body">
			<p>{running ? 'Running, but unreachable.' : 'Not running and not connected.'}</p>
			<p class="faint">Last seen {formatDateTime(ecosystemState['last_seen'])}</p>
		</div>
	{/if}
</article>

<style>
	.panel {
		position: relative;
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--edge, var(--border-strong));
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 15px 16px 16px;
		display: flex;
		flex-direction: column;
		gap: 13px;
	}

	.panel.lit {
		--edge: var(--grow);
	}

	.panel.lit::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--radius);
		background: radial-gradient(120% 60% at 0% 0%, var(--grow-soft), transparent 60%);
		pointer-events: none;
	}

	.panel.night {
		--edge: #5566a0;
	}

	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}

	.panel-head h3 {
		font-family: 'Garamond', Georgia, serif;
		font-weight: 600;
		font-size: 1.2rem;
		margin: 2px 0 0;
		line-height: 1.1;
		color: var(--text);
	}

	.eyebrow {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.status {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		padding: 4px 9px;
		border-radius: 3px;
		white-space: nowrap;
	}

	.status .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.status.running {
		background: color-mix(in srgb, var(--good-green) 15%, transparent);
		color: var(--good-green);
	}
	.status.running .dot {
		background: var(--good-green);
	}

	.status.stopped {
		background: color-mix(in srgb, var(--critical-red) 14%, transparent);
		color: var(--critical-red);
	}
	.status.stopped .dot {
		background: var(--critical-red);
	}

	.status.disconnected {
		background: var(--surface-2);
		color: var(--text-dim-solid);
	}
	.status.disconnected .dot {
		background: var(--text-dim-solid);
	}

	/* Sensor readouts: labels quiet, figures loud + tabular */
	.readouts {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px 14px;
		margin-bottom: 4px;
	}

	.rk {
		font-size: 0.66rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		font-weight: 700;
		margin-bottom: 1px;
	}

	.rv {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.05;
		color: var(--text);
	}

	.rv u {
		text-decoration: none;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-dim-solid);
		margin-left: 2px;
	}

	.rv.faint {
		color: var(--text-faint);
	}

	/* Actuators: colour = on/off, spinning status-circle = automatic, and the
	   AUTO/MAN label carries the same meaning when motion is unavailable. */
	.actuators {
		display: flex;
		flex-wrap: wrap;
		gap: 7px;
	}

	.act {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 5px 9px;
		border-radius: 3px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		color: var(--text-dim-solid);
	}

	.act.on {
		color: var(--text);
		border-color: color-mix(in srgb, var(--grow) 40%, var(--border));
	}

	.act :global(.sc) {
		width: 11px;
		height: 11px;
		color: var(--text-dim-solid);
	}

	.act.on :global(.sc) {
		color: var(--grow);
	}

	.act .mode {
		margin-left: 2px;
		font-size: 0.56rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		color: var(--text-faint);
	}

	/* Capability strip: scannable footer + deep links */
	.cap-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: auto;
		padding-top: 3px;
	}

	.cap {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--text-dim-solid);
		text-decoration: none;
		padding: 5px 9px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--surface-2);
	}

	.cap:hover {
		color: var(--grow);
		border-color: color-mix(in srgb, var(--grow) 40%, var(--border));
	}

	.cap .dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}

	.cap .dot.on {
		background: var(--good-green);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--good-green) 20%, transparent);
	}

	.cap .dot.stale {
		background: var(--text-faint);
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		gap: 11px;
		padding: 4px 0 2px;
		margin-top: auto;
	}

	.empty-state p {
		margin: 0;
		color: var(--text-dim-solid);
		font-size: 0.85rem;
	}

	.btn {
		align-self: flex-start;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--grow);
		text-decoration: none;
		padding: 7px 12px;
		border: 1px solid color-mix(in srgb, var(--grow) 45%, var(--border));
		border-radius: 3px;
	}

	.btn:hover {
		background: var(--grow-soft);
	}

	.offline-body {
		color: var(--text-dim-solid);
		font-size: 0.85rem;
	}

	.offline-body p {
		margin: 0;
	}

	.offline-body .faint {
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
		margin-top: 3px;
	}
</style>
