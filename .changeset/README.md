# Changesets

Each pull request that changes a published package adds a changeset: `pnpm changeset`, then
describe the change for the consumers of `@veljaos/*`. The three packages are released together
with one version (`fixed`). A release pull request runs `pnpm changeset version`, which bumps the
versions and writes each package's `CHANGELOG.md`; the tag `v<version>` then publishes
(`.github/workflows/publish.yml`). Until 1.0.0 the packages are in prerelease mode (`alpha`).
