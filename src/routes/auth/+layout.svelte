<script>
	import ContractBanner from '$lib/components/ContractBanner.svelte';

	let { children } = $props();
</script>

<!-- The page shell is `AuthSheet`, so that each page owns its own kicker, title
     and rail; the layout only carries what is common to the whole tree. -->
{@render children?.()}
<ContractBanner />
