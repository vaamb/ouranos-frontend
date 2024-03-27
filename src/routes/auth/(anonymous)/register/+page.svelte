<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import axios from 'axios';
	import jwt_decode from 'jwt-decode';
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import { currentUser, flashMessage } from '$lib/store.js';
	import { API_URL } from '$lib/utils/consts.js';
	import { Message, User } from '$lib/utils/factories.js';

	let token = $page.url.searchParams.get('token');

	let tokenUsername;
	let tokenFirstname;
	let tokenLastname;
	let tokenRole;
	let tokenEmail;
	try {
		const data = jwt_decode(token);
		tokenUsername = data['username'];
		tokenFirstname = data['firstname'];
		tokenLastname = data['lastname'];
		tokenRole = data['role'];
		tokenEmail = data['email'];
	} catch (error) {
		token = null;
	}

	const regexEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
	const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[-+_!$&?.,])[^ ]{8,20}$/;

	let errors = {};
	const resetErrors = function () {
		errors.email = null;
		errors.password1 = null;
		errors.password2 = null;
		errors.server = null;
	};
	resetErrors();

	let username = tokenUsername;
	let firstname = tokenFirstname;
	let lastname = tokenLastname;
	let role = tokenRole || 'User';
	let email = tokenEmail;
	let telegramId;
	let password1;
	let password2;

	const checkValidEmail = function (email) {
		if (!email) {
			return null;
		}
		return regexEmail.test(email);
	};

	$: validEmail = checkValidEmail(email);

	const checkValidPassword = function (password) {
		if (!password) {
			return null;
		}
		return regexPassword.test(password);
	};

	$: validPassword = checkValidPassword(password1);

	const checkSamePassword = function (password1, password2) {
		if (!password1 || !password2) {
			return null;
		}
		return password1 === password2;
	};

	$: samePassword = checkSamePassword(password1, password2);

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
	const getValidationColorClass = function (validationCode) {
		if (validationCode === null) {
			return 'hidden';
		} else if (validationCode === true) {
			return 'on';
		} else if (validationCode === false) {
			return 'off';
		}
	};
</script>

{#if !token}
	<p>Get a valid token and enter it <a href="/auth/invitation">here</a></p>
{:else}
	<h1>Register</h1>
	<form on:submit={validateRegistration}>
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
			<div style="display: {validPassword !== null ? 'auto' : 'none'}" />
			<Fa icon={faCircle} class={getValidationColorClass(validPassword)} />
			{#if errors.password1}
				<br />
				<div class="error">{errors.password1}</div>
			{:else}
				<p style="max-width: 250px; margin: 0; font-size: smaller">
					Should be between 8 and 20 characters long, contain at least one lower case letter, one
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
