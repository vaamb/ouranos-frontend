<script>
	import ContractBanner from '$lib/components/ContractBanner.svelte';

	let { children } = $props();
</script>

<div class="main center-content">
	<div style="max-width: 80%">
		{@render children?.()}
	</div>
	<ContractBanner />
</div>

<style>
	.main {
		height: 100vh;
		width: 100vw;
	}
</style>
