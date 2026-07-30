<script>
	import { onDestroy, onMount } from 'svelte';

	import Box from '$lib/components/layout/Box.svelte';
	import BoxItem from '$lib/components/layout/BoxItem.svelte';
	import Image from '$lib/components/Image.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { fetchCameraPicturesInfo } from '$lib/queries.js';
	import { joinRoom, leaveRoom, socketio } from '$lib/socketio.svelte.js';
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize, dynamicSort, formatTimeShort } from '$lib/utils/functions.js';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);

	let cameraData = $state({});
	let cameraIDs = $derived(
		Object.values(cameraData)
			.sort(dynamicSort('camera_name'))
			.map((obj) => ({
				uid: obj['camera_uid'],
				name: capitalize(obj['camera_name'].replace('_', ' '))
			}))
	);

	// How live the stream is, taken from the freshest picture on the page. The
	// timestamps are kept as dates beside the captions, which are already strings.
	let lastPicture = $derived.by(() => {
		const timestamps = Object.values(cameraData)
			.map((info) => info['timestamp'])
			.filter((timestamp) => timestamp && !isNaN(timestamp));
		return timestamps.length ? new Date(Math.max(...timestamps)) : null;
	});

	const getSource = function (path) {
		return `${STATIC_URL}/${path}?timestamp=${new Date().getTime()}`;
	}

	const getCaption = function (timestamp) {
		return `Taken on ${new Date(timestamp)}`;
	};

	onMount(async () => {
		const cameraPicturesInfo = await fetchCameraPicturesInfo(ecosystemUID);
		Object.keys(cameraPicturesInfo).forEach((cameraUID) => {
			cameraData[cameraUID] = {};
			cameraData[cameraUID]['camera_uid'] = cameraUID;
			cameraData[cameraUID]['camera_name'] = cameraPicturesInfo[cameraUID]['camera_name'];
			cameraData[cameraUID]['source'] = getSource(cameraPicturesInfo[cameraUID]['path']);
			cameraData[cameraUID]['caption'] = getCaption(cameraPicturesInfo[cameraUID]['timestamp']);
			cameraData[cameraUID]['timestamp'] = new Date(cameraPicturesInfo[cameraUID]['timestamp']);
		});

		joinRoom('camera_stream');
		socketio.on('pictures_update', (data) => {
			if (data['ecosystem_uid'] === ecosystemUID) {
				// TODO: add new images if available
				for (const updatedInfo of data['updated_pictures']) {
					const cameraUID = updatedInfo['camera_uid'];
					if (cameraUID in cameraData) {
						cameraData[cameraUID]['source'] = getSource(updatedInfo['path']);
						cameraData[cameraUID]['caption'] = getCaption(updatedInfo['timestamp']);
						cameraData[cameraUID]['timestamp'] = new Date(updatedInfo['timestamp']);
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

{#snippet stream()}
	{cameraIDs.length}
	{cameraIDs.length === 1 ? 'camera' : 'cameras'}
	{#if lastPicture}· last picture {formatTimeShort(lastPicture)}{/if}
{/snippet}

<TitleBar title="Camera stream from {ecosystemName}" sideBloc={cameraIDs.length ? stream : null} />

{#each cameraIDs as cameraID}
	{@const pictureInfo = cameraData[cameraID['uid']]}
	{#if pictureInfo}
		<Box title={cameraID['name']} maxWidth="450px">
			<BoxItem>
				<div style="margin: auto">
					<Image
						source={pictureInfo['source']}
						caption={pictureInfo['caption']}
						height="250"
						width=null
						alt={`A picture taken by the camera '${cameraID['name']}'`}
					/>
				</div>
			</BoxItem>
		</Box>
	{/if}
{:else}
	<p>There is currently no camera stream available, please come back later</p>
{/each}
