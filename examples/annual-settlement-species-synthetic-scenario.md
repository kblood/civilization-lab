# Fictional annual cohort arithmetic

This example explains the partition arithmetic. It is not a compiled scenario,
a source-complete API fixture, an executed allocator result or an editor's real
approval. Exact source bytes, matching spatial identities and all parent hashes
must come from the deliberately selected inputs in a real request.

Suppose a positive anchor at year 0 has total 1,600, species A 600, species B
500 and explicit unassigned 500. An actual supplied contiguous year-1 arc total
of 1,920 gives fixed-policy totals A 720, B 600, unassigned 600; no rounding units
remain in this illustrative ratio. Year 1 is a distinct child observation, with
its own source tick, full exact instant and resident parent. It retains the
year-0 adoption key as the anchor reference.

An editor explicitly authors this later resident partition: one settlement has
1,200 residents in a cell whose unallocated residual is 720. The other fifteen
cells have zero population and zero unallocated residual. Every cell residual
must still appear explicitly, and all identities/order must match the actual
resident parent. These choices are illustrative, not inferred from species.

| Destination | Resident budget | A | B | speciesUnassigned |
| --- | ---: | ---: | ---: | ---: |
| Authored settlement in cell 0 | 1,200 | 400 | 300 | 500 |
| Cell 0 residual | 720 | 100 | 100 | 520 |
| Each cell 1–15 residual, all explicitly included | 0 | 0 | 0 | 0 |

Known species A has located 500 and explicit `notLocated` 220. B has located
400 and explicit `notLocated` 200. Aggregate destination speciesUnassigned is
1,020, exactly 220 + 200 + annual policy unassigned 600. The destination resident
budgets sum to 1,920. The zero assignment columns for cells 1–15 are omitted
from their sparse `assignments` arrays, while the fifteen zero-budget destination
records themselves remain mandatory. If an empty settlement also existed in the
resident parent, its explicit zero-budget destination would be mandatory too.

This leaves both axes incomplete: some known policy species are not located,
and some destination residents are not attributed to species. Neither residual
identifies an additional species or locates the unlocated counts. Nothing here
establishes physical residence, migration, reproduction or historical continuity.
An unknown or interrupted year-1 refinement row cannot use this arithmetic to
create a valid allocation; its species totals would remain unknown.
