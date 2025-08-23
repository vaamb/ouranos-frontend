<script>
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import { faNotdef, faSpinner } from '@fortawesome/free-solid-svg-icons';

	let {
		source,
		width,
		height,
		alt = '',
		caption = undefined
	} = $props();

	export const update = function (newData) {
		if (newData["source"]) {
			source = newData["source"];
		}
		if (newData["alt"]) {
			alt = newData["alt"];
		}
		if (newData["caption"]) {
			caption = newData["caption"];
		}
	};

	let image = undefined;  // bound to the image container
	let loading = $state(false);
	let loaded = $state(false);
	let error = $state(false);

	onMount(() => {
		loading = true;
	});
</script>

<div class="image-wrapper" style="--image-height: {height}; --image-width:{width}">
	<figure>
		<img
			bind:this={image}
			src={source}
			{alt}
		  onload={() => {loading = false; loaded = true;}}
			onerror={() => {loading = false; error = true;}}
			style="display: {loaded ? 'inherit' : 'none'}"
		/>
		{#if loaded && caption}
			<figcaption>
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

<style>
	.image-wrapper {
		height: calc(var(--image-height) * 1px);
		width: calc(var(--image-width) * 1px);
		position: relative;
		display: flex;
		padding: 1px;
		border: thin var(--derived-50) solid;
	}

	img {
		height: 100%;
		width: 100%;
		object-fit: cover;
		margin: auto;
	}

	figcaption {
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
</style>
