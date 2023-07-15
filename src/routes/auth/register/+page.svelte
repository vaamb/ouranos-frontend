<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import axios from 'axios';
	import jwt_decode from 'jwt-decode';

	import { flashMessage } from '$lib/store.js';
	import { API_URL } from '$lib/utils/consts.js';
	import { Message } from '$lib/utils/factories.js';

	const rawToken = $page.url.searchParams.get('token');
	let token;
	let validToken;
	let role;

	try {
		token = jwt_decode(rawToken);
		validToken = true;
		role = token.rle || 'User';
	} catch (error) {
		token = null;
		validToken = false;
	}

	let invitationToken;
	let invitationError = null;

	const regexEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
	const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-+_!$&?.,])(?=.{8,})[^ ]+$/;

	const validateInvitation = function () {
		invitationError = null;
		try {
			const decodedInvitationToken = jwt_decode(invitationToken);
			if (new Date() >= decodedInvitationToken.exp * 1000) {
				invitationError = 'Expired token';
			} else {
				goto(`${API_URL}/auth/register?token=${invitationToken}`);
			}
		} catch (error) {
			if (error.message) {
				invitationError = 'Invalid token';
			}
		}
	};

	let errors = {};
	const resetErrors = function () {
		errors.email = null;
		errors.password1 = null;
		errors.password2 = null;
		errors.server = null;
	};
	resetErrors();

	let username;
	let firstname;
	let lastname;
	let email;
	let telegramId;
	let password1;
	let password2;

	const validateRegistration = function () {
		resetErrors();
		if (!regexEmail.test(email)) {
			errors.password1 = 'Invalid email format.';
		}
		if (!regexPassword.test(password2)) {
			errors.password1 = 'Invalid password format.';
		}
		if (password1 !== password2) {
			errors.password2 = 'Both passwords should match.';
		}
		axios
			.post(`${API_URL}/auth/register?token=${token}`, {
				username: username,
				firstname: firstname,
				lastname: lastname,
				email: email,
				telegram_id: telegramId,
				password: password1
			})
			.then(() => {
				let msgs = $flashMessage;
				msgs.push(Message('Hello ' + username + ', welcome to Ouranos'));
				flashMessage.set(msgs);
			})
			.catch((postError) => {
				if (postError.response) {
					if (postError.response.status === 400) {
						errors.server = postError.response.data.detail;
					}
				}
			});
	};
</script>

{#if !rawToken}
	<h1>Enter your registration token</h1>
	<form on:submit={validateInvitation}>
		<div class="input-group">
			{#if invitationError}
				<div class="error">{invitationError}</div>
			{/if}
			<input id="invitation" size="60" type="text" bind:value={invitationToken} />
		</div>
		<div class="input-group">
			<input id="submit-invitation" type="submit" class="submit-button" value="Validate" />
		</div>
	</form>
{:else if !validToken}
	<h1>Invalid token</h1>
	<p>Get a new token and enter it <a href="/auth/register">here</a></p>
{:else}
	<h1>Register</h1>
	<form on:submit={validateRegistration}>
		{#if errors.server}
			<div class="input-group">
				{#each errors.server as error}
					<div class="error">{error}</div>
				{/each}
			</div>
		{/if}
		<div class="input-group">
			<label for="username">Username</label> <br />
			<input id="username" size="32" type="text" bind:value={username} />
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
			<input id="email" size="32" type="text" bind:value={email} />
			{#if errors.email}
				<br />
				<div class="error">{errors.email}</div>
			{/if}
		</div>
		<div class="input-group">
			<label for="telegram-id">Telegram ID</label> <br />
			<input id="telegram-id" size="32" type="text" bind:value={telegramId} />
		</div>
		<div class="input-group">
			<label for="password1">Password</label> <br />
			<input
				id="password1"
				size="32"
				type="text"
				bind:value={password1}
				placeholder="Should contain at least one lowercase, one capital, one number and one special character"
			/>
			{#if errors.password1}
				<br />
				<div class="error">{errors.password1}</div>
			{/if}
		</div>
		<div class="input-group">
			<label for="password2">Repeat your password</label> <br />
			<input id="password2" size="32" type="text" bind:value={password2} />
			{#if errors.password2}
				<br />
				<div class="error">{errors.password2}</div>
			{/if}
		</div>
	</form>
{/if}
