<script>
	import HeaderLine from '$lib/components/HeaderLine.svelte';
</script>

<HeaderLine title="Concerning GAIA" />

<div class="text">
	<p>
		GAIA stands for the Greenhouse Automation Intuitive App. It is a side project started during my PhD study in
        plants biology to replicate the functionalities of the phytotrons (growth chambers) used in the lab. It started
        as a small script written in Python running on a Raspberry Pi Zero. It was a simple loop that would check if
        the lights were on or off, read the temperature and humidity from a DHT22 sensor and write it in a text file.
	</p>
	<p>
		Then, as I started to learn a bit more to code with  Python, I wanted to add some functionalities. First was
        the possibility to read the configuration from a YAML file instead of having to write it in the main Python
        script. Then, as the text file used to record the sensor data quickly became impractical, I wanted to log those
        data into a database (using MySQLdb and SQL queries).
	</p>
	<p>
		Now, those data were more easy to search through but I wanted to be able to visualise them. To do so, I used
        Flask to build a simple website and added a bit of javascript with chartjs to display simple graphs. As the
        project grew, it became more and more resources hungry on my poor Pi Zero and I choose to divide GAIA in two
        sub-programs and to migrate them to a new Pi 3B+. Those news programs were gaiaEngine (that became
        <a href="https://github.com/vaamb/gaia">Gaia</a>, without capital letters), and gaiaWeb (that became
        <a href="https://github.com/vaamb/ouranos-core">Ouranos</a>, the husband of Gaia in the greek mythology).
        gaiaEngine was composed of the functionalities that took care of the plants while gaiaWeb was the Flask server.
    </p>
    <p>
        As I followed Flask guides made by Miguel Grinberg, gaiaWeb architecture totally changed and became more
        structured and I started to use an ORM (SQLAlchemy) to spend less time on SQL and more on Python. In parallel,
        I wanted Gaia to be more flexible so I created sensors templates as I learnt how to use Python classes. I also
        realised that while the web server should be operated on the Raspberry Pi 3B+, I could still run Gaia (which I
        tried to keep relatively light) on my old Pi Zero but I needed to share the data between Gaia and Ouranos
        without relying on the fact that they were launched in the same interpreter and thus shared their memory.
    </p>
    <p>
        The first step was to totally isolate Gaia from Ouranos. This was a task harder than I thought as many Python
        objects were shared between the two sub programs. Then I looked how to share data between Python processes not
        running in the same interpreter and not even running on the same computer. In the end, I choose to use Socket.IO
        to share data between Gaia and Ouranos as I had used to update the data on my graphs in real time and it was
        doing a rather good job.
	</p>
	<p>
		This worked for a while, but I still wanted to add even more functionalities to the server and realised that
        while it could be useful to instantiate multiple Flask processes in the future, some new functionalities (such
        as a database archiver to store old db entries to a long term storage db, a script to get the weather, another
        to get the sunrise and sunset times, ...) should be launched only a single time. There again, the need to share
        data between multiple processes arose. However, this time I used a new approach and wrote a simple
        <a href="https://github.com/vaamb/event-dispatcher">event dispatcher</a> with an API comparable to the one of
        Socket.IO. I tried to make this dispatcher broker agnostic and it can run in memory, using Redis or RabbitMQ,
        and it is easy to add new brokers.
	</p>
	<p>
		At the same time, as I was making the backend more resilient, I was adding interactivity to the frontend (still
        based on Flask and Jinja2) by writing more and more code in Javascript and using the possibilities offered by
        Socket.IO. However, at one point, I started to have too much spaghetti code and I looked for a solution. This
        solution was to use a Javascript frontend framework and I chose Vue.js. Here again, a big modification was
        needed on Ouranos: change all the Flask routes I had been working on and change them into an API, and port all
        the templates that I did using Jinja2 into Vue.js.
	</p>
	<p>
        At that time, my thesis came to its end and I had less free time to play with GAIA. When I passed it, I started
        again to play with GAIA. Soon, I found Vue too "boilerplate-y" and I missed the possibility to validate
        the queries Flask received. That's how I once again switched not one, but two of the frameworks I was using. For
        Ouranos backend, I chose FastAPI, thanks to which I finally had to learn asyncio and discovered Pydantic, which
        I sprinkled everywhere some input was needed, both in Ouranos and Gaia. For the frontend, I chose Svelte (and
        later SvelteKit) that finally made Javascript a bit less painful to write.
    </p>
	<p>
		Finally, here is the (temporary) result (until I decide to change another thing), a side project I had a lot of
        fun to play with and thanks to which I learnt a lot about Python, project architecture, databases, Javascript,
        NGINX, concurrency, RabbitMQ ...
	</p>
</div>

<style>
	.text {
		width: 800px;
		margin: auto;
		line-height: 1.5;
		text-align: justify;
		text-justify: inter-word;
	}
	.text p {
		font-size: 1.06rem;
		margin-bottom: 1rem;
	}
</style>
