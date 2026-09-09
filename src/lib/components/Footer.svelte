<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const version = $derived(page.data['appVersion']);
</script>

<footer class="footer">
	<p class="site-version">
		Ouranos{#if version}&nbsp;{version}{/if}
	</p>

	<div class="links">
		<a href={resolve('/about')}>About</a>
		<a href="https://github.com/vaamb/gaia-ouranos">GitHub</a>
	</div>
</footer>

<style>
	.footer {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
		margin-top: clamp(28px, 5vw, 44px);
		padding-top: 13px;
		border-top: 1px solid var(--border);
	}

	.site-version {
		margin: 0;
		font-family: 'Raleway', sans-serif;
		font-size: 11.5px;
		color: var(--text-faint);
	}

	.links {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-left: auto;
	}

	.links a {
		font-family: 'Raleway', sans-serif;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-dim-solid);
		text-decoration: none;
	}

	.links a:hover {
		color: var(--text);
	}

	.links a:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 3px;
		border-radius: 2px;
	}
</style>
