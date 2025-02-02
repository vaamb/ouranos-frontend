<script>
	import { onMount } from 'svelte';

	import axios from 'axios';
	import { marked } from 'marked';

	import HeaderLine from '$lib/components/HeaderLine.svelte';

	import { fetchWikiPictures } from '$lib/actions.svelte.js';
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize } from '$lib/utils/functions.js';

	let { data } = $props();

	let article = data['article'];
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
					// TODO: use a not def symbol
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

	onMount(async () => {
		pictures = await fetchWikiPictures(article['topic_slug'], article['slug']);
		content = await axios.get(`${STATIC_URL}/${article['path']}`).then((response) => {
			return response.data;
		});
	});
</script>

<HeaderLine title={capitalize(article.name)} />

<div class="text">
	{#if content && pictures !== undefined}
		{@html marked(content)}
	{/if}
</div>

<style>
	.img {
		float: left;
		object-fit: cover;
	}
</style>
