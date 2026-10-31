# Phones

- One column. A page never scrolls sideways.
- No box with its own vertical scroll inside a phone page: lists, cards, trees and legal text flow
  with the page.
- Select lists, menus, popovers and tooltips keep 8px inside the screen, are never wider than the
  room there and wrap long text; a popover or menu always moves to stay on the screen.
- Overlays cover the whole screen: every backdrop covers it; every dialog is a full-width bottom
  sheet; LookupDialog, CatalogPicker and the company switcher are full-screen sheets; PeriodField
  opens a sheet (presets first, one month full width).
- A preview that opens from inside text is a bottom sheet with its "Open …" action, never a
  popover over the text.
- The main action sits in the bottom bar. Sticky footers and bottom bars have one divider and an
  opaque background, and the content scrolls fully above them.
- Tables become cards; a canvas becomes today's lists (see [floorplans](floorplans.md)).
- Phone stories draw a `PhoneFrame` (390 × 844), which is the screen: the phone layout
  (`usePhone`), the boundary of floating content, fixed overlays on the frame. Its page scrolls
  inside it with the sticky header and bottom bars in place; no padded `h-full overflow-y-auto`
  box inside it, and no width wrapper squeezes it.
