<script>
	import { createEventDispatcher } from 'svelte';

	export let disabled = false;
	export let id = 'primary';
	export let checked = true;

	const dispatch = createEventDispatcher();

	const label = id + 'Button';

	const toggle = function (event) {
		const target = event.target;
		const state = target.getAttribute('aria-checked');
		checked = state !== 'true';
		dispatch('toggle', {
			checked
		});
	};
</script>

<div class="slider">
	<button
		role="switch"
		{disabled}
		aria-checked={checked}
		aria-labelledby={label}
		on:click={toggle}
	/>
</div>

<style>
	:root {
		--accent-color: #2196f3;
		--gray: #ccc;
	}

	.slider {
		display: flex;
		align-items: center;
	}

	.slider button {
		width: 3em;
		height: 1.6em;
		position: relative;
		margin: 0 0 0 0.5em;
		background: var(--gray);
		border: none;
	}

	.slider button::before {
		content: '';
		position: absolute;
		width: 1.3em;
		height: 1.3em;
		background: #fff;
		top: 0.13em;
		right: 1.5em;
		transition: transform 0.3s;
	}

	.slider button[aria-checked='true'] {
		background-color: var(--accent-color);
	}

	.slider button[aria-checked='true']::before {
		transform: translateX(1.3em);
		transition: transform 0.3s;
	}

	.slider button {
		border-radius: 1.5em;
	}

	.slider button::before {
		border-radius: 100%;
	}
</style>
