# Changelog

> **Note on versioning:** Prior to version 0.9.0, the package used its own version
> numbering (starting at 0.1.0). Starting with 0.9.0, the version number was aligned
> with the Ouranos core versioning scheme, causing the version to jump from 0.1.0 to 0.9.0.

---

## Unreleased

### Added
- Comments on pages with SSR disabled (#271)

### Changed
- Svelte 5 upgrade complete: all remaining stores replaced with `$state` runes (#268)
- Engines overview page treated as a "default" page type (#272)
- "Server info" box renamed to "Server status"; latency section always rendered (#262)
- Home page: ecosystem card simplified, "no-functionality" box removed, gaia API
  calls parallelized, "calendar" box only rendered when the service is enabled
  (#261, #263, #273, #274)
- Core layout improved (#264); health data fetching parallelized (#265)
- `Maintenance` and `Unreachable` pages centered (#269)

### Fixed
- Service-dependent pages now guarded against unauthorized access (#260)

### Development
- `ESLint` bumped to 9.39.4 (#267)

---

## 0.10.0 — 2026-04-10

> Version bump to align with Ouranos core versioning.

### Added
- Weather events in the ecosystem settings page (#237)
- `build` subcommand added to the Python package (#236)
- Transitions when minimizing the menu (#240)
- `Image` component can be enlarged on click (#227)
- Shortcut to the camera page on the home page (#229)
- Quick link to ecosystem settings from the home page (#220)
- Nycthemeral info shown for ecosystems with at least one subsystem enabled (#218)
- Menu can be toggled on larger screens (#239)

### Changed
- Ecosystem settings page made accessible to all users (#221)
- `$app/store` upgraded to `$app/state` (#243)
- `Modal` fully refactored for Svelte 5: snippets for title and content, `$props`
  runes, `confirmationButtons` removed, inconsistencies fixed (#248, #249, #250, #251)
- `Image` simplified and fully adheres to Svelte 5 (#253)
- `BottomBar` logic simplified (#252); page guard for engine/ecosystem pages restored (#256)
- `Form`: values not changed by the user are no longer submitted; internal maintenance
  improved (#234, #247)
- Layout and `Table` inconsistencies fixed (#245, #246)
- Weather page: more information, better mobile rendering, graphs homogenized with
  the sensor page (#214, #215, #216)
- Actuator graphs drawn when the actuator is active or when there are enough data points (#254)
- `install.sh` and `update.sh` improved and migrated to `uv` (#219, #241, #255)
- Home page: ecosystems ordered by status (#226); `actuator` reference guarded (#225)
- `createEventDispatcher` replaced by callbacks throughout (#232)
- New "actuators" management field and `Functionality` nomenclature adopted (#222, #212)
- `$derived` used on variables from page `$props` (#217)
- Data fetching in `(core)`'s server layout parallelized (#257)

### Removed
- Python 3.9 and 3.10 support dropped (#242)

### Fixed
- `BottomBar` no longer appears on the home page when not required (#258)
- Calendar day ordering fixed (#213)
- Settings path on the home page fixed (#235)
- Hardware API calls fixed (#230, #231); hardware removed from config no longer
  fetched (#233)
- Static image URL warning fixed (#228)
- `adapter-node` version constraint relaxed (#244)

---

## 0.9.0 — 2025-05-25

> Version aligned to Ouranos core versioning (supersedes 0.1.0).

### Added
- Calendar page with full CRUD support, visibility control, and Monday start (#132, #134, #195)
- Wiki page (user-reserved) (#164, #182, #190)
- Health page (#167)
- Weather page with suntimes, smoothed graphs, and detailed information (#128, #147, #201)
- Account confirmation and password reset pages (#172)
- Admin page for user management and invitations (#179)
- Services toggle page (#148)
- `BottomBar` with ecosystem, engine, and server connection status (#107)
- Error page template with "go back" button (#114, #160)
- Camera page with `Image` component; enlarge on click (#110, #111)
- Actuator record graphs (#96)
- Server load page (#89)
- Countdown on `Switch` component (#146)
- Welcome email sent after registration (#194)
- "visibility" field for calendar events (#195)
- More nycthemeral info on the home page (#159)
- Socket.IO room join/leave events (#109)

### Changed
- Initial migration to Svelte 5: runes adopted where possible, stores retained (#129)
- Navigation menu improved: organised by ecosystem, transitions on phones (#81, #151, #177)
- Auth pages improved on phones (#178)
- `User` store reworked; server-to-client data transmission improved (#66)
- Pages grouped by permission level; ecosystems slugified; 404 on unknown ecosystems (#67, #145)
- `warnings` made a derived store (#152)
- Connection status displayed in `TopBar`; always visible on wide screens (#102, #104)
- Ecosystems/engines dynamic state split from static part (#168)
- Actuator graphs updated at a fixed interval and on data events (#197)
- Charts cleaned up on component destroy (#196)
- `Form` improved: required fields, file upload, empty values excluded from payload
  (#137, #154, #157, #166)
- `Table` improved: HTTP link support, custom data formatters (#140, #153)
- `Calendar` improved: Monday start, midnight boundary fix, readability (#188, #189, #198)
- `Modal` and `HeaderLine` adapted for Svelte 5 snippets (#165)
- Ecosystem settings table uniformized; weather graphs smoothed (#199, #201)
- `Config` made more robust; parameters passed to `.env` file (#191)
- Body color contrast increased; images size reduced (#204, #206)
- Fonts deferred on pages that rarely use them (#208)
- Ouranos `Plugin` system adopted (#209)
- Session cookie refreshed through the base layout (#207)
- Health data cached on the home page (#170)

### Fixed
- Actuator page: shown when recently active or currently active; records patched for
  active actuators with no recent state change (#108, #175, #176)
- `fetchWikiArticles` / `fetchWikiPictures` now use `API_URL` (#200)
- `fetchSensorsCurrentDataForMeasure` for plants on the home page fixed (#124)
- `Config.API_URL_LOCAL` no longer derived from `BACKEND_URL` by default (#193)
- `auth.css` removed (was interfering with `global.css`) (#138)
- `BottomBar` updated for slugified ecosystem names (#150)
- API call fixes: hardware, environment parameters, system data format (#93, #101, #230, #231)
- Redirect to the previous page after login (#126)
- Page reload attempted after account confirmation (#192)
- Calendar events refreshed after CRUD requests (#139)
- Weather and user data only fetched when actually needed (#32, #37)

---

## 0.1.0 — 2024-01-29

Initial public release. Bootstrapped from earlier work (2023-03-13).

### Added
- Base SvelteKit application structure with Python plugin wrapper (`ouranos_frontend`),
  installation and update scripts
- `Gauge`, `Graph`, `Modal`, `SlideButton`, `Table`, `Switch`, `ConfirmButtons`,
  `Form`, `WIPSign` UI components
- Navigation `Menu` with ecosystem/engine grouping
- Home page with ecosystem status boxes
- Sensors page with real-time updates via Socket.IO
- Ecosystem settings page
- Switches / actuators page
- Engines overview page
- About page
- Fallbacks for server connectivity issues

### Changed
- Migrated to Svelte 4 (#24) and SvelteKit 2 (#25)
- Actuator and light data cached and updated via Socket.IO (#31, #38)
