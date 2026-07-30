<script>
	import { appState } from '$lib/store.svelte.js';
</script>

{#if appState.anyContractMismatch}
	<div class="contract-banner" role="alert">
		<div class="center-content" style="text-align: center">
			Frontend and backend are incompatible — everything might not work as expected
		</div>
	</div>
{/if}

<style>
	.contract-banner {
		position: fixed;
		bottom: 0;
		right: 0;
		font-size: 1rem;
		font-weight: bold;
		height: var(--bottom-banner-height-mobile, 50px);
		width: 100%;
		z-index: 10;
		background: var(--critical-red);
		color: var(--critical-red-dark);
	}

	@media only screen and (min-width: 992px) {
		.contract-banner {
			height: var(--bottom-banner-height, 37px);
		}
	}
</style>
