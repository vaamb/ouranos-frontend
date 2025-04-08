<script>
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/stores';

	import axios from 'axios';
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import { flashMessage } from '$lib/store.svelte.js';
	import { API_URL } from '$lib/utils/consts.js';
	import { Message } from '$lib/utils/factories.js';
	import { checkJWT, getValidationColorClass } from '$lib/utils/functions.js';

	// Token validation
	let token = $state($page.url.searchParams.get('token'));
	let newToken = $state(token);

	let tokenIsValid = $derived.by(() => {
		try {
			checkJWT(token, { sub: 'confirmation' });
			return true;
		} catch (error) {
			return false;
		}
	});

	let newTokenError = $derived.by(() => {
		try {
			checkJWT(newToken, { sub: 'confirmation' });
			return null;
		} catch (error) {
			console.log(error);
			return error.message;
		}
	});
	let newTokenIsValid = $derived(!newToken ? null : newTokenError === null);

	const submitToken = function () {
		if (newTokenIsValid !== true) {
			// If invalid or expired token, clear it (should not be possible)
			newToken = null;
			token = null;
		} else {
			// Else, store the reset token and use it
			token = newToken;
			requestAnimationFrame(() => {
				goto(`/auth/confirm?token=${token}`);
			});
		}
	};

	const confirmAccount = function () {
		axios(`${API_URL}/auth/confirm?token=${token}`, {
			method: 'post',
			withCredentials: true
		})
			.then(() => {
				let msgs = $flashMessage;
				msgs.push(Message('Your account has been confirmed'));
				flashMessage.set(msgs);
				goto('/');
			})
			.catch((error) => {
				if (error.response.data.detail) {
					let msgs = $flashMessage;
					msgs.push(Message(error.response.data.detail));
					flashMessage.set(msgs);
				} else {
					let msgs = $flashMessage;
					msgs.push(
						Message(
							'We encountered an error. Please contact the administrator and come back later.'
						)
					);
					flashMessage.set(msgs);
				}
			});
	};

	// Update token on self page navigation
	$effect(() => {
		if ($navigating) {
			// Coming from a page with a token, to a page without -> the token was invalid, clear it
			if (
				$navigating.from.url.searchParams.get('token') &&
				!$navigating.to.url.searchParams.get('token')
			) {
				token = null;
				newToken = null;
			}
		}
	});
</script>

{#if token === null}
	<h1>Enter your confirmation token</h1>
	<form onsubmit={submitToken}>
		<div class="input-group">
			{#if newToken !== null && newTokenError !== null}
				<div class="error">{newTokenError}</div>
			{/if}
			<input id="confirm" size="60" type="text" bind:value={newToken} />
			<Fa icon={faCircle} class={getValidationColorClass(newTokenIsValid)} />
		</div>
		<div class="input-group">
			<input
				id="submit-token"
				type="submit"
				class="submit-button"
				value="Validate"
				style="height: 2rem"
				disabled={!newTokenIsValid}
			/>
		</div>
	</form>
{:else if tokenIsValid}
	<h1>Confirm your account</h1>
	<form onsubmit={confirmAccount}>
		<div class="input-group">
			<input
				id="submit-confirm-account"
				type="submit"
				class="submit-button"
				value="Confirm"
				style="height: 2rem"
			/>
		</div>
	</form>
{:else}
	<p>Get a valid token and enter it <a href="/auth/confirm">here</a></p>
{/if}

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

	.submit-button:disabled {
		background-color: var(--derived-40);
		color: var(--derived-60);
		cursor: not-allowed;
	}
</style>
