<script>
	import { goto } from '$app/navigation';

	import { checkJWT } from '$lib/utils/functions.js';

	let invitationToken = $state();
	let invitationError = $state(null);

	const validateToken = function () {
		invitationError = null;
		try {
			checkJWT(invitationToken, { sub: 'registration' });
			requestAnimationFrame(() => {
				goto(`/auth/register?token=${invitationToken}`);
			});
		} catch (error) {
			invitationError = error.message;
		}
	};
</script>

<h1>Enter your registration token</h1>
<form onsubmit={validateToken}>
	<div class="input-group">
		{#if invitationError}
			<div class="error">{invitationError}</div>
		{/if}
		<input id="invitation" size="60" type="text" bind:value={invitationToken} />
	</div>
	<div class="input-group">
		<input
			id="submit-invitation"
			type="submit"
			class="submit-button"
			value="Validate"
			style="height: 2rem"
		/>
	</div>
</form>

<style>
	h1 {
		font-size: 1.8rem;
		font-weight: 500;
		margin-bottom: 7px;
	}

	input {
		height: 1.3rem;
		font-size: 0.95rem;
	}
</style>
