<script>
	import Fa from 'svelte-fa';
	import { faCircle } from '@fortawesome/free-solid-svg-icons';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';
	import { services } from '$lib/store.svelte.js';
	import {
		capitalize,
		getStatusClass,
		formatDateTime,
		serviceEnabled
	} from '$lib/utils/functions.js';

	let { data } = $props();

	let userDescription = $derived(data.userDescription);

	const seenLastly = function (userDescription) {
		if (!userDescription['last_seen']) {
			return false;
		}
		return new Date() - new Date(userDescription['last_seen']) < 1000 * 60 * 2;
	};

	const emptyIfNull = function (maybeStr) {
		return maybeStr ? maybeStr : '';
	};

	// Modal-related variables and functions
	let modals = $state({});
	let crudAction = $state(undefined);

	const setCrudAction = function (action) {
		crudAction = action;
	};

	const resetCrudAction = function () {
		crudAction = undefined;
	};
</script>

<HeaderLine title="{userDescription['username']}'s profile" />
<table class="table-base table-narrow">
	<tbody>
		<tr>
			<td>Username</td>
			<td>
				{userDescription['username']} &nbsp;
				<Fa icon={faCircle} class={getStatusClass(seenLastly(userDescription))} />
			</td>
		</tr>
		<tr>
			<td>Firstname</td>
			<td>{emptyIfNull(userDescription['firstname'])}</td>
		</tr>
		<tr>
			<td>Lastname</td>
			<td>{emptyIfNull(userDescription['lastname'])}</td>
		</tr>
		<tr>
			<td>Role</td>
			<td>{capitalize(userDescription['role_name'])}</td>
		</tr>
		<tr>
			<td>E-mail</td>
			<td>{userDescription['email']}</td>
		</tr>
		<tr>
			<td>Registration date</td>
			<td>{formatDateTime(new Date(userDescription['created_at']))}</td>
		</tr>
	</tbody>
	<tbody>
		<tr>
			<td colspan="2" style="text-align: center; vertical-align: middle">
				<button
					class="text-button"
					onclick={() => {
						setCrudAction('update');
					}}
				>
					Update profile
				</button>
			</td>
		</tr>
		{#if serviceEnabled($services, 'email')}
			{#if !userDescription['confirmed_at']}
				<tr>
					<td colspan="2" style="text-align: center; vertical-align: middle">
						<button
							class="text-button"
							onclick={() => {
								setCrudAction('confirm');
							}}
						>
							Confirm account
						</button>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="2" style="text-align: center; vertical-align: middle">
						<button
							class="text-button"
							onclick={() => {
								setCrudAction('reset_password');
							}}
						>
							Change password
						</button>
					</td>
				</tr>
			{/if}
		{/if}
		<tr>
			<td colspan="2" style="text-align: center; vertical-align: middle">
				<button
					class="text-button"
					onclick={() => {
						setCrudAction('delete');
					}}
				>
					Delete account
				</button>
			</td>
		</tr>
	</tbody>
</table>
<Modal
	bind:this={modals['update']}
	showModal={crudAction === 'update'}
	onclose={resetCrudAction}
	title="Update {userDescription['username']}'s user info"
>
	<Form
		data={[
			{ label: 'Username', key: 'username', value: userDescription['username'], disabled: true },
			{ label: 'Firstname', key: 'firstname', value: userDescription['firstname'] },
			{ label: 'Lastname', key: 'lastname', value: userDescription['lastname'] },
			{ label: 'Role', key: 'role_name', value: userDescription['role_name'], disabled: true },
			{ label: 'E-mail', key: 'email', value: userDescription['email'], disabled: true }
		]}
		onconfirm={(payload) => {
			crudRequest(`user/u/${userDescription['username']}`, 'update', payload).then(() => {
				modals['update'].closeModal();
			});
		}}
		oncancel={() => modals['update'].closeModal()}
	/>
</Modal>
{#if serviceEnabled($services, 'email')}
	<Modal
		bind:this={modals['confirm']}
		showModal={crudAction === 'confirm'}
		onclose={resetCrudAction}
		title="Confirm {userDescription['username']}'s account"
	>
		<p>Send a confirmation mail to {userDescription['username']}?</p>
		<ConfirmButtons
		  onconfirm={() => {
				crudRequest(
					`user/u/${userDescription['username']}/confirmation_token?send_email=true`,
					'get'
				).then(() => {
					modals['confirm'].closeModal();
				});
			}}
			oncancel={() => modals['confirm'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modals['reset_password']}
		showModal={crudAction === 'reset_password'}
		onclose={resetCrudAction}
		title="Change {userDescription['username']}'s password"
	>
		<p>Send a mail to change {userDescription['username']}'s password ?</p>
		<ConfirmButtons
			onconfirm={() => {
				crudRequest(
					`user/u/${userDescription['username']}/password_reset_token?send_email=true`,
					'get'
				).then(() => {
					modals['reset_password'].closeModal();
				});
			}}
			oncancel={() => modals['reset_password'].closeModal()}
		/>
	</Modal>
{/if}
<Modal
	bind:this={modals['delete']}
	showModal={crudAction === 'delete'}
	onclose={resetCrudAction}
	title="Delete {userDescription['username']}'s account"
>
	<p>Are you sure you want to delete {userDescription['username']}'s account ?</p>
	<ConfirmButtons
		onconfirm={() => {
			crudRequest(`user/u/${userDescription['username']}/delete`, 'create').then(() => {
				modals['delete'].closeModal();
			});
		}}
		oncancel={() => modals['delete'].closeModal()}
	/>
</Modal>
