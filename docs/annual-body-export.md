# Annual body observation export

`src/annual-body-export.mjs` exports `createAnnualBodyExport(world, result,
{body, years})` and `serializeAnnualBodyExport(observation)`. Supply a world
created with `createDomain`, an already compiled result, its declared body ID,
and 1–10,000 distinct integer years. This matches the offline Atlas observation
import budget so a successful export remains reviewable there. This module never compiles, replays, or supplies
default fixture data. It is a Lab observation format, versioned
`civ-lab-annual-body-observations-2`, for authored scenarios.

Each requested year uses the exact `annualHierarchy` sample for its containing
decade. The final compiled boundary uses the preceding decade's endpoint.
An intermediate decade boundary uses the new decade, so an uninspected new
decade remains `not-inspected` even if the preceding endpoint was inspected.
Available inspected ledgers are sorted before the inspection adapter builds
contiguous region histories. Population values are BigInts; canonical JSON
serializes them as decimal strings. An arc with zero population has `era: null`.
A positive population retains the annual refiner's era, rather than the final
run's maximum development level. Body population sums the inspected arcs;
body era is their maximum populated era. All arcs retain their IDs and lineage
IDs and are sorted by arc ID.

Missing inspection decades produce `not-inspected`, with unknown population
and era represented by `null`. A present inspection with no stepped arc on the
body produces `no-active-arc-observed`, population zero and era null. That
status describes the supplied observation only: it does not distinguish
pre-origin, retired arcs, biological life, or extinction, and does not claim
coverage of arcs omitted by diagnostic compile options. The configured horizon
and actual compiled interval are separate. Requests beyond the actual compiled
end, including after early terminal completion, are rejected.

`annualOutcome` always reports `not-modelled`. Population refinement does not
derive yearly lineage outcome, and the final run outcome is not substituted.
Events retain complete compiled records and original event IDs, including
pre-empted events. The top-level event list and each observation's `eventIds`
remain explicitly **domain-wide**; they do not claim a body event history. The
export includes all compiled events through the last requested year. Each
observed arc now also has `eventIds` for the current source decade, filtered to
events dated through that observation year. These arc IDs cross-reference the
top-level records and use the association supplied by `inspectionTicks`; they
are not independently replayed or authenticated against chapter witnesses.
Each observation also has `civilisationEventIds`, the sorted union of those
observed arcs' event IDs for the selected body and year. It is `null` when the
source decade was not inspected, and an empty array when an inspection exists
but no stepped arc event is associated with that body. This is an
inspection-backed event association, not a complete history of every event on
the body; the top-level `eventIds` remain domain-wide.
Event dates and precision remain those of the source. No events are invented
from annual population changes.

Source consistency checks recompute manifest, input bundle and recipe digests,
compare result provenance with the supplied world, reconstruct the result
Merkle root from its supplied arc roots and domain root, and verify the supplied
event array against the deterministic `eventsDigest` emitted by the compiled
result. Bounds, event identities and inspected arc identities are checked before
refinement. The export retains model, seed, domain and all source digest
identifiers, including `eventsDigest`. These checks detect an event list changed
without its digest; they do not authenticate inspection payloads or events
against chapter witnesses, replay the simulation, or prove a caller supplied an
unmodified result and digest together. The observation scope and validation
label preserve that limit in the output.

The output is deeply frozen through the existing canonical encoder. Canonical
serialization sorts record keys; requested years, inspected ticks, arc IDs,
arc event IDs and events are explicitly sorted. No Atlas address, environment
binding or provider is inferred. This format does not implement
`CivilizationSnapshot` and must not be installed as an Atlas data provider
without a separate authored binding and coverage contract.

## Same-run exports for multiple bodies

`createAnnualBodyExportBundle(world, result, {bodies, years})` builds several
single-body observation series from one already compiled domain result. It
requires at least two distinct body IDs, sorts them canonically, and emits
`civ-lab-annual-body-observation-bundle-1`. Shared provenance, interval
metadata, and domain-wide events are stored once; each body keeps its own
sorted observations, arc IDs, and annual development levels. The bundle API
does not compile or replay the domain.

`annualBodyExportFromBundle(bundle, body)` projects one member into the existing
`civ-lab-annual-body-observations-2` shape, so the offline Atlas importer can
continue receiving its current single-body artifact and authored binding. The
bundle itself is not yet an Atlas import format or provider. The
[CLI workflow](annual-body-export-cli.md) documents `--bodies` and its shared
provenance behavior.
