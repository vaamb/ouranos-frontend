<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	import DataSheet from '$lib/components/DataSheet.svelte';
	import SectionHead from '$lib/components/SectionHead.svelte';
	import TitleBar from '$lib/components/TitleBar.svelte';
	import { ecosystemViews } from '$lib/components/nav/functions.js';

	import { gaiaState } from '$lib/store.svelte.ts';
	import { dynamicSort, months, slugify } from '$lib/utils/functions.js';

	const UMBRELLA_REPO = 'https://github.com/vaamb/gaia-ouranos';

	// --- This install ----------------------------------------------------
	// Everything here is read from the store, so the page describes whatever
	// install is serving it rather than the one it was written on.
	const version = $derived(page.data['appVersion']);
	const engines = $derived(Object.values(gaiaState.engines));
	const ecosystems = $derived(Object.values(gaiaState.ecosystems).sort(dynamicSort('name')));

	// The install is as old as its oldest registration, engine or ecosystem.
	const runningSince = $derived.by(() => {
		const stamps = [...engines, ...ecosystems]
			.map((record) => record['registration_date'])
			.filter((date) => date)
			.map((date) => new Date(date).getTime());
		if (stamps.length === 0) {
			return null;
		}
		const oldest = new Date(Math.min(...stamps));
		return `${months[oldest.getMonth()]} ${oldest.getFullYear()}`;
	});

	const installRows = $derived([
		{ label: 'Ouranos', value: version },
		{ label: 'Running since', value: runningSince },
		{ label: 'Engines', value: engines.length > 0 ? String(engines.length) : null },
		{ label: 'Ecosystems', value: ecosystems.map((ecosystem) => ecosystem['name']) }
	]);

	// The views a visitor can open: the ones the nav line would show for that
	// place, minus its settings — a settings page is not something to look at.
	const places = $derived(
		ecosystems
			.map((ecosystem) => ({
				uid: ecosystem['uid'],
				name: ecosystem['name'],
				views: ecosystemViews(
					slugify(ecosystem['name']),
					gaiaState.ecosystemsManagement[ecosystem['uid']] || {}
				).filter((view) => view['id'] !== 'settings')
			}))
			.filter((place) => place['views'].length > 0)
	);

	// --- How it's built --------------------------------------------------
	const repoRows = [
		{
			label: 'Gaia',
			repo: 'gaia',
			value:
				'The edge node. Runs on a Raspberry Pi and manages the sensors, actuators, lights and climate control of its ecosystems.'
		},
		{
			label: 'Ouranos core',
			repo: 'ouranos-core',
			value:
				'The backend server. Aggregates the data sent by the Gaia instances, archives it and exposes it through a REST and Socket.IO API.'
		},
		{
			label: 'Ouranos frontend',
			repo: 'ouranos-frontend',
			value: 'This web UI, built with SvelteKit.'
		},
		{
			label: 'Event dispatcher',
			repo: 'event-dispatcher',
			value:
				'A broker-agnostic pub/sub library, extracted from Gaia and used to communicate between every components.'
		},
		{
			label: 'Gaia validators',
			repo: 'gaia-validators',
			value: 'The Pydantic models used as the data transfer protocol between Gaia and Ouranos.'
		}
	];
</script>

{#snippet repo(row)}
	<span class="role">{row['value']}</span>
	<a class="repo" href="https://github.com/vaamb/{row['repo']}">vaamb/{row['repo']}</a>
{/snippet}

<TitleBar title="Concerning Gaia & Ouranos" />

<article class="paper">
	<div class="prose lead">
		<p>
			Gaia-Ouranos is an automation system that monitors and controls plant growth environments:
			greenhouses, terrariums, aquariums, or any enclosure where temperature, humidity, light and
			CO₂ matter. One or more Raspberry Pis run Gaia, the edge automation node. They report to
			Ouranos, a backend server that aggregates and archives the sensor data, exposes a REST and
			WebSocket API, and serves this web UI. Everything communicates through a custom event
			dispatcher that works in memory, over RabbitMQ or over Redis.
		</p>
		<p>
			This project started during my PhD in plant biology, to replicate laboratory phytotrons on a
			budget, and it has been running at home ever since.
		</p>
	</div>
	<a class="cta" href={UMBRELLA_REPO}>See the code on GitHub</a>
</article>

<section>
	<SectionHead title="This install" />
	<DataSheet rows={installRows} />

	{#if places.length > 0}
		<p class="note">
			Have a look. Everything below is public; nothing here can be changed without logging in.
		</p>
		<div class="places">
			{#each places as place (place['uid'])}
				<div class="place">
					<span class="nm">{place['name']}</span>
					<div class="chiprow">
						{#each place['views'] as view (view['id'])}
							<a class="chip" href={resolve(view['path'])}>{view['name']}</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<section>
	<SectionHead title="What's inside" />
	<DataSheet rows={repoRows.map((row) => ({ ...row, content: repo }))} />
</section>

<section>
	<SectionHead title="The story" />
	<article class="paper">
		<div class="prose">
			<p>
				GAIA stands for Greenhouse Automation Intuitive App. I started it during my PhD in plant
				biology to replicate at home the functionalities of phytotrons (growth chambers) we used in
				the lab. It started as a small Python script running a single routine on a Raspberry Pi
				Zero: a loop that checked whether the lights were on, read the temperature and humidity from
				a DHT22 sensor and wrote them to a text file.
			</p>
			<p>
				As I learnt more Python, I wanted to add functionalities. The configuration moved out of the
				script and into a YAML file. Soon, the text file became impractical to store data, and the
				readings went into a SQLite database. As I wanted to visualize this data, I built a small
				Flask website with a few Chart.js graphs.
			</p>
			<p>
				That became too much for my poor Pi Zero. I split GAIA in two and moved to a Pi 3B+:
				gaiaEngine took care of the plants, gaiaWeb was the Flask server. They became
				<a href="https://github.com/vaamb/gaia">Gaia</a> (in lowercase) and
				<a href="https://github.com/vaamb/ouranos-core">Ouranos</a>, after the husband of Gaia in
				Greek mythology. Since Gaia was light enough to keep running on the old Pi Zero while
				Ouranos needed to stay on the 3B+, the two had to become independent processes and stop
				sharing memory. Isolating them was harder than expected, as many Python objects were used by
				both; the ones the two still had to agree on and share became
				<a href="https://github.com/vaamb/gaia-validators">gaia-validators</a>. For the link itself
				I first picked Socket.IO, which was already doing a good job pushing live data to my graphs.
			</p>
			<p>
				The server kept growing. Some of its jobs, such as archiving old records or fetching the
				weather, had to run exactly once even if several web workers were started. So processes
				needed to talk to each other too, and this time I wrote a small dedicated
				<a href="https://github.com/vaamb/event-dispatcher">event dispatcher</a>
				with an API close to Socket.IO's that I also used to share data between Gaia and Ouranos. This
				event dispatcher is broker agnostic and can run in memory, over Redis or RabbitMQ, and adding
				a new broker is easy.
			</p>
			<p>
				Meanwhile, the frontend (still based on Flask and Jinja2) had accumulated enough JavaScript
				to turn into spaghetti code. Vue.js fixed that, and turned Ouranos into a backend API in the
				process. Then, once my thesis was defended and I had more free time for myself, Vue felt too
				"boilerplate-y" and I started to miss the possibility to validate the queries the API
				received. So I switched two frameworks once more: FastAPI and Pydantic on the backend (which
				taught me asyncio, and gave both Gaia and Ouranos proper input validation), and Svelte
				(later SvelteKit) for <a href="https://github.com/vaamb/ouranos-frontend">the frontend</a>,
				and it finally made JavaScript a bit less painful to write.
			</p>
			<p>
				Six years later it is still running every day, on my old Pi Zero and a newer Pi 4B, and it
				has taught me a lot about Python, project architecture, databases, JavaScript, NGINX,
				concurrency, RabbitMQ and more.
			</p>
			<p>
				The next step is to get out of the Raspberry Pi's GPIO pins: Gaia now speaks a WebSocket
				protocol to remote hardware, and an ESP32 firmware written in Rust is being written, so that
				microcontrollers can act as sensors and actuators from anywhere in the greenhouse.
			</p>
		</div>
	</article>
</section>

<style>
	.paper {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: clamp(18px, 3.5vw, 40px);
		margin-bottom: 1.2rem;
	}

	.paper .prose {
		max-width: inherit;
		margin: 0 auto;
	}

	.lead {
		font-size: 1.18rem;
		text-align: left;
		hyphens: none;
	}

	.lead p:last-child {
		margin-bottom: 0;
	}

	/* The one solid button on the page */
	.cta {
		display: inline-flex;
		align-items: center;
		margin-top: 22px;
		padding: 9px 16px;
		font-family: 'Raleway', sans-serif;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--surface);
		background: var(--text);
		border: 1px solid var(--text);
		border-radius: var(--radius);
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}

	.cta:hover {
		background: var(--text-dim-solid);
		border-color: var(--text-dim-solid);
	}

	.cta:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 3px;
	}

	section {
		margin-top: clamp(28px, 5vw, 44px);
	}

	.note {
		margin: 0 0 12px;
		font-size: 0.85rem;
		color: var(--text-dim-solid);
	}

	/* A place and its views, the same row the "Go to" sheet uses. */
	.places {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.place {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 14px;
	}

	.nm {
		font-family: 'Raleway', sans-serif;
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text);
	}

	.chiprow {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.chip {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--text-dim-solid);
		text-decoration: none;
		padding: 5px 9px;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--surface-2);
	}

	.chip:hover {
		color: var(--text);
		border-color: var(--border-strong);
	}

	.chip:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}

	/* A repo row: its role, and the repository under it in mono. */
	.role {
		display: block;
	}

	.repo {
		display: inline-block;
		margin-top: 3px;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 0.78rem;
		color: var(--text-dim-solid);
		text-decoration: none;
		border-bottom: 1px solid var(--border-strong);
	}

	.repo:hover {
		color: var(--text);
		border-bottom-color: var(--text);
	}

	.repo:focus-visible {
		outline: 2px solid var(--grow);
		outline-offset: 2px;
	}
</style>
