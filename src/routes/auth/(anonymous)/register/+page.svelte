<script>
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/stores';

	import axios from 'axios';
	import jwt_decode from 'jwt-decode';
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import { currentUser, flashMessage } from '$lib/store.svelte.js';
	import { API_URL } from '$lib/utils/consts.js';
	import { Message, User } from '$lib/utils/factories.js';
	import {
		checkJWT,
		getValidationColorClass,
		isEmailValid,
		isEmpty,
		isPasswordValid,
		isUsernameValid
	} from '$lib/utils/functions.js';

	// Token validation
	let token = $state($page.url.searchParams.get('token'));
	let newToken = $state(token);

	let tokenIsValid = $derived.by(() => {
		try {
			checkJWT(token, { sub: 'registration' });
			return true;
		} catch (error) {
			return false;
		}
	});

	let newTokenError = $derived.by(() => {
		try {
			checkJWT(newToken, { sub: 'registration' });
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
				username = tokenData.username;
				firstname = tokenData.firstname;
				lastname = tokenData.lastname;
				role = tokenData.role || 'User';
				email = tokenData.email;
				telegramId = tokenData.telegramId;
				goto(`/auth/register?token=${token}`);
			});
		}
	};

	// Token data extraction
	let tokenData = $derived.by(() => {
		try {
			checkJWT(token, { sub: 'registration' });
			const tokenData = jwt_decode(token);
			return {
				username: tokenData['username'],
				firstname: tokenData['firstname'],
				lastname: tokenData['lastname'],
				role: tokenData['role'],
				email: tokenData['email'],
				telegramId: undefined
			};
		} catch (error) {
			return {};
		}
	});

	// Prefill user data with pre-assigned user info
	let username = $state(tokenData.username);
	let firstname = $state(tokenData.firstname);
	let lastname = $state(tokenData.lastname);
	let role = tokenData.role || 'User';
	let email = $state(tokenData.email);
	let telegramId = $state(tokenData.telegramId);

	let password1 = $state(null);
	let password2 = $state(null);

	// Data validation
	let serverError = $state(null);

	let validUsername = $derived(!username ? null : isUsernameValid(username));
	let validEmail = $derived(!email ? null : isEmailValid(email));
	let validPassword = $derived(!password1 ? null : isPasswordValid(password1));
	let samePassword = $derived(!password1 || !password2 ? null : password1 === password2);

	let canSubmit = $derived(validUsername && validEmail && validPassword && samePassword);

	const validateRegistration = function () {
		axios(`${API_URL}/auth/register?invitation_token=${token}&send_email=true`, {
			method: 'post',
			withCredentials: true,
			data: {
				// Overwrite the non-overridable pre-assigned user info (it won't be accepted otherwise)
				username: tokenData.username ? tokenData.username : username,
				email: tokenData.email ? tokenData.email : email,
				// Use the remaining user info as such
				firstname: firstname,
				lastname: lastname,
				// telegram_id: telegramId,
				password: password1
			}
		})
			.then((response) => {
				serverError = null;
				const user = User(response.data.user);
				currentUser.set(user);
				let msgs = $flashMessage;
				msgs.push(Message('Hello ' + user['username'] + ', welcome to Ouranos'));
				flashMessage.set(msgs);
				goto(`/`);
			})
			.catch((error) => {
				if (error.response) {
					if (error.response.data.detail) {
						serverError = error.response.data.detail;
					} else {
						serverError =
							'We encountered an error. Please contact the administrator and come back later.';
					}
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
	<h1>Enter your registration token</h1>
	<form onsubmit={submitToken}>
		<div class="input-group">
			{#if newToken !== null && newTokenError !== null}
				<div class="error">{newTokenError}</div>
			{/if}
			<input id="token" type="text" bind:value={newToken} />
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
	<h1>Register</h1>
	<form onsubmit={validateRegistration}>
		{#if serverError}
			<div class="input-group">
				<div class="error">{serverError}</div>
			</div>
		{/if}
		<div class="input-group">
			<label for="username">Username</label> <br />
			<input
				id="username"
				size="32"
				type="text"
				bind:value={username}
				disabled={tokenData.username !== undefined}
			/>
			<Fa icon={faCircle} class={getValidationColorClass(validUsername)} />
			<p style="max-width: 250px; margin: 0; font-size: smaller">
				Should be between 3 and 32 characters long, cannot contain spaces
				and special characters other than ._!
			</p>
		</div>
		<div class="input-group">
			<label for="firstname">Firstname</label> <br />
			<input id="firstname" size="32" type="text" bind:value={firstname} />
		</div>
		<div class="input-group">
			<label for="lastname">Lastname</label> <br />
			<input id="lastname" size="32" type="text" bind:value={lastname} />
		</div>
		<div class="input-group">
			<label for="role">Role</label> <br />
			<input id="role" size="32" type="text" value={role} disabled />
			<Fa icon={faCircle} class={getValidationColorClass(!isEmpty(role))} />
		</div>
		<div class="input-group">
			<label for="email">E-mail</label> <br />
			<input
				id="email"
				size="32"
				type="email"
				bind:value={email}
				disabled={tokenData.email !== undefined}
			/>
			<Fa icon={faCircle} class={getValidationColorClass(validEmail)} />
		</div>
		<!--
		<div class="input-group">
			<label for="telegram-id">Telegram ID</label> <br />
			<input id="telegram-id" size="32" type="text" bind:value={telegramId} />
		</div>
		-->
		<div class="input-group">
			<label for="password1">Password</label> <br />
			<input id="password1" size="32" type="password" bind:value={password1} />
			<Fa icon={faCircle} class={getValidationColorClass(validPassword)} />
			<p style="max-width: 250px; margin: 0; font-size: smaller">
				Should be between 8 and 32 characters long, contain at least one lower case letter, one
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
				id="submit-invitation"
				type="submit"
				class="submit-button"
				value="Validate"
				style="height: 2rem"
				disabled={!canSubmit}
			/>
		</div>
	</form>
{:else}
	<p>Get a valid token and enter it <a href="/auth/register">here</a></p>
{/if}

<style>
	h1 {
		font-size: 1.8rem;
		font-weight: 500;
		margin-bottom: 7px;
	}

	label {
		font-size: 1.15rem;
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

	#token {
		width: 100%;
	}

	@media only screen and (min-width: 992px) {
		#token {
			width: 575px;
		}
	}
</style>
