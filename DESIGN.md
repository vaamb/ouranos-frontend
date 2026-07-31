# Ouranos UI — design principles

The rules a new page or component is checked against. Everything here is shipped
somewhere in `src/lib/components/`; when in doubt, read the component named
beside a rule.

---

## 1. The thesis

**The chrome is quiet and the data is loud.**

- **Colour is semantic, never decorative.** If something is coloured, the colour
  *means* something, and the same meaning always uses the same token.
- **Absence is information.** A missing rail, a missing module, a missing chip
  says something. Nothing is greyed out to hold a place.
- **Density beats decoration.** An empty grid cell costs as much attention as a
  full one. Layouts collapse to their content.

---

## 2. Material

There is exactly one surface treatment, and everything is made of it.

```
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius);   /* 4px */
box-shadow: var(--shadow);
```

A card, a table, a data sheet and a dialog are the **same material**. A dialog is
this box *lifted* (`--sheet-shadow` + `--scrim`). Secondary regions inside a card
(footer bars, action bars) are `--surface-2` behind a hairline — never a second
border, never a second radius.

**Hairlines, not fills.** Separation is a 1px `--border` line. `--border-strong`
is reserved for the one line that separates a header from its content.

**Page ground** is `--bg`; content sits in a centred `.wrap`.

---

## 3. Typography — three fonts, three jobs

Each font has a job it never leaves:

| Font            | Job                                                    |
|-----------------|--------------------------------------------------------|
| **Raleway**     | UI text, labels, buttons, kickers - everything chrome  |
| **Open Sans**   | data, always with `font-variant-numeric: tabular-nums` |
| **EB Garamond** | display: section headings, dialog titles, long prose   |

**The display stack is `'EB Garamond', Garamond, Georgia, serif`, and the first
name is load-bearing.** `static/fonts/Garamond/registry.css` declares the family
as **`'EB Garamond'`** — the *directory* is called `Garamond/`, which is what makes
this easy to get wrong. A stack starting `'Garamond'` matches no loaded webfont and
silently renders a system serif: `'Garamond', Georgia, serif`.

**Numbers are Open Sans + tabular.** This is what makes UIDs, GPIO addresses,
timestamps and temperatures scannable down a column.

### The kicker — the app-wide label device

One label style, everywhere a label is needed:

```css
font-family: 'Raleway';
font-size: 0.64rem;      /* ~9.5–10px */
font-weight: 700;
letter-spacing: 0.13em;
text-transform: uppercase;
color: var(--text-dim-solid);
```

It is the table column header (`Table.svelte`), the same header turned on its
side as a `DataSheet` `<dt>`, the dialog eyebrow (`Modal.svelte`), the form field
label, the metric key on a card, the `SUN TODAY` block label. Labels stay quiet
so values can be read.

### Long prose

**Long prose is `.prose`** (`global.css`) — Garamond at 1.1rem on a `--measure`
line length, justified and hyphenated, with its headings, lists, quotes, code and
tables already dressed. It lives in `global.css` rather than in a component
because it dresses `{@html}` output, which scoped styles never reach, and because
the wiki reader and `TextEditor`'s preview have to be the *same* typography or
the preview stops being one. Put it on a sheet the width of its own text, not of
the page.

`--measure` is 70ch, which in EB Garamond comes out at 560px. A page needing a
different line length sets `--measure` on its own `.prose`, never on the shared
rule.

**Garamond is rationed.** One display element per view — the `SectionHead` on a
page, the title in a sheet. A `Table` inside a section contains no Garamond at
all, because the `SectionHead` above it already supplied it.

---

## 4. Colour

### The one accent

`--grow` (magenta) means **"light is on"**, and nothing else. It is never used
decoratively. It is also the focus-ring colour for every control.

### The severity ramp

State is drawn from a five-step, hue-ordered severity ramp
(`functions.js:getLevelColor()` returns a token *name*, used as
`var(${getLevelColor(level)})`):

| Level      | Token                 |
|------------|-----------------------|
| `low`      | `--text-dim-solid`    |
| `moderate` | `--good-green`        |
| `high`     | `--transition-yellow` |
| `severe`   | `--transition-orange` |
| `critical` | `--critical-red`      |

`WarningLevel` is shared by warnings *and* calendar events, so the calendar page,
the home cards and any future consumer must agree on this one ramp.

- `--good-green` carries **operational status**: it is tuned to 4.8:1 as text,
  matching `--critical-red`'s 4.84:1, so Running and Stopped read as
  equal-weight peers instead of one shouting.
- `--leaf` keeps only the *decorative* "live/healthy" job (e.g. the role dot). As
  text on a near-white pill it reaches 3.6:1 and fails WCAG AA — never use it for
  status.
- `--transition-yellow` is a dark gold, not a yellow: it ships as an 8px dot, so
  it is held to WCAG 1.4.11 (3:1, non-text UI), not to 4.5:1 text. A yellow
  forced to 4.5:1 goes olive and breaks the ramp's hue order.

### Operational status

`on → --good-green`, `off → --critical-red`, `disconnected → --text-dim-solid`
(neutral). A disconnected ecosystem is in an *unknown* state — it may be running
fine and merely off the network — so it is neutral, not alarming. A deliberately
**off** ecosystem is red, because it is actionable.

---

## 5. The devices

The recurring instruments. Reuse them; do not invent a fourth thing that does the
same job.

### 5.1 Rails, not boxes

**A 3px left edge, coloured by meaning, present only when something is carried.**

- `Table` — on `td:first-child`, so the rail labels the *whole row*.
- `DataSheet` — on the card, when a row carries a status.
- `Calendar` — an event is a rail spanning its start row → end row.
- `Modal` — the rail is **inherited**: a sheet opened from a calendar event
  carries that event's `getLevelColor()`; destructive actions carry
  `--critical-red`; where nothing semantic is carried the rail is absent.

Its presence is the information. That is what keeps it from being a generic
"accent bar on a card".

⚠ An `inset` box-shadow rail is painted *under* a child's background. On any card
with both a rail and an opaque child region (a footer bar), use
`position: relative` + an absolutely positioned `::before`.

### 5.2 State gets a word

A bare tinted dot is colour as the only channel — a WCAG 1.4.1 failure. Every
state renders as a **pill: dot + label**, driven by one inline `--tone` so
background, text, dot and rail all read the same token. The word is
domain-specific (Running/Stopped, Connected/Disconnected); a generic Yes/No is
worse than the dot it replaces. Severity bars at `high`+ carry a small uppercase
level tag for the same reason.

### 5.3 Buttons name the act

Never `Confirm` — the same word for creating and for destroying. `Add event`,
`Save changes`, `Delete event`; the safe choice in a delete confirmation is
`Keep it`. One solid button (ink `--text`, inverted; red when destructive) plus
one ghost `Cancel`, right-aligned.

The creation affordance leaves the content grid for a **footer bar** on
`--surface-2` behind a hairline, saying what it adds ("Add hardware", "Add a
topic") — not a bare `+` in a row.

### 5.4 Bands

The nycthemeral band is the hero instrument, and it is **a single-day device**.

- `SkyBand` — the site's real astronomical sun, one global band, gradient built
  from the actual `civil_dawn`/`sunrise`/`solar_noon`/`sunset`/`civil_dusk`.
- `EcosystemBand` — a *per-ecosystem photoperiod* mini-band: the nycthemeral
  cycle (day/night backdrop) with the lighting schedule overlaid. Two independent
  notions, do not conflate them — and do not conflate either with the site sun.

**A 24-hour band is a good instrument; the same instrument at 7× zoom is not.**
Density, not styling, is the problem. Do not stretch one past a day without
asking.

Band tokens (`--sky-*`) are the single source of truth: the JS gradient holds
`'var(--sky-…)'` strings, not hex, so a theme flip re-themes the band with zero
JS change.

### 5.5 A dialog is not a workspace

A sheet holds a **short form**; it does not hold a place of work. Two columns of
prose in a `min(460px, …)` sheet is the tell that the dialog is the wrong
container — and a dialog widened to 1100px is not a dialog any more.

**Editing a long text is therefore a mode of the page, not a modal.**
`TextEditor.svelte` is that mode: source and preview side by side inside one
card, the actions on the card's own `--surface-2` bar, and the page's own
`TitleBar` action withdrawn while it is open (the editor already carries its own
acts). Below 700px of *card* width — a container query — the two panes become
Write/Preview tabs, because two stacked scrollers are two half-views of one text.
The preview HTML is passed in by the caller, so page-specific markup (the wiki's
`!picture:slug!` codes) stays the page's knowledge, not the editor's.

Everything short stays in the sheet — an image upload is still a `Form` in a
`Modal`.

### 5.6 The door is the same building

The `auth` tree renders no header, so `AuthSheet.svelte` supplies the chrome: the
`Header` brand in Garamond over a single centred sheet — the same material as
§2, lifted like a `Modal` but without a scrim or a close button, because there is
nothing behind it to go back to.

Three of the four auth pages are **token gates**, and that is what the tree is
about: Ouranos is not signed up for, it is *admitted to*. `TokenGate.svelte`
carries the shared `{#if no token} / {valid} / {refused}` triple, and the rail
plus kicker report one state — required (no rail) / accepted (`--good-green`) /
refused (`--critical-red`).

**A refusal says which refusal it is.** `checkJWT` tells an expired token apart
from a malformed one, and the two need different things from the reader: a new
invitation, or a more careful copy-paste. An accepted token states when it
expires, since that is in the claims already.

**The token is the source of truth for whatever it carries.** A registration JWT
holds only the claims the administrator filled in, and the backend overrides
username, email and role from the token. So a field the token carries is disabled
and says *why* (a `note` chip beside the label); a field it does not carry is
yours to fill. The register form's shape therefore varies per invitation, exactly
like a heterogeneous ecosystem card (§6).

### 5.7 Section heads

`SectionHead.svelte` — Garamond `h2` + a hairline rule, with an optional quiet
trailing note ("measured 14:32", "min–max on one shared scale"). It carries **no
top margin**; the block before it owns the gap.

Its `aside` does not wrap — a long one scrolls the page on narrow screens.

---

## 6. Layout

- **Cards are heterogeneous.** Hardware varies per ecosystem, so a card renders
  only what exists; absent modules are omitted, never greyed. Cards therefore
  vary in height — grids must not force equal heights.
- **Grids collapse to content.** `repeat(auto-fit, minmax(220px, 1fr))` for the
  overview strip, `auto-fill, minmax(300px, 1fr)` for the ecosystem wall.
- **Narrow layouts are container queries, not media queries.** `container-type:
  inline-size` on the card + `@container (max-width: …)`. Keyed to the
  *component's* width, so a table in a narrow column stacks correctly on desktop
  too. ⚠ `@container` blocks add **no specificity** — a desktop rule with a
  tighter selector keeps winning inside them.
- **Sticky gutters.** The calendar's day column and the weather chart's
  temperature gutter sit outside the horizontal scroller so they hold while the
  content scrolls. Any mobile media query **must restate the gutter width**.
- **Mobile dialogs dock to the bottom** (full width, 10px top corners) and the
  rail moves to the top edge.
- **Empty values render `Never` / `—` in `--text-faint`**, not a blank cell. An
  empty table renders `emptyText`, not a header above nothing — that reads as a
  page that failed to load.
- Check every layout at **1280 / 390 / 330px**.

---

## 7. Accessibility rules that are part of the design

Not a checklist bolted on afterwards; several rules above exist *because* of
these.

- **Colour is never the only channel.** Hence the state pills, the severity tags,
  the AUTO/MANUAL label beside the spinning actuator ring (motion-as-information
  fails under `prefers-reduced-motion`).
- **Text contrast is checked before a token ships** — see `--good-green` above.
- **Icon-only controls carry an `aria-label`**; a link cell says "Open →" in
  words.
- **Focus opens on the first field, or on the safe choice in a confirmation.**
  Browsers autofocus the close button, which reads as an entry state pointed at
  the exit — so `Modal` focuses the first enabled field explicitly.
- **Form validity is a touched state, not a dot column.** A field goes red only
  after you leave it invalid, and the actions bar lists what is outstanding
  ("Still needed: Title, Until.").
- **`Form` renders a real `<form>`.** Enter submits it and password managers
  recognise it — neither works with a `<div>` of inputs and a `type="button"`.
  It is `novalidate`, because native validation bubbles contradict the touched
  state and the "Still needed" hint.

---

## 8. Theme

Modes are `auto | light | dark` (`src/lib/theme.svelte.ts`, `useTheme()` in the
root layout).

- **`auto` follows the site's own sun**, not the operating system — it matches
  the Day/Night labels and the greenhouse cycle.
- Every colour goes through a token that exists in both the `:root` and the
  `:root[data-theme='dark']` block. **No hardcoded hex in a component** unless it
  is genuinely theme-independent (SkyBand's white tick marks, because the band
  gradient is dark in both themes) — and say so in a comment.
- Dark is gated on `[data-theme='dark']` **only**, never
  `@media (prefers-color-scheme: dark)`.
- **Reading a CSS token into JS is a bug.** Chart.js resolves no CSS variables,
  so token reads must happen inside an `$effect` depending on
  `themeState.resolved`, deferred to `requestAnimationFrame` (the layout stamps
  `data-theme` in *its* effect), and `Graph` needs a `{#key}` on the **resolved
  colour** because it freezes its scales at creation.

---

## 9. Building a new component

**Re-skin the existing generic components; do not replace them.**

`Form`, `Table`, `Modal`, `SmallCard` carry real behaviour —
`serializer`/`deserializer`, custom `validate`, `canSubmit`, confirm-time payload
diffing, `selectFrom`, `type: 'file'`. Markup that reproduces the *look* of a form
silently throws that away and turns a re-skin into a rewrite across every caller.

So:

1. Read the component **and its callers** first; list what its props already carry.
2. Drive the mockup from a **real caller's data**, not invented markup. If the
   mockup cannot be driven by the existing prop shape, the design is asking for a
   rewrite — say so explicitly.
3. State per file what is **markup-only** vs. **logic**. Keep additions optional
   and backwards compatible: a new optional row key beats a new required one.
4. Do not declare a component "absorbed" into another without checking it has no
   standalone callers.

**Verify against the real backend, not mocks.** `npm run dev` against a running
`ouranos-core` plus a screenshot at 1280 / 390 / 330px in *both* themes is the
cheapest check there is, and it catches defects a `vite build` never will. A
throwaway route is the usual way to reach operator-only branches.
