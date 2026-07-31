<script>
	import { onDestroy, onMount } from 'svelte';

	import { resolve } from '$app/paths';

	import Image from '$lib/components/Image.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';

	import { fetchCameraPicturesInfo } from '$lib/queries.js';
	import { joinRoom, leaveRoom, socketio } from '$lib/socketio.svelte.js';
	import { gaiaState } from '$lib/store.svelte.ts';
	import { STATIC_URL } from '$lib/utils/consts.js';
	import { capitalize, dynamicSort, formatDateTime, slugify } from '$lib/utils/functions.js';

	let { data } = $props();

	let ecosystemName = $derived(data['ecosystemName']);
	let ecosystemUID = $derived(data['ecosystemUID']);
	let slug = $derived(slugify(ecosystemName));

	// A camera is live if it has sent something in the last five minutes, which is
	// the threshold `EcosystemCard` already uses for its camera dot. Gaia's picture
	// cadence (`PICTURE_SENDING_PERIOD`) never reaches the frontend, so this is the
	// app's standing assumption rather than a derived value — hence "Waiting", which
	// is true whatever the cadence, rather than a word blaming the camera.
	const LIVE_MS = 5 * 60 * 1000;
	const SILENT_MS = 60 * 60 * 1000;
	const CLOCK_MS = 30 * 1000;

	let cameraData = $state({});
	let picturesLoaded = $state(false);

	// The ages are counted, not stamped, so the page keeps its own clock.
	let now = $state(new Date());
	let clock;

	let picturesEnabled = $derived(
		gaiaState.ecosystemsManagement[ecosystemUID]?.['pictures'] ?? false
	);

	let cameras = $derived(
		Object.values(cameraData)
			.sort(dynamicSort('camera_name'))
			.map((info) => ({
				uid: info['camera_uid'],
				name: capitalize(info['camera_name'].replaceAll('_', ' ')),
				source: info['source'],
				timestamp: info['timestamp'],
				shape: info['shape']
			}))
	);

	// The picture is written to one path per camera and overwritten in place, so
	// the cache buster has to be the picture itself: the same timestamp is the same
	// frame, and a new one is a new frame.
	const getSource = function (path, timestamp) {
		return `${STATIC_URL}/${path}?timestamp=${new Date(timestamp).getTime()}`;
	};

	// The stored dimension is the array's shape — rows, then columns — so the
	// picture's width is its second element. Anything else is a shape this page
	// cannot reserve space for, and the picture sizes itself instead.
	const getShape = function (dimension) {
		if (!Array.isArray(dimension) || dimension.length < 2) {
			return 'auto';
		}
		const [rows, columns] = dimension;
		if (!rows || !columns) {
			return 'auto';
		}
		return `${columns} / ${rows}`;
	};

	const record = function (cameraUID, info) {
		cameraData[cameraUID] = {
			camera_uid: cameraUID,
			camera_name: info['camera_name'] ?? cameraData[cameraUID]?.['camera_name'] ?? cameraUID,
			source: getSource(info['path'], info['timestamp']),
			timestamp: new Date(info['timestamp']),
			// A pushed frame carries no dimension, only a path and a time. Keeping
			// the shape already worked out is what stops every new frame from
			// resizing the card it lands in.
			shape: info['dimension']
				? getShape(info['dimension'])
				: (cameraData[cameraUID]?.['shape'] ?? 'auto')
		};
	};

	const loadPicturesInfo = async function () {
		const cameraPicturesInfo = await fetchCameraPicturesInfo(ecosystemUID);
		Object.keys(cameraPicturesInfo).forEach((cameraUID) => {
			record(cameraUID, cameraPicturesInfo[cameraUID]);
		});
		picturesLoaded = true;
	};

	// How long ago, in the coarsest unit that still says something. Under a minute
	// a live window is simply current.
	const formatAge = function (timestamp) {
		const age = now - timestamp;
		if (age < 60 * 1000) {
			return 'just now';
		}
		if (age < 60 * 60 * 1000) {
			const minutes = Math.floor(age / (60 * 1000));
			return `${minutes} min ago`;
		}
		if (age < 24 * 60 * 60 * 1000) {
			const hours = Math.floor(age / (60 * 60 * 1000));
			return `${hours} h ago`;
		}
		const days = Math.floor(age / (24 * 60 * 60 * 1000));
		return `${days} d ago`;
	};

	// A live camera carries nothing: no rail, no word. The counted age already says
	// the frame is current, and the quiet card is the working one.
	const getState = function (timestamp) {
		const age = now - timestamp;
		if (age < LIVE_MS) {
			return null;
		}
		if (age < SILENT_MS) {
			return { word: 'Waiting', tone: '--transition-yellow' };
		}
		return { word: 'Silent', tone: '--transition-orange' };
	};

	onMount(async () => {
		clock = setInterval(() => {
			now = new Date();
		}, CLOCK_MS);

		await loadPicturesInfo();

		joinRoom('camera_stream');
		socketio.on('pictures_update', (payload) => {
			if (payload['ecosystem_uid'] !== ecosystemUID) {
				return;
			}
			let unknown = false;
			for (const updatedInfo of payload['updated_pictures']) {
				const cameraUID = updatedInfo['camera_uid'];
				if (cameraUID in cameraData) {
					record(cameraUID, updatedInfo);
				} else {
					unknown = true;
				}
			}
			if (unknown) {
				// A camera that starts sending while the page is open. The push
				// carries no name and no dimension, so the list is read again rather
				// than a nameless frame put on the wall.
				loadPicturesInfo();
			}
		});
	});

	onDestroy(async () => {
		clearInterval(clock);
		leaveRoom('camera_stream');
		socketio.off('pictures_update');
	});
</script>

<!-- `TitleBar` draws its own separator dot as soon as it is handed a snippet, so
     the snippet is withheld entirely rather than rendered empty. -->
{#snippet census()}
	{cameras.length}
	{cameras.length === 1 ? 'camera' : 'cameras'}
{/snippet}

<TitleBar
	title="Camera"
	docTitle="Camera in {ecosystemName}"
	sideBloc={cameras.length ? census : null}
/>

{#if cameras.length}
	<p class="blurb">
		Each camera keeps one picture — the last one it took. New frames arrive as they are photographed
		and replace what is on screen.
	</p>

	<div class="wall">
		{#each cameras as camera (camera.uid)}
			{@const state = getState(camera.timestamp)}
			<figure class="frame" class:railed={state} style={state ? `--rail: var(${state.tone})` : ''}>
				<div class="glass">
					<Image
						source={camera.source}
						frame={camera.shape}
						reveal="wipe"
						alt="Latest frame from {camera.name}"
						caption={formatDateTime(camera.timestamp)}
					/>
				</div>
				<figcaption class="ident">
					<span class="name">{camera.name}</span>
					<span class="when">
						{#if state}
							<span class="pill" style="--tone: var({state.tone})">
								<span class="dot"></span>{state.word}
							</span>
						{/if}
						<span class="age">{formatAge(camera.timestamp)}</span>
					</span>
				</figcaption>
			</figure>
		{/each}
	</div>
{:else if picturesLoaded && picturesEnabled}
	<div class="nothing">
		<h2>Waiting for the first frame</h2>
		<p>
			Pictures are switched on in {ecosystemName}, but nothing has reached the server in the last
			day. Check that the chamber's engine is running and that its camera is connected — the first
			frame appears here on its own.
		</p>
	</div>
{:else if picturesLoaded}
	<div class="nothing">
		<h2>No camera in {ecosystemName}</h2>
		<p>
			Nothing in this chamber is being photographed. Fit a camera to it and switch pictures on, and
			its view appears here.
		</p>
		<a class="go" href={resolve(`/ecosystem/${slug}/settings`)}>Open the chamber's settings</a>
	</div>
{/if}

<style>
	.blurb {
		max-width: 68ch;
		margin-bottom: 16px;
		font-size: 0.8rem;
		color: var(--text-dim-solid);
	}

	/* Tracks are capped as well as floored: a lone camera stretched across the full
	   page is a picture two-thirds of a metre tall, and this is a window, not a
	   billboard. */
	.wall {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
		gap: 18px;
	}

	.frame {
		position: relative;
		display: flex;
		flex-direction: column;
		max-width: 560px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		/* The rail's width is always reserved, so a camera falling behind does not
		   shift its neighbours. */
		padding-left: 3px;
		overflow: hidden;
	}

	/* Rails, not boxes: the edge is painted only when the camera has fallen behind.
	   An `inset` shadow would be covered by the identification bar's own
	   background, so the rail is drawn over both regions. */
	.frame.railed::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		width: 3px;
		background: var(--rail);
	}

	/* The card is the window frame: the picture runs to its edges and is clipped by
	   its radius, with nothing printed over the plants. */
	.glass {
		display: flex;
		background: var(--surface-2);
	}

	.ident {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 4px 12px;
		padding: 8px 12px;
		background: var(--surface-2);
		border-top: 1px solid var(--border);
	}

	.name {
		font-family: 'Raleway', sans-serif;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
	}

	.when {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.age {
		font-family: 'Open Sans', sans-serif;
		font-variant-numeric: tabular-nums;
		font-size: 0.74rem;
		color: var(--text-dim-solid);
	}

	/* State pill — same chip as `Table` and `DataSheet`, driven by one --tone */
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: 'Raleway', sans-serif;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		padding: 3px 8px;
		border-radius: 3px;
		white-space: nowrap;
		background: color-mix(in srgb, var(--tone) 14%, transparent);
		color: var(--tone);
	}

	.pill .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--tone);
	}

	.nothing {
		max-width: 60ch;
	}

	.nothing h2 {
		font-family: 'EB Garamond', Garamond, Georgia, serif;
		font-weight: 600;
		font-size: 1.375rem;
		margin: 0 0 8px;
		color: var(--text);
	}

	.nothing p {
		font-size: 0.85rem;
		color: var(--text-dim-solid);
	}

	.go {
		display: inline-block;
		margin-top: 14px;
		font-family: 'Raleway', sans-serif;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
