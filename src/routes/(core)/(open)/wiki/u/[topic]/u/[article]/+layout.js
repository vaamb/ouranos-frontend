import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
	const data = await parent();
	const articles = data['articles'];
	const article = Object.values(articles).find((article) => {
		return article['slug'] === params['article'];
	});

	if (article === undefined) {
		error(404, 'Not found');
	}

	return {
		article: article
	};
}
