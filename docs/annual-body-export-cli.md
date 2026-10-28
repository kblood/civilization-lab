# Annual body export command

For a separate arc/region/cell artifact, pass `--format spatial` with one
`--body`; see the [spatial observation contract](annual-spatial-export.md).
The default format remains `body`, including existing multi-body bundles.
Spatial exports additionally reject more than 250,000 emitted cell rows or
32 MiB of canonical UTF-8 JSON. Request fewer years or smaller year groups;
these limits never truncate output.

Run from the repository root with Node 22 or newer:

```powershell
node tools/export-annual-body.mjs --domain fixtures/domains/toy-12.json --seed annual-cli-1 --body stub:s00:b0 --years 1,9,10,20 --output out/annual-body.json
```

For a dense annual history, use an inclusive range instead:

```powershell
node tools/export-annual-body.mjs --domain fixtures/domains/toy-12.json --seed annual-cli-1 --body stub:s00:b0 --year-range 1:20 --output out/annual-body.json
```

For multiple planets in the same domain, compile once and write one canonical
bundle with shared provenance and domain events:

```powershell
node tools/export-annual-body.mjs --domain fixtures/planets/home-system.json --seed colony-review-1 --bodies stub:s00:b0,stub:s00:b1 --year-range 10:29 --output out/system-observations.json
```

Create the output parent directory first. `--domain`, `--seed` and `--output`
are required exactly once. Choose exactly one body selector: `--body` names one
body and writes the existing single-body v2 artifact, while `--bodies` accepts
at least two comma-separated, distinct body IDs and writes a
`civ-lab-annual-body-observation-bundle-1`. Every body must belong to the same
domain. The bundle compiles that domain once, stores provenance and domain-wide
events once, and stores per-body annual observations in sorted body-ID order.
It does not add Atlas address bindings. Each bundle member can be projected
back to the existing single-body v2 shape with `annualBodyExportFromBundle`.
Choose exactly one of `--years` or `--year-range`. `--years` is a
comma-separated list of distinct safe integer years without spaces.
`--year-range START:END` expands both safe integer endpoints and every integer
between them, with no spaces and `START <= END`. Either selector is limited to
10,000 requested observations per body; the annual export and Atlas offline
importer share this cap. There are no default inputs.
`--help`, used alone, prints usage. Invalid, missing, duplicate and unknown
arguments fail with a nonzero exit status.

The year range is expanded into the same exact year list as `--years`. It does
not interpolate levels, add unsupplied simulation milestones, or alter how a
decade-boundary sample is selected.

By default, the command compiles through the largest requested year rounded up
to a decade boundary. A largest requested year already on a boundary keeps that
boundary:
`1,10,20` compiles through 20, and year 20 uses the preceding decade's endpoint.
Intermediate boundaries use their new decade, so year 10 uses source tick 1.
An end year of 21 instead compiles through 30 and samples year 21 within tick 2.

The optional `--until-year Y` flag sets the configured compilation horizon
independently of the requested observation years. Supply it at most once as a
safe integer without spaces, decimal points or exponent notation, divisible by
10 and at least as large as every requested year. For example:

```powershell
node tools/export-annual-body.mjs --domain fixtures/domains/toy-12.json --seed annual-cli-1 --body stub:s00:b0 --years 1,9,10,20 --until-year 30 --output out/annual-body.json
```

This exports an interval with `fromYear: 0`, `compiledUntilYear: 30` and
`configuredUntilYear: 30`, with exactly four observations at years 1, 9, 10 and
20, using source ticks 0, 0, 1 and 2. Year 20 is an intermediate boundary here;
only the final compiled boundary uses the preceding decade's endpoint. Select
the authored envelope horizon when preparing observations for an offline Atlas
binding that requires the configured horizon to match that envelope.

Only the unique inspection ticks required for the requested exact years and
possible early terminal endpoints are retained. At an intermediate decade
boundary, the command keeps the new decade and its predecessor; the exporter
uses the predecessor only if compilation actually terminates at that boundary.
Years are sorted in the output. The horizon must be after the domain start and
within its bounds; a request after early terminal completion fails.

The command uses the [existing observation export](annual-body-export.md),
including its provenance and source consistency checks, exact annual population
and era refinement, domain-wide events, source-decade event IDs attached to
observed arcs, and unmodelled annual lineage outcome. It writes canonical JSON
with a trailing newline. Generation and serialization finish before a sibling
temporary file replaces the destination by rename; failed generation preserves
an existing output.

This remains an authored scenario observation export. It supplies no Atlas
address binding or coverage contract and is not an Atlas provider.
