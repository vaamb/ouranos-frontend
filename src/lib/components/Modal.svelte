<script>
	import { createEventDispatcher } from 'svelte';

	import Fa from 'svelte-fa';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';

	export let dialog; // HTMLDialogElement
	export let showModal = false;
	export let title = undefined;

	const dispatch = createEventDispatcher();

	$: if (dialog && showModal) dialog.showModal();

	const closeModal = function () {
		dialog.close();
		dispatch('close');
	};
</script>

<dialog bind:this={dialog} on:close={() => (showModal = false)} on:click|self={() => closeModal()}>
	<div on:click|stopPropagation>
		<button class="reset-button close" on:click={() => closeModal()}>
			<Fa icon={faXmark} />
		</button>
		{#if title}
			<h1>
				{title}
			</h1>
		{/if}
		<h1>
			<slot name="header" />
		</h1>
		<div class="content">
			<slot />
		</div>
	</div>
</dialog>

<style>
	dialog {
		margin: auto;
		min-width: 30vw;
		max-width: 90vw;
		height: fit-content;
		border: 2px solid var(--main-40);
		padding: 15px 25px;
		border-radius: 15px;
		background-color: var(--main-95);
		color: var(--derived-50);
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}

	h1 {
		font-size: 1.3rem;
		font-weight: 500;
		margin-bottom: 7px;
	}

	.close {
		position: absolute;
		top: 0;
		right: 0;
		margin-right: 0;
		width: 35px;
		height: 35px;
		cursor: pointer;
	}

	.content {
		padding: 10px 0;
	}
</style>
