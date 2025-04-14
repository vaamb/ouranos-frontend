<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
</script>

<HeaderLine title="Concerning GAIA" />

<div class="text">
	<p>
		GAIA, short for Greenhouse Automation Intuitive App, is a side project I started during my
		PhD study in plant biology, aiming to replicate the functionalities of laboratory
		phytotrons (growth chambers). It was initially conceived as a small Python script, operating on
		a Raspberry Pi Zero, executing a basic routine. This routine involved monitoring the status of
		lights, reading temperature and humidity data through a DHT22 sensor, and logging the
		information into a text file.
	</p>
	<p>
		Then, as I learnt more about Python, I wanted to add some functionalities. First, I focused on
		adding the possibility to read the configurations from a YAML file, instead of embedding
		them directly into the main Python script. Then, as the text file used to record the sensor data
		became impractical, I decided to use a more efficient method by logging them into a database,
		using SQLite and plain SQL queries.
	</p>
	<p>
		As the volume of data increased, I soon wanted to add visualization capabilities. To
		achieve this, I used Flask to construct a small website and integrated JavaScript with Chart.js
		to render basic graphs. However, with the project's growth, it became more and more resource hungry
		on my poor Raspberry Pi Zero. As such, I chose to split GAIA into two distinct sub-programs
		and migrate them to a more capable Pi 3B+. These programs were gaiaEngine
		(renamed <a href="https://github.com/vaamb/gaia">Gaia</a>, in lowercase), responsible for managing
		plant-related functionalities, and gaiaWeb (that became
		<a href="https://github.com/vaamb/ouranos-core">Ouranos</a>, after the husband of Gaia in Greek
		mythology), serving as the Flask server.
	</p>
	<p>
		As I followed Flask tutorials, the architecture of gaiaWeb underwent a significant
		transformation, evolving into a more organized structure. One of the changes I made at that
		time was starting to use an ORM (SQLAlchemy) to spend less time on SQL schema and queries and more
		on Python. In parallel, I
		wanted to increase Gaia's flexibility, and so I started to create sensor templates as I learnt
		more about OOP and how to use Python classes. I also realised that while the web server had to
		be operated on the Raspberry Pi 3B+, I could still run Gaia (which I tried to keep relatively
		light) on my old Pi Zero. However, I faced the challenge of synchronizing data between Gaia and
		Ouranos without relying on shared memory, necessitating a more sophisticated approach.
	</p>
	<p>
		The first step was to totally isolate Gaia from Ouranos. This was a task harder than I thought
		as many Python objects and data were shared between the two sub programs (these shared objects
		and data later became <a href="https://github.com/vaamb/gaia-validators">Gaia Validators</a>).
		To solve this, I explored methods for sharing data between Python processes operating across
		different interpreters and even different machines. Ultimately, I opted to use Socket.IO (a clearly
		suboptimal solution) for sharing data between Gaia and Ouranos. This decision was influenced by
		my prior success in using Socket.IO for real-time data updates in graph visualization, where it
		was doing a rather good job.
	</p>
	<p>
		This worked for a while, but I wanted to to expand the server's capabilities further. I realized
		that while it could be useful to instantiate multiple Flask processes down the line, certain
		new functionalities (such as a database archiver for storing old entries in a long-term storage
		database, a script for retrieving weather data, and another for fetching sunrise and sunset
		times) should only be launched once. This raised the issue of sharing data across multiple
		processes once again. However, this time I took a different approach and developed a basic
		<a href="https://github.com/vaamb/event-dispatcher">event dispatcher</a> with an API similar to
		Socket.IO's. I tried to make this dispatcher broker agnostic, enabling versatility.
		It can operate in-memory, utilize Redis or RabbitMQ, and adding support for additional brokers is
		straightforward.
	</p>
	<p>
		Simultaneously, while I was making the backend more resilient, I was continuing to add interactivity
		to the frontend, leveraging vanilla JavaScript and the capabilities of Socket.IO, while still relying on
		Flask and Jinja2. However, as the codebase grew, I started to face issues with spaghetti code,
		leading me to look for a solution. Enter Vue.js, a JavaScript frontend framework. This decision
		required significant modifications to Ouranos: transitioning all the Flask routes I had been
		working on into an API structure and migrating Jinja2-based templates to Vue.js components.
	</p>
	<p>
		During the final stages of my thesis, I had limited free time to play with GAIA. However, once I
		completed it, I resumed my experiments with GAIA. Quickly, I found Vue.js to be overly
		"boilerplate-y" and missed the ability to validate queries received by Flask. This led me
		to switch not just one, but two of the frameworks I had been using. For the backend of Ouranos,
		I opted for FastAPI, which introduced me to async programing and Pydantic. Pydantic became integral for
		validating inputs across both Ouranos and Gaia.
		For the <a href="https://github.com/vaamb/ouranos-frontend">frontend</a>, I chose Svelte
		(and later SvelteKit), which made Javascript a bit less painful to write.
	</p>
	<p>
		At that point, I started to have a good enough backbone and so I focused on making the code cleaner and
		adding more "aesthetic" features. So in parallel of removing redundant chunks in my code, trying to write
		more maintainable code and increasing test coverage; I started to play with CI/CD pipeline (that greatly
		reduced the amount of errors making it to "production"), photo manipulation (allowing to visualize Gaia's
		ecosystems from Ouranos' UI and compute ecosystem health metrics) and added a ridiculously simple wiki.
	</p>
	<p>
		Here is the (temporary) result of this side project, until I decide to make further changes. It has
		been a pleasure to play with this project, as it has taught me a lot about Python, project architecture,
		databases, JavaScript, NGINX, concurrency, RabbitMQ, and more ...
	</p>
</div>

<style>
</style>
