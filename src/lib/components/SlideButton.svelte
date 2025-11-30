<script>
	let {
		disabled = false,
		id = 'primary',
		checked = $bindable(true),
		ontoggle = (checked) => {}
	} = $props();

	const label = id + 'Button';

	const toggle = function (event) {
		const target = event.target;
		const state = target.getAttribute('aria-checked');
		checked = state !== 'true';
		ontoggle(checked);
	};
</script>

<div class="slider">
	<button
		role="switch"
		{disabled}
		aria-checked={checked}
		aria-labelledby={label}
		onclick={toggle}
	></button>
</div>

<style>
	.slider {
		display: flex;
		align-items: center;
	}

	.slider button {
		width: 3em;
		height: 1.6em;
		position: relative;
		margin: 0 0 0 0.5em;
		background: var(--gray-80);
		border: none;
		border-radius: 1.5em;
	}

	.slider button:disabled {
		background-color: var(--gray-70);
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
		border-radius: 100%;
	}

	.slider button[aria-checked='true'] {
		background-color: var(--blue-accent);
	}

	.slider button[aria-checked='true']:disabled {
		background-color: hsl(207, 30%, 68%);
	}

	.slider button[aria-checked='true']::before {
		transform: translateX(1.3em);
		transition: transform 0.3s;
	}
</style>
