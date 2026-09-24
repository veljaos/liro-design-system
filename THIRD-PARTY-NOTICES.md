# Third-party notices

The Liro Design System is proprietary (see `LICENSE`). It contains or depends on the third-party
software listed below, which is distributed under its own license. Each notice is reproduced as
required by that license.

**Scope.** Code copied into this repository, code included in the published packages, and the
packages' runtime and peer dependencies. Build and test tools (TypeScript, ESLint, Prettier, tsup,
Vite, Storybook, Vitest, …) are not distributed with the packages and are not listed.

**Keep this file current.** Add an entry in the same pull request that adds a runtime or peer
dependency, or copies third-party code (for example a shadcn/ui component) into the repository.

## Included in the packages

| Software     | Version | License | Where                                                                |
| ------------ | ------- | ------- | -------------------------------------------------------------------- |
| Tailwind CSS | 4.3.3   | MIT     | Generated CSS in `@liro/ui/styles.css` (built with the Tailwind CLI) |

## Runtime and peer dependencies

| Software | Version   | License | Used by    |
| -------- | --------- | ------- | ---------- |
| React    | 19 (peer) | MIT     | `@liro/ui` |

## Published Storybook catalogue

The Storybook build (`apps/storybook`) bundles Storybook and React. It is published at the end of Phase 0.

| Software  | Version | License | Note                                                                                             |
| --------- | ------- | ------- | ------------------------------------------------------------------------------------------------ |
| Storybook | 10.6.0  | MIT     | Notice below, from the upstream repository (tag v10.6.0); the npm package ships no LICENSE file. |
| React     | 19.3.0  | MIT     | Notice below.                                                                                    |

## Planned

Entries are added, with their notices, in the step that brings them in (BUILD-PLAN section 3):
shadcn/ui (copied components, MIT), Radix UI primitives (MIT), TanStack Table and TanStack Virtual
(MIT), lucide-react (ISC), cmdk (MIT), sonner (MIT), react-day-picker (MIT), Recharts (MIT),
React Hook Form (MIT).

## Notices

### Tailwind CSS

```
MIT License

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### React

```
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Storybook

From https://github.com/storybookjs/storybook/blob/v10.6.0/LICENSE

```
The MIT License (MIT)

Copyright (c) 2024 Storybook

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
