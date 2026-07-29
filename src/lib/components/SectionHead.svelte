<script>
	// A section header: a Garamond title, a hairline rule filling the remaining width,
	// and optional trailing content.
	//
	// `aside` is the common case (a short, quiet note such as "measured 14:32").
	// `action` takes over the same slot when the trailing content needs real
	// markup.
	let { title, aside = null, action } = $props();
</script>

<div class="section-head">
	<h2>{title}</h2>
	<span class="rule"></span>
	{#if action}
		{@render action()}
	{:else if aside}
		<span class="aside">{aside}</span>
	{/if}
</div>

<style>
	.section-head {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin: 0 0 14px;
	}

	h2 {
		font-family: 'Garamond', Georgia, serif;
		font-weight: 600;
		font-size: 1.375rem;
		margin: 0;
		letter-spacing: 0.01em;
		color: var(--text);
	}

	.rule {
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	.aside {
		font-size: 0.72rem;
		color: var(--text-faint);
		white-space: nowrap;
	}
</style>
