<script>
	import { appState } from '$lib/store.svelte.js';
</script>

{#if appState.anyContractMismatch}
	<div class="bottom-banner">
		<div class="center-content" style="text-align: center">
			Frontend and backend are incompatible — everything might not work as expected
		</div>
	</div>
{/if}

<style>
	.bottom-banner {
		position: fixed;
		bottom: 0;
		right: 0;
		font-size: 1rem;
		font-weight: bold;
		height: var(--bottom-banner-height-mobile, 50px);
		width: 100%;
		z-index: 10;
		background: var(--red);
		color: hsl(9, 85%, 20%);
	}

	@media only screen and (min-width: 992px) {
		.bottom-banner {
			width: inherit;
			height: var(--bottom-banner-height, 37px);
		}
	}
</style>
