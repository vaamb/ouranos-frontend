<script>
	import { createEventDispatcher } from 'svelte';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import { isEmpty, isObject } from '$lib/utils/functions.js';

	let { data } = $props();
	// [{
	//   label: "The input", key: "the_input", value: "the value", hint: "This is what you should enter"
	//   type: "text",
	//   selectFrom: [{ label: "The input", value: "the_value" }]
	//   validate: function(value) { return value === "validated" },
	// }]

	const notEmptyValue = function (value) {
		return value !== '';
	};

	const getValues = function (data) {
		const rv = {};
		for (const row of data) {
			rv[row['key']] = {
				value: row['value'] !== undefined ? row['value'] : '',
				validate: row['validate'] !== undefined ? row['validate'] : notEmptyValue
			};
		}
		return rv;
	};

	const values = getValues(data);

	const canSubmit = function (data) {
		for (const [_, obj] of Object.entries(data)) {
			const validate = obj['validate'];
			if (!validate(obj['value'])) {
				return false;
			}
		}
		return true;
	};

	let disabledSubmit = $derived(!canSubmit(values));

	const dispatch = createEventDispatcher();

	const cancel = function () {
		dispatch('cancel');
	};

	const confirm = function () {
		const payload = {};
		for (const [key, obj] of Object.entries(values)) {
			payload[key] = obj['value'];
		}
		dispatch('confirm', payload);
	};
</script>

<table style="display: table">
	<tbody>
		{#each data as row}
			<tr>
				<td>
					<label for={row['key']}>{row['label'] || row['key']}</label>
				</td>
				<td style="width: 10px"></td>
				<td>
					{#if isEmpty(row['selectFrom'])}
						<input
							id={row['key']}
							type={row['type'] !== undefined ? row['type'] : null}
							bind:value={values[row['key']]['value']}
							disabled={row['disabled']}
							placeholder={row['hint'] ? row['hint'] : ''}
						/>
					{:else}
						<select
							id={row['key']}
							bind:value={values[row['key']]['value']}
							disabled={row['disabled']}
							title={row['hint'] ? row['hint'] : ''}
						>
							{#if !row['value']}
								<option disabled value="">Select one</option>
							{/if}
							{#each row['selectFrom'] as choice}
								{#if isObject(choice)}
									<option value={choice['value']}>
										{choice['label'] || choice['value']}
									</option>
								{:else}
									<option value={choice}>
										{choice}
									</option>
								{/if}
							{/each}
						</select>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>
<ConfirmButtons disabled={disabledSubmit} on:confirm={confirm} on:cancel={cancel} />

<style>
	input {
		height: 1.3rem;
		width: 216px;
	}

	select {
		height: 1.5rem;
		width: 218px;
	}
	option {
		height: 1.5rem;
	}

	input:disabled {
		background-color: var(--gray-90);
		border: var(--gray-50) 1px solid;
	}

	tr {
		height: 27px;
	}
</style>
