<script>
	import Fa from 'svelte-fa';
	import { faNotdef, faSpinner } from '@fortawesome/free-solid-svg-icons';

	import Modal from '$lib/components/Modal.svelte';

	let {
		source,
		width,
		height,
		alt = '',
		caption = undefined
	} = $props();

	let loaded = $state(false);
	let error = $state(false);
	let loading = $derived(!(loaded || error));

	// Modal
	let enlargePicture = $state(false)
</script>

<div class="thumbnail-wrapper" style="--image-height: {height}; --image-width:{width}">
	<figure>
		<img
			src={source}
			{alt}
			onload={() => {loaded = true; }}
			onerror={() => {error = true;}}
			onclick={() => {enlargePicture = true}}
			style="display: {loaded ? 'inherit' : 'none'}"
			class="thumbnail"
		/>
		{#if loaded && caption}
			<figcaption class="thumbnail-caption">
				{caption}
			</figcaption>
		{/if}
	</figure>
	{#if loading}
		<div class="image-icon">
			<Fa icon={faSpinner} spin size="3x" />
		</div>
	{:else if error}
		<div class="image-icon">
			<Fa icon={faNotdef} size="3x" />
		</div>
	{/if}
</div>

<Modal
	showModal={enlargePicture}
	onclose={() => {enlargePicture = false}}
>
	{#snippet title()}{alt}{/snippet}
	<img
		src={source}
		{alt}
		class="large-image"
	>
</Modal>

<style>
	.thumbnail-wrapper {
		height: calc(var(--image-height) * 1px);
		width: calc(var(--image-width) * 1px);
		position: relative;
		display: flex;
		padding: 1px;
		border: thin var(--derived-50) solid;
	}

	.thumbnail {
		height: 100%;
		width: 100%;
		object-fit: cover;
		margin: auto;
	}

	.thumbnail-caption {
		position: absolute;
		width: calc(100% - 8px); /* paddings */
		bottom: 1px;
		padding: 3px;
		background-color: rgba(0, 0, 0, 35%);
		color: var(--gray-90);
		font-size: x-small;
	}

	.image-icon {
		margin: auto;
	}

	.large-image {
		height: calc(95vh - 95px);  /* Modal padding: 2x20 + Title: 24+7 + Content padding: 2x10 + padding and border */
		max-width: min(1200px, 80vw);
		object-fit: contain;
		margin: auto;
		padding: 1px;
		border: thin var(--derived-50) solid;
	}
</style>
