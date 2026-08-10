<script>
	import Fa from 'svelte-fa';
	import { faPenToSquare, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';

	import { permissions } from '$lib/utils/consts.js';
	import { getLevelColor, getStatusClass } from '$lib/utils/functions.js';
	import { appState } from '$lib/store.svelte.js';

	let {
		tableID,
		columns = [],
		// [{
		//   label: "My column", key: "data_key", isStatus: false, isLevel: false, isLink: false,
		//   statusLabels: ['On', 'Off'] (for isStatus only)
		//   serializer: undefined | function(value)
		// }]
		data = [], // [{data_key: data1}, {data_key: data2}]
		editable = false,
		crudOptions = ['create', 'update', 'delete'],
		createLabel = 'Add an entry',
		emptyText = 'Nothing here yet.',
		oncrud = (payload) => {}
	} = $props();

	const emitEvent = function (action, rowIndex) {
		const payload = {
			action: action,
			rowIndex: rowIndex
		};
		oncrud(payload);
	};

	let canEdit = $derived(appState.currentUser.can(permissions.OPERATE) && editable);
	let showRowActions = $derived(
		canEdit && (crudOptions.includes('update') || crudOptions.includes('delete'))
	);
	let showCreate = $derived(canEdit && crudOptions.includes('create'));
	let columnCount = $derived(columns.length + (showRowActions ? 1 : 0));

	// A row carries a state when one of its columns is a status or a level. That
	// column drives both its own pill and the row's left rail.
	let stateColumn = $derived(
		columns.find((column) => column['isStatus'] === true || column['isLevel'] === true)
	);

	const serialize = function (column, row) {
		const serializer = column['serializer'] ? column['serializer'] : (value) => value;
		return serializer(row[column['key']]);
	};

	const isBlank = function (value) {
		return value === null || value === undefined || value === '';
	};

	const stateTone = function (column, row) {
		if (column['isLevel'] === true) {
			return getLevelColor(row[column['key']]);
		}
		return getStatusClass(row[column['key']]) === 'on' ? '--good-green' : '--critical-red';
	};

	const statusLabel = function (column, row) {
		const labels = column['statusLabels'] ? column['statusLabels'] : ['On', 'Off'];
		return getStatusClass(row[column['key']]) === 'on' ? labels[0] : labels[1];
	};

	// Names the row for the action buttons' accessible labels.
	const rowName = function (row) {
		return columns.length > 0 ? String(serialize(columns[0], row) ?? '') : '';
	};

	// svelte-ignore state_referenced_locally
	if (import.meta.env.DEV && data.length > 0) {
		/**
		 * Check if columns and data keys match
		 */
		for (const column of columns) {
			if (!Object.prototype.hasOwnProperty.call(data[0], column.key)) {
				console.warn("SimpleTable '" + tableID + "': Columns and data keys do not match");
				break;
			}
		}
	}
</script>

<div class="tbl-card">
	<div class="tbl-scroll">
		<table class="tbl">
			<thead>
				<tr>
					{#each columns as column (column['label'])}
						<th>{column.label}</th>
					{/each}
					{#if showRowActions}
						<th class="acts">Action</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each data as row, rowIndex}
					{@const rail = stateColumn ? stateTone(stateColumn, row) : null}
					<tr style={rail ? `--rail: var(${rail})` : null}>
						{#each columns as column (`row-${rowIndex}-${column['label']}`)}
							{@const value = serialize(column, row)}
							<td data-label={column.label}>
								{#if column['isStatus'] === true}
									{@const tone = stateTone(column, row)}
									<span class="pill" style="--tone: var({tone})">
										<span class="dot"></span>{statusLabel(column, row)}
									</span>
								{:else if column['isLevel'] === true}
									{@const tone = stateTone(column, row)}
									<span class="pill" style="--tone: var({tone})">
										<span class="dot"></span>{value}
									</span>
								{:else if column['isLink'] === true}
									<a class="lnk" href={value}>Open →</a>
								{:else if isBlank(value)}
									<span class="none">—</span>
								{:else}
									{value}
								{/if}
							</td>
						{/each}
						{#if showRowActions}
							<td class="acts" data-label="Action">
								{#if crudOptions.includes('update')}
									<button
										class="act"
										type="button"
										title="Edit"
										aria-label="Edit {rowName(row)}"
										onclick={() => emitEvent('update', rowIndex)}
									>
										<Fa icon={faPenToSquare} />
									</button>
								{/if}
								{#if crudOptions.includes('delete')}
									<button
										class="act del"
										type="button"
										title="Delete"
										aria-label="Delete {rowName(row)}"
										onclick={() => emitEvent('delete', rowIndex)}
									>
										<Fa icon={faTrashCan} />
									</button>
								{/if}
							</td>
						{/if}
					</tr>
				{:else}
					<tr>
						<td class="empty" colspan={columnCount}>{emptyText}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if showCreate}
		<div class="tbl-foot">
			<button class="add" type="button" onclick={() => emitEvent('create')}>
				<Fa icon={faPlus} />
				{createLabel}
			</button>
		</div>
	{/if}
</div>

<style>
	.tbl-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
		margin-bottom: 1.5rem;
		/* the narrow form below keys off this card's width, not the viewport */
		container-type: inline-size;
	}

	.tbl-scroll {
		overflow-x: auto;
	}

	.tbl {
		width: 100%;
		border-collapse: collapse;
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.82rem;
		line-height: 1.35;
		color: var(--text);
	}

	.tbl th {
		font-family: 'Raleway', sans-serif;
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--text-dim-solid);
		text-align: left;
		white-space: nowrap;
		padding: 12px 14px 10px;
		border-bottom: 1px solid var(--border-strong);
	}

	.tbl td {
		padding: 11px 14px;
		border-top: 1px solid var(--border);
		vertical-align: middle;
	}

	.tbl tbody tr:first-child td {
		border-top: 0;
	}

	.tbl tbody tr:hover td {
		background: var(--surface-2);
	}

	/* first column names the row, and carries the rail */
	.tbl tbody td:first-child {
		font-weight: 600;
		white-space: nowrap;
		box-shadow: inset 3px 0 0 var(--rail, transparent);
	}

	.none {
		color: var(--text-faint);
	}

	/* state pill — the ecosystem card's status chip, driven by one --tone */
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

	.lnk {
		font-family: 'Raleway', sans-serif;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--grow);
		text-decoration: none;
		white-space: nowrap;
	}

	.lnk:hover {
		text-decoration: underline;
	}

	.acts {
		width: 1%;
		white-space: nowrap;
		text-align: right;
	}

	.act {
		border: 0;
		background: none;
		padding: 6px;
		border-radius: 3px;
		font-size: 0.85rem;
		line-height: 0;
		color: var(--text-faint);
		cursor: pointer;
		transition:
			color 120ms ease,
			background 120ms ease;
	}

	.act + .act {
		margin-left: 2px;
	}

	.act:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	.act.del:hover {
		color: var(--critical-red);
	}

	.act:focus-visible,
	.add:focus-visible,
	.lnk:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	.empty {
		padding: 30px 14px;
		text-align: center;
		color: var(--text-faint);
		font-size: 0.8rem;
	}

	/* the create control leaves the row grid and names what it adds */
	.tbl-foot {
		display: flex;
		padding: 9px 12px;
		border-top: 1px solid var(--border);
		background: var(--surface-2);
	}

	.add {
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

	.add:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	/* Narrow: the table stops pretending to be a table. Each row becomes a card,
	   the column headers move down into the cells as labels, and the rail moves
	   to the card's left edge. */
	@container (max-width: 620px) {
		.tbl thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.tbl,
		.tbl tbody,
		.tbl tbody tr {
			display: block;
		}

		/* the rail moves from the first cell to the card's own left edge */
		.tbl tbody tr {
			border-top: 1px solid var(--border);
			padding: 10px 14px 12px;
			box-shadow: inset 3px 0 0 var(--rail, transparent);
		}

		.tbl tbody tr:first-child {
			border-top: 0;
		}

		.tbl tbody td {
			border: 0;
			padding: 3px 0;
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 14px;
			text-align: left;
		}

		.tbl tbody td::before {
			content: attr(data-label);
			font-family: 'Raleway', sans-serif;
			font-size: 0.6rem;
			font-weight: 700;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: var(--text-faint);
			flex: none;
		}

		/* matches the desktop `td:first-child` rail rule's specificity, so the
		   rail is not drawn a second time inside the card */
		.tbl tbody td:first-child {
			box-shadow: none;
			font-size: 0.95rem;
			padding-bottom: 6px;
		}

		.tbl tbody td:first-child::before {
			display: none;
		}

		.tbl tbody td.acts {
			width: auto;
			margin-top: 6px;
		}

		.tbl tbody td.empty {
			display: block;
			text-align: center;
		}

		.tbl tbody td.empty::before {
			display: none;
		}
	}
</style>
