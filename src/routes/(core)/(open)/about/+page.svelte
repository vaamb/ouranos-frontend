<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
</script>

<HeaderLine title="Concerning GAIA" />

<div class="text">
	<p>
        GAIA, short for Greenhouse Automation Intuitive App, is a side project I started during my doctoral research in
        plant biology, aiming to emulate the functionalities of laboratory phytotrons (growth chambers).
        It was initially conceived as a small Python script, operating on a Raspberry Pi Zero, executing a basic
        routine.
        This routine involved monitoring the status of lights, capturing temperature and humidity data through a DHT22
        sensor, and logging the information into a text file.
	</p>
	<p>
		Then, as I delved deeper into Python, I wanted to add some functionalities. First, I focused on incorporating
        the possibility to extract configurations from a YAML file, streamlining the process instead of embedding them
        directly into the main Python script.
        Then, as I became limited by possibilities offered by storing my sensor data in a text file, I sought to
        transition to a more efficient method by logging them into a database.
        This involved utilizing sqlite and executing SQL queries for data management.
	</p>
	<p>
        As the volume of data increased, I soon wanted to  incorporate visualization capabilities.
        To achieve this, I used Flask to construct a small website and integrated JavaScript with Chart.js to render
        basic graphs.
        However, with the project's expansion, it began to strain the resources of my poor Raspberry Pi Zero.
        Consequently, I chose to split GAIA into two distinct sub-programs and migrate them to a more capable Pi 3B+.
        These programs were gaiaEngine (renamed <a href="https://github.com/vaamb/gaia">Gaia</a>, in lowercase),
        responsible for managing plant-related functionalities, and gaiaWeb (that became
        <a href="https://github.com/vaamb/ouranos-core">Ouranos</a>, after the husband of Gaia in Greek mythology),
        serving as the Flask server.
    </p>
    <p>
        As I immersed myself in Flask tutorials, the architecture of gaiaWeb underwent a significant transformation,
        evolving into a more organized structure.
        One of the changes undertaken at that time is that I started to use an ORM (SQLAlchemy) to streamline database
        operations, allowing me to allocate more time to Python development rather than writing SQL queries.
        In parallel, I wanted to increase Gaia's flexibility, thus, I started to create sensor templates as I learnt
        more about OOP and how to use Python classes.
        I also realised that while the web server had to be operated on the Raspberry Pi 3B+, I could still use Gaia
        (which I tried to keep relatively light) on my old Pi Zero. However, I faced the challenge of synchronizing
        data between Gaia and Ouranos without relying on shared memory, necessitating a more sophisticated approach.
    </p>
    <p>
        The first step was to totally isolate Gaia from Ouranos.
        This proved to be a more challenging task than anticipated, given the numerous Python objects shared between
        the two subsystems.
        To address this, I explored methods for sharing data between Python processes operating across different
        interpreters and even different machines.
        Ultimately, I opted to use Socket.IO for data sharing between Gaia and Ouranos.
        This decision was influenced by my prior success in using Socket.IO for real-time data updates in graph
        visualization, where it was doing a rather good job.
	</p>
	<p>
		This worked for a while, but I wanted to to expand the server's capabilities further.
        I realized that while it might be beneficial to instantiate multiple Flask processes down the line, certain new
        functionalities (such as a database archiver for storing old entries in a long-term storage database, a script
        for retrieving weather data, and another for fetching sunrise and sunset times) should only be launched once.
        This raised the issue of sharing data across multiple processes once again.
        However, this time I took a different approach and developed a basic
        <a href="https://github.com/vaamb/event-dispatcher">event dispatcher</a> with an API similar to Socket.IO's.
        I aimed to make this dispatcher independent of any specific messaging broker, enabling versatility.
        It can operate in-memory, utilize Redis or RabbitMQ, and adding support for additional brokers is
        straightforward.
	</p>
	<p>
        Simultaneously, while enhancing the backend's resilience, I was continuing to add interactivity to the frontend,
        leveraging JavaScript and the capabilities of Socket.IO, while still relying on Flask and Jinja2.
        However, as the codebase grew, I found myself grappling with spaghetti code, prompting me to seek a solution.
        Enter Vue.js, a JavaScript frontend framework.
        This decision necessitated significant modifications to Ouranos: transitioning all the Flask routes I had been
        working on into an API structure and migrating Jinja2-based templates to Vue.js components.
	</p>
	<p>
        During the final stages of my thesis, I had limited free time to play with GAIA.
        However, once I completed it, I resumed my experiments with GAIA.
        Quickly, I found Vue.js to be overly "boilerplate-y" and yearned for the ability to validate queries received by
        Flask.
        This led me to switch not just one, but two of the frameworks I had been using.
        For the backend of Ouranos, I opted for FastAPI, which introduced me to asyncio and Pydantic.
        Pydantic became integral for validating inputs across both Ouranos and Gaia.
        For the <a href="https://github.com/vaamb/ouranos-frontend">frontend</a>, I chose Svelte (and later SvelteKit),
        which made Javascript a bit less painful to write.
    </p>
	<p>
        Here is the current snapshot of my side project, until I decide to make further changes.
        I've thoroughly enjoyed delving into this project, as it has provided me with valuable insights into Python,
        project architecture, databases, JavaScript, NGINX, concurrency, RabbitMQ, and more ...
	</p>
</div>

<style>

</style>
