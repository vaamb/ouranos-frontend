<script>
	import { page } from '$app/stores';
</script>

<div class="center-content">
	<div style="max-width: 80%">
		<h1>{$page.status}</h1>
		<p>{$page.error.message}</p>
	</div>
</div>
