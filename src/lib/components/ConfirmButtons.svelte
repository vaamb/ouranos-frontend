<script>
	import { createEventDispatcher } from 'svelte';

	let { disabled = false } = $props();

	const dispatch = createEventDispatcher();

	const cancel = function () {
		dispatch('cancel');
	};

	const confirm = function () {
		dispatch('confirm');
	};
</script>

<div style="display: flex; justify-content: center; margin-top: 10px">
	<button class="confirm" onclick={confirm} {disabled}> Confirm </button>
	<button class="cancel" onclick={cancel}>Cancel</button>
</div>

<style>
	button {
		border: none;
		color: white;
		padding: 0.7em 1.4em;
		margin: 0 25px;
		text-align: center;
		border-radius: 7px;
		font-size: 1rem;
		cursor: pointer;
	}

	button:disabled {
		background-color: var(--derived-50);
		cursor: not-allowed;
	}

	.confirm {
		background-color: var(--green);
	}

	.cancel {
		background-color: var(--red);
	}
</style>
