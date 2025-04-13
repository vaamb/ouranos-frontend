import { error } from '@sveltejs/kit';

import { fetchWikiArticles } from '$lib/actions.svelte.js';

export async function load({ params, parent }) {
	const data = await parent();
	const topics = data['wikiTopics'];
	const topic = Object.values(topics).find((topic) => {
		return topic['slug'] === params['topic'];
	});

	if (topic === undefined) {
		error(404, 'Not found');
	}

	const articles = await fetchWikiArticles(topic['slug']);

	return {
		topic: topic,
		articles: articles
	};
}
