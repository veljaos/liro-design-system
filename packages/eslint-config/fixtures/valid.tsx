// Fixture for src/rules.test.ts: nothing in this file may be reported.
// This file is not linted by the repository's own configuration.
import './styles.css'

export function Tokens() {
  return (
    <div className="bg-surface-page text-primary">
      <p className="bg-surface-raised text-secondary border border-strong shadow-md">Meanings</p>
      <p className="bg-status-danger-bg text-status-danger-fg border-status-danger-border">Tone</p>
      <p className="bg-brand-solid text-brand-on-solid hover:bg-brand-solid-hover">Brand</p>
      <p className="bg-brand-solid/80 outline-focus ring-focus divide-subtle">Opacity and focus</p>
      <p className="bg-(--liro-surface-sunken) text-[var(--liro-text-tertiary)]">Variables</p>
      <p className="bg-transparent text-current fill-current">Keywords</p>
      <p className="whitespace-nowrap">Not a colour</p>
      <p style={{ color: 'var(--liro-text-secondary)', background: 'transparent' }}>Style</p>
      <p style={{ borderColor: 'currentColor' }}>Current colour</p>
    </div>
  )
}

export function Logical() {
  return (
    <div className="ms-4 me-2 ps-3 pe-1 start-0 end-0 text-start text-end border-s rounded-ss-md">
      <p className="mx-4 px-2 inset-x-0 float-start">Symmetric and logical</p>
      <p style={{ marginInlineStart: 8, textAlign: 'start', float: 'inline-end' }}>Style</p>
      <p title="Reads right-to-left">A word, not a class</p>
      <a href="#section-2">Anchor</a>
    </div>
  )
}
