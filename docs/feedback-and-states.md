# Feedback and states

## Feedback

- A routine action answers in place: a save is `SaveStatus` beside the action ("Saving…", "Saved",
  the error in words); a till's or a floor's line shows its state ("Sent · 19:40").
- Anything reversible gets Undo beside what changed (`InlineUndo`, CartPanel `undo`), never a
  confirmation first. Restoring a version runs at once.
- Toasts are for errors and for what happens outside the screen. A toast only reports; it never
  tells the user what to do next.
- Toasts never block: each has its close button; success and info close after 4 s, a warning after
  6 s, an error waits; only a toast's buttons take the pointer; it stands above every sticky bottom
  bar (`useBottomBar` registers a bar).
- An action inside an Alert, a Banner or any box with a status background is a neutral secondary
  button; the tone already carries the meaning.
- A confirmation that may message people offers each message as a "Notify …" checkbox.

## States

Every state is visible and says something:

- **Loading:** skeletons in the final layout (text.primary at 10%, visible on every surface) or a
  spinner with words; never a blank area. A single-block canvas (map, diagram) writes its loading
  words over the skeleton.
- **Empty:** an EmptyState with the application's words and its first step; tools that cannot work
  without data are not drawn. No results: with "Clear filters".
- **Error:** ErrorState (never the empty icon) with "Try again" and the case number.
- **Refusal:** not an error: neutral secondary text, no red, no error icon (MaskedValue).
- **A tile's state:** two lines, the icon and the state in words, the detail under it (`StateLine`).
- **No access:** the reason in words. **Offline:** OfflineIndicator; queued work in words.
- Anything monitored continuously (a connection, a queue, a backup) is a HealthList row: its state
  in the application's words and tone, its figures, the last success and the last error. The list
  never turns a figure into a state.
- A deadline is SlaTimer against the application's `now`, in words ("Overdue by 40 min").

## Code, payloads and logs

- They are CodeBlocks: only the code is copied, always left to right, colours from the Liro code
  theme (`--liro-code-*`); highlighting only from `@veljaos/ui/code` (Shiki, loaded on first use).
