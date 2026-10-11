---
'@veljaos/ui': minor
---

Phase 5: floor plans, seating, room rack and diagrams; working-time follow-up.

- ShiftPlanner: "Apply rotation…" opens with people chosen (`rotationPeople`, else everyone in view), shows what it will add per person and day, and the application's checks of it (`rotationConflicts`). MyShifts: `swapDefaults` (a colleague suggested).
- FloorPlan (the plan of a place: items, areas, states as data, choosing, a list view, edit mode reporting adds, moves, resizes, turns and removes) and SeatingChart (seats round tables, the guest list, seating by keyboard, drag or "Seat at…").
- RoomRack (rooms by floor with occupancy and housekeeping states, search and state chips, keyboard, compact density, phones) and its helpers; ResourceSchedule `scale="days"` for stays over days (`fitOnDays`).
- `@veljaos/ui/diagram` (new subpath): `Diagram` — workflows and orchestrator runs in a BPMN-style notation on React Flow 12.12.0 and dagre 3.1.1, in view, edit (operations through `onChange`) and run modes; React Flow's credit link shown unless `hideAttribution`. New dependencies `@xyflow/react` 12.12.0 and `@dagrejs/dagre` 3.1.1 (MIT), loaded only through that subpath.
- New messages `shifts.rotation*`, `floorPlan.*`, `seating.*`, `rack.*`, `diagram.*` (English defaults).
