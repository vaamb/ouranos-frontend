<script>
	import Fa from 'svelte-fa';

	/**
	 * One entry in `Header`'s `.ctx` / `.core` zones
	 *
	 * @typedef {Object} Props
	 * @property {string} [label] - the uppercase key, e.g. "Server"
	 * @property {string|number} value - the figure, e.g. 24, "3/4 up"
	 * @property {string} [unit] - small dim suffix inside the value, e.g. "ms"
	 * @property {boolean} [dot] - leading "live" dot
	 * @property {any} [icon] - leading Font Awesome icon (used instead of a label)
	 * @property {string} [href] - when set, renders as a link
	 * @property {'default'|'good'|'warn'|'grow'} [tone] - colours the value
	 * @property {string} [description] - accessible name; defaults to "label value unit"
	 */

	/** @type {Props} */
	let {
		value,
		label = '',
		unit = '',
		dot = false,
		icon = null,
		href = '',
		tone = 'default',
		description = ''
	} = $props();

	const accessibleName = $derived(description || `${label} ${value} ${unit}`.trim());
</script>

{#snippet body()}
	{#if dot}
		<span class="dot live" aria-hidden="true"></span>
	{/if}
	{#if icon}
		<span class="icon" aria-hidden="true"><Fa {icon} /></span>
	{/if}
	{#if label}
		<span class="label">{label}</span>
	{/if}
	<span class="value {tone}">
		{value}{#if unit}<span class="unit">{unit}</span>{/if}
	</span>
{/snippet}

{#if href}
	<a class="stat {tone}" {href} aria-label={accessibleName}>
		{@render body()}
	</a>
{:else}
	<div class="stat" title={accessibleName}>
		{@render body()}
	</div>
{/if}

<style>
	.stat {
		display: flex;
		align-items: baseline;
		gap: 7px;
		padding: 7px 12px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		font-family: 'Raleway', sans-serif;
		text-decoration: none;
		white-space: nowrap;
	}

	.label {
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		font-weight: 700;
	}

	.value {
		font-family: 'Open Sans', system-ui, sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 15px;
		font-weight: 600;
		color: var(--text);
	}

	.value.good {
		color: var(--good-green);
	}

	.value.warn {
		color: var(--critical-red);
	}

	.value.grow {
		color: var(--grow);
	}

	.unit {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-dim-solid);
		margin-left: 1px;
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		display: inline-block;
		flex: none;
		background: var(--good-green);
	}

	.dot.live {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--good-green) 22%, transparent);
	}

	.icon {
		align-self: center;
		display: inline-flex;
		font-size: 13px;
		color: var(--text-dim-solid);
	}

	/* Link variant — the chip is unchanged, only the affordances are added. */
	a.stat:hover {
		border-color: var(--border-strong);
	}

	a.stat:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	a.stat.warn .icon {
		color: var(--critical-red);
	}

	a.stat.warn:hover {
		border-color: var(--critical-red);
	}

	a.stat.warn:focus-visible {
		outline-color: var(--critical-red);
	}
</style>
