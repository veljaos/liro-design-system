/*
 * The stories host a small viewer written here (a `srcdoc` document) that speaks the protocol of
 * docs/document-frame.md: it reports 'loading', then 'ready' with its page count, and answers
 * 'goToPage' and 'setZoom' with 'page' and 'zoom'. Its origin is opaque (sandbox without
 * allow-same-origin), so the frame's `allowedOrigin` is "null".
 */

export interface ViewerOptions {
  title: string
  lang: string
  dir?: 'ltr' | 'rtl'
  /** Each page's HTML. */
  pages: string[]
  /** How long the viewer "loads", in ms. */
  delay?: number
  /** Reports this error instead of 'ready'. */
  error?: string
  /** Never answers (a viewer that hangs). */
  silent?: boolean
}

/** A viewer document that speaks the DocumentFrame protocol. */
export function viewer(options: ViewerOptions): string {
  const script = `
const PROTOCOL = 'liro-document-frame'
const VERSION = 1
const pages = ${JSON.stringify(options.pages)}
let page = 1
let zoom = 100
const paper = document.getElementById('paper')
function post(message) {
  // A real viewer names the host's origin here; this one is a story inside Storybook.
  parent.postMessage(Object.assign({ protocol: PROTOCOL, version: VERSION }, message), '*')
}
function draw() {
  paper.innerHTML = pages[page - 1]
  paper.style.zoom = String(zoom / 100)
}
window.addEventListener('message', (event) => {
  if (event.source !== parent) return
  const data = event.data
  if (!data || data.protocol !== PROTOCOL || data.version !== VERSION) return
  if (data.type === 'goToPage' && Number.isInteger(data.page) && data.page >= 1 && data.page <= pages.length) {
    page = data.page
    draw()
    post({ type: 'page', page, pageCount: pages.length })
  }
  if (data.type === 'setZoom' && typeof data.zoom === 'number' && data.zoom >= 10 && data.zoom <= 1000) {
    zoom = data.zoom
    draw()
    post({ type: 'zoom', zoom })
  }
})
${
  options.silent === true
    ? ''
    : `post({ type: 'loading' })
setTimeout(() => {
  ${
    options.error === undefined
      ? `draw()
  post({ type: 'ready', page, pageCount: pages.length, zoom })`
      : `post({ type: 'error', message: ${JSON.stringify(options.error)} })`
  }
}, ${String(options.delay ?? 150)})`
}
`
  return `<!doctype html>
<html lang="${options.lang}" dir="${options.dir ?? 'ltr'}">
<head>
<meta charset="utf-8">
<title>${options.title}</title>
<style>
  html, body { margin: 0; background: whitesmoke; font-family: Georgia, 'Times New Roman', serif; color: black; }
  main { padding: 24px; display: flex; justify-content: center; }
  #paper { box-sizing: border-box; width: 595px; max-width: 100%; min-height: 760px; background: white; padding: 56px 64px; box-shadow: 0 0 0 1px silver; }
  h1 { font-size: 18px; margin: 0 0 16px; }
  h2 { font-size: 15px; margin: 24px 0 8px; }
  p { font-size: 13px; line-height: 1.6; margin: 0 0 8px; }
</style>
</head>
<body>
<main><article id="paper" aria-live="polite"></article></main>
<script>${script}</script>
</body>
</html>`
}

/** Employment contract RU-2026-017 (fictitious, from the example dataset), three pages. */
export const CONTRACT_VIEWER = viewer({
  title: 'Ugovor o radu RU-2026-017',
  lang: 'sr-Latn',
  pages: [
    `<h1>Ugovor o radu br. RU-2026-017</h1>
     <p>Zaključen u Novom Sadu, između poslodavca Kvadrat Gradnja d.o.o., Novi Sad, PIB 108452317, MB 21456789, koga zastupa direktor Nenad Kovačević, i zaposlenog Stefana Nikolića.</p>
     <h2>Član 1. Radno mesto</h2>
     <p>Zaposleni zasniva radni odnos na neodređeno vreme, na radnom mestu inženjer gradilišta, počev od 02.11.2026. godine.</p>
     <h2>Član 2. Probni rad</h2>
     <p>Ugovara se probni rad u trajanju od 3 meseca.</p>`,
    `<h2>Član 3. Mesto rada</h2>
     <p>Zaposleni obavlja poslove u sedištu poslodavca u Novom Sadu i delimično od kuće (hibridni rad).</p>
     <h2>Član 4. Zarada</h2>
     <p>Osnovna bruto zarada iznosi 185.000,00 RSD mesečno.</p>`,
    `<h2>Član 5. Završne odredbe</h2>
     <p>Ugovor je sačinjen u tri istovetna primerka, od kojih svaka strana zadržava po jedan, a jedan se čuva u dosijeu zaposlenog.</p>
     <p>Poslodavac: Nenad Kovačević, direktor</p>
     <p>Zaposleni: Stefan Nikolić</p>`,
  ],
})
