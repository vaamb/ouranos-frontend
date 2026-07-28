<script>
	import { onMount } from 'svelte';

	import axios from 'axios';
	import { marked } from 'marked';

	import Form from '$lib/components/Form.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import Table from '$lib/components/Table.svelte';
	import TextEditor from '$lib/components/TextEditor.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { crudRequest } from '$lib/actions.svelte.js';
	import { fetchWikiPictures } from '$lib/queries.js';
	import { appState } from '$lib/store.svelte.ts';
	import { permissions, STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize, splitTags } from '$lib/utils/functions.js';

	let { data } = $props();

	const article = $derived(data['article']);
	const topic = $derived(data['topic']);

	let pictures = $state(undefined);
	let content = $state(undefined);

	const canEdit = $derived(appState.currentUser.can(permissions.OPERATE));

	// Inject picture URL during parsing
	const regexPicture = /!picture:[a-zA-Z0-9_.]*!/;
	const renderer = {
		image({ href, title, text }) {
			const styling = href.split('&');
			href = styling.shift();
			if (regexPicture.test(href)) {
				const value = href.replace('!picture:', '').replace('!', '');
				let picture = Object.values(pictures).find((picture) => {
					return picture['slug'] === value;
				});
				if (picture === undefined) {
					href = '/images/misc/undefined.svg';
				} else {
					href = `${STATIC_URL}/${picture['path']}`;
				}
			}
			let out = '<img src="' + href + '" alt="' + text + '"';

			if (title) {
				out += ' title="' + title + '"';
			}

			if (styling) {
				out += ' style="';
				for (const [index, style] of styling.entries()) {
					const [option, param] = style.split('=');
					out += option + ': ' + param;
					if (index < styling.length - 1) {
						out += '; ';
					}
				}
				out += '"';
			}

			out += this.options.xhtml ? '/>' : '>';
			return out;
		}
	};
	marked.use({ renderer });

	// The renderer resolves `!picture:slug!` codes against `pictures`, so nothing
	// is parsed before both have arrived.
	const ready = $derived(content !== undefined && pictures !== undefined);
	const renderedContent = $derived(ready ? marked(content) : '');

	let editing = $state(false);
	let draft = $state('');
	const renderedDraft = $derived(pictures !== undefined ? marked(draft) : '');

	// Image upload
	let showImageUploadModal = $state(false);
	let showPictures = $state(false);

	const refreshPictures = async function () {
		pictures = await fetchWikiPictures(article['topic_slug'], article['slug']);
	};

	const openEditor = function () {
		draft = content ?? '';
		editing = true;
	};

	const saveArticle = function () {
		crudRequest(
			`app/services/wiki/topics/u/${article['topic_slug']}/u/${article['slug']}`,
			'update',
			{ content: draft }
		).then(() => {
			content = draft;
			editing = false;
		});
	};

	// Mount
	const fetchWikiArticleContent = async function (articleObject) {
		return axios
			.get(`${STATIC_URL}/${articleObject['path']}?${new Date().getTime()}`)
			.then((response) => {
				return response.data;
			});
	};

	onMount(async () => {
		await refreshPictures();
		content = await fetchWikiArticleContent(article);
	});
</script>

{#snippet inTopic()}
	<a class="back" href="/wiki/u/{topic['slug']}">{capitalize(topic['name'])}</a>
{/snippet}

{#snippet edit()}
	<button class="edit" type="button" onclick={openEditor}>Edit article</button>
{/snippet}

<TitleBar
	title={capitalize(article['name'])}
	sideBloc={inTopic}
	action={canEdit && ready && !editing ? edit : undefined}
/>

{#if article['description']}
	<p class="dek">{capitalize(article['description'])}</p>
{/if}

{#if editing}
	<TextEditor
		bind:value={draft}
		rendered={renderedDraft}
		onsave={saveArticle}
		oncancel={() => (editing = false)}
	>
		{#snippet tools()}
			<button type="button" onclick={() => (showImageUploadModal = true)}>Upload an image</button>
			<button type="button" onclick={() => (showPictures = !showPictures)}>
				{showPictures ? 'Hide images' : `Images (${pictures ? pictures.length : 0})`}
			</button>
		{/snippet}
	</TextEditor>

	{#if showPictures}
		<SectionHead title="Images" aside="Paste a code to place one" />
		<Table
			tableID="pictures"
			columns={[
				{ label: 'Name', key: 'name' },
				{ label: 'Description', key: 'description' },
				{ label: 'Code', key: 'slug', serializer: (value) => `!picture:${value}!` },
				{
					label: 'Link',
					key: 'path',
					isLink: true,
					serializer: (value) => `${STATIC_URL}/${value}`
				}
			]}
			data={pictures ? pictures : []}
			emptyText="No image uploaded to this article yet."
		/>
	{/if}
{:else}
	<article class="paper">
		{#if ready}
			{#if content}
				<div class="prose">
					{@html renderedContent}
				</div>
			{:else}
				<p class="empty">
					This article has no text yet.{#if canEdit}&nbsp;Write it with “Edit article”.{/if}
				</p>
			{/if}
		{:else}
			<p class="empty">Loading the article…</p>
		{/if}
	</article>

	{#if article['tags'] && article['tags'].length}
		<p class="tags">
			{#each article['tags'] as tag (tag)}
				<span class="tag">{tag}</span>
			{/each}
		</p>
	{/if}
{/if}

<Modal
	showModal={showImageUploadModal === true}
	onclose={() => {
		showImageUploadModal = false;
	}}
>
	{#snippet kicker()}{capitalize(article['name'])}{/snippet}
	{#snippet title()}{'Upload an image'}{/snippet}
	{#snippet children(closeModal)}
		<Form
			data={[
				{ label: 'Name', key: 'name' },
				{ label: 'Description', key: 'description', required: false },
				{
					label: 'Image',
					key: 'content',
					type: 'file',
					accept: 'image/*',
					hint: 'A picture file'
				},
				{
					label: 'Tags',
					key: 'tags',
					hint: 'Comma separated tags',
					required: false,
					deserializer: splitTags
				}
			]}
			confirmLabel="Upload"
			onconfirm={(payload) => {
				let formData = new FormData();
				formData.append('name', payload['name']);
				if (payload['description'] !== undefined) {
					formData.append('description', payload['description']);
				}
				payload['tags'] = payload['tags'] || [];
				for (const tag of payload['tags']) {
					formData.append('tags', tag);
				}
				formData.append('file', payload['content'][0]);
				crudRequest(
					`app/services/wiki/topics/u/${article['topic_slug']}/u/${article['slug']}/u/upload_file`,
					'create',
					formData
				).then(() => refreshPictures());
				closeModal();
			}}
			oncancel={() => closeModal()}
		/>
	{/snippet}
</Modal>

<style>
	.back {
		color: inherit;
	}

	.back:hover {
		color: var(--text);
		text-decoration: underline;
	}

	.edit {
		font-family: 'Raleway', sans-serif;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 8px 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text-dim-solid);
		cursor: pointer;
		transition:
			color 120ms ease,
			border-color 120ms ease;
	}

	.edit:hover {
		border-color: var(--border-strong);
		color: var(--text);
	}

	.dek {
		max-width: 70ch;
		margin: -0.9rem 0 1.4rem;
		font-size: 0.86rem;
		color: var(--text-dim-solid);
	}

	/* The article is one sheet of the same material as every other card — and it
	   is the width of its own text, not of the page: a card stretched to 1120px
	   around a 70ch measure is 400px of nothing. */
	.paper {
		max-width: 42rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: clamp(18px, 3.5vw, 40px);
		margin-bottom: 1.2rem;
	}

	.paper .prose {
		margin: 0 auto;
	}

	/* The floated pictures must not run out of the sheet. */
	.paper::after {
		content: '';
		display: block;
		clear: both;
	}

	.empty {
		font-size: 0.82rem;
		color: var(--text-faint);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 1.5rem;
	}

	.tag {
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		padding: 3px 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		color: var(--text-faint);
	}
</style>
