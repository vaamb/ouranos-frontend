<script>
	import Fa from 'svelte-fa';
	import {
		faCircle,
		faLink,
		faPenToSquare,
		faSquarePlus,
		faTrashCan
	} from '@fortawesome/free-solid-svg-icons';

	import { permissions } from '$lib/utils/consts.js';
	import { getStatusClass } from '$lib/utils/functions.js';
	import { currentUser } from '$lib/store.svelte.js';

	let {
		tableID,
		columns = [],
		// [{
		//   label: "My column", key: "data_key", isStatus: false, isLink: false,
		//   serializer: undefined | function(value)
		// }]
		data = [], // [{data_key: data1}, {data_key: data2}]
		editable = false,
		crudOptions = ['create', 'update', 'delete'],
		oncrud = (payload) => {}
	} = $props();

	const emitEvent = function (action, rowIndex) {
		const payload = {
			action: action,
			rowIndex: rowIndex
		};
		oncrud(payload);
	};

	const checkCongruency = function () {
		for (const column of columns) {
			if (!Object.prototype.hasOwnProperty.call(data[0], column.key)) {
				console.warn("SimpleTable '" + tableID + "': Columns and data keys do not match");
				break;
			}
		}
	};

	if (data.length > 0) {
		checkCongruency();
	}
</script>

<div class="table-wrap">
	<table class="table-base table-spaced table-alternate-colors">
		<thead>
			<tr>
				{#each columns as column}
					<th>{column.label}</th>
				{/each}
				{#if $currentUser.can(permissions.OPERATE) && editable}
					<th>Action</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each data as row, rowIndex}
				<tr>
					{#each columns as column}
						{@const serializer = column['serializer'] ? column['serializer'] : (value) => value}
						{@const value = serializer(row[column.key])}
						<td>
							{#if column['isStatus'] === true}
								<Fa icon={faCircle} class={getStatusClass(value)} />
							{:else if column['isLink'] === true}
								<a href={value}>
									<Fa icon={faLink} />
								</a>
							{:else}
								{value}
							{/if}
						</td>
					{/each}
					{#if $currentUser.can(permissions.OPERATE) && editable && (crudOptions.includes('update') || crudOptions.includes('delete'))}
						<td>
							<div>
								{#if crudOptions.includes('update')}
									<button class="crud-button" onclick={() => emitEvent('update', rowIndex)}>
										<Fa icon={faPenToSquare} />
									</button>
								{/if}
								{#if crudOptions.includes('delete')}
									<button class="crud-button" onclick={() => emitEvent('delete', rowIndex)}>
										<Fa icon={faTrashCan} />
									</button>
								{/if}
							</div>
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
		{#if $currentUser.can(permissions.OPERATE) && editable && crudOptions.includes('create')}
			<tbody>
				<tr class="table-bigger-line">
					<td colspan="8" style="text-align: center; vertical-align: middle">
						<button
							class="crud-button"
							style="font-size: 2rem"
							onclick={() => emitEvent('create')}
						>
							<Fa icon={faSquarePlus} />
						</button>
					</td>
				</tr>
			</tbody>
		{/if}
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
	}
</style>
