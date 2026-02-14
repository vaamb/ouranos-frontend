<script>
	import ConfirmButtons from '$lib/components/ConfirmButtons.svelte';
	import Form from '$lib/components/Form.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Table from '$lib/components/Table.svelte';

	import { crudRequest, fetchWikiTopics } from '$lib/actions.svelte.js';
	import { wikiTopics } from '$lib/store.svelte.js';
	import { capitalize, joinTags, splitTags } from '$lib/utils/functions.js';

	const refreshTopics = function () {
		fetchWikiTopics().then((data) => {
			wikiTopics.set(data);
		});
	};

	let crudAction = $state(null);
	let crudIndex = $state(null);

	const resetModal = function () {
		crudAction = null;
		crudIndex = null;
	};
</script>

<HeaderLine title="Topics index" />

<Table
	tableID="wikiTopicsTable"
	columns={[
		{ label: 'Name', key: 'name', serializer: capitalize },
		{ label: 'Description', key: 'description', serializer: capitalize },
		{ label: 'Tags', key: 'tags', serializer: joinTags },
		{ label: 'Link', key: 'slug', isLink: true, serializer: (value) => `/wiki/u/${value}` }
	]}
	data={$wikiTopics}
	editable={true}
	oncrud={(payload) => {
		crudAction = payload['action'];
		crudIndex = payload['rowIndex'];
	}}
/>

<Modal
	showModal={crudAction === 'create'}
	onclose={resetModal}
	title="Create a new topic"
>
	{#snippet children(closeModal)}
		<Form
			data={[
				{ label: 'Name', key: 'name' },
				{ label: 'Description', key: 'description', required: false },
				{
					label: 'Tags',
					key: 'tags',
					hint: 'Comma separated tags',
					required: false,
					deserializer: splitTags
				}
			]}
			onconfirm={(payload) => {
				crudRequest(`app/services/wiki/topics/u`, 'create', payload).then(() => refreshTopics());
				closeModal();
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>
{#if $wikiTopics[crudIndex]}
	<Modal
		showModal={crudAction === 'update'}
		onclose={resetModal}
		title={`Update ${$wikiTopics[crudIndex]['name']} topic`}
	>
		{#snippet children(closeModal)}
			<Form
				data={[
					{ label: 'Name', key: 'name', value: $wikiTopics[crudIndex]['name'], type: 'text' },
					{
						label: 'Description',
						key: 'description',
						value: $wikiTopics[crudIndex]['description'],
						required: false
					},
					{
						label: 'Tags',
						key: 'tags',
						value: $wikiTopics[crudIndex]['tags'],
						hint: 'Comma separated tags',
						required: false,
						serializer: joinTags,
						deserializer: splitTags
					}
				]}
				onconfirm={(payload) => {
					crudRequest(
						`app/services/wiki/topics/u/${$wikiTopics[crudIndex]['name']}`,
						'update',
						payload
					).then(() => refreshTopics());
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
	<Modal
		showModal={crudAction === 'delete'}
		title={`Delete ${$wikiTopics[crudIndex]['name']} topic`}
		onclose={resetModal}
	>
		{#snippet children(closeModal)}
			<p>Are you sure you want to delete '{$wikiTopics[crudIndex]['name']}' topic ?</p>
			<ConfirmButtons
				onconfirm={() => {
					crudRequest(`app/services/wiki/topics/u/${$wikiTopics[crudIndex]['name']}`, 'delete')
					.then(
						() => refreshTopics()
					);
					closeModal();
				}}
				oncancel={() => closeModal()}
			/>
		{/snippet}
	</Modal>
{/if}
