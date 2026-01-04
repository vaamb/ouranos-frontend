<script>
	import { browser } from '$app/environment';
	import { page } from '$app/state';
</script>

<div class="main center-content">
	<div style="max-width: 80%">
		<h1>{page.status}</h1>
		<p>{page.error.message}</p>
		<button
			class="submit-button"
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
</style>
