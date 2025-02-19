<script>
	import { onMount } from 'svelte';

	import Fa from 'svelte-fa';
	import { faPenNib } from '@fortawesome/free-solid-svg-icons';

	import axios from 'axios';
	import { marked } from 'marked';

	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Modal from '$lib/components/Modal.svelte';

	import { crudRequest, fetchWikiPictures } from '$lib/actions.svelte.js';
	import { currentUser } from '$lib/store.svelte.js';
	import { permissions, STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	let { data } = $props();

	const article = data['article'];

	let pictures = $state(undefined);
	let content = $state();

	// Inject picture URL during parsing
	const regexPicture = /!picture:[a-zA-Z0-9_.]*!/;
	const renderer = {
		image({ href, title, text }) {
			const styling = href.split('&');
			href = styling.shift();
			if (regexPicture.test(href)) {
				const value = href.replace('!picture:', '').replace('!', '');
				let picture = Object.values(pictures).find((picture) => {
					return picture['name'] === value;
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

	// Update text
	let modal = $state();

	let updatingContent = $state(null);
	let parsedUpdatingContent = $derived.by(() => {
		if (updatingContent) return marked(updatingContent);
	});

	// Mount
	onMount(async () => {
		pictures = await fetchWikiPictures(article['topic_slug'], article['slug']);
		content = await axios.get(`${STATIC_URL}/${article['path']}?${new Date().getTime()}`).then((response) => {
			return response.data;
		});
	});
</script>

{#snippet update()}
	{#if $currentUser.can(permissions.OPERATE)}
		<button
			class="reset-button"
			style="margin-left: 20px; cursor: pointer"
			onclick={() => {
				updatingContent = content;
			}}
		>
			<Fa icon={faPenNib} />
		</button>
	{/if}
{/snippet}

<HeaderLine title={capitalize(article.name)} sideBloc={update} />

<div class="text">
	{#if content && pictures !== undefined}
		{@html marked(content)}
	{/if}
</div>

<Modal
	bind:this={modal}
	showModal={updatingContent !== null}
	title="Text editor"
	on:close={() => {
		updatingContent = null;
	}}
>
	<div class="modal-content">
		<div class="editor">
			<textarea
				class="text-box"
				bind:value={updatingContent}
				style="margin-right: auto; resize: none"
			></textarea>
			<div class="text-box rendered">
				{@html parsedUpdatingContent}
			</div>
		</div>
		<div class="center-content" style="margin-top: 12px">
			<button
				class="text-button"
				onclick={() => {
					crudRequest(
						`app/services/wiki/topics/u/${article['topic_slug']}/u/${article['slug']}`,
						'update',
						{ "content": updatingContent }
					);
					content = updatingContent;
					modal.closeModal();
				}}
			>
				Save
			</button>
		</div>
	</div>
</Modal>

<style>
	.rendered :global(ul) {
		padding-left: 40px;
		margin-bottom: 0.75rem;
	}

	.rendered :global(ol) {
		padding-left: 40px;
		margin-bottom: 0.75rem;
	}

	.rendered :global(img) {
		float: left;
		object-fit: cover;
		margin: 7px;
	}

	.text-box {
		width: 100%;
		min-height: 30vh;
		padding: 5px;
	}

	.rendered {
		border: thin solid var(--main-50-shadow);
		overflow: auto;
	}

	.modal-content {
		max-height: calc(80vh - (40px + 3.2px + 24px + 7px + 20px)); /*Modal padding (40) + border (3.2) + h1 (24 + 7) + content padding (20)*/
		display: flex;
		flex-direction: column;
		column-gap: 1em;
		row-gap: 1em;
	}

	@media only screen and (max-width: 992px) {
		.editor {
			width: 80vw;
			display: flex;
			flex-direction: column;
			row-gap: 1em;
		}
	}

	@media only screen and (min-width: 992px) {
		.editor {
			width: 1100px;
			display: flex;
		}

		.text-box {
			width: calc((1100px - 3em) / 2);
			height: 70vh;
			max-height: 400px;
		}
	}
</style>
