import { error } from '@sveltejs/kit';

export async function load({ params, parent }) {
	const data = await parent();
	const ecosystems = data['ecosystems'];
	const ecosystem = Object.values(ecosystems).find((ecosystem) => {
		return ecosystem.name_slug === params['ecosystem'];
	})
	if (ecosystem === undefined) {
		error(404, 'Not found');
	}
	return {
		ecosystemUID: ecosystem.uid,
		ecosystemName: ecosystem.name
	}
}
