<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Image from '$lib/components/Image.svelte';

	import { fetchCameraPicturesInfo } from '$lib/actions.js';
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { getEcosystemUID } from '$lib/utils/functions.js';
	import { joinRoom, leaveRoom, socketio } from '$lib/socketio.js';
	import { ecosystems } from '$lib/store.js';

	$: ecosystemName = $page['params']['ecosystem'];
	$: ecosystemUID = getEcosystemUID($ecosystems, ecosystemName);

	let cameraIDs = [];
	let cameraPicturesInfo = {};
	let captions = {};
	let refreshImage = {};

	const createCaptions = function (cameraPicturesInfo) {
		const rv = {};
		for (const cameraUID in cameraPicturesInfo) {
			const pictureInfo = cameraPicturesInfo[cameraUID];
			rv[cameraUID] = `Taken on ${pictureInfo['timestamp']}`;
		}
		return rv;
	};

	onMount(async () => {
		const data = await fetchCameraPicturesInfo(ecosystemUID);
		cameraPicturesInfo = data.cameraPicturesInfo;
		cameraIDs = data.cameraIDs;
		captions = createCaptions(cameraPicturesInfo);

		joinRoom('camera_stream');
		socketio.on('pictures_update', (data) => {
			if (data['ecosystem_uid'] === ecosystemUID) {
				for (const updatedInfo of data['updated_pictures']) {
					if (
						cameraPicturesInfo.hasOwnProperty(updatedInfo['camera_uid']) &&
						refreshImage.hasOwnProperty(updatedInfo['camera_uid'])
					) {
						const cameraPictureInfo = cameraPicturesInfo[updatedInfo['camera_uid']];
						cameraPictureInfo['timestamp'] = new Date(updatedInfo['timestamp']);
						refreshImage[updatedInfo['camera_uid']]();
					}
				}
			}
			captions = createCaptions(cameraPicturesInfo);
		});
	});

	onDestroy(async () => {
		leaveRoom('camera_stream');
		socketio.off('pictures_update');
	});
</script>

<HeaderLine title="Camera stream from {ecosystemName}" />

{#each cameraIDs as cameraID}
	{@const pictureInfo = cameraPicturesInfo[cameraID['uid']]}
	{#if pictureInfo}
		<Box title={cameraID['name']} maxWidth="450px">
			<BoxItem>
				<div style="margin: auto">
					<Image
						source={`${STATIC_URL}/${pictureInfo['path']}`}
						height="250"
						width="375"
						bind:caption={captions[cameraID['uid']]}
						bind:refresh={refreshImage[cameraID['uid']]}
					/>
				</div>
			</BoxItem>
		</Box>
	{/if}
{/each}
