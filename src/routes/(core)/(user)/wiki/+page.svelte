<script>
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

	let modal = $state({});
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
	on:crud={(event) => {
		crudAction = event['detail']['action'];
		crudIndex = event['detail']['rowIndex'];
	}}
/>

<Modal
	bind:this={modal['create']}
	showModal={crudAction === 'create'}
	onclose={resetModal}
	title="Create a new topic"
>
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
		on:confirm={(event) => {
			const payload = event.detail;
			crudRequest(`app/services/wiki/topics/u`, 'create', payload).then(() => refreshTopics());
			modal['create'].closeModal();
		}}
		on:cancel={() => modal['create'].closeModal()}
	/>
</Modal>
{#if $wikiTopics[crudIndex]}
	<Modal
		bind:this={modal['update']}
		showModal={crudAction === 'update'}
		onclose={resetModal}
		title={`Update ${$wikiTopics[crudIndex]['name']} topic`}
	>
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
			on:confirm={(event) => {
				const payload = event.detail;
				crudRequest(
					`app/services/wiki/topics/u/${$wikiTopics[crudIndex]['name']}`,
					'update',
					payload
				).then(() => refreshTopics());
				modal['update'].closeModal();
			}}
			on:cancel={() => modal['update'].closeModal()}
		/>
	</Modal>
	<Modal
		bind:this={modal['delete']}
		showModal={crudAction === 'delete'}
		title={`Delete ${$wikiTopics[crudIndex]['name']} topic`}
		confirmationButtons={true}
		onclose={resetModal}
		onconfirm={() => {
			crudRequest(`app/services/wiki/topics/u/${$wikiTopics[crudIndex]['name']}`, 'delete')
			.then(
				() => refreshTopics()
			);
			modal['delete'].closeModal();
		}}
	>
		<p>Are you sure you want to delete '{$wikiTopics[crudIndex]['name']}' topic ?</p>
	</Modal>
{/if}
