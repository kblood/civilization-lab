# Species → Atlas starter v2 request recipe

`request.recipe.json` is an unexecuted template. This directory contains no
source originals, captured output, real decision or accepted Atlas target.
The [separate v1 fictional demonstration](../species-atlas-starter/README.md)
remains unchanged and supplies no valid Atlas envelope for this recipe.

Copy the recipe to your own local working directory, replace all author,
decision and policy placeholders, and supply all six actual original files in
the paths listed by `sources`. Those paths resolve relative to the recipe's
resolved location. Use the complete current adoption history. `choose` with
`null` is appropriate only for a target with no active decision; otherwise
explicitly replace the exact active decision as described in the
[starter guide](../../docs/species-atlas-starter.md).

The Species proposal must already pin the exact original composition source,
Species bundle and Atlas authoring envelope. Obtain the envelope from its owner;
do not invent an address, change the v1 fictional binding, reformat an original
or copy digest declarations in place of supplying actual bytes. V2 checks the
envelope SHA-256, version and full binding against the validated proposal;
Atlas must independently review its declarations and selected planet.

From the Civilization Lab root, after preparing actual originals and an
explicit decision, export to a new directory whose parent already exists:

```powershell
node tools/export-species-atlas-starter.mjs --request path/to/your/request.recipe.json --output-dir path/to/existing-parent/new-starter-v2
```

This command has not been run for this recipe. A successful local v2 export
retains the original envelope as `atlas-envelope.json` for the earlier
Civilization observation import beside `annual-body.json`. Its version-2
manifest still identifies exactly four annual-count inputs: output ledger,
composition source, annual body and refinement. Do not add the envelope to that
four-file picker. `atlasEnvelopeReviewed` remains false; no import acceptance,
simulation, species biology, artifact closure or runtime verification is claimed.
