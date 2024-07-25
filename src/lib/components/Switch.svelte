<script>
	import { createEventDispatcher } from 'svelte';

	import Fa from 'svelte-fa';
	import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import { currentUser } from '$lib/store.js';
	import { permissions } from '$lib/utils/consts.js';

	export let actuatorType;
	export let status = false;
	export let mode = 'automatic';

	const turnToOptions = ['on', 'off', 'automatic'];

	const dispatch = createEventDispatcher();

	const emitEvent = function (actuatorMode) {
		dispatch('switch', { actuatorType: actuatorType, mode: actuatorMode });
	};
</script>

<div class="container">
	<div class="status">
		<div style="margin: auto">
			<Fa icon={faSyncAlt} class={status ? 'on' : 'off'} size="6x" spin={mode === 'automatic'} />
		</div>
	</div>
	<div class="switch-options">
		{#each turnToOptions as option}
			<div class="switch">
				<button
					on:click={() => emitEvent(option)}
					disabled={!$currentUser.can(permissions.OPERATE)}
					title={$currentUser.can(permissions.OPERATE)
						? ''
						: 'You need to be logged as an operator to toggle switches'}
				>
					{option}
				</button>
			</div>
		{/each}
	</div>
</div>

<style>
	button {
		width: 100%;
		box-shadow: var(--main-50-shadow);
		border: none;
		background-color: var(--main-60);
		color: #fff;
		padding: 0.5em 1.4em;
		margin: 2px 0;
		text-align: center;
		border-radius: 7px;
		font-size: 1rem;
		cursor: pointer;
	}

	button:disabled {
		background-color: hsla(210, 33%, 60%, 60%);
		color: rgba(100%, 100%, 100%, 60%);
		cursor: default;
	}

	.container {
		width: 100%;
		display: flex;
	}

	.status {
		height: 150px;
		width: 150px;
		display: flex;
		padding-right: 10px;
	}

	.switch-options {
		margin: auto;
	}
</style>
