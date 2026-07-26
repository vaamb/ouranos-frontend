<script>
	import { resolve } from '$app/paths';

	// A small titled card for the home page's "Global overview" band
	let { title, href = null, linkText = 'View →', action, children } = $props();
</script>

<article class="mod">
	<div class="mod-head">
		<h4>{title}</h4>
		{#if action}
			{@render action()}
		{:else if href}
			<a class="link" href="{resolve(href)}">{linkText}</a>
		{/if}
	</div>
	{@render children?.()}
</article>

<style>
	.mod {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}

	.mod-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	h4 {
		font-family: 'Garamond', Georgia, serif;
		font-weight: 600;
		font-size: 1rem;
		margin: 0;
		line-height: 1.1;
		color: var(--text);
	}

	.link {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--grow);
		text-decoration: none;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.link:hover {
		text-decoration: underline;
	}
</style>
