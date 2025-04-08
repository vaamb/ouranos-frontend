<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

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
		isPasswordValid
	} from '$lib/utils/functions.js';

	// Get token, verify it and extract the pre-assigned user info
	let token = $state($page.url.searchParams.get('token'));

	let tokenUsername = $state();
	let tokenFirstname = $state();
	let tokenLastname = $state();
	let tokenRole = $state();
	let tokenEmail = $state();

	// Token validation should be done only once
	if (token) {
		try {
			checkJWT(token, { sub: 'registration' });
			const data = jwt_decode(token);
			tokenUsername = data['username'];
			tokenFirstname = data['firstname'];
			tokenLastname = data['lastname'];
			tokenRole = data['role'];
			tokenEmail = data['email'];
		} catch (error) {
			token = null;
		}
	}

	// Prefill user data with pre-assigned user info
	let username = $state(tokenUsername);
	let firstname = $state(tokenFirstname);
	let lastname = $state(tokenLastname);
	let role = tokenRole || 'User';
	let email = $state(tokenEmail);
	let telegramId = $state();
	let password1 = $state(null);
	let password2 = $state(null);

	// Data validation
	let errors = $state({});
	const resetErrors = function () {
		errors.email = null;
		errors.password1 = null;
		errors.password2 = null;
		errors.server = null;
	};
	resetErrors();

	let validEmail = $derived(!email ? null : isEmailValid(email));
	let validPassword = $derived(!password1 ? null : isPasswordValid(password1));
	let samePassword = $derived(!password1 || !password2 ? null : password1 === password2);

	const validateRegistration = function () {
		resetErrors();
		if (!isEmailValid(email)) {
			errors.email = 'Invalid email format.';
		}
		if (!isPasswordValid(password2)) {
			errors.password1 = 'Invalid password format.';
		}
		if (password1 !== password2) {
			errors.password2 = 'Both passwords should match.';
		}
		axios(`${API_URL}/auth/register?invitation_token=${token}`, {
			method: 'post',
			withCredentials: true,
			data: {
				username: tokenUsername ? tokenUsername : username,
				firstname: firstname,
				lastname: lastname,
				email: tokenEmail ? tokenEmail : email,
				telegram_id: telegramId,
				password: password1
			}
		})
			.then((response) => {
				const user = User(response.data.user);
				currentUser.set(user);
				let msgs = $flashMessage;
				msgs.push(Message('Hello ' + user['username'] + ', welcome to Ouranos'));
				flashMessage.set(msgs);
				goto(`/`);
			})
			.catch((postError) => {
				if (postError.response) {
					if (postError.response.data.detail) {
						errors.server = postError.response.data.detail;
					} else {
						errors.server =
							'We encountered an error. Please contact the administrator and come back later.';
					}
				}
			});
	};
</script>

{#if !token}
	<p>Get a valid token and enter it <a href="/auth/invitation">here</a></p>
{:else}
	<h1>Register</h1>
	<form onsubmit={validateRegistration}>
		{#if errors.server}
			<div class="input-group">
				<div class="error">{errors.server}</div>
			</div>
		{/if}
		<div class="input-group">
			<label for="username">Username</label> <br />
			<input
				id="username"
				size="32"
				type="text"
				bind:value={username}
				disabled={tokenUsername !== undefined}
			/>
			{#if errors.username}
				<br />
				<div class="error">{errors.username}</div>
			{/if}
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
		</div>
		<div class="input-group">
			<label for="email">E-mail</label> <br />
			<input
				id="email"
				size="32"
				type="text"
				bind:value={email}
				disabled={tokenEmail !== undefined}
			/>
			<Fa icon={faCircle} class={getValidationColorClass(validEmail)} />
			{#if errors.email}
				<br />
				<div class="error">{errors.email}</div>
			{/if}
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
			<div style="display: {validPassword !== null ? 'auto' : 'none'}"></div>
			{#if errors.password1}
				<br />
				<div class="error">{errors.password1}</div>
			{:else}
				<p style="max-width: 250px; margin: 0; font-size: smaller">
					Should be between 8 and 32 characters long, contain at least one lower case letter, one
					capital letter, one number and one special character amongst -+_!$&?.,
				</p>
			{/if}
		</div>
		<div class="input-group">
			<label for="password2">Repeat your password</label> <br />
			<input id="password2" size="32" type="password" bind:value={password2} />
			<Fa icon={faCircle} class={getValidationColorClass(samePassword)} />
			{#if errors.password2}
				<br />
				<div class="error">{errors.password2}</div>
			{/if}
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
</style>
