Ouranos-frontend
================

Ouranos-frontend is the web interface for
[Ouranos](https://github.com/vaamb/ouranos-core), the companion server to
[Gaia](https://github.com/vaamb/gaia). It is a SvelteKit application that
connects to the Ouranos REST + WebSocket API and provides a real-time dashboard
for monitoring and controlling plant growth environments.

It ships as both a standalone Node.js app and a Python plugin that Ouranos can
launch and manage automatically.

Part of the [gaia-ouranos](https://github.com/vaamb/gaia-ouranos) ecosystem.

---

Features
--------

**Dashboard and monitoring**
- Home page with per-ecosystem status cards: sensors, actuators, camera, health,
  nycthemeral cycle, and server latency
- Live updates via Socket.IO: sensor readings, actuator states, and connection
  status refresh without page reload
- Per-ecosystem pages: current and historic sensor graphs, actuator control with
  countdown timers, camera pictures, and settings
- Weather page with forecasts, suntimes, and condition graphs
- Calendar with full CRUD support and visibility control
- Warnings page for sensor alarms

**Access control** — pages are grouped by role:

| Role          | Pages                                                                            |
|---------------|----------------------------------------------------------------------------------|
| Everyone      | Home, Ecosystem (sensors, actuators, camera, settings), Weather, Calendar, About |
| Logged-in     | Warnings, Wiki, User profile and settings                                        |
| Operator      | Engine settings                                                                  |
| Administrator | User management, Services settings, System load per server                       |

**Component library** — reusable Svelte components included:
`Gauge`, `Graph`, `Calendar`, `Table`, `Form`, `Modal`, `Switch` (with countdown),
`SlideButton`, `Image` (zoomable), `BottomBar`, `TopBar`

---

Requirements
------------

- Node.js LTS (20+) and npm
- Python 3.11+ and `uv` (for the Ouranos plugin wrapper)
- A running [Ouranos](https://github.com/vaamb/ouranos-core) instance

---

Installation
------------

Ouranos must be installed first. Copy the install script from the `scripts/`
directory into any working directory and run it:

```bash
bash install.sh
```

The script will:
1. Install Node.js and npm if not already present
2. Clone the repository into `$OURANOS_DIR/lib/ouranos-frontend`
3. Install npm dependencies and build the SvelteKit app
4. Install the Python wrapper into Ouranos' virtual environment

The frontend plugin is enabled automatically once installed — Ouranos will
detect it on the next start.

---

Running
-------

**With Ouranos** (recommended):

```bash
ouranos restart           # restart Ouranos and all plugins, including the frontend
ouranos start frontend    # start the frontend plugin standalone
```

Or if running via systemd:

```bash
sudo systemctl restart ouranos.service
```

**Standalone Node** (production build required):

```bash
npm run build
node build
```

The frontend listens on `http://127.0.0.1:3000` by default.

---

Configuration
-------------

When launched through Ouranos, the frontend's `.env` file is patched
automatically from the active Ouranos config. No manual configuration is needed
for standard setups.

To customise the bind address or the backend URL, set these in your Ouranos
`config.py` (or via environment variables):

| Config key        | Env variable                  | Default       | Description                          |
|-------------------|-------------------------------|---------------|--------------------------------------|
| `FRONTEND_HOST`   | `OURANOS_FRONTEND_HOST`       | `127.0.0.1`   | Address the Node server binds to     |
| `FRONTEND_PORT`   | `OURANOS_FRONTEND_PORT`       | `3000`        | Port the Node server listens on      |
| `FRONTEND_USE_SSL`| `OURANOS_FRONTEND_USE_SSL`    | `False`       | Enable HTTPS                         |
| `API_HOST`        | `OURANOS_API_HOST`            | `127.0.0.1`   | Ouranos API host (for `BACKEND_URL`) |
| `API_PORT`        | `OURANOS_API_PORT`            | `5000`        | Ouranos API port                     |

For development, create a `.env` file at the root of the repository:

```
PUBLIC_APP_MODE = "development"
PUBLIC_BACKEND_URL = "http://127.0.0.1:5000"
PUBLIC_LOCAL_API_URL = "http://127.0.0.1:5000/api"
```

---

Development
-----------

Clone the repository and install dependencies:

```bash
git clone https://github.com/vaamb/ouranos-frontend.git
cd ouranos-frontend
npm install
```

Start the Vite development server (requires a running Ouranos instance):

```bash
npm run dev
```

Build for production:

```bash
npm run build
# or via the Ouranos CLI after installing the Python wrapper:
ouranos frontend build
```

Run unit tests:

```bash
npm run test:unit   # vitest
npm test            # playwright end-to-end
```

Lint and format:

```bash
npm run lint
npm run format
```

---

Tech stack
----------

- Svelte 5 · SvelteKit 2 · Vite · adapter-node
- Socket.IO client (real-time data)
- Chart.js + chartjs-adapter-date-fns (sensor and actuator graphs)
- Axios (REST API calls)
- svelte-fa + Font Awesome (icons)
- gaugeJS (dashboard gauges)
- marked (wiki Markdown rendering)
- date-fns · humanize-duration
- Python 3.11+ · setuptools (plugin wrapper)
- Vitest · Playwright · ESLint · Prettier

---

Status
------

Active. Running in production at home since 2024. The page set is complete;
the UI and component APIs may still evolve.
