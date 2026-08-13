<script>
	import {
		faEnvelopeCircleCheck,
		faKey,
		faPenToSquare,
		faTrashCan
	} from '@fortawesome/free-solid-svg-icons';

	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import DataSheet from '$lib/components/DataSheet.svelte';
	import Form from '$lib/components/Form.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';
	import { servicesState } from '$lib/store.svelte.ts';
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

	// Modal-related variables and functions
	let crudAction = $state(undefined);

	const setCrudAction = function (action) {
		crudAction = action;
	};

	const resetCrudAction = function () {
		crudAction = undefined;
	};

	// The account acts, in the order they are likely to be needed. Sending mails
	// is only offered when the mail service is up, and only one of the two mails
	// makes sense at a time.
	let profileActions = $derived.by(() => {
		const actions = [
			{
				label: 'Update profile',
				icon: faPenToSquare,
				onaction: () => setCrudAction('update')
			}
		];
		if (serviceEnabled(servicesState.services, 'email')) {
			if (!userDescription['confirmed_at']) {
				actions.push({
					label: 'Confirm account',
					icon: faEnvelopeCircleCheck,
					onaction: () => setCrudAction('confirm')
				});
			} else {
				actions.push({
					label: 'Change password',
					icon: faKey,
					onaction: () => setCrudAction('reset_password')
				});
			}
		}
		actions.push({
			label: 'Delete account',
			icon: faTrashCan,
			danger: true,
			onaction: () => setCrudAction('delete')
		});
		return actions;
	});
</script>

<TitleBar title="{userDescription['username']}'s profile" />
<DataSheet
	rows={[
		{ label: 'Username', value: userDescription['username'] },
		{
			label: 'Status',
			value: seenLastly(userDescription) ? 'Online' : 'Offline',
			statusClass: getStatusClass(seenLastly(userDescription))
		},
		{ label: 'Firstname', value: userDescription['firstname'] },
		{ label: 'Lastname', value: userDescription['lastname'] },
		{ label: 'Role', value: capitalize(userDescription['role_name']) },
		{ label: 'E-mail', value: userDescription['email'] },
		{
			label: 'Registration date',
			value: formatDateTime(new Date(userDescription['created_at']))
		}
	]}
	actions={profileActions}
	actionPermission={null}
/>
<Modal
	showModal={crudAction === 'update'}
	onclose={resetCrudAction}
>
	{#snippet title()}{`Update ${userDescription['username']}'s user info`}{/snippet}
	{#snippet children(closeModal)}
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
					closeModal();
				});
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>
{#if serviceEnabled(servicesState.services, 'email')}
	<Modal
		showModal={crudAction === 'confirm'}
		onclose={resetCrudAction}
	>
		{#snippet title()}{`Confirm ${userDescription['username']}'s account`}{/snippet}
		{#snippet children(closeModal)}
			<p>Send a confirmation mail to {userDescription['username']}?</p>
			<ConfirmButtons
				confirmLabel="Send confirmation e-mail"
				onconfirm={() => {
					crudRequest(
						`user/u/${userDescription['username']}/confirmation_token?send_email=true`,
						'get'
					).then(() => {
						closeModal();
					});
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudAction === 'reset_password'}
		onclose={resetCrudAction}
	>
		{#snippet title()}{`Change ${userDescription['username']}'s password`}{/snippet}
		{#snippet children(closeModal)}
			<p>Send a mail to change {userDescription['username']}'s password ?</p>
			<ConfirmButtons
				confirmLabel="Send reset e-mail"
				onconfirm={() => {
					crudRequest(
						`user/u/${userDescription['username']}/password_reset_token?send_email=true`,
						'get'
					).then(() => {
						closeModal();
					});
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}
<Modal
	showModal={crudAction === 'delete'}
	onclose={resetCrudAction}
>
	{#snippet title()}{`Delete ${userDescription['username']}'s account`}{/snippet}
	{#snippet children(closeModal)}
		<p>Are you sure you want to delete {userDescription['username']}'s account ?</p>
		<ConfirmButtons
			confirmLabel="Delete account"
			cancelLabel="Keep it"
			danger
			onconfirm={() => {
				crudRequest(`user/u/${userDescription['username']}/delete`, 'create').then(() => {
					closeModal();
				});
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>
