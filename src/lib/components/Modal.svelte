<script>
	import Fa from 'svelte-fa';
	import { faXmark } from '@fortawesome/free-solid-svg-icons';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';

	let {
		showModal = $bindable(false),
		title = undefined,
		confirmationButtons = false,
		timeOut = undefined,
		onconfirm = () => {},
		oncancel = () => {},
		onclose = () => {},
		children
	} = $props();

	let dialog = $state(); // HTMLDialogElement

	$effect(() => {
		if (showModal) displayModal();
	});

	const displayModal = function () {
		dialog.showModal();
		if (timeOut) {
			setTimeout(() => {
				closeModal();
			}, timeOut);
		}
	};

	export const closeModal = function () {
		dialog.close();
	};
</script>

<dialog
	bind:this={dialog}
	tabindex="-1"
	onclose={() => {
		showModal = false;
		onclose();
	}}
	onclick={(e) => {
		if (e.target === dialog) closeModal();
	}}
>
	<div>
		<!--The `showModal` is required to update the content when displaying several modals one after the other-->
		{#if showModal}
			<button class="reset-button close" onclick={closeModal}>
				<Fa icon={faXmark} />
			</button>
			{#if title}
				<h1>
					{title}
				</h1>
			{/if}
			<div class="content">
				{@render children?.()}
			</div>
			{#if confirmationButtons}
				<ConfirmButtons
					onconfirm={onconfirm}
					oncancel={() => {
						oncancel();
						closeModal();
					}}
				/>
			{/if}
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
