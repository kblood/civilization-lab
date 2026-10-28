# Synthetic Species → Atlas starter example

This folder contains one reproducible **Civ exporter demonstration**, not a
real civilization history or an Atlas-ready target. The proposal and annual
observations come from Civilization Lab's existing fictional settlement
allocation example. The exact Species bundle bytes come from
`../../../species-lab/examples/civilization-composition-bundle.json` in the sibling
Species Lab repository; the exporter copies those bytes into its output.

`request.json` explicitly chooses one synthetic composition against the empty
complete-history ledger. `annual-body.json` is used for both the pinned
composition source and the one-sample annual source. Their original bytes are
canonicalized from the embedded source and match the proposal pin
`27ace250e0975484f8f59fe90887510b3335407a12f9d4ca75ed089edee4a34f` (1,713
bytes). The proposal is 2,438 bytes and matches its declared pin. None of these
synthetic declarations proves source authenticity or historical facts.

To regenerate into a **new** output directory from the Civilization Lab root:

```powershell
node tools/export-species-atlas-starter.mjs --request examples/species-atlas-starter/request.json --output-dir examples/species-atlas-starter/out/run-002
```

`out/run-001/` is the captured output from one execution of that command. Its
manifest lists the exact four files for the Atlas annual-count picker and
records the actual pins. The target binding uses `fictional-atlas-seed` and
`fiction:b0`; no corresponding original Atlas authoring envelope is supplied
or reviewed. **Do not treat this packet as an Atlas-accepted import or as a
planet test fixture.** Atlas import review, biological review, asset review and
rights review have not been performed.

The output's year-5 counts are exactly the authored fictional anchor:
species A 600, species B 500, unassigned 500, total 1,600. No later sample is
provided, so this example demonstrates provenance and transport only; it does
not show temporal evolution, population change, settlement residents or
physical planet presentation. No tests were run to produce this example.
