/** Guided v2 Species composition adoption and Atlas annual-count starter. */
import {mkdtemp, open, realpath, rm} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {stdin, stdout} from 'node:process';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {ANNUAL_SPECIES_POPULATION_POLICY} from '../src/annual-species-population-refinement.mjs';
import {inspectSpeciesCompositionAdoption} from '../src/species-composition-adoption.mjs';
import {prepareSpeciesAtlasStarter, writeSpeciesAtlasStarter} from './export-species-atlas-starter.mjs';
import {MIB, createInputReader, encodeJson, localPath, originalPin} from './population-decision-io.mjs';

const VERSION = 'civ-species-atlas-starter-request-2';
const HELP = `Usage: node tools/guide-species-atlas-starter.mjs [--proposal PATH] [--composition-source PATH] [--ledger PATH]
       [--annual-body PATH] [--species-bundle PATH] [--atlas-envelope PATH] [--output-dir NEW_DIRECTORY]
       node tools/guide-species-atlas-starter.mjs --help

Prompts for omitted exact original source paths and an explicit adoption decision.
The Species composition review ZIP is not a direct input: select its untouched
composition-proposal.json, sources/species-bundle.json,
sources/atlas-envelope.json and sources/civilization-observations.json members.
Reviews the v2 envelope-pinned request and fixed annual refinement before asking
for exact write confirmation. It reloads and recomputes every source and output
pin before writing to a new directory with the existing exclusive completion
manifest. No Species biology/asset admission, Atlas envelope acceptance or
simulation is asserted. Enter :cancel or end input before confirmation to stop.
See docs/species-atlas-starter.md.
`;
const ROLES = ['proposal', 'compositionSource', 'speciesCompositionLedger', 'annualBody', 'speciesBundle', 'atlasEnvelope'];
const FLAGS = Object.freeze({proposal: '--proposal', compositionSource: '--composition-source', speciesCompositionLedger: '--ledger',
  annualBody: '--annual-body', speciesBundle: '--species-bundle', atlasEnvelope: '--atlas-envelope'});
const LIMITS = Object.freeze({proposal: MIB, compositionSource: 16 * MIB, speciesCompositionLedger: 32 * MIB,
  annualBody: 16 * MIB, speciesBundle: 4 * MIB, atlasEnvelope: MIB});
const say = value => stdout.write(`${value}\n`), show = value => JSON.stringify(value, null, 2);
const fail = message => { throw new TypeError(message); };
class Cancelled extends Error {}

function conversation() {
  const rl = createInterface({input: stdin, output: stdout, terminal: !!stdin.isTTY && !!stdout.isTTY}), lines = rl[Symbol.asyncIterator]();
  let interrupted = false;
  const interrupt = () => { interrupted = true; rl.close(); };
  rl.on('SIGINT', interrupt); process.on('SIGINT', interrupt);
  return {
    async ask(prompt) {
      if (interrupted) throw new Cancelled('Interrupted before writing');
      stdout.write(`${prompt}: `); const answer = await lines.next();
      if (interrupted || answer.done) throw new Cancelled('Input ended before writing');
      const value = answer.value.trim();
      if (value === ':cancel') throw new Cancelled('Cancelled before writing');
      if (!value.isWellFormed() || value.length > 65536) fail('Prompt input exceeds supported text bounds');
      return value;
    },
    assertActive() { if (interrupted) throw new Cancelled('Interrupted before writing'); },
    close() { process.removeListener('SIGINT', interrupt); rl.close(); }
  };
}
async function answerValid(chat, prompt, validate) {
  for (;;) { const value = await chat.ask(prompt); try { return validate(value); } catch (error) { say(`Invalid choice: ${error.message}`); } }
}
function identifier(value) {
  if (!/^[A-Za-z][A-Za-z0-9._:-]{0,255}(?![\s\S])/.test(value)) fail('Enter an identifier beginning with a letter, at most 256 characters');
  return value;
}
function authoredText(value, max, label) {
  if (!value.trim() || !value.isWellFormed() || value.length > max) fail(`${label} must be nonempty well-formed text of at most ${max} characters`);
  return value;
}
function boundedPreview(rows, limit = 32) {
  if (rows.length <= limit) return {count: rows.length, omitted: 0, rows};
  const head = Math.ceil(limit / 2), tail = Math.floor(limit / 2);
  return {count: rows.length, omitted: rows.length - limit, rows: [...rows.slice(0, head), ...rows.slice(-tail)]};
}
function populationPreview(population) {
  const assignments = population.assignments;
  return {budget: population.budget, assignmentCount: assignments.length,
    assignments: boundedPreview(assignments, 24), unassigned: population.unassigned};
}
function annualRowPreview(row) {
  if (row.status !== 'derived') return {year: row.year, sourceTick: row.sourceTick, status: row.status,
    reason: row.reason, observedArcPopulation: row.observedArcPopulation};
  const population = row.population;
  return {year: row.year, sourceTick: row.sourceTick, status: row.status, observedArcPopulation: row.observedArcPopulation,
    population: populationPreview(population)};
}
function samePrepared(a, b) {
  if (!a.manifestBytes.equals(b.manifestBytes) || a.files.length !== b.files.length) fail('Fresh source review differs from the confirmed starter');
  for (let i = 0; i < a.files.length; i++) {
    if (a.files[i].name !== b.files[i].name || !a.files[i].bytes.equals(b.files[i].bytes)) fail(`Fresh output differs at ${a.files[i].name}`);
  }
}
async function removePrivateRequestDirectory(directory) {
  const expectedParent = resolve(tmpdir()), expectedPrefix = 'civ-species-atlas-starter-';
  const actual = await realpath(directory);
  if (dirname(actual) !== expectedParent || !basename(actual).startsWith(expectedPrefix)) fail('Refusing to remove a temporary directory outside this guide’s private request area');
  await rm(actual, {recursive: true, force: false});
}
async function main(argv) {
  if (argv.length === 1 && argv[0] === '--help') { stdout.write(HELP); return; }
  const args = new Map();
  for (let at = 0; at < argv.length; at++) {
    const flag = argv[at], value = argv[++at];
    if (![...Object.values(FLAGS), '--output-dir'].includes(flag) || args.has(flag) || value === undefined || value.startsWith('--')) fail('Expected unique supported path flags and values');
    args.set(flag, value);
  }
  const cwd = process.cwd(), chat = conversation(); let privateDirectory;
  try {
    say('Species → Atlas starter guide (request v2). Enter :cancel at any prompt to stop.');
    say('Supply the exact complete originals. The guide never fetches files or invents an empty history, author, rationale, replacement or target.');
    say('The Species composition ZIP is not read directly. Select its untouched composition-proposal.json and sources/species-bundle.json, sources/atlas-envelope.json and sources/civilization-observations.json members as four separate files. The ZIP review receipt is not a Civ adoption decision.');
    const paths = Object.create(null);
    for (const role of ROLES) {
      const flag = FLAGS[role];
      paths[role] = args.has(flag) ? localPath(args.get(flag), cwd, role)
        : await answerValid(chat, `${role} original JSON path`, value => localPath(value, cwd, role));
    }

    const read = createInputReader(), originals = Object.create(null);
    for (const role of ROLES) originals[role] = await read(paths[role], LIMITS[role], role, role === 'speciesBundle' ? 'bundle' : 'strict');
    const inspected = inspectSpeciesCompositionAdoption({proposal: originals.proposal.parsed,
      civilization: originals.compositionSource.parsed, proposalPin: originals.proposal.pin, ledger: originals.speciesCompositionLedger.parsed});
    say('Exact original file pins:');
    for (const role of ROLES) say(`${role}: ${show({path: paths[role], realPath: originals[role].realPath, ...originals[role].pin})}`);
    say('Exact proposal target and authored composition:');
    say(show({proposal: {id: inspected.proposal.id, revision: inspected.proposal.revision}, observationKey: inspected.observationKey,
      observation: inspected.observation, temporal: inspected.proposal.temporal, atlas: inspected.proposal.atlas,
      speciesBundle: inspected.proposal.speciesBundle, population: populationPreview(inspected.proposal.population), policy: inspected.proposal.policy,
      populationMeaning: inspected.populationMeaning, verification: inspected.verification, effects: inspected.effects}));
    const active = inspected.currentChoice;
    let choice, replaces;
    if (active) {
      say('An active decision already exists for this exact observation in the supplied complete ledger:');
      say(show({id: active.decision.id, recordSha256: active.recordSha256, population: populationPreview(active.proposal.population), decision: active.decision}));
      const expected = `replace ${active.decision.id} ${active.recordSha256}`;
      await answerValid(chat, `To replace it, type exactly: ${expected}`, value => { if (value !== expected) fail('Confirm the displayed active decision ID and record digest'); return value; });
      choice = 'replace'; replaces = {id: active.decision.id, recordSha256: active.recordSha256};
    } else {
      say('No active decision exists for this exact observation in the supplied complete ledger.');
      await answerValid(chat, 'Type exact choose to author the initial decision', value => { if (value !== 'choose') fail('Enter choose explicitly or cancel'); return value; });
      choice = 'choose'; replaces = null;
    }
    const knownIds = new Set(originals.speciesCompositionLedger.parsed.records.map(row => row.decision.id));
    const id = await answerValid(chat, 'New unique decision ID', value => { identifier(value); if (knownIds.has(value)) fail('Decision ID already exists in the supplied complete ledger'); return value; });
    const author = await answerValid(chat, 'Actual author declaration', value => authoredText(value, 256, 'Author'));
    const policyId = await answerValid(chat, 'Authored decision policy ID', identifier);
    const policyVersion = await answerValid(chat, 'Authored decision policy version', value => authoredText(value, 128, 'Policy version'));
    const policyRationale = await answerValid(chat, 'Actual rationale for the authored decision policy', value => authoredText(value, 4096, 'Policy rationale'));
    const rationale = await answerValid(chat, 'Actual rationale for this species composition decision', value => authoredText(value, 4096, 'Decision rationale'));
    const decision = {id, author, policy: {id: policyId, version: policyVersion, rationale: policyRationale}, rationale, choice, replaces};
    say(`Annual refinement uses ${ANNUAL_SPECIES_POPULATION_POLICY}: the chosen anchor's authored species and unassigned counts remain fixed weights; supplied totals are apportioned with integer largest remainders and only a contiguous observed segment forward from that anchor is derived. Gaps, interruptions and later years remain unknown.`);
    await answerValid(chat, 'Type the exact annual policy identifier to explicitly use it', value => {
      if (value !== ANNUAL_SPECIES_POPULATION_POLICY) fail('Enter the exact displayed policy identifier or cancel'); return value;
    });
    const outputDirectory = args.has('--output-dir') ? localPath(args.get('--output-dir'), cwd, '--output-dir')
      : await answerValid(chat, 'New output directory (its parent must already exist)', value => localPath(value, cwd, '--output-dir'));
    const request = {version: VERSION, sources: paths, decision, policy: ANNUAL_SPECIES_POPULATION_POLICY};
    const requestBytes = encodeJson(request, 'guided v2 starter request', MIB);
    privateDirectory = await mkdtemp(join(resolve(tmpdir()), 'civ-species-atlas-starter-'));
    const requestPath = join(privateDirectory, 'request.json'), handle = await open(requestPath, 'wx');
    try { await handle.writeFile(requestBytes); await handle.sync(); } finally { await handle.close(); }

    const prepared = await prepareSpeciesAtlasStarter(requestPath);
    const refinement = prepared.refinement, derivedRows = refinement.rows.filter(row => row.status === 'derived');
    const unknownRows = refinement.rows.filter(row => row.status === 'unknown');
    const manifest = JSON.parse(prepared.manifestBytes.toString('utf8'));
    say('Exact v2 envelope correspondence, adoption and fixed-policy annual refinement:');
    say(show({decisionRecord: {id: prepared.adoption.record.decision.id, recordSha256: prepared.adoption.record.recordSha256,
        observationKey: prepared.adoption.record.observationKey, population: populationPreview(prepared.adoption.record.proposal.population)},
      ledger: {recordCount: prepared.adoption.ledger.records.length, activeDecisionCount: prepared.adoption.active.length},
      refinement: {target: refinement.target, anchor: refinement.anchor, policy: refinement.policy, coverage: refinement.coverage,
        rowCounts: {derived: derivedRows.length, unknown: unknownRows.length},
        rows: boundedPreview(refinement.rows.map(annualRowPreview)), gaps: boundedPreview(refinement.gaps),
        verification: refinement.verification, effects: refinement.effects},
      inputOriginalBytes: manifest.inputOriginalBytes, outputArtifacts: manifest.outputArtifacts,
      atlasImportFiles: manifest.atlasImportFiles, atlasPrerequisites: manifest.atlasPrerequisites,
      outputDirectory}));
    say('Atlas still must independently review the original envelope/body, then separately review the four annual-count files. Species biology, asset bytes, provenance rights and Atlas admission remain owner-specific reviews.');
    const confirmation = await chat.ask('Type exact write to reload all six originals, recompute this complete starter, and write');
    if (confirmation !== 'write') throw new Cancelled('Write was not confirmed');
    chat.assertActive();
    const fresh = await prepareSpeciesAtlasStarter(requestPath);
    samePrepared(prepared, fresh);
    chat.assertActive();
    await writeSpeciesAtlasStarter(outputDirectory, fresh);
    say('Atlas handoff: first review atlas-envelope.json with annual-body.json in Civilization observation; then import exactly refinement.json, species-composition-ledger.json, composition-source.json and annual-body.json into annual Species-count review.');
  } finally {
    chat.close();
    if (privateDirectory) {
      try { await removePrivateRequestDirectory(privateDirectory); }
      catch (error) { process.stderr.write(`Temporary request cleanup was incomplete: ${error.message}\n`); }
    }
  }
}

try { await main(process.argv.slice(2)); }
catch (error) { if (error instanceof Cancelled) say(`${error.message}. No starter output directory was created.`); else { process.stderr.write(`Guided Species Atlas starter failed: ${error.message}\n`); process.exitCode = 1; } }
