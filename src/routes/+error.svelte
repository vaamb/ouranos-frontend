<script>
	import { browser } from '$app/environment';
	import { page } from '$app/state';
</script>

<div class="main center-content">
	<div style="max-width: 80%">
		<h1>{page.status}</h1>
		<p>{page.error.message}</p>
		<button
			class="go-back"
			onclick={() => {
				if (browser) window.history.back();
			}}
		>
			Go back
		</button>
	</div>
</div>

<style>
	.main {
		height: 100vh;
		width: 100vw;
	}

	.go-back {
		margin-top: 1rem;
		padding: 8px 16px;
		font-family: 'Raleway', sans-serif;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--surface);
		background: var(--text);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
	}

	.go-back:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}
</style>
