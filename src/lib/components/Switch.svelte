<script>
	import { createEventDispatcher } from 'svelte';

	import Fa from 'svelte-fa';
	import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';

	import Box from '$lib/components/layout/Box.svelte';

	import { currentUser } from '$lib/store.js';
	import { permissions } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	export let actuatorType;
	export let title = capitalize(actuatorType);
	export let status = false;
	export let mode = 'automatic';

	const turnToOptions = ['on', 'off', 'automatic'];

	const dispatch = createEventDispatcher();

	const emitEvent = function (actuatorMode) {
		dispatch('switch', { actuatorType: actuatorType, mode: actuatorMode });
	};
</script>

<div class="outer">
	<Box {title} direction="row">
		<div class="fix">
			<div class="status">
				<div style="padding-top: 25px">
					<Fa
						icon={faSyncAlt}
						class={status ? 'on' : 'off'}
						size="6x"
						spin={mode === 'automatic'}
					/>
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
	</Box>
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

	.fix {
		width: 100%;
		display: flex;
		background: var(--main-95);
	}

	.outer {
		width: 350px;
	}

	.status {
		height: 150px;
		width: 150px;
	}

	.switch-options {
		margin: auto;
	}
</style>
