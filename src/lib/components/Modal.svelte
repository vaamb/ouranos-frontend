<script>
	import { createEventDispatcher } from 'svelte';

	import Fa from 'svelte-fa';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';
	import ConfirmButtons from "$lib/components/ConfirmButtons.svelte";

	export let dialog; // HTMLDialogElement
	export let showModal = false;
	export let title = undefined;
	export let confirmationButtons = false;
	export let timeOut = undefined;

	const dispatch = createEventDispatcher();

	const closeModal = function () {
		dialog.close();
		dispatch('close');
	};

	const displayModal = function () {
		dialog.showModal();
		if (timeOut) {
			setTimeout(() => {
				closeModal();
			}, timeOut);
		}
	};

	$: if (dialog && showModal) displayModal();
</script>

<dialog bind:this={dialog} on:close={() => (showModal = false)} on:click|self={closeModal}>
	<div on:click|stopPropagation style="font-size: 1.05rem">
		<button class="reset-button close" on:click={closeModal}>
			<Fa icon={faXmark} />
		</button>
		{#if title}
			<h1>
				{title}
			</h1>
		{/if}
		<div class="content">
			<slot />
		</div>
		{#if confirmationButtons}
			<ConfirmButtons
				on:confirm={() => {dispatch('confirm')}}
				on:cancel={() => {dispatch('cancel'); closeModal()}}
			/>
		{/if}
	</div>
</dialog>

<style>
	dialog {
		margin: auto;
		min-width: 30vw;
		max-width: 90vw;
		height: fit-content;
		border: 2px solid var(--main-40);
		padding: 20px 25px;
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
