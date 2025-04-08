<script>
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/stores';

	import axios from 'axios';
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import { flashMessage } from '$lib/store.svelte.js';
	import { API_URL } from '$lib/utils/consts.js';
	import { Message } from '$lib/utils/factories.js';
	import { checkJWT, getValidationColorClass, isPasswordValid } from '$lib/utils/functions.js';

	// Token validation
	let token = $state($page.url.searchParams.get('token'));
	let newToken = $state(token);

	let tokenIsValid = $derived.by(() => {
		try {
			checkJWT(token, { sub: 'reset_password' });
			return true;
		} catch (error) {
			return false;
		}
	});

	let newTokenError = $derived.by(() => {
		try {
			checkJWT(newToken, { sub: 'reset_password' });
			return null;
		} catch (error) {
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
				goto(`/auth/reset_password?token=${token}`);
			});
		}
	};

	// Password validation
	let password1 = $state(null);
	let password2 = $state(null);

	let validPassword = $derived(!password1 ? null : isPasswordValid(password1));
	let samePassword = $derived(!password1 || !password2 ? null : password1 === password2);

	const submitPassword = function () {
		if (!(validPassword && samePassword)) {
			password1 = null;
			password2 = null;
		} else {
			axios(`${API_URL}/auth/reset_password?token=${token}`, {
				method: 'post',
				withCredentials: true,
				data: {
					password: password1
				}
			})
				.then(() => {
					let msgs = $flashMessage;
					msgs.push(Message('Your password has been changed'));
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
		}
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
	<h1>Enter your reset token</h1>
	<form onsubmit={submitToken}>
		<div class="input-group">
			{#if newToken !== null && newTokenError !== null}
				<div class="error">{newTokenError}</div>
			{/if}
			<input id="validate" size="60" type="text" bind:value={newToken} />
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
	<h1>Reset your password</h1>
	<form onsubmit={submitPassword}>
		<div class="input-group">
			<label for="password1">Password</label> <br />
			<input id="password1" size="32" type="password" bind:value={password1} />
			<Fa icon={faCircle} class={getValidationColorClass(validPassword)} />
			<p style="max-width: 250px; margin: 0; font-size: smaller">
				Should be between 8 and 20 characters long, contain at least one lower case letter, one
				capital letter, one number and one special character amongst -+_!$&?.,
			</p>
		</div>
		<div class="input-group">
			<label for="password2">Repeat your password</label> <br />
			<input id="password2" size="32" type="password" bind:value={password2} />
			<Fa icon={faCircle} class={getValidationColorClass(samePassword)} />
		</div>
		<div class="input-group">
			<input
				id="submit-password"
				type="submit"
				class="submit-button"
				value="Confirm"
				style="height: 2rem"
				disabled={!(validPassword && samePassword)}
			/>
		</div>
	</form>
{:else}
	<p>Get a valid token and enter it <a href="/auth/reset_password">here</a></p>
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
