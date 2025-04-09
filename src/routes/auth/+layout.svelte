<script>
	let { children } = $props();
</script>

<div class="center-content">
	<div style="max-width: 80%">
		{@render children?.()}
	</div>
</div>
