/** Explicit local composition adoption + fixed-policy annual export.
 * Original byte IO stays outside the unchanged pure decision/refinement APIs. */
import {link, unlink} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {adoptSpeciesComposition} from '../src/species-composition-adoption.mjs';
import {ANNUAL_SPECIES_POPULATION_POLICY, refineAnnualSpeciesPopulation} from '../src/annual-species-population-refinement.mjs';
import {canonicalString} from '../src/canonical.mjs';
import {MIB, createInputReader, encodeJson, localPath, originalPin, writeNewDirectory} from './population-decision-io.mjs';

const VERSION = 'civ-species-atlas-starter-request-1';
const ENVELOPE_VERSION = 'civ-species-atlas-starter-request-2';
const LIMITS = Object.freeze({proposal: MIB, compositionSource: 16 * MIB, speciesCompositionLedger: 32 * MIB, annualBody: 16 * MIB, speciesBundle: 4 * MIB});
const ENVELOPE_LIMITS = Object.freeze({...LIMITS, atlasEnvelope: MIB});
const MAX_OUTPUT_BYTES = 160 * MIB;
const PENDING_MANIFEST = 'starter-manifest.pending.json';
const HELP = `Usage: node tools/export-species-atlas-starter.mjs --request PATH --output-dir NEW_DIRECTORY
       node tools/export-species-atlas-starter.mjs --help

Explicitly adopt one original Species composition proposal and export its annual
fixed-policy counts through the existing Civ contracts. Request v1 requires five
original sources; opt-in v2 also requires the exact pinned original atlasEnvelope.
Versions: civ-species-atlas-starter-request-1 / civ-species-atlas-starter-request-2.
The v2 envelope cap is 1 MiB; request plus source role caps total 71 MiB.
The complete current adoption ledger, author decision and fixed policy are explicit.
Writes the four Atlas import files, original request/proposal/input ledger/Species
bundle, and manifest.json published last. V2 retains atlas-envelope.json for the
earlier Civilization observation import, separately from the four annual inputs.
V2 checks envelope byte pin/version/full binding correspondence only; no Atlas
address/envelope/import review or simulation runs. V1 output remains unchanged.
The output parent must exist; target directory must be new. Relative source paths
resolve from the resolved request file's directory. See docs/species-atlas-starter.md.
`;
const fail = message => { throw new TypeError(message); };
function closed(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail(`${label}: missing or extra fields`);
}
function argsFor(argv) {
  const args = new Map();
  for (let at = 0; at < argv.length; at++) {
    const flag = argv[at], value = argv[++at];
    if (!['--request', '--output-dir'].includes(flag) || args.has(flag) || value === undefined || value.startsWith('--')) fail('Expected unique --request and --output-dir values');
    args.set(flag, value);
  }
  if (args.size !== 2) fail('Both --request and --output-dir are required');
  return args;
}

export async function prepareSpeciesAtlasStarter(requestPath) {
  const read = createInputReader(), requestInput = await read(requestPath, MIB, 'starter request'), request = requestInput.parsed;
  closed(request, ['version', 'sources', 'decision', 'policy'], 'starter request');
  if (![VERSION, ENVELOPE_VERSION].includes(request.version)) fail('Unsupported starter request version');
  const withEnvelope = request.version === ENVELOPE_VERSION;
  const limits = withEnvelope ? ENVELOPE_LIMITS : LIMITS;
  if (request.policy !== ANNUAL_SPECIES_POPULATION_POLICY) fail('Supply the explicit fixed-anchor-largest-remainder-contiguous-forward-1 policy');
  closed(request.sources, Object.keys(limits), 'starter sources');
  const inputs = Object.create(null);
  for (const [role, maximum] of Object.entries(limits)) {
    const path = localPath(request.sources[role], dirname(requestInput.realPath), role);
    inputs[role] = await read(path, maximum, role, role === 'speciesBundle' ? 'bundle' : 'strict');
  }
  const proposal = inputs.proposal.parsed;
  if (inputs.compositionSource.pin.sha256 !== proposal?.civilization?.observationsSha256) fail('Original composition source bytes differ from proposal.civilization.observationsSha256');
  if (inputs.speciesBundle.pin.sha256 !== proposal?.speciesBundle?.sha256) fail('Original Species bundle bytes differ from proposal.speciesBundle.sha256');
  // Owner-specific Species declarations, lineage, applicability and artifact
  // closure are deliberately left to Species/Atlas reviewers. This is a byte pin.
  if (inputs.speciesBundle.parsed?.version !== 'species-authoring-bundle-1') fail('The exact pinned Species source must identify species-authoring-bundle-1');
  const adoption = adoptSpeciesComposition({proposal, civilization: inputs.compositionSource.parsed,
    proposalPin: inputs.proposal.pin, decision: request.decision, ledger: inputs.speciesCompositionLedger.parsed});
  if (withEnvelope) {
    const envelope = inputs.atlasEnvelope;
    // Compare against the proposal only after the existing adoption contract has
    // validated its complete binding. This establishes correspondence, not an
    // Atlas address, envelope declaration, evidence or fixture review.
    const atlas = adoption.record.proposal.atlas;
    if (envelope.pin.sha256 !== atlas.envelopeSha256) fail('Original Atlas envelope bytes differ from proposal.atlas.envelopeSha256');
    if (envelope.parsed?.version !== 'atlas-civilization-authoring-envelope-1') fail('The exact pinned Atlas source must identify atlas-civilization-authoring-envelope-1');
    if (canonicalString(envelope.parsed.binding) !== canonicalString(atlas.binding)) fail('Original Atlas envelope full binding differs from the validated proposal.atlas.binding');
  }
  const ledgerBytes = encodeJson(adoption.ledger, 'appended complete composition ledger', 32 * MIB);
  const ledgerPin = originalPin(ledgerBytes);
  const refinement = refineAnnualSpeciesPopulation({speciesCompositionLedger: adoption.ledger,
    compositionRecordSha256: adoption.record.recordSha256,
    compositionSource: inputs.compositionSource.parsed, annualBody: inputs.annualBody.parsed,
    sourcePins: {speciesCompositionLedger: ledgerPin, compositionSource: inputs.compositionSource.pin, annualBody: inputs.annualBody.pin},
    policy: request.policy});
  const refinementBytes = encodeJson(refinement, 'annual Species refinement', 32 * MIB);
  const files = [
    {name: 'request.json', role: 'original-starter-request', bytes: requestInput.bytes},
    {name: 'species-composition-proposal.json', role: 'original-species-composition-proposal', bytes: inputs.proposal.bytes},
    {name: 'input-species-composition-ledger.json', role: 'original-complete-pre-adoption-ledger', bytes: inputs.speciesCompositionLedger.bytes},
    {name: 'species-bundle.json', role: 'original-exact-species-bundle-optional-atlas-biology-companion', bytes: inputs.speciesBundle.bytes},
    {name: 'species-composition-ledger.json', role: 'speciesCompositionLedger', bytes: ledgerBytes},
    {name: 'composition-source.json', role: 'compositionSource', bytes: inputs.compositionSource.bytes},
    {name: 'annual-body.json', role: 'annualBody', bytes: inputs.annualBody.bytes},
    {name: 'refinement.json', role: 'refinement', bytes: refinementBytes},
  ];
  if (withEnvelope) files.push({name: 'atlas-envelope.json', role: 'original-pinned-atlas-authoring-envelope', bytes: inputs.atlasEnvelope.bytes});
  const outputArtifacts = Object.fromEntries(files.map(file => [file.name, {role: file.role, ...originalPin(file.bytes)}]));
  const manifest = {version: withEnvelope ? 'civ-species-atlas-starter-manifest-2' : 'civ-species-atlas-starter-manifest-1', status: 'complete-local-export',
    compositionRecordSha256: adoption.record.recordSha256, compositionDecisionId: adoption.record.decision.id,
    refinementSha256: refinement.refinementSha256, target: refinement.target, anchor: refinement.anchor,
    inputOriginalBytes: {request: requestInput.pin, ...Object.fromEntries(Object.entries(inputs).map(([role, input]) => [role, input.pin]))},
    outputArtifacts,
    atlasImportFiles: files.filter(file => ['speciesCompositionLedger', 'compositionSource', 'annualBody', 'refinement'].includes(file.role)).map(file => ({file: file.name, ...outputArtifacts[file.name]})),
    atlasPrerequisites: {originalAuthoringEnvelope: withEnvelope ? 'atlas-envelope.json' : 'separately-required-not-supplied', baseAnnualSource: 'annual-body.json', selectedTarget: 'must-match-original-envelope-and-annual-import'},
    verification: {originalInputPinsComputed: true, originalCompositionSourcePinMatched: true, originalSpeciesBundlePinMatched: true,
      ...(withEnvelope ? {originalAtlasEnvelopePinMatched: true, originalAtlasEnvelopeBindingMatched: true} : {}),
      appendedLedgerBytePinComputed: true, adoptionAndAnnualDeclarationContractsApplied: true,
      speciesBundleDeclarationsReviewed: false, speciesArtifactBytesVerified: false, speciesApplicabilityVerified: false,
      atlasEnvelopeReviewed: false, atlasImportReview: 'not-performed', sourceAuthenticityVerified: false, biologicalTruthVerified: false},
    effects: {simulationRun: false, simulationStateChanged: false, populationStateChanged: false, settlementResidentsCreated: false, repositoriesSynchronized: false},
    completion: {marker: 'manifest.json', publication: 'exclusive-hard-link-after-all-listed-files-flushed', pendingFile: PENDING_MANIFEST}};
  const manifestBytes = encodeJson(manifest, 'starter manifest', MIB);
  if (files.reduce((total, file) => total + file.bytes.length, manifestBytes.length) > MAX_OUTPUT_BYTES) fail('Composed starter output exceeds 160 MiB');
  return {files, manifestBytes, adoption, refinement};
}

export async function writeSpeciesAtlasStarter(outputDirectory, prepared) {
  // Compose every byte before mkdir. The shared writer creates only a new
  // directory and exclusive fixed-name files, flushing/closing each one.
  await writeNewDirectory(outputDirectory, [...prepared.files.map(file => [file.name, file.bytes]), [PENDING_MANIFEST, prepared.manifestBytes]]);
  // link is atomic and exclusive: write/sync/close failures cannot leave a
  // partially written completion marker. No overwrite or non-atomic fallback.
  await link(join(outputDirectory, PENDING_MANIFEST), join(outputDirectory, 'manifest.json'));
  try { await unlink(join(outputDirectory, PENDING_MANIFEST)); }
  catch { process.stderr.write('Export complete; duplicate staged manifest remains beside manifest.json.\n'); }
  process.stdout.write(`Wrote Species Atlas starter with adoption ${prepared.adoption.record.recordSha256} and annual refinement ${prepared.refinement.refinementSha256} to ${outputDirectory}\n`);
}

async function main(argv) {
  if (argv.length === 1 && argv[0] === '--help') { process.stdout.write(HELP); return; }
  const args = argsFor(argv), requestPath = localPath(args.get('--request'), process.cwd(), '--request');
  const outputDirectory = localPath(args.get('--output-dir'), process.cwd(), '--output-dir');
  const prepared = await prepareSpeciesAtlasStarter(requestPath);
  await writeSpeciesAtlasStarter(outputDirectory, prepared);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try { await main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`Species Atlas starter export failed: ${error.message}\n`); process.exitCode = 1; }
}
