<script>
	import Fa from 'svelte-fa';
	import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';
</script>

<div class="center-wip">
	<div style="margin: auto; display: flex; flex-direction: column">
		<div style="margin: auto; margin-bottom: 1rem; color: var(--graph-yellow)">
			<Fa icon={faPersonDigging} size="5x" />
		</div>
		<p style="margin-bottom: 0; font-size: 1.5rem; font-weight: 550">Work In Progress</p>
	</div>
</div>

<style>
	.center-wip {
		height: calc(
			100vh - 141px
		); /* 141px = Nav bar (65) + Top bar (45) + border (1) + padding (10+20) */
		display: flex;
	}

	/* Large devices (laptops/desktops, 992px and up) */
	@media only screen and (min-width: 992px) {
		.center-wip {
			height: calc(100vh - 76px); /* 76px = Top bar (45) + border (1) + padding (10+20) */
		}
	}
</style>
