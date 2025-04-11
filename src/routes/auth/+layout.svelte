<script>
	let { children } = $props();
</script>

<div class="main center-content">
	<div style="max-width: 80%">
		{@render children?.()}
	</div>
</div>

<style>
	.main {
		height: 100vh;
		width: 100vw;
	}
</style>
