<script>
	import Fa from 'svelte-fa';
	import { faNotdef, faSpinner } from '@fortawesome/free-solid-svg-icons';

	import Modal from '$lib/components/Modal.svelte';

	let {
		source,
		width,
		height,
		alt = '',
		caption = undefined,
		// Frame mode: the picture fills the caller's width and the caller supplies
		// the frame, so this draws no border of its own. The value is the picture's
		// own shape ('640 / 480'), which reserves the space before the bytes arrive
		// and keeps the whole picture — a live frame must not be cropped. Pass
		// 'auto' when the shape is unknown and the picture may reflow as it loads.
		// In frame mode the caption is the enlarged sheet's kicker only: the caller
		// captions the picture itself, so nothing is printed over the plants.
		frame = undefined,
		// 'wipe' reveals a replacement frame with a downward wipe. Only a source
		// that changes under the reader needs it; a picture loaded once does not.
		reveal = 'none'
	} = $props();

	const REVEAL_MS = 420;

	// The picture on screen. A new `source` is loaded behind it and only takes its
	// place once its bytes are there, so a refresh never blanks the frame and a
	// failed one leaves the last good picture up.
	let displayed = $state(source);
	let incoming = $state(null);
	let revealing = $state(false);

	let loaded = $state(false);
	let error = $state(false);
	let loading = $derived(!(loaded || error));

	// The last source asked for, kept off the reactive graph so the effect below
	// tracks `source` alone and never re-runs on its own writes.
	let requested = source;
	let promotion;

	$effect(() => {
		const next = source;
		if (next === requested) {
			return;
		}
		requested = next;
		clearTimeout(promotion);
		revealing = false;
		incoming = next;
	});

	const promote = function () {
		displayed = incoming;
		incoming = null;
		revealing = false;
	};

	const onIncomingLoad = function () {
		loaded = true;
		error = false;
		const wipes =
			reveal === 'wipe' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (wipes) {
			revealing = true;
			promotion = setTimeout(promote, REVEAL_MS);
		} else {
			promote();
		}
	};

	// A refresh that fails is not an error state: the frame already on screen is
	// still the last thing the camera actually sent.
	const dropIncoming = function () {
		incoming = null;
		revealing = false;
	};

	// Modal
	let enlargePicture = $state(false);
</script>

<div
	class="thumbnail-wrapper"
	class:framed={frame}
	class:natural={frame === 'auto'}
	style={frame
		? frame === 'auto'
			? undefined
			: `--image-ratio: ${frame}`
		: `--image-height: ${height}; --image-width:${width}`}
>
	<figure>
		<!-- Without a label of its own the button borrows the picture's alt text and
		     announces itself as the picture rather than as the act. -->
		<button
			class="reset-button thumbnail-button"
			aria-label={alt ? `Enlarge: ${alt}` : 'Enlarge picture'}
			onclick={() => {
				enlargePicture = true;
			}}
		>
			<img
				src={displayed}
				{alt}
				onload={() => {
					loaded = true;
				}}
				onerror={() => {
					error = true;
				}}
				style="display: {loaded ? 'inherit' : 'none'}"
				class="thumbnail"
			/>
			{#if incoming}
				<!-- The replacement, loading behind the frame on screen. It is
				     decorative until it is promoted: the alt text describes the one
				     picture this figure is of, whichever bytes are currently in it. -->
				<img
					src={incoming}
					alt=""
					aria-hidden="true"
					onload={onIncomingLoad}
					onerror={dropIncoming}
					class="thumbnail incoming"
					class:revealing
				/>
			{/if}
		</button>
		{#if loaded && caption && !frame}
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
	onclose={() => {
		enlargePicture = false;
	}}
	bleed
	width="min(900px, calc(100vw - 28px))"
>
	{#snippet kicker()}{caption || 'Picture'}{/snippet}
	{#snippet title()}{alt}{/snippet}
	<img src={displayed} {alt} class="large-image" />
</Modal>

<style>
	.thumbnail-wrapper {
		height: calc(var(--image-height) * 1px);
		width: calc(var(--image-width) * 1px);
		position: relative;
		display: flex;
		padding: 1px;
		border: thin var(--border) solid;
	}

	/* Frame mode: the caller owns the border and the width, the picture's own
	   shape owns the height. */
	.thumbnail-wrapper.framed {
		height: auto;
		width: 100%;
		aspect-ratio: var(--image-ratio);
		padding: 0;
		border: none;
		overflow: hidden;
	}

	/* Shape unknown: the picture sizes itself, and the box follows it. */
	.thumbnail-wrapper.framed.natural {
		aspect-ratio: auto;
	}

	.thumbnail-wrapper.framed figure,
	.thumbnail-wrapper.framed .thumbnail-button {
		width: 100%;
	}

	figure {
		position: relative;
	}

	.thumbnail-button {
		height: 100%;
		width: 100%;
		position: relative;
		cursor: pointer;
	}

	/* A full-bleed frame has no border of its own to carry the ring, so it is drawn
	   inside the picture. */
	.thumbnail-wrapper.framed .thumbnail-button:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: -2px;
	}

	.thumbnail {
		height: 100%;
		width: 100%;
		object-fit: cover;
		margin: auto;
	}

	/* The box is already the picture's own shape, so there is nothing to crop. */
	.thumbnail-wrapper.framed .thumbnail {
		display: block;
		object-fit: contain;
	}

	.thumbnail-wrapper.framed.natural .thumbnail {
		height: auto;
	}

	.incoming {
		position: absolute;
		inset: 0;
		clip-path: inset(0 0 100% 0);
	}

	.incoming.revealing {
		animation: wipe 420ms ease-out forwards;
	}

	@keyframes wipe {
		from {
			clip-path: inset(0 0 100% 0);
		}
		to {
			clip-path: inset(0 0 0 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.incoming.revealing {
			animation: none;
			clip-path: inset(0 0 0 0);
		}
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

	/* In frame mode the figure already fills the box, so the spinner has no room
	   left to be centred in — it is laid over the reserved space instead. */
	.thumbnail-wrapper.framed .image-icon {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-faint);
	}

	/* The sheet bleeds, so the frame runs edge to edge under the caption */
	.large-image {
		display: block;
		width: 100%;
		max-height: calc(86vh - 70px); /* the sheet's max height, less its head */
		object-fit: contain;
	}
</style>
