<script>
	import { appState } from '$lib/store.svelte.js';
	import { permissions } from '$lib/utils/consts.js';

	// The actuator's control panel: what it is doing right now, and the three ways
	// to change it. Two orthogonal channels, never mixed — colour says on/off, and
	// motion + a word say automatic/manual (motion alone fails `prefers-reduced-motion`).
	let {
		actuatorType,
		status = false,
		mode = 'automatic',
		turnToOptions = ['on', 'off', 'automatic'],
		useTimer = false,
		onswitch = (payload) => {}
	} = $props();

	let countdown = $state('00:00:00');
	let seconds = $derived.by(() => {
		const [h, m, s] = countdown.split(':');
		return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
	});

	let canOperate = $derived(appState.currentUser.can(permissions.OPERATE));

	// An option is the current one when the actuator is already in that state:
	// `automatic` when Gaia decides, `on`/`off` when a human has forced it.
	const isCurrent = function (option) {
		if (option === 'automatic') {
			return mode === 'automatic';
		}
		return mode !== 'automatic' && status === (option === 'on');
	};

	const emitEvent = function (actuatorMode) {
		onswitch({ actuatorType: actuatorType, mode: actuatorMode, countdown: seconds });
		countdown = '00:00:00';
	};

	// The dial: a ring with two gaps, an arrow head closing each arc. It is the
	// page's old 6x `faSyncAlt` drawn at its real size rather than an icon scaled up.
	const radius = 34;
	const circumference = 2 * Math.PI * radius;
	const heads = [0.36, 0.86].map((fraction) => {
		const degrees = fraction * 360;
		const radians = ((degrees - 90) * Math.PI) / 180;
		return {
			x: 50 + radius * Math.cos(radians),
			y: 50 + radius * Math.sin(radians),
			degrees: degrees
		};
	});
</script>

<div class="panel" style="--tone: var({status ? '--good-green' : '--text-dim-solid'})">
	<div class="state">
		<svg class="dial" class:turning={mode === 'automatic'} viewBox="0 0 100 100" aria-hidden="true">
			<circle class="track" cx="50" cy="50" r={radius} />
			<g class="rotor">
				<circle
					class="arc"
					cx="50"
					cy="50"
					r={radius}
					transform="rotate(-90 50 50)"
					stroke-dasharray="{circumference * 0.36} {circumference * 0.14}"
				/>
				{#each heads as head (head.degrees)}
					<path
						class="head"
						d="M-6.5,-9 L8,0 L-6.5,9 Z"
						transform="translate({head.x.toFixed(1)},{head.y.toFixed(1)}) rotate({head.degrees})"
					/>
				{/each}
			</g>
		</svg>
		<p class="reading">{status ? 'On' : 'Off'}</p>
		<p class="mode" class:manual={mode !== 'automatic'}>
			{mode === 'automatic' ? 'Automatic' : 'Manual'}
		</p>
	</div>

	{#if canOperate}
		<div class="controls">
			<div class="stack" role="group" aria-label="Switch {actuatorType}">
				{#each turnToOptions as option (option)}
					<!-- Pressing the current state again is legitimate: it restarts the hold. -->
					<button type="button" aria-pressed={isCurrent(option)} onclick={() => emitEvent(option)}>
						{option}
					</button>
				{/each}
			</div>
			{#if useTimer}
				<div class="hold">
					<label for="hold-{actuatorType}">Hold for</label>
					<input id="hold-{actuatorType}" type="time" step="1" bind:value={countdown} />
				</div>
			{/if}
		</div>
	{:else}
		<!-- Say why once, in words: a `title` on a dead button is not an explanation. -->
		<p class="denied">Log in as an operator to switch this actuator.</p>
	{/if}
</div>

<style>
	.panel {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 16px;
		padding: 14px 16px;
		background: var(--surface-2);
		/* The panel is its own ground, so it owns the edge between itself and
		   whatever it sits beside. 620px is the actuator card's stacking point. */
		border-right: 1px solid var(--border);
	}

	@container (max-width: 620px) {
		.panel {
			border-right: 0;
			border-bottom: 1px solid var(--border);
		}
	}

	.state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.dial {
		width: 84px;
		height: 84px;
		color: var(--tone);
	}

	.track {
		fill: none;
		stroke: var(--border-strong);
		stroke-width: 8;
		opacity: 0.55;
	}

	.arc {
		fill: none;
		stroke: currentColor;
		stroke-width: 8;
	}

	.head {
		fill: currentColor;
	}

	/* Turning = Gaia is deciding. Stopped = a human is holding it. */
	.rotor {
		transform-origin: 50px 50px;
	}

	.dial.turning .rotor {
		animation: turn 3.4s linear infinite;
	}

	@keyframes turn {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dial.turning .rotor {
			animation: none;
		}
	}

	.reading {
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 1;
		color: var(--tone);
	}

	.mode {
		margin-top: -3px;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.mode.manual {
		color: var(--amber);
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.stack button {
		font-family: 'Raleway', sans-serif;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		padding: 8px 10px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-dim-solid);
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease;
	}

	.stack button:hover {
		border-color: var(--text-dim-solid);
		color: var(--text);
	}

	/* The state the actuator is already in reads as filled ink. */
	.stack button[aria-pressed='true'] {
		background: var(--leaf);
		border-color: var(--leaf);
		color: var(--leaf-dark);
	}

	.stack button:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	.hold {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.hold label {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
	}

	.hold input {
		width: 100%;
		box-sizing: border-box;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		padding: 5px 7px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
	}

	.hold input:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 1px;
	}

	.denied {
		font-size: 0.78rem;
		line-height: 1.4;
		color: var(--text-dim-solid);
	}

	@container (max-width: 420px) {
		.panel {
			grid-template-columns: minmax(0, 1fr);
			justify-items: center;
		}

		.controls,
		.stack {
			width: 100%;
			max-width: 220px;
		}
	}
</style>
