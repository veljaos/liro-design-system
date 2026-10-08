# DocumentFrame — the viewer protocol

`DocumentFrame` (`@veljaos/ui`, BUILD-PLAN P5.5) shows a document drawn by a viewer that lives on
another origin — the Core's PDF viewer, a signing service's preview — inside a Liro screen. The
viewer runs in a sandboxed `<iframe>`; the Design System draws the toolbar (pages and zoom), the
loading skeleton and the error state around it. The two talk with `postMessage` in the small
protocol described here. This file is for whoever writes or adapts a viewer.

The code of the host side is `packages/ui/src/components/document-frame.tsx`; the reading and
checking of messages is `document-frame-protocol.ts`, unit-tested in `document-frame.test.ts`.
The Storybook stories ("Components / Files / DocumentFrame") host a viewer written in the story
that speaks this protocol.

## Using it

```tsx
import { DocumentFrame } from '@veljaos/ui'

;<DocumentFrame
  title="Employment contract RU-2026-017"
  src="https://viewer.liro.rs/documents/RU-2026-017?token=…"
  allowedOrigin="https://viewer.liro.rs"
  className="h-[70vh]"
/>
```

| Prop              | Meaning                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `title`           | The frame's accessible name (required).                                                                   |
| `src` / `srcDoc`  | The viewer's address, or the viewer as a document (`srcDoc`, used by the stories and tests).              |
| `allowedOrigin`   | The viewer's origin, exactly (`https://viewer.liro.rs`); `"null"` for an opaque origin (see below).       |
| `allowSameOrigin` | Adds `allow-same-origin` to the sandbox. Default `false`.                                                 |
| `timeout`         | Milliseconds to wait for the viewer's `ready` before showing the error. Default 20 000 (`FRAME_TIMEOUT`). |
| `onStateChange`   | Receives `{ status, page, pageCount, zoom, error? }` whenever the viewer reports something.               |
| `className`       | Layout, usually the height (default 480px).                                                               |

## Isolation

- The iframe has `sandbox="allow-scripts"`: the viewer can run its scripts, but it has an
  **opaque origin** (no cookies or storage of its own origin, no access to the host), and it
  cannot submit forms, open popups, navigate the top window or start downloads. `referrerpolicy`
  is `no-referrer`.
- `allowSameOrigin` adds `allow-same-origin` — only when the viewer needs its own origin's cookies
  or storage (a session cookie on the viewer's domain). Never give it to a viewer served from the
  application's own origin: `allow-scripts` together with `allow-same-origin` on the same origin
  lets the frame remove its own sandbox.
- The short-lived link to the document (a signed URL, a token) is the application's: it is put in
  `src` when the frame is shown, never stored.

## Messages

Every message, in both directions, is a plain object:

```js
{ protocol: 'liro-document-frame', version: 1, type: '<name>', ...payload }
```

A message with another `protocol`, another `version`, an unknown `type` or a payload of the wrong
shape is **ignored**, without an error. Pages count from 1. Zoom is a percentage (100 = actual
size), a number from 10 to 1000.

### Viewer → host

| `type`    | Payload                                           | Meaning                                                                                                                        |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `loading` | —                                                 | The viewer started (again) to load the document. The host shows the skeleton.                                                  |
| `ready`   | `page`, `pageCount`, `zoom` (all numbers)         | The document is shown: on `page` of `pageCount`, at `zoom`. Ends the loading. `page` must be an integer from 1 to `pageCount`. |
| `page`    | `page`, `pageCount`                               | The page shown changed (after `goToPage`, or because the user scrolled inside the viewer).                                     |
| `zoom`    | `zoom`                                            | The zoom changed (after `setZoom`, or inside the viewer).                                                                      |
| `error`   | `message?` (string, at most 300 characters shown) | The document cannot be shown. The host shows its error state with the text, or its own when there is none, and "Try again".    |

### Host → viewer

| `type`     | Payload         | Meaning                                                                                    |
| ---------- | --------------- | ------------------------------------------------------------------------------------------ |
| `goToPage` | `page` (number) | Show this page. The viewer answers with `page`.                                            |
| `setZoom`  | `zoom` (number) | Show at this zoom (the toolbar steps 50, 75, 100, 125, 150, 200, 300). Answer with `zoom`. |

**The viewer owns the state.** The host never assumes a command worked: the toolbar shows only
what the viewer reported. A viewer that cannot go to a page (out of range) or zoom that far simply
does not answer, and the toolbar stays where it was.

### Order

1. The host renders the iframe and listens. It shows the skeleton and starts the timeout.
2. The viewer sends `loading` (optional), loads the document, then sends `ready`.
3. The user presses a toolbar button: the host sends `goToPage` or `setZoom`; the viewer answers
   with `page` or `zoom`.
4. On failure the viewer sends `error`. Without `ready` within `timeout`, the host shows "The
   document viewer did not answer." "Try again" loads the iframe anew (a new frame, from step 1).

## Origin rules

The host takes a message only when **all three** hold:

1. `event.source` is the frame's own window (a message from any other window or frame is
   ignored, even from an allowed origin);
2. `event.origin` equals `allowedOrigin` **exactly** — scheme, host and port; no prefixes, no
   wildcards (`https://viewer.liro.rs.example.com` is not `https://viewer.liro.rs`);
3. the data match the protocol.

The host sends its commands with `targetOrigin` = `allowedOrigin`, so a frame that has been
navigated elsewhere never receives them. **Opaque origin:** a sandboxed frame without
`allow-same-origin` (and any `srcdoc` frame) sends messages whose origin is the string `"null"`;
the application then passes `allowedOrigin="null"`, the source check (rule 1) is what ties the
messages to this frame, and the host sends with `targetOrigin` `"*"` — an opaque origin cannot be
named. That is safe because the host's messages carry nothing but a page number or a zoom level.

**The viewer** should do the same in its direction: accept commands only from `window.parent`
(`event.source === parent`), and, when it knows the host's origin (it is usually given in the
viewer's URL or configuration), check `event.origin` and post to that origin instead of `"*"`.

## An example viewer

A complete viewer of a few HTML pages (the stories use this shape; a PDF viewer replaces `draw`
with its renderer):

```html
<!doctype html>
<html lang="sr-Latn">
  <head>
    <meta charset="utf-8" />
    <title>Ugovor o radu RU-2026-017</title>
  </head>
  <body>
    <main><article id="paper"></article></main>
    <script>
      const PROTOCOL = 'liro-document-frame'
      const VERSION = 1
      const HOST = 'https://app.liro.rs' // the host's origin; '*' only when it is not known
      const pages = ['<h1>Ugovor o radu</h1>…', '<h2>Član 3.</h2>…', '<h2>Član 5.</h2>…']
      let page = 1
      let zoom = 100
      const paper = document.getElementById('paper')

      function post(message) {
        parent.postMessage({ protocol: PROTOCOL, version: VERSION, ...message }, HOST)
      }
      function draw() {
        paper.innerHTML = pages[page - 1]
        paper.style.zoom = String(zoom / 100)
      }

      window.addEventListener('message', (event) => {
        if (event.source !== parent || event.origin !== HOST) return
        const data = event.data
        if (!data || data.protocol !== PROTOCOL || data.version !== VERSION) return
        if (data.type === 'goToPage' && Number.isInteger(data.page)) {
          if (data.page < 1 || data.page > pages.length) return
          page = data.page
          draw()
          post({ type: 'page', page, pageCount: pages.length })
        }
        if (data.type === 'setZoom' && typeof data.zoom === 'number') {
          if (data.zoom < 10 || data.zoom > 1000) return
          zoom = data.zoom
          draw()
          post({ type: 'zoom', zoom })
        }
      })

      post({ type: 'loading' })
      try {
        draw()
        post({ type: 'ready', page, pageCount: pages.length, zoom })
      } catch (error) {
        post({ type: 'error', message: 'The document could not be read.' })
      }
    </script>
  </body>
</html>
```

## Accessibility

- The frame is named by `title`. The toolbar is a group named "Document"
  (`messages['frame.toolbar']`); its buttons have names from the provider's messages; "Page 2 of
  3" is a polite status, so a page change is announced; the zoom level is read as "Zoom 125%".
- The document inside is the viewer's: it must have a `lang`, a `<title>`, real text (not only an
  image of text) and its own keyboard handling. A PDF viewer should expose the PDF's text layer.
- Right to left: the host's toolbar follows the provider's direction (the page arrows are
  mirrored). The viewer lays out its document by the document's own language.

## Versioning

`version` is 1. A change that an existing viewer would misread raises it; the host ignores
messages of a version it does not know, so an old viewer with a new host (or the reverse) shows
the "did not answer" error instead of wrong pages.
