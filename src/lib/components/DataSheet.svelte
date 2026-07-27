<script>
	import Fa from 'svelte-fa';
	import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

	import { permissions } from '$lib/utils/consts.js';
	import { appState } from '$lib/store.svelte.js';

	// A record-holding component, not a register.
	// (compared to `Table` that lists many rows that share a shape, `DataSheet` rows can be unrelated to
	// each others)
	let {
		rows = [],
		// [{
		//   label: 'UID',
		//   value: 'GAIA-1' | ['line one', 'line two'],
		//   statusClass: 'on' | 'off' | 'deco',  // renders `value` as a pill and tones the card's rail
		//   labelId: 'sensorsButton',            // names a control rendered by `content`
		//   content: snippet(row)                // when the value is not text
		// }]
		actionLabel = null,
		onaction = () => {},
		// When a record has more than one act, `actions` replaces the `actionLabel`/
		// `onaction` shorthand: [{ label, onaction, icon?, danger? }]
		actions = null,
		// `null` for a sheet whose page already gates who can reach it (the user
		// profile: its own owner is not necessarily an operator)
		actionPermission = permissions.OPERATE
	} = $props();

	const tones = {
		on: '--good-green',
		off: '--critical-red',
		deco: '--text-dim-solid'
	};

	// The status row tones the card's left rail, the same way a `Table` row's
	// state column drives its own.
	let rail = $derived.by(() => {
		const statusRow = rows.find((row) => row['statusClass']);
		return statusRow ? tones[statusRow['statusClass']] : null;
	});

	let acts = $derived(actions ?? (actionLabel !== null ? [{ label: actionLabel, onaction }] : []));

	let showActions = $derived(
		acts.length > 0 &&
			(actionPermission === null || appState.currentUser.can(actionPermission))
	);

	const isBlank = function (value) {
		return value === null || value === undefined || value === '';
	};
</script>

<div class="sheet" style={rail ? `--rail: var(${rail})` : null}>
	<dl>
		{#each rows as row (row['label'])}
			<dt id={row['labelId']}>{row['label']}</dt>
			<dd>
				{#if row['content']}
					{@render row['content'](row)}
				{:else if row['statusClass']}
					<span class="pill" style="--tone: var({tones[row['statusClass']]})">
						<span class="dot"></span>{row['value']}
					</span>
				{:else if Array.isArray(row['value'])}
					{#each row['value'] as line (line)}
						<span class="line">{line}</span>
					{/each}
				{:else if isBlank(row['value'])}
					<span class="none">—</span>
				{:else}
					{row['value']}
				{/if}
			</dd>
		{/each}
	</dl>
	{#if showActions}
		<div class="foot">
			{#each acts as act (act['label'])}
				<button
					class="act"
					class:danger={act['danger']}
					type="button"
					onclick={() => act['onaction']()}
				>
					<Fa icon={act['icon'] || faPenToSquare} />
					{act['label']}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.sheet {
		position: relative;
		max-width: 560px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
		margin-bottom: 1.5rem;
		/* the stacked form below keys off this card's width, not the viewport */
		container-type: inline-size;
	}

	/* The rail runs the card's full height, footer included. */
	.sheet::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: 3px;
		background: var(--rail, transparent);
	}

	dl {
		display: grid;
		grid-template-columns: minmax(0, max-content) minmax(0, 1fr);
		align-items: center;
		column-gap: 26px;
		margin: 0;
		padding: 12px 16px 14px;
	}

	/* The label is the app-wide kicker, the same one `Table` uses for its column headers */
	dt {
		font-family: 'Raleway', sans-serif;
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		white-space: nowrap;
		padding: 6px 0;
	}

	dd {
		margin: 0;
		padding: 6px 0;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.88rem;
		line-height: 1.35;
		color: var(--text);
	}

	.line {
		display: block;
	}

	.none {
		color: var(--text-faint);
	}

	/* State pill — same chip as `Table` and `EcosystemCard`, driven by one --tone */
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: 'Raleway', sans-serif;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		padding: 3px 8px;
		border-radius: 3px;
		white-space: nowrap;
		background: color-mix(in srgb, var(--tone) 14%, transparent);
		color: var(--tone);
	}

	.pill .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex: none;
		background: var(--tone);
	}

	/* The edit control leaves the rows and names the act, as in `Table` */
	.foot {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 9px 12px;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}

	.act {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-family: 'Raleway', sans-serif;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		padding: 7px 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-dim-solid);
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease;
	}

	.act:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.act:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	/* A destructive act carries the warning in the ink, not in a filled button —
	   the footer is a row of equals until one of them is pressed */
	.act.danger {
		color: var(--critical-red);
	}

	.act.danger:hover {
		border-color: var(--critical-red);
		color: var(--critical-red);
	}

	/* Narrow: the label stops holding a column of its own and becomes an eyebrow
	   above its value. */
	@container (max-width: 340px) {
		dl {
			grid-template-columns: minmax(0, 1fr);
		}

		dt {
			padding: 8px 0 0;
		}

		dd {
			padding: 0 0 4px;
		}
	}
</style>
