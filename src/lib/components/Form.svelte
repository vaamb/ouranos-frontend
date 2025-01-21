<script>
	import { createEventDispatcher } from 'svelte';

	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';

	import { isEmpty, isObject } from '$lib/utils/functions.js';

	let { data } = $props();
	// [{
	//   label: "The input", key: "the_input", value: "the value", hint: String
	//   type: undefined | String, min: undefined | Number, max: undefined | Number, step: undefined | Number,
	//   serializer: undefined | function(value), deserializer: undefined | function(value),
	//   pattern: undefined | regex, selectFrom: [{ label: "The input", value: "the_value" }]
	//   validate: undefined | function(value) { return value === "validated" },
	// }]

	const notEmptyValue = function (value) {
		return value !== '';
	};

	const getValues = function (data) {
		const rv = {};
		for (const row of data) {
			const serializer =
				row['serializer'] !== undefined
					? row['serializer']
					: (value) => {
							return value;
						};
			const deserializer =
				row['deserializer'] !== undefined
					? row['deserializer']
					: (value) => {
							return value;
						};
			rv[row['key']] = {
				value: row['value'] !== undefined ? serializer(row['value']) : '',
				validate: row['validate'] !== undefined ? row['validate'] : notEmptyValue,
				deserializer: deserializer
			};
		}
		return rv;
	};

	let values = $state(getValues(data));

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
			payload[key] = obj['deserializer'](obj['value']);
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
							min={row['min'] !== undefined ? row['min'] : null}
							max={row['max'] !== undefined ? row['max'] : null}
							step={row['step'] !== undefined ? row['step'] : null}
							pattern={row['pattern'] !== undefined ? row['pattern'] : null}
							disabled={row['disabled']}
							placeholder={row['hint'] ? row['hint'] : null}
						/>
					{:else}
						<select
							id={row['key']}
							bind:value={values[row['key']]['value']}
							disabled={row['disabled']}
							title={row['hint'] ? row['hint'] : null}
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
				<td>
					{#if values[row['key']] !== ''}
						&nbsp;
						<Fa
							icon={faCircle}
							class={values[row['key']]['validate'](values[row['key']]['value']) ? 'on' : 'off'}
						/>
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
		font-family: inherit;
	}

	select {
		height: 1.5rem;
		width: 218px;
		font-family: inherit;
	}

	option {
		height: 1.5rem;
		font-family: inherit;
	}

	input:disabled {
		background-color: var(--gray-90);
		border: var(--gray-50) 1px solid;
	}

	tr {
		height: 27px;
	}
</style>
