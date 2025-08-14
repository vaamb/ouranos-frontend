<script>
	import { onDestroy, onMount } from 'svelte';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import HeaderLine from '$lib/components/HeaderLine.svelte';
	import Image from '$lib/components/Image.svelte';

	import { fetchCameraPicturesInfo } from '$lib/actions.svelte.js';
	import { joinRoom, leaveRoom, socketio } from '$lib/socketio.svelte.js';
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize, dynamicSort } from '$lib/utils/functions.js';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	let images = $state({});
	let cameraPicturesInfo = $state({});
	let cameraIDs = $derived(
		Object.values(cameraPicturesInfo)
			.sort(dynamicSort('camera_name'))
			.map((obj) => ({
				uid: obj['camera_uid'],
				name: capitalize(obj['camera_name'].replace('_', ' '))
			}))
	);

	const getCaption = function (cameraPicturesInfo, cameraUID) {
		if (Object.prototype.hasOwnProperty.call(cameraPicturesInfo, cameraUID)) {
			return `Taken on ${cameraPicturesInfo[cameraUID]['timestamp']}`;
		}
		return '';
	};

	onMount(async () => {
		cameraPicturesInfo = await fetchCameraPicturesInfo(ecosystemUID);

		joinRoom('camera_stream');
		socketio.on('pictures_update', (data) => {
			if (data['ecosystem_uid'] === ecosystemUID) {
				// TODO: add new images if available
				for (const updatedInfo of data['updated_pictures']) {
					const cameraUid = updatedInfo['camera_uid'];
					if (
						Object.prototype.hasOwnProperty.call(cameraPicturesInfo, cameraUid) &&
						Object.prototype.hasOwnProperty.call(images, cameraUid)
					) {
						cameraPicturesInfo[cameraUid]['timestamp'] = new Date(updatedInfo['timestamp']);
						images[cameraUid].refresh();
					}
				}
			}
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
						bind:this={images[cameraID['uid']]}
						source={`${STATIC_URL}/${pictureInfo['path']}?${new Date().getTime()}`}
						height="250"
						width="375"
						caption={getCaption(cameraPicturesInfo, cameraID['uid'])}
						alt={`A picture taken by the camera '${cameraID['name']}'`}
					/>
				</div>
			</BoxItem>
		</Box>
	{/if}
{:else}
	<p>There is currently no camera stream available, please come back later</p>
{/each}
