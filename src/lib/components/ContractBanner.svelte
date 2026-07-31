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
	/* Sits in the flow of `(core)/+layout.svelte`'s fixed bottom stack. The
	   heights are the ones the layout reserves as `--bottom-banner-height*` for
	   the page's own bottom padding — keep the two in step. */
	.contract-banner {
		pointer-events: auto;
		font-size: 1rem;
		font-weight: bold;
		height: 50px;
		background: var(--critical-red);
		color: var(--critical-red-dark);
	}

	@media only screen and (min-width: 992px) {
		.contract-banner {
			height: 37px;
		}
	}
</style>
