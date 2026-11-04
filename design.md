# CFD Solver design

## Concept
Gold and white, after directureai.com (the user's chosen reference): a clean white page, near-black type,
a single gold accent, pill-shaped controls and product screens set in large rounded warm frames. The dark
mode keeps the same gold on black. The product's blue-to-orange heat ramp stays only where it means
temperature (slab diagrams, heat maps); it is never used as decoration.

Deliberate choices against the usual defaults, with reasons:
- **Inter.** The user asked to match the reference site, which is set in Inter at weight 500 with tight
  tracking (about -0.045em at display sizes). IBM Plex Mono stays for numbers and code.
- **Gold accent on white.** The user asked for a golden theme. Gold fills carry dark text (#121212),
  never white, so they pass contrast. Gold text on white uses the darker #856a29 / #b07d1f.
- **One glow.** The dark band near the end has a live 2-D heat simulation drawn in gold behind it. It is
  real physics and the only glow on the page.
- **Warm frames.** Screens sit in 30px-radius frames with a #fff4e7 to white gradient, like the reference.

## Colour tokens
Landing page (`index.html` `:root`, dark values under `:root.dark`) and app (`src/index.css`: light `:root`,
dark `:root.dark`; the slate scale is remapped to warm greys and the blue scale to gold).

| Role | Light | Dark | Use |
|---|---|---|---|
| Page | #ffffff (landing), #fafaf8 (app) | #000000 | background |
| Surface 2 | #fafaf8 | #0a0a0a | footer, code, table heads |
| Ink | #121212 | #f5f5f5 | headings, main text |
| Ink 2 | #3d3d39 | #d2d2d2 | secondary text |
| Muted | #6e6e6a | #9b9b9b | body copy, captions |
| Line | #e9e9e4 | #262626 | borders, dividers |
| Gold | #d4a12f | #d4a536 | primary buttons, focus ring, active states, phase accents |
| Gold hover | #c28f22 | #e0b54f | hover |
| Gold ink | #856a29 | #e0b54f | eyebrow labels, gold text on light surfaces |
| Gold text | #b07d1f | #e8c46e | accent lines in headings |
| Gold soft | #fdf8ea | #1f190c | selected rows, chips, pivot cells |
| Frame | #fff4e7 to #fefefe | #1a1409 to #0a0a0a | product frames |
| On gold | #121212 | #000000 | text on gold fills |

Data colours keep their meaning and never act as decoration: the heat ramp (cool #2a78d6 to hot #eb6834),
chart series (slot 1 is gold, slot 4 blue), boundary-condition colours, and ok / warning / error.

## Type
Inter 400/500/600, IBM Plex Mono 400/500, Mrs Saint Delafield for the signature only.

| Role | Size / weight / tracking |
|---|---|
| Hero headline | clamp(38px, 5.4vw, 60px) / 500 / -0.045em; second line in gold text |
| Section title | clamp(30px, 3.6vw, 44px) / 500 / -0.04em |
| Lead and body | 17px and 16px / 400, 1.65 line height, muted colour |
| Eyebrow | 11px / 500 / 0.18em uppercase, gold ink, with a 6px gold dot |
| Numbers | IBM Plex Mono, tabular figures |

## Shape and spacing
Base unit 4px. Sections 120px apart (80px on phones). Content width 1232px.
- Nav: floating pill, 62px tall, 85% white with blur, hairline border.
- Buttons and inputs that act like buttons: full pill (999px). Primary is gold with dark text; secondary
  is a white pill with a hairline border; ink pills (black) for neutral actions.
- Product frames 30px, cards and windows 16 to 20px, chips 5px.
- App: cards rounded-2xl, header a floating pill, sidebars rounded panels; sidebar scrollbars hidden.

## Motion
All off under `prefers-reduced-motion`.
- Headline words rise in sequence on load; lead and buttons fade in after.
- Sections rise 18px and fade in on entering the viewport, from a visible resting state.
- The product frame tilts from 12deg to flat as it scrolls into view; numbers count up once.
- Live demos: the transient slab plays, the elimination walkthrough steps, LaTeX renders as you type.
- The dark band's heat field follows the pointer.

## Pages
`/` landing · `/solver/` app · `/terms/` · `/privacy/`. Footer links Terms and Privacy. The landing page,
legal pages and app share the theme key in localStorage, so light or dark carries across.
