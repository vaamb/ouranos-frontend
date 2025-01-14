<script>
	let { children } = $props();
</script>

<div class="row">
	{@render children?.()}
</div>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
</style>
