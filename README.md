# Liro Design System

The shared look, components and screen templates of every Liro application. Applications pass
data and text through props and `LiroProvider`; the library draws, the application decides.

## Packages

| Package                  | What it is                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `@veljaos/tokens`        | Colours, type, spacing and motion as CSS variables, the Tailwind theme, fonts, brand |
| `@veljaos/ui`            | Components and page templates, with precompiled CSS (`@veljaos/ui/styles.css`)       |
| `@veljaos/eslint-config` | The lint rules for applications: no raw colours, logical properties, no Radix        |

Subpaths of `@veljaos/ui`, each loaded only where used: `/form` (React Hook Form bindings),
`/charts`, `/map`, `/gantt`, `/diagram`, `/pivot`, `/rich-text`, `/code`.

## Install and use

The packages are published to GitHub Packages:

```sh
echo "@veljaos:registry=https://npm.pkg.github.com" >> .npmrc
pnpm add @veljaos/tokens @veljaos/ui
```

```tsx
import '@veljaos/tokens/tokens.css'
import '@veljaos/ui/styles.css'
import { Button, LiroProvider } from '@veljaos/ui'

export function App() {
  return (
    <LiroProvider locale="en-RS" today="2026-10-31">
      <Button intent="save" label="Save" />
    </LiroProvider>
  )
}
```

`LiroProvider` carries everything that differs between applications and customers: locale,
direction, messages (the library's few strings), format, today, time zone, colour scheme, density
and the router's link component.

**Liro Business Core** adapts to the library, never the reverse: an adapter in `liro-core` maps
its manifests, permissions and API data to these props. Printed documents are PDFs from
liro-folio ([documents](docs/documents.md)).

## Develop

Node 24 and pnpm 12.

```sh
pnpm install
pnpm build            # packages; Storybook reads the built tokens
pnpm storybook        # the catalogue at http://localhost:6006
pnpm lint && pnpm typecheck && pnpm test
pnpm build-storybook && pnpm --filter liro-storybook test:stories
pnpm consumer-check   # the packed tarballs in a plain Vite app
pnpm perf             # the performance budget
```

Working rules for people and agents: [AGENTS.md](AGENTS.md).

## Rules

- [Principles](docs/principles.md) — the two principles and the rules that apply everywhere
- [Tokens and look](docs/look.md)
- [Layout and floorplans](docs/floorplans.md) — the seven floorplans and the recipes
- [Fields and forms](docs/fields-and-forms.md)
- [Tables and grids](docs/tables.md)
- [Feedback and states](docs/feedback-and-states.md)
- [Phones](docs/phones.md)
- [Languages and directions](docs/languages.md)
- [Accessibility](docs/accessibility.md)
- [Charts and maps](docs/charts-and-maps.md)
- [Point of sale](docs/pos.md)
- [Documents and liro-folio](docs/documents.md)
- [Testing](docs/testing.md)
