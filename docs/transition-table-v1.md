# Civilisation transition table v1

M2.0 binding transition contract (runner review incorporated); model `civ-m2-1`, catalogue `civ-catalogue-1`,
partition `civ-stub-regions-1`. This document completes spec §§6.3 and 14.
It changes no code. Opus owns final checks and the M2.0 commit before M2a.

**[scenario] applies to every model constant, prior, fixture, threshold,
coefficient, probability, gate and modelling equation introduced here**, unless
explicitly attributed below. These are authored, uncalibrated choices. This
blanket label also applies to the machine-readable table. Integer arithmetic,
identity and serialization rules are engineering definitions, not research.
No new research or network access was used. Evidence IDs refer to
[the supplied synthesis](research-2026-10-04.md), not fresh verification of its
sources. Confidence below is confidence reported there, not calibration here.

## Evidence and scope

| Finding | Use here | Source URL; confidence in the supplied evidence |
|---|---|---|
| T2.1 | Beverton–Holt/logistic form; agrarian reference growth | https://www.imsc.res.in/~sitabhra/meetings/sgn24/assets/presentations/Turchin_2009_AnnNYAS_Long_term_population_cycles_in_human_societies.pdf ; high |
| T2.2 | Renewable-stock motivation, not its coefficients | https://www.researchgate.net/publication/24057902_Could_institutional_reform_have_saved_Easter_Island ; original unverified, reproduction reported high |
| T2.7 | Conquest probability and distance attenuation | https://www.kokkonuts.org/wp-content/uploads/PNAS-2013-Turchin-16384-9.pdf ; high for form, coefficients unverified |
| T2.10 | Administrative-overhead motivation | https://arxiv.org/html/2102.06698 ; high, no year calibration |
| T2.11, T5.1 | Population-driven invention | https://www.steveambler.uqam.ca/511/readings/kremer.1993.pdf ; high; all coefficients here [scenario] |
| T2.12 | Infrastructure lifetime 14 years | https://github.com/cvanwynsberghe/pyworld3 ; high in synthesis |
| T2.13 | 4500 and 230000 kcal/person/day anchors | https://pzacad.pitzer.edu/~lyamane/ianmorris.pdf ; high; 4500 is the scenario midpoint of 4000–5000 |
| T4.3 | Colony coloniser disposition | https://ntrs.nasa.gov/search.jsp?R=19940022867 ; high mechanism, no calibrated probability |
| T4.7–8 | Wide priors and ordered hard steps | https://arxiv.org/html/1806.02404v1 and https://mason.gmu.edu/~rhanson/greatfilter.html ; high framing, numerical priors low |
| T4.11, T4.13 | Episode hazards; natural-extinction bound | https://www.nature.com/articles/s41598-019-47540-7 ; high in synthesis |
| T4.12 | Reference existential-risk figures only | https://www.tobyord.com/writing/the-precipice-revisited ; medium |
| T4.14 | Industry/fuel/berth launch minimum | https://forums.matrixgames.com/viewtopic.php?t=374975 ; medium; all units and costs here [scenario] |
| T5.2–3 | Maintenance population and learning bias | https://pmc.ncbi.nlm.nih.gov/articles/PMC3404092 ; high review, contested mechanism; https://abdn.elsevierpure.com/files/100834691/PNAS_2016_Vaesen_E2241_7.pdf was title-only in synthesis |

O1 remains the declared end-boundary stock approximation. O2 is addressed by
this table, subject to review. O3 remains an allocation-view limitation. O4 is
not an empirical claim here. O5 is respected by the exact M2a split below.
O6 does not license an Atlas runtime dependency. Read-only inspection confirms
`placeAt` obtains `planetGeophysics(body)` then adjusts surface gravity for
height, census absence requires a complete patch, and surface cell IDs use
`x+/ix/iy`-style faces. The stubs below define their own yields/resources;
suitability, Creature Lab species and air presence do not supply them.

## Arithmetic, addressing and closed records

`F(a,b)` means mathematical floorDiv(a,b); `C(a,b)` means ceilDiv(a,b).
Every division in this document is written F or C; both operands are promoted
to BigInt before products/division, then converted to Number only for a bounded
Number field. `Q=4294967296`. `clamp(x,a,b)` is
min(b,max(a,x)). A sum is over code-unit-sorted IDs; a named-term sum is sorted
by term name. No floating arithmetic is needed except M1's `expQ32` internals.
People, capacity, fuel, infrastructure, forcing, energy, power, hazard and
provenance scores are BigInt, with no artificial upper bound. Safe integer
overflow of years or Number counters is an error, never wrapping. Epochs and
tick indices in state are BigInt; event tick fields use canonical decimal strings.
All intervals are half-open. Zero population never grows spontaneously.

Field paths have grammar `root.member`, exactly two ASCII identifier segments.
Roots are `region`, `polity`, `arc`, `hazard`, `chain`, `provenance`, `latch`,
`lineage`, `voyage`, `transit`, `domain`, `message`, `origin`, `input`.
A path names a typed **atomic field**, possibly a fixed tuple or closed record;
indexing a tier, resource component or outcome component is a read/write of the
whole atomic field. There are no wildcards or implicit paths. Record members
and all collection membership fields are specified below. Reads include
eligibility, magnitude and derived-input dependencies, not just effects.
`input.*` is immutable manifest/fixture data. Collection access also declares
the container path. Framework phase bookkeeping is declared separately from
kind effects, so every event need not claim to mutate all provenance/latches.

Every record is closed: no extra keys, omitted keys, undefined, NaN, floats,
accessors or sparse arrays. Empty nullable fields are null; empty lists are [].
Runtime BigInts serialize through M1 canonicalBytes as decimal strings.
All arrays sort by ID unless a different total key is stated. Tiers and fixed
tuples retain position. LIVE state contains live polities, open hazards and active
chains only. Retired records move exactly once into the append-only ARCHIVE
defined below; no archived identity may be resurrected.

`X(fields)=encodeFields(fields).toString('hex')`, using M1 S/I/B tags.
Define `sid(prefix,fields)=prefix+":"+X(fields)`. Text components are S,
indices/episodes are I. No FNV hash is an identity. IDs:

| Entity | Exact construction |
|---|---|
| Body/system/domain | Fixture canonical string, `[A-Za-z0-9_./:-]+`, 1..128 ASCII characters; excludes `#`, `>`, `~`, `|` |
| Lineage | `lin:` + origin body |
| Arc | `arc:` + body + `:` + lineage ID + `:` + decimal body episode; episode starts 0 and increases on each new occupation of that body, across lineages |
| Region | `arcId+"#"+localRegionId` |
| Directed contact edge | `arcId+"#"+srcLocal+"~"+dstLocal` |
| Polity | `arcId+"#pol:"+tick+":"+kindRank+":"+anchorLocalRegionId+":"+part` |
| Event owner for polity | polity ID directly |
| Directed polity pair owner | `attackerPolityId+">"+defenderPolityId` (directed) |
| Culture | `arcId+"#cul:"+tick+":"+kindRank+":"+anchorLocalRegionId+":"+part`; founder `arcId+"#cul:founder"` |
| Voyage / transit | `arcId+"#voy:"+tick+":"+sourceLocalRegionId`; `transit:` + voyage ID |
| Chain | opener event ID (no encoding); chain owner stays opener's owner |
| Message | `domainId+"#msg:"+emissionTick+"~"+sourceKey+"~"+type+"~"+targetId+"~"+ordinal`; sourceKey is emitting arc ID for P, domain ID for D |
| Origin schedule | `sid("origin",[bodyId])` |
| Latch subject | region ID, `regionId+"~tech:"+domainName`, polity ID or arc/lineage ID as specified |

Flat polity/culture anchors are the founding local region, or the smallest
pre-state local region of a split/schism parent. part=0 for founding and 0/1
for split children (SCHISM uses 1). Different parents have disjoint territories
and therefore different anchors. An ownership/retirement lock permits only
one accepted founding/split per anchor, rank and tick; the culture group lock
permits only one schism there. Thus IDs are unique without embedding ancestry.
COLLAPSE uses each parent's anchor, not globally increasing part numbers.
Fixture polities use `arcId+"#pol:fixture:"+label` (label 1..64 characters of
`[A-Za-z0-9_-]`); fixture voyages use `sourceArc+"#voy:fixture:"+label`.
Message ordinals start 0 within `(emissionTick,sourceKey,type,targetId)`, sorting
by `(causeEventId-or-empty,canonicalBytes(payload))`; identical rows coalesce.
These components exclude `~`. P finalizes its own outbound IDs at P5e without
reading other arcs; D expansion gets D-source IDs at the barrier. IDs never
embed a cause ID. Pending ARRIVAL emissionTick is the launch barrier, not its
future delivery tick. Event owners are these identities directly and never contain `|`. Chain IDs
alone retain the opener event ID: an opener cannot itself be a chain step,
so event nesting depth is at most one. Messages/voyages never embed event IDs;
launchEventId and causeEventId are references only. Remaining sid uses encode
only flat fixture/body/origin/epoch identities, never ancestry or an event.
All IDs, including event IDs and hazard keys, must be <=65536 ASCII characters;
validate this bound over 40000 ticks in a repeated-split/recolonisation
CLI stress run, checking every generated ID (not only surviving records). With 128-byte
input IDs, safe-year ticks/counters and at most one opener embedding, this
bound is independent of history depth. Reject inputs violating these limits.

Body IDs must not contain `:lin:`. This additional validation makes the arc
body/lineage delimiter unambiguous while retaining the spec's printed arc-ID
shape. System/domain IDs may not begin `arc:` or `lin:`. Tier symbols E,S,M,
T,I,V,O in formulae always mean the named domain tier, never a stock variable.

Hazard ID uses M1 `{ownerId,kind,domain?,targetTier?,edgeId?}` and
`hazardKey`, including presence bits. Kind is uppercase M2 catalogue spelling.
Use M1 `hazardIntent`, `chainIntent`, `messageIntent`, `thresholdIntent`,
`eventId`, `compareEvents`, `sortEvents`. Magnitude address is event ID,
owner level, episodeOrBucket=0n, ordinal=0. Each separately named draw has its
own purpose; sampler draw index is always 0. The only rejection counter is
the sampler's attempt field. Hazard address is hazardKey, owning level,
episodeOrBucket=entry.episode, ordinal=0, purpose `haz.KIND`.
M1 threshold() hardcodes P: M2 must supply a D threshold callback to
advanceHazard for voyages (and initialize its first E with the same callback).

All events use M1 schema plus `resolution` (accepted/pre-empted),
`reason` (null or code), `intentKey`, and `data` (closed per-kind payload
described below). `params` contains only the explicitly named magnitude
integers as decimal strings; `data` carries IDs/enums/tuples. Non-scalar (including numeric tuples), Boolean and categorical set
effects use `{target,field,op:"set",amount:"0"}` and the final value in
`data.sets`, sorted uniquely by `(target,field)` code-unit order, with exactly
one `{target,field,value}` for each set effect; value is the final whole atomic
field, retaining tuple positions and Number/BigInt types. Scalar numeric effects record
resolved signed deltas as `add`; transfers record accepted nonnegative amount
once with required `toField` giving the registered receiver path (MIGRATION:
region.pop→region.pop; LAUNCH: region.pop→transit.pop; arrival:
transit.pop→region.pop). Other operations forbid `to` and `toField`. A scale's multiplier is in params but its resolved effect is an add,
matching M1 replay. The effects array is ordered by recipe operation, then target ID, then field
where the recipe does not prescribe a field order. No effect is emitted for an unchanged field.
All kinds carry `data.sets` (default []), `data.stage` (default null),
`data.outcome` (default null), `data.source`/`data.target` (default null),
`data.survivor` (default null), `data.launch` (default null). `data.launch`
is a voyage record without hazard, lastDeath or account; other data keys are forbidden.
This is a required future validator extension; M1 toy bytes stay unchanged.

Serialization completion rules: effect.field is the full registered field
path (for example `region.pop`), target/to are concrete entity/account IDs.
`refs` always includes `{role:"arc",entityId:arcId}` for P events; add
source/target refs exactly when data.source/target is nonnull, `{role:"chain",
entityId:chainId}` plus every chain.refs participant for openers and steps, victim refs for multi-region losses, and survivor for a merged
war loser. Sort/deduplicate by `(role,entityId)`. D arrival refs are exactly role source=voyage and, when accepted, role
target=arc (matching data.source/target); D voyage loss adds role voyage;
lineage extinction adds role lineage. Chain participants use their stored
roles unchanged. Multi-region loss refs use role victim for every region
targeted by an accepted loss operation, even when its resolved debit is zero;
PLAGUE uses victim refs also for a single victim. No optional decorative refs.
Params are exactly the named parameters in a recipe (empty record when none).
For perils caps use data.sets rather than adding arbitrary params. Trigger
hazard is exactly M1's evidence (saturated always present Boolean); scheduled,
chain and exogenous are `{mode}` only. Threshold trigger defaults to
`{mode:"threshold",crossed:{var:"region.pop",value:"0",threshold:"0"}}`
only for EXTINCTION and LINEAGE_EXTINCTION. Other scalar crossings use the
variable/value/threshold named in the recipe; TECH_LOSS and SPACEFLIGHT add
the relevant domainIndex param (SPACEFLIGHT=3). HEGEMONY var=`region.pop`,
COLONY_LOST value=arc population as stated. All threshold values are decimal
strings. Derived era event is threshold mode but no persistent latch.
Precision is year for hazards, decade for every other event. Chain event.chain
is `{chainId,step,deadlineTick:String,status}` after its transition; non-chain
events use null. All events have forced=false and modelVersion=`civ-m2-1`.
CONQUEST losing its lock is the only pre-empted event that closes an existing
chain; invalidations are accepted chain records, not silent deletions. When an
otherwise active WAR CAMPAIGN or PLAGUE SPREAD is pre-empted at P5b (target-ended
or no-people), it still consumes its scheduled step: step=old.step+1,
nextTick=t+1, status=active, reason=null. WAR frontier/visited remain [];
PLAGUE frontier=[] and visited is unchanged because no victims were affected.
The event retains its drawn params and stage, empty effects and pre-emption
reason; event.chain records that active advancement. The next tick applies
ordinary invalidation/burnout rules. No existing chain can retain a past-due
nextTick. CONQUEST lock loss keeps the event's pre-emption reason, while its
chain reason is stalemate.

## State field register

The following tables are the source for the JSON field register. P5e/D2
archive removal writes the relevant live container; INIT sets immutable defaults. Writers such
as `P5a` name framework phases; event-specific writers are added from the kind
register. Immutable initializers are `INIT`. `P0` includes phase-0 inbox
application. D phases are defined below. A writer not listed is forbidden.
Unless stated otherwise, SAPIENCE and COLONY_FOUNDED initialize the same values.
All nonnegative BigInts start 0; bounded Numbers start 0; booleans start false;
lists start []; nullable references start null. Exceptions follow the tables.
Conflict policy: natural fields are replaced once from pre-state; event adds
and debits compose in order; numeric scales read remaining stock; competing
categorical sets use the first accepted target lock; framework derivations
replace once after effects. IDs and immutable metadata never change.

| Path | Type | Unit | Framework writers |
|---|---|---|---|
| region.id | String | identity | INIT |
| region.localId | String | identity | INIT |
| region.pop | BigInt | persons | INIT,P0,P5a |
| region.Kbase | BigInt | persons | INIT,P0,P5c |
| region.K | BigInt | persons | INIT,P0,P5c |
| region.renewable | Number | permille | INIT,P5a |
| region.infra | BigInt | capital | INIT,P0,P5a |
| region.fuel | BigInt | fuel_units | INIT,P5a |
| region.forcing | BigInt | forcing_units | INIT,P5a |
| region.immunityTicks | Number | ticks | INIT,P5a |
| region.damage | Array | damage_records | INIT,P0 |
| region.polityId | StringOrNull | identity | INIT,P5c |
| region.cultureId | String | identity | INIT |
| region.culture | NumberTuple3 | permille | INIT,P5a |
| region.tiers | NumberTuple7 | tiers | INIT,P0,P5c |
| region.caps | NumberTuple7 | tiers | INIT,P0 |
| region.era | Number | era | INIT,P0,P5c |
| region.energy | BigInt | kcal_per_day | INIT,P0,P5c |
| region.resources | NumberTuple4 | permille | INIT,P0 |
| region.collapse | CollapseOrNull | recovery_targets | INIT,P0 |
| region.lowTicks | NumberTuple7 | ticks | INIT,P5a |
| region.ceilings | Array | ceiling_records | INIT,P5c |
| region.spaceflight | Boolean | flag | INIT,P1,P5b |
| region.berthsUsed | Number | persons_this_tick | INIT,P0 |
| polity.id | String | identity | INIT |
| polity.regions | StringArray | identities | INIT,P5c |
| polity.capital | String | identity | INIT,P5c |
| polity.regime | String | regime | INIT |
| polity.eliteShare | Number | permille | INIT,P5a |
| polity.asabiya | Number | permille | INIT,P5a |
| polity.legitimacy | Number | permille | INIT,P5a |
| polity.stress | Number | permille | INIT,P5a |
| polity.warWeariness | Number | permille | INIT,P5a |
| polity.foundedYear | Number | year | INIT |
| polity.endedYear | NumberOrNull | year | INIT,P5c |
| polity.parentIds | StringArray | identities | INIT |
| polity.hegemony | Boolean | flag | INIT,P5c |
| arc.id | String | identity | INIT |
| arc.lineageId | String | identity | INIT |
| arc.body | String | identity | INIT |
| arc.episode | Number | count | INIT |
| arc.foundedYear | Number | year | INIT |
| arc.foundingTiers | NumberTuple7 | inherited_tiers | INIT |
| arc.lastDeath | DeathWitnessOrNull | death_witness | INIT,P0,P5a,P5b |
| arc.isColony | Boolean | flag | INIT |
| arc.colonizer | Boolean | flag | INIT |
| arc.regions | Array | region_records | INIT |
| arc.polities | Array | polity_records | INIT,P5e |
| arc.hazardLedger | Array | hazard_records | INIT,P2,P5c,P5e |
| arc.chains | Array | chain_records | INIT,P3,P5e |
| arc.provenance | Array | provenance_records | INIT,P5e |
| arc.latches | Array | latch_records | INIT,P1,P5e |
| arc.perils | String | perils_state | INIT,P0,P5c |
| arc.nonviable | Boolean | flag | INIT,P5b |
| arc.outcome | Outcome | outcome_axes | INIT,P0,P5c |
| arc.scenarioParams | Priors | parameters | INIT |
| arc.inbox | Array | message_records | D0,INIT,P0 |
| arc.outbox | Array | message_records | D2,INIT,P0,P5b |
| arc.tick | BigInt | tick | INIT,P5e |
| hazard.hazardId | HazardId | identity_tuple | D1,INIT,P2 |
| hazard.key | String | hex_identity | D1,INIT,P2 |
| hazard.episode | BigInt | count | D1,INIT,P2 |
| hazard.H_q32 | BigInt | integrated_hazard_q32 | D1,INIT,P2 |
| hazard.E_q32 | BigInt | threshold_q32 | D1,INIT,P2 |
| hazard.closed | Boolean | flag | D2,INIT,P5c |
| chain.chainId | String | identity | INIT |
| chain.kind | String | kind | INIT |
| chain.refs | Array | typed_references | INIT |
| chain.step | Number | count | INIT,P3 |
| chain.nextTick | BigIntOrNull | tick | INIT,P3 |
| chain.deadlineTick | BigInt | tick | INIT |
| chain.status | String | chain_status | INIT,P3,P5c |
| chain.reason | StringOrNull | reason | INIT,P3,P5c |
| chain.frontier | StringArray | identities | INIT,P3 |
| chain.visited | StringArray | identities | INIT,P3 |
| provenance.target | String | identity | INIT,P5e |
| provenance.field | String | field_path | INIT,P5e |
| provenance.entries | Array | scored_event_references | INIT,P5e |
| latch.kind | String | kind | D2,INIT,P1 |
| latch.subject | String | identity | D2,INIT,P1 |
| latch.active | Boolean | flag | D2,INIT,P1 |
| lineage.foundedArcs | Number | count | D0,INIT |
| lineage.lastDeath | DeathWitnessOrNull | death_witness | D2,INIT |
| lineage.id | String | identity | INIT |
| lineage.arcs | StringArray | identities | D0,D2,INIT |
| lineage.voyages | StringArray | identities | D2,INIT |
| lineage.contacts | StringArray | identities | INIT |
| lineage.scenarioParams | Priors | parameters | INIT |
| lineage.perilsSafe | Boolean | flag | D2,INIT |
| lineage.outcomeClass | String | outcome_class | D2,INIT |
| lineage.extinctionCause | StringOrNull | event_identity | D2,INIT |
| voyage.lastDeath | DeathWitnessOrNull | death_witness | D0,D1,D2,INIT |
| voyage.id | String | identity | D2,INIT |
| voyage.lineageId | String | identity | D2,INIT |
| voyage.sourceArc | String | identity | D2,INIT |
| voyage.sourceRegion | String | identity | D2,INIT |
| voyage.destination | String | body_identity | D2,INIT |
| voyage.launchEventId | String | event_identity | D2,INIT |
| voyage.launchYear | Number | year | D2,INIT |
| voyage.arrivalYear | Number | year | D2,INIT |
| voyage.deliveryTick | BigInt | tick | D2,INIT |
| voyage.tiers | NumberTuple7 | tiers | D2,INIT |
| voyage.cultureId | String | identity | D2,INIT |
| voyage.culture | NumberTuple3 | permille | D2,INIT |
| voyage.status | String | voyage_status | D0,D2,INIT |
| voyage.hazard | HazardOrNull | hazard_record | D0,D1,D2,INIT |
| transit.id | String | identity | D2,INIT |
| transit.pop | BigInt | persons | D0,D1,D2,INIT |
| domain.id | String | identity | INIT |
| domain.tick | BigInt | tick | D2,INIT |
| domain.lineages | Array | lineage_records | D0,D2,INIT |
| domain.arcs | Array | arc_records | D0,D2,INIT |
| domain.voyages | Array | voyage_records | D0,D2,INIT |
| domain.transit | Array | transit_records | D0,D2,INIT |
| domain.messages | Array | message_records | D0,D2,INIT |
| domain.origins | Array | origin_records | D0,INIT |
| domain.bodyEpisodes | Array | body_episode_records | D0,INIT |
| domain.latches | Array | latch_records | D2,INIT |
| domain.coverage | String | coverage | INIT |
| message.id | String | identity | D2,INIT,P5e |
| message.type | String | message_type | D2,INIT |
| message.causeEventId | StringOrNull | event_identity | D2,INIT |
| message.targetId | String | identity | D2,INIT |
| message.deliveryTick | BigInt | tick | D2,INIT |
| message.payload | Payload | message_data | D2,INIT |
| origin.body | String | identity | INIT |
| origin.rates | BigIntTuple3 | annual_hazard_q32 | INIT |
| origin.waitYears | BigIntTuple3 | years | INIT |
| origin.sapienceYear | NumberOrNull | year | D0,INIT |
| origin.deliveryTick | BigIntOrNull | tick | D0,INIT |
| origin.status | String | origin_status | D0,INIT |
| input.environment | Environment | immutable_adapter_data | INIT |
| input.routes | Array | route_records | INIT |
| input.parameters | Parameters | immutable_model_data | INIT |

Closed compound types (these members are not separately addressable field
paths):

* `NumberTuple7` order is Energy, Subsistence, Materials, Transport,
  Information, Medicine, Organisation, abbreviated E,S,M,T,I,V,O. Maximums
  `[6,5,5,7,5,4,5]`. `caps` initially those maximums. `lowTicks` instead has
  seven counters in 0..2. `NumberTuple3` has three coordinates in 0..1000.
  `NumberTuple4` resources order metals, fuels, fissiles, domesticables.
* `CollapseOrNull={active:Boolean,recoverPop:BigInt,recoverInfra:BigInt}`.
  Null initially; while active, further collapse retains the maximum of old
  target and that event's pre-state stock. After recovery set null.
* Damage records `{eventId:String,permille:Number,untilTick:BigInt}` sorted
  `(untilTick,eventId)`. permille 0..1000; damage applies while tick<untilTick.
  Effective damage is min(1000,sum(permille)). Events in tick t lasting n
  ticks expire at t+1+n, affecting natural updates t+1 through t+n.
* Ceiling records `{domain:String,targetTier:Number,reason:String}` sorted
  `(domain,targetTier,reason)`, recomputed from the next-tier gate. Reasons
  `resource:metals`, `resource:fuels`, `resource:fissiles`,
  `resource:domesticables`, `profile`, `existential-cap`. Prerequisite tier
  shortages are not ceilings. Record every failing resource/cap gate.
* `Outcome={biological:String,industrialEra:Number,regressing:Boolean,
  political:String,terminal:Boolean}`. biological extant/extinct, political
  continuous/fragmented/none; initial extant/0/false/none/false.
* `DeathWitnessOrNull` is null initially, otherwise
  `{tick:BigInt,stage:Number,ownerId:String,sequence:Number,dateYear:Number,
  eventId:StringOrNull,kind:StringOrNull}`. See the exact death-order rule below.
  arc.lastDeath, voyage.lastDeath and lineage.lastDeath retain this independently
  of transfers and outcome axes. arc.foundingTiers is an immutable NumberTuple7,
  all zero for sapience, exact launch tiers for colonies (including empty regions).
* `HazardId` is the M1 type above; H starts 0, episode 0n, E=expQ32(address),
  closed=false. 0<=H<E, E>=1. Ledger slots first appear when eligible and
  then persist even when ineligible; closed owners never restart.
* Chains: status active/complete/fail/invalidate/timeout; reason null or
  `participant-ended`, `no-frontier`, `conquest`, `stalemate`, `peace`,
  `burnout`, `arc-ended`. step=0, nextTick=t+1. WAR deadline=t+3; PLAGUE=t+3.
  refs sorted `(role,entityId)`; roles attacker/defender/target or origin.
  frontier/visited are region IDs (empty for WAR). No duplicate membership.
  An active step sets nextTick=t+1. Every terminal branch sets nextTick=null,
  frontier=[], preserves sorted visited including victims actually affected by
  that step, preserves refs/deadline/kind/chainId, and records the attempted
  step number. WAR visited always stays []. Terminal reason/status are those
  in the recipe; no branch retains a runnable nextTick. A chain moves to the
  archive after this transition. CONQUEST lock loss is pre-empted but records
  fail/stalemate; all other invalidations are accepted, effect-free steps.
* Provenance entries `{eventId:String,score:BigInt}`; 1..3 entries sorted
  score descending then eventId ascending. Slots sorted `(target,field)`.
  Latches sorted `(kind,subject)`, created false, then assigned predicates.
* `Priors` has exactly `learningBias`, `innovationPpm`, `nuclearQ32`,
  `pandemicQ32`, `runawayQ32`, `sharedRiskPpm`, `colonizerPpm`, with types and
  ranges in the prior table. arc.scenarioParams is an immutable copy of its
  lineage's record, so P never reads live D.
* Voyage statuses transit/delivered/lost/turned-away; initial transit.
  `transit.pop` is the sole authoritative passenger stock, never duplicated
  on voyage. Account reaches zero on disposal and moves to archive. Hazard closes then.
* Body episode records `{body:String,nextEpisode:Number}` sorted by body,
  initialized 0. Origin statuses pending/founded/no-lineage/preempted;
  no-lineage is a recorded origin fact, not an extinct biological lineage.
* Message types LAUNCH, ARRIVAL, SHARED, PERILS_EXIT, PERILS_REENTER. LAUNCH
  is an outbound-only message consumed by D at the emission barrier. Payload is
  `{voyageId:StringOrNull,kind:StringOrNull,outcome:StringOrNull,
  lossPermille:Number,infraLossPermille:Number,tierDrop:Number,
  damagePermille:Number,damageTicks:Number,caps:NumberTuple7OrNull,
  launch:LaunchOrNull}`. Launch is the same closed snapshot as data.launch.
  Null/0 defaults; LAUNCH uses launch, ARRIVAL uses voyageId, SHARED uses kind/outcome/numbers;
  perils uses defaults. No random draw occurs during delivery.
  For perils messages choose the latest strictly earlier accepted event at
  that barrier that changed a safety-predicate input as causeEventId; if none,
  causeEventId=null. ID is the flat barrier message ID above; a null cause never fabricates a causal
  event. Set targetId to the receiving arc. LAUNCH targetId is destination
  body; source SHARED targetId is lineage; their deliveryTick=t+1 until D
  expands/reschedules them. D assigns ARRIVAL causeEventId=launchEventId.
* domain.coverage is always `complete-domain`; contacts stays [] in M2.
  Historical membership is append-only in the archive; live directory membership
  removes retired records. Runtime ownership comes from
  region.polityId, not two independent territory records.

SAPIENCE draws n=1+below(2), then initializes min(n,positiveCount) populated
regions, taking the first by local ID with Kbase>0. regionCount is the actual
count. If positiveCount=0, D0 marks origin no-lineage, clears sapienceYear and
deliveryTick to null, and creates no lineage/arc/event; rates/waits stay retained.
This hosting check precedes the region-count draw. One positive region always
receives 1000 people regardless of n. Each receives 1000 persons, infra=1000, tiers all 0,
culture `[500,500,500]`, common founder culture ID, renewable=1000,
immunityTicks=20. Other regions have zero people/infra and the same culture,
tiers and renewable/immunity defaults. Kbase/resources come from the epoch;
K, energy and era are derived. Home arc colonizer=true, isColony=false.
There is no initial polity. Empty-body metadata does not instantiate an arc.

Fixture origin witnesses and reserved initialization context are immutable
inputs to P0, not permission to query live D state; the corresponding table
paths describe those supplied snapshots. In an ordinary origin with zero
positive capacity, no-lineage records the reason through its status (no extra
undeclared reason member). Live records are resolved by IDs through framework
collection lookup; lookup does not implicitly read unrelated member fields.

Other initialization is explicit: arc.tick=founding boundary tick; arc.body,
episode,lineageId,foundedYear and id are the reserved identity values;
arc.nonviable=false, arc.perils=none, and collections use the empty defaults
unless filled by initialization above. lineage.id is the origin ID form,
lineage.arcs=[homeArcId], foundedArcs=1, lastDeath=null,
voyages/contacts=[], perilsSafe=false,
outcomeClass=EXTANT_PLANETARY, extinctionCause=null. domain.id comes from the
fixture, domain.tick=fromTick, origins contain the sorted computed schedules,
bodyEpisodes include every declared body with nextEpisode=0, and all other
directories/latches/messages start empty. Archive starts empty. Origin founding increments its body
counter to 1. At colony creation append the reserved arc and increment that
body's counter once. D does not redraw lineage priors at colony creation.
Origin.body is immutable; rates/waits are initialized by the prior recipe;
sapienceYear/deliveryTick are null only for no-lineage, otherwise the computed
dates (including pending beyond horizon). Voyage immutable values are copied
from data.launch; launch.status=transit, hazard initialized at episode0 with exactly
`{ownerId:voyage.id,kind:"VOYAGE_LOST"}` (domain, targetTier and edgeId absent),
transit.id derived from voyage ID, transit.pop=accepted launch passengers.
`arc.regions` contains exactly the region records, `arc.polities` only live
polities, `domain.arcs` only nonterminal arcs; no separate hidden
state tables may influence history. lineage.foundedArcs increments once for each founding; lastDeath fields start
null. arc.foundingTiers is set once as specified above. Every initialization derives era/energy
and caps before the first pre-state, including a colony's initial industrialEra.

COLONY_FOUNDED sets isColony=true, colonizer=chance(colonizerPpm). It puts
all passengers in the first region with arrival Kbase>0, infra=10*founders,
fuel=0, exact launch tiers/culture in that region, zero tiers elsewhere.
Inherited tiers are not caps. Other defaults match SAPIENCE; all unoccupied
regions still have the inherited culture. Landing structures are a recorded
founding addition [scenario], not silently transferred capital. Minimum viable
colony population is 2000; nonviable starts false and is evaluated in phase 1.
Kbase on habitat bodies is conditional on arrival life support, below.

Polity creation: regions as assigned; capital=smallest region ID;
regime=state, eliteShare=100, asabiya=600, legitimacy=600, stress=100,
warWeariness=0, hegemony=false, endedYear=null, foundedYear=event date,
parentIds=[] or sorted split parents. Split children instead inherit regime,
eliteShare and warWeariness, set asabiya=700, legitimacy=600, stress=200.
All polity population/power sums are computed views, not stored fields.

## Natural dynamics and derived quantities [scenario]

All right sides read the frozen pre-state, including era. Stock loss fractions
below mean debit F(remaining*fraction,1000), not rounding surviving stock.

| Era | g per decade | kcal/person/day | build coefficient | fuel coefficient |
|---|---:|---:|---:|---:|
| E0 | 10050 | 4500 | 1 | 0 |
| E1 | 20201 | 8000 | 2 | 0 |
| E2 | 105171 | 26000 | 4 | 0 |
| E3 | 221403 | 77000 | 8 | 2 |
| E4 | 161834 | 230000 | 16 | 4 |
| E5 | 105171 | 1000000 | 32 | 8 |
| E6 | 105171 | 5000000 | 64 | 16 |
| E7 | 105171 | 10000000 | 128 | 32 |

The g integers are pinned nearest-integer values for annual r of respectively
1000,2000,10000,20000,15000,10000,10000,10000 millionths. The BH form is T2.1;
these rates are [scenario], including the agrarian selection from its range.
Infrastructure keep=490 permille (nearest integer for tau=14 years, T2.12).
There is no run-time exp. Build is a per-tick authored increment, not a claim
to implement the full World3 frozen-investment integral.

1. `K=F(Kbase*subsMult[S]*(1000-damage),1000000)`, with subsMult
   `[1000,2500,10000,25000,60000,120000]`. Renewable is a pressure driver;
   it does not secretly introduce another K multiplier. On habitat bodies,
   use Kbase=0 unless local E>=5 and S>=5 (epoch Kbase remains available in
   input.environment); phase 0 and 5c recompute that conditional Kbase.
2. `BH(P,K,g)=0` if P=0 or K=0, otherwise
   `num=P*K*(1000000+g)`, `den=1000000*K+g*P`,
   `BH=F(2*num+den,2*den)` (nearest, ties up; runner D10). The rational num/den
   lies between integer P and K for g>=0, so rounding cannot leave that
   closed integer interval: 0<=BH<=max(P,K). BH(100,5000,10050)=101. For a nonviable colony subtract
   `min(BH,max(1,F(BH*100,1000)))` when BH>0. This explicit extra mortality
   ensures small populations eventually reach zero; it is a naturalDelta.
   K=0 kills P naturally **before** event debits. Natural delta=Pnew-P.
3. infra'=F(infra*490,1000)+F(pop*buildCoefficient*(1000-stressOwner),1000).
   Unowned stressOwner=0. Fuel'=fuel+F(pop*fuelCoefficient*resources.fuels,1000)
   for Energy-domain tier<=4; for Energy-domain tier>=5 use resources factor
   1000 (synthetic fuel), even when era=4. Build/fuel coefficients and g use
   era, never Energy tier; only the synthetic-resource switch uses Energy tier. No natural
   fuel debit, no stock cap; LAUNCH debits fuel and infrastructure explicitly.
4. forcing'=F(forcing*990,1000)+fossilUse, where fossilUse is
   F(energy,1000) at E tier 3, F(energy,2000) at E tier 4, otherwise 0.
   This uses Energy domain, not era. Forcing threshold=1000000000 units.
5. pressure=`min(2000,F(pop*1000,max(1,K)))`;
   renewable'=clamp(renewable+20-F(pressure,50),0,1000).
   immunityTicks'=min(20,immunityTicks+1). Empty regions use pressure=0.
6. N_eff(r)=pop(r)+sum F(pop(neighbour)*effectiveContact,1000).
   effectiveContact=edge.contactPermille if !barrier, otherwise
   F(edge.contactPermille,4); both directions use the same static contact.
   A low maintenance predicate is tier>0 and
   maintenanceN_eff<F(Nstar[domain,tier]*learningBias,1000).
   M4a founding knowledge reserve defines maintenanceN_eff below; invention retains N_eff.
   lowTicks'=min(2,lowTicks+1) if low, otherwise 0. TECH_LOSS tests
   pre-state lowTicks>=2, so two completed low ticks precede loss.
7. Culture natural drift moves each coordinate one unit toward the polity
   capital's pre-state coordinate if owned, otherwise leaves it unchanged.
   Distance(c1,c2)=F(sum(abs(component difference)),3), in permille.
8. For each live polity compute unweighted region averages of pressure and
   renewable, and its maximum I tier. Let fighting be 1 if a pre-state active
   WAR includes it, else 0. stressTarget=clamp(F(avgPressure,2)+eliteShare+
   F((1000-legitimacy),2)+20*(regionCount-1)-F(asabiya,2),0,1000).
   stress'=F(3*stress+stressTarget,4);
   legitimacy'=clamp(legitimacy+5-F(stress,100)-10*fighting,0,1000);
   asabiya'=clamp(asabiya+10*fighting-2,0,1000);
   eliteShare'=clamp(eliteShare+1+maxI-F(stress,100),0,1000);
   warWeariness'=clamp(warWeariness+100*fighting-20*(1-fighting),0,1000).
   Regime never changes naturally. There is no stress feedback within a tick.
9. Era is exactly the highest matching conjunction in spec §7; E7 energy
   capture above is a display extension. energy=pop*capture[era].
   powerAt(polity,target)=sum over its regions
   F(pop*(1+M)*(500+asabiya),1000), attenuating each contribution by
   F(value*800,1000) once per shortest-path hop to target. Graph distance uses
   all adjacency edges, regardless of barriers; unreachable contributes 0.
   BFS distances are static; equal paths do not change the hop count.
10. Derived ownership lists are rebuilt from region.polityId; empty polities
    get endedYear=tickEnd only when endedYear is null; preserve an existing
    split/event retirement date exactly. Their IDs never return. A lost capital becomes the
    smallest retained region. Sum population=0 does not end a polity unless
    its arc terminates. Hegemony is cleared if its predicate is false.
    arc industrialEra=max occupied-region era (default 0), regressing compares
    it to pre-state industrialEra; political fragmented if a split happened
    this tick, else continuous if any live polity, else none. Biological
    extinct iff total population=0; terminal is set only by EXTINCTION.
    If perils=none and committed frontier era>=3, set active. Only D messages
    can set exited or reactivate exited. No automatic exit on regression.

## Technology gates [scenario]

Each acquisition requires local pop>0, target=current+1<=maximum and caps,
all named tier minima, and every resource gate. O4 additionally requires the
owner polity's hegemony flag; O5 requires I4,T6 on any body, including the
homeworld (runner D9, no colony gate). Empty conjunction=true. A lost prerequisite does not automatically
erase dependent tiers. Gates apply equally to AGRICULTURE, DISCOVERY and
DIFFUSION. Anoxic rows replace, rather than add to, the named normal rows.

| Domain | Target tiers: prerequisite conjunction; resource minima |
|---|---|
| E | 1: S1; domesticables100. 2: M1,T1; metals100. 3: M3,T2; fuels100. 4: M4,I3; fissiles50. 5: M4,I4; metals100. 6: M5,T7,O5; metals100 |
| S | 1: none; domesticables100. 2: E1,O1; domesticables100. 3: M2,T2; metals100. 4: E3,M3; fuels100. 5: E4,V3; metals100 |
| M | 1: E1; metals100. 2: E1; metals200. 3: E2; metals200. 4: E3,I2; metals200. 5: E5,I5; metals200 |
| T | 1: S1; none. 2: M1,O1; metals100. 3: E3,M3; metals200. 4: E3,M3,I3; fuels100. 5: E4,M4,I4; metals200. 6: E5,S5,O4; metals200. 7: E5,M5,O5; metals200 |
| I | 1: S1; none. 2: M1,O2; none. 3: E3,M3; metals100. 4: E4,M4; metals200. 5: E4,V3; metals200 |
| V | 1: S1; none. 2: I2; none. 3: E3,I3; none. 4: I4,M4; none |
| O | 1: S1; none. 2: S2,I1; none. 3: T2,I2; none. 4: I3,T4 + hegemony; none. 5: I4,T6; none |
| Anoxic E1 | M0,S1; metals100 (geothermal/electrochemical scenario; no domesticable energy gate) |
| Anoxic E3 | M3,T2; metals200 (no fuel gate) |
| Anoxic S4,T4 | Same tier minima as normal; metals200 replaces fuels100 |

Nstar rows list tier 0 through maximum, in persons:

| Domain | Nstar (persons, tier 0 onward) | discovery cost (tier 0 unused) |
|---|---|---|
| E | 0,100,500,2000,10000,40000,100000 | 0,2,5,10,20,100,3000 |
| S | 0,50,100,500,5000,30000 | 0,2,5,10,20,100 |
| M | 0,100,500,1000,10000,50000 | 0,2,5,10,20,100 |
| T | 0,100,300,1000,5000,15000,40000,80000 | 0,2,5,10,20,100,500,2000 |
| I | 0,50,200,1000,10000,40000 | 0,2,5,10,20,100 |
| V | 0,50,200,1000,10000 | 0,2,5,10,20 |
| O | 0,100,300,1000,10000,40000 | 0,2,5,10,20,100 |

All costs and thresholds are authored **[scenario]**, with no research backing
claimed. kremer(d,r)=F(400*N_eff(r)*innovationPpm,1000000*cost[d][target]).
AGRICULTURE additionally multiplies by domesticable resources / 1000, floored.
AGRICULTURE owns S0->S1 only; DISCOVERY excludes it. Each eligible domain/target
has its own hazard. DIFFUSION keeps its contact rate and copies one gated tier;
N_eff never copies knowledge. Later capacities are typically 300,000--600,000
persons per region (Kbase 5,000 times S4/S5); maintenance thresholds up to
100,000 times learningBias/1000 are expressed in those same person units.

## Priors, origin and purposes [scenario]

Integer discrete log-uniform sampler `Log(lo,hi)` draws `j=below(hi-lo+1)`
and returns `1n << BigInt(lo+Number(j))`. Bounds are inclusive integer binary
exponents; this is explicitly a discrete logarithmic prior, not a continuous
log-uniform approximated with linear bins. Powers are exact integers.

| Parameter | Purpose | Sampler/range | Address |
|---|---|---|---|
| origin annual step rates, j=0,1,2 | orig.rate.0, orig.rate.1, orig.rate.2 | Log(12,22): 4096..4194304 Q32/year | D, origin ID, episode 0, ordinal 0 |
| hard-step threshold j | orig.step.0, orig.step.1, orig.step.2 | expQ32 | same |
| learningBias | prior.learning | Log(8,12): 256..4096 permille, Number | D, lineage ID, episode 0, ordinal 0 |
| innovationPpm | prior.innovation | Log(17,23): 131072..8388608, Number | same |
| nuclearQ32 | prior.nuclear | Log(8,24): 256..16777216 BigInt/tick | same |
| pandemicQ32 | prior.pandemic | Log(12,28): 4096..268435456 BigInt/tick | same |
| runawayQ32 | prior.runaway | Log(14,29): 16384..536870912 BigInt/tick | same |
| sharedRiskPpm | prior.shared | Log(0,19): 1..524288, Number | same |
| colonizerPpm | prior.colonizer | Log(15,19): 32768..524288, Number | same |

Before a lineage exists draw origin rates, not lineage parameters. Starting at
max(complexLifeFromYear,habitableFromYear), compute each
Wj=C(expQ32(orig.step.j),ratej), sum as BigInt. Sapience physical year is start
+sum W. If >=habitableUntilYear, status=no-lineage; do not retry. If before
the horizon but not globally aligned, schedule at 10*C(year,10), preserving
the physical year in the origin record. If that boundary is outside the
window, no-lineage. If beyond the requested horizon, pending, never no-lineage.
Origin scheduling cannot use a floating year or shorten the habitability window
to the query horizon. The primary homeworld is the only origin in default M2;
up to four explicitly listed origin bodies are allowed. If another lineage
occupies the body at the sapience delivery boundary, mark origin preempted.
If occupied by its own lineage, the origin likewise does not create another
arc. Record the deterministic reason, with no second sapience attempt.

Ord reference probabilities in T4.12 are not coefficients here. The lineage
priors intentionally span many orders of magnitude and outcome classes include
survival. No inference from existential risk to extinction probability is made.

Full **new** purpose registry entries (case-sensitive):

`haz.MIGRATION`, `haz.AGRICULTURE`, `haz.PLAGUE`, `haz.NATURAL_CATASTROPHE`,
`haz.DISCOVERY`, `haz.DIFFUSION`, `haz.POLITY_FOUNDING`, `haz.WAR`,
`haz.FRAGMENTATION`, `haz.REVOLUTION`, `haz.SCHISM`, `haz.COLLAPSE`,
`haz.NUCLEAR_WAR`, `haz.ENGINEERED_PANDEMIC`, `haz.RUNAWAY_TECH`,
`haz.LAUNCH`, `haz.VOYAGE_LOST`,
`orig.rate.0`, `orig.rate.1`, `orig.rate.2`,
`orig.step.0`, `orig.step.1`, `orig.step.2`,
`prior.learning`, `prior.innovation`, `prior.nuclear`, `prior.pandemic`,
`prior.runaway`, `prior.shared`, `prior.colonizer`,
`evt.sapience.regions`, `evt.migration.fraction`, `evt.plague.loss`,
`evt.natural.loss`, `evt.natural.duration`, `out.NATURAL_CATASTROPHE`,
`evt.collapse.drop`, `evt.revolution.regime`, `evt.schism.coordinate`,
`evt.conquest.win`, `evt.perils.drop`, `evt.perils.shared`,
`out.NUCLEAR_WAR`, `out.ENGINEERED_PANDEMIC`, `out.RUNAWAY_TECH`,
`evt.launch.destination`, `arc.colonizer`.
Retain all M1 purposes; `evt.war.campaign` already exists and is reused.
No purpose is generated dynamically outside this closed list.
`arc.colonizer` address: P, arc ID, episodeOrBucket=0, ordinal=0.

## Event execution conventions

Eligibility/rates/magnitude parameters use **only pre-state**. Resolution may
test target identity/liveness and remaining debit stocks, but never invent a
new hazard, change a draw, or reevaluate a rate. A kind's omitted hazard
components are absent, not empty strings. The HazardId optional-component
exception to closed records is exactly the M1 presence-bit contract; do not
serialize absent components as null. All hazard terms below are integer
Q32 per ten-year tick. A single named term is a sorted sum of length one.
No hidden intercept, noise, seasonality or rate floor exists.

Threshold latches evaluate the predicate every phase 1, reset to false when
false, and emit only when true and previously false. A pre-empted threshold
still sets its latch. For TECH_LOSS the subject includes domain but not tier;
accepted loss resets lowTicks to 0, and its latch resets next tick once that
counter is false. Extinction latches never reset on a terminal arc. Dead
region/population is not by itself a dead region identity.

General effect helpers, with exact within-event ordering:

* `loss(r,p)`: debit F(remaining region.pop*p,1000). `infraLoss` similarly
  debits remaining region.infra. `drop(r,n)` sets every maintained tier to
  max(0,remainingTier-n), caps unchanged. Numeric adds/scales do not acquire
  categorical target locks.
* `shock(r,p,n)` inserts its damage record; its eventId is the owning event's
  ID. For repeated consequences of that event on one region, insert once.
* `collapse(r,n,p,i)`: snapshot pre-state pop/infra as recovery targets (merge
  by maxima if already collapsed), set active, loss p, infraLoss i, drop n.
* `split(polity)`: if >=2 regions, end parent at event date and assign sorted
  lower F(count,2) to child part 0 and the rest to part 1. Creates exactly two
  records, every region occurs once. If count=1 no split. Regions with 0 pop
  still transfer. `region.pop` never moves on ownership-only CONQUEST or
  split: the people stay in their region and derived polity totals change.
* Acquisitions take one `(region,domain)` gain lock. First accepted wins;
  later same-tick gains are pre-empted. Accepted gain is set to
  min(currentRemainingTier+1,preTargetTier,remainingCap), never lowers a tier.
  If this yields no increase, pre-empt with `no-gain`. A same-tick loss can
  therefore reduce the benefit of a later innovation; prerequisites are not
  rechecked on mutable state. Tier-drop effects remain ordered and additive.
* Territory intents lock the affected region IDs as a group; first accepted
  ownership intent wins all its locks, otherwise the entire intent is
  pre-empted. A split also locks its parent polity retirement. Regime and
  culture sets lock `(target,field)`. SCHISM locks culture fields of its part,
  not region ownership. Recovery and collapse flags follow event order;
  RECOVERY clears only the pre-state collapse episode (if a prior effect this
  tick replaced/enlarged it, RECOVERY is pre-empted `new-collapse`).
* Arc-wide perils and regional collapse do not lock stock debits: sequential losses
  compose. After an actual extinction-class effect, all later local intents
  needing living people are pre-empted `no-people`. Natural zero is treated
  identically. Already registered voyages are unaffected.

Resolve phase 4 determines categorical locks in event order. Phase 5b resolves
stocks in that same order after natural updates; it may mark an otherwise
accepted intent pre-empted for zero available amount or ended target. Hazard
thresholds remain consumed. Pre-empted events retain trigger evidence and
drawn params, empty effects, resolution pre-empted and a reason; no new chain or
outbound message is created (existing chain steps still advance as specified). `no-stock`, `target-ended`, `target-conflict`,
`duplicate-chain`, `reciprocal-war`, `no-gain`, `new-collapse`, `no-people`
are the complete P pre-emption reasons. All initially have resolution accepted,
reason null. Empty numeric losses alone do not pre-empt an event with other
nonzero effects.

## Catalogue recipes [scenario]

Ranks are spec row numbers, unique 1..31. Base salience is fixed, never random.
Event phases are trigger phases; effects normally commit at 5b. Mixed-trigger
rows have an explicit phase per variant. All thresholds use phase 1 unless
stated otherwise. All H rows use phase 2 unless D-owned. Owner listed below
is both level and RNG level; the subject identifies the event owner.

### 1 SAPIENCE — P; scheduled; phase 0; salience 1000; M2a

Owner=new arc ID. Origin schedule and unoccupied body at the scheduled boundary
are required. Intent=m:origin ID. `evt.sapience.regions` uses below(2)+1.
Effects plus the INIT skeleton create all P initialization fields; D0
registers the lineage/arc exactly once before P0, confirmed at the barrier; initial people are additions, not a transfer. Parameters
`regionCount` (the actual clamped count). No hazard. D reserves the body episode before phase 0; it
provides immutable lineage parameters to P. FoundedYear is the aligned
boundary; origin.sapienceYear preserves the hard-step date. Initial ancestry
has no fabricated cause event. No later sapience on this origin.

### 2 MIGRATION — P; hazard; phase 2; salience 200; M2a

Owner=source region ID; hazard edgeId=directed edge. Both regions belong to the
same arc; source pop>0, destination K>pop, effectiveContact>0.
`headroom=F((Kdest-popdest)*1000,max(1,Kdest))`;
`war=200` if source participates in an active war, otherwise 0;
`climate=min(1000,sum active source damage)`;
`push=clamp(pressureSource-700+climate+war+(1000-renewable),0,2000)`.
Term `pressure=F(21474836*push*headroom*effectiveContact,1000000000)`.
Draw `evt.migration.fraction`: below(201)+50 permille (50..250).
Transfer F(remaining source.pop*fraction,1000) to destination.pop. The
pre-state headroom gates the hazard but does not clip arrivals to K. Zero
transfer pre-empts. Params fraction; data source/target=region IDs. No culture
or technology automatically moves. Debits happen after all natural updates.

### 3 AGRICULTURE — P; hazard; phase 2; salience 700; M2a

Owner=region; domain=`Subsistence`, targetTier=1. Eligible S=0 and S1 gate.
Term `kremer=F(kremer(S,r)*resources.domesticables,1000)`.
No magnitude draw. Gain S1 under acquisition lock; params domainIndex=1,
targetTier=1. K recomputes at 5c; this event does not grow population instantly.

### 4 FAMINE — P; threshold; phase 1; salience 500; M2a

Owner/subject=region. Predicate pop>0 and
`(pop*1000>K*1200 OR damage>=300)`. Reset whenever false.
lossPermille=`clamp(pressure-1000+damage,50,700)`, no draw.
Effects loss(pop,lossPermille), renewable=max(0,remainingRenewable-100).
No repeated famine each tick while the predicate stays true; BH decline
continues. `crossed.var=region.pop`, value=pop, threshold=F(K*1200,1000),
including a shock-caused crossing; params also damage.

### 5 PLAGUE — P; hazard opener / chain; phases 2/3; salience 600; M2a

Owner=outbreak region. No other active plague chain may have this origin.
Eligible pop>0;
`connectivity=1000+sum effectiveContact`;
`susceptible=50+F(950*immunityTicks,20)`.
Term `density=F(71582788*min(2000,pressure)*connectivity*susceptible*urban[S]*medicine[V],1000000000000000)`.
urban by Subsistence tier=[10,100,300,600,1000,1000] permille;
medicine by Medicine tier=[1000,700,400,150,50] permille.
Opener draw evt.plague.loss=below(201)+100 (100..300 permille).
At resolution take one `(PLAGUE,originRegion)` opener lock; later same-tick
openers pre-empt duplicate-chain even though all read the same pre-state.
OUTBREAK applies loss, sets immunityTicks=0, and if owned debits eliteShare by
min(remainingEliteShare,50). Creates chain with origin ref, frontier/visited
containing origin; step=0, next=t+1, deadline=t+3. Params lossPermille;
data.stage=OUTBREAK.

At t+1 and t+2 emit one PLAGUE SPREAD chain event (step 1 or 2), dated tick
start. From pre-state frontier, take all adjacent not-visited regions with
pop>0, effectiveContact>=100, immunityTicks>=5, sorted unique. Spread to every such
region, independent of traversal order. Draw one evt.plague.loss on this
step ID (100..300), shared by its victims; same effects as outbreak. Set
frontier=new victims, visited=union. Empty frontier instead emits BURNOUT,
complete/no-frontier, no stock effects. At t+3 emit step 3 BURNOUT complete/
burnout regardless of frontier. Arc termination invalidates with arc-ended.
Origin population loss alone does not invalidate the pathogen chain.
Each step's params and effects enumerate actual victims through sorted refs
role `victim`; no per-edge spread draws. Separate chains can hit a region in
one tick and their losses compose.

### 6 CLIMATE_SHIFT — P; exogenous; phase 0; salience 400; M2b

Owner=arc. At a globally aligned millennium boundary OR exact lifecycle
habitableUntilYear boundary emit iff installed Kbase/resources change. P0
checks lifecycle every tick, including in M2a where the environmental install
is framework-only (CLIMATE_SHIFT remains disabled). At year150 closure sets
Kbase=K=0 in P0 of tick15; P5a that tick kills its pre-state population, with
stock jump at year160 under O1. No wait until year1000. Outside-lifecycle zero
overrides all habitat support and epoch values, including in P5c.
The exogenous intent is `m:` plus `arcId+"#env:"+tick`; a coincident epoch and
closure yields one event. Compare installed values, not wrapper digests.
Replace Kbase/resources for every region, expire damage, derive K before
freezing. No draw or population debit here. All changed environmental fields
are represented by sets; lifecycle closure forces Kbase=0. No extra catalogue
event for unchanged epochs. Terminal arcs receive no new epoch events.

### 7 NATURAL_CATASTROPHE — P; hazard; phase 2; salience 850; M2b

Owner=arc; eligible total pop>0. Terms `impact=214748`, `volcano=214748`,
so h=429496. Conditional extinction probability
`p=min(1000000,F(3067833*1000000,max(1,h)))`, then min(p,1000) for the
default scenario. `3067833` Q32/tick is strictly below Q*10/14000;
require h*p<=3067833*1000000 even in overrides. This is a **cap on the sampled direct natural-extinction branch only; delayed
demographic extinction after a survivable catastrophe is not bounded**. Runner
D3 accepts this scope for M2b (A9). Draw `out.NATURAL_CATASTROPHE` via chance(p).
If true: loss 1000 on every region; data.outcome=extinction.
On that branch params are lossPermille=1000, damageTicks=0,
extinctionPpm=p; no severity/duration draw is made.
Otherwise draw evt.natural.loss=below(301)+100; duration=
evt.natural.duration below(16)+5. For each region sorted: loss at sampled
fraction, infraLoss same fraction, shock(300,duration). No resampling per
region. Params lossPermille,damageTicks,extinctionPpm. data.outcome=survivable.

### 8 DISCOVERY — P; hazard; phase 2; salience 650; M2a

Owner=region; hazard domain=full domain name, targetTier=current+1.
Eligible target gate, excluding S0→1. Term `kremer=kremer(d,r)`.
No draw. Gain target using acquisition lock. Params domainIndex,targetTier.
Enabled provenance comes from all named prerequisites and population.

### 9 DIFFUSION — P; hazard; phase 2; salience 450; M2a

Owner=directed edge ID, hazard domain=full domain name, edgeId=same ID;
no targetTier component. Destination pop>0, source tier>destination tier,
effectiveContact>0, destination next-tier gate. Term
`contact=F(42949673*(sourceTier-destTier)*effectiveContact,1000)`.
Gain destination next tier using acquisition lock. Params domainIndex,
targetTier; data source/target are region IDs. No independent discovery-spread
term. A paused edge ledger resumes when a tier gap returns.

### 10 TECH_LOSS — P; threshold; phase 1; salience 500; M2a

Owner=region, subject=regionId+"~tech:"+domainName. Predicate tier>0 and
lowTicks[d]>=2. Set remaining tier=max(0,tier-1), lowTicks[d]=0. No draw.
Params domainIndex,drop=1. Trigger crossed.var=region.lowTicks, value=pre counter,
threshold=2. Natural maintenance increments run before this reset. Missing
prerequisites do not cascade loss; caps may subsequently restrict recovery.

### 11 ENERGY_TRANSITION — P; derived threshold; phase 5; salience 750; M2a

Owner/subject=region. Exactly one iff pre.era!=committed.era. No latch is
needed beyond this before/after comparison; no hazard or draw. Set era/energy
is framework 5c; event has no further stock effect. Params fromEra,toEra.
Trigger mode threshold, crossed.var=region.era, value=newEra, threshold=oldEra.
Date=max dates of accepted events this tick changing relevant tiers (or tick
start if none); retain only causes strictly earlier in order. Natural changes
cannot change the conjunction; phase-0 founding establishes initial era before
comparison, so no duplicate transition on arrival.

### 12 POLITY_FOUNDING — P; hazard; phase 2; salience 650; M2a

Owner=region; eligible polityId=null, pop>=1000, S>=2, pressure>=100.
Term `density=F(42949673*min(1000,pressure),1000)`.
Creates one polity, claims this region with an ownership lock; metadata/defaults
above. No draw, data.target=new polity ID; regime state. Does not require O2,
so a polity may form before maintaining the abstract state technology.

### 13 WAR — P; hazard declaration / chain; phases 2/3; salience 700; M2a

Owner=directed pair ID; hazard has no optional components. Eligible two
live adjacent polities with positive population, no active chain between the
unordered pair. Target is smallest defender region adjacent to any attacker
region. Pa/Pd=powerAt each polity at target; ratio=min(2000,F(Pa*1000,max(1,Pd))).
warStress=max(100,attacker.stress); cultureDistance is distance of the two
capital cultures. Terms:
`stress=F(429496730*ratio*warStress*(1000-attacker.warWeariness),1000000000)`;
`culture=F(2147483*cultureDistance,1000)`.
Reciprocal declarations in this tick merge: smaller ownerId survives even if
its date is later; other logs reciprocal-war with survivor ref. All subsequent
declarations of this unordered pair pre-empt duplicate-chain. Opener DECLARED
creates chain refs attacker/defender/target, deadline=t+3, no casualties.

At t+1 and t+2 emit WAR CAMPAIGN steps 1 and 2 dated tick start. At t+3 emit
CONQUEST END step 3, below. If a participant ended or target no longer belongs
to defender in pre-state, emit WAR with that step, stage INVALIDATED,
status invalidate/participant-ended and no stock effects. Do not retarget.
Campaign magnitude evt.war.campaign=below(81)+20 (20..100 permille).
For each participating polity's pre-state regions sorted, apply population
loss fraction, infraLoss 50; add 100 weariness, clamped to 1000, to each polity
after losses. Natural fighting updates additionally apply. Intensity used by
nuclear hazard is number of active armed WAR chains, capped at 4; no new
declaration can cause a nuclear firing in its own tick.

### 14 CONQUEST — P; chain END; phase 3; salience 800; M2a

Owner=war pair ID, refs unchanged, step=3. Valid active war with existing
participants/defender target; use same pre-state power definition.
`p=0` if Pa+Pd=0, otherwise max(0,F((Pa-Pd)*1000000,Pa+Pd)).
Draw evt.conquest.win via chance(p). Success sets target region.polityId to
attacker (ownership lock), ends chain complete/conquest, stage END,
outcome CONQUEST. No people debit or relocation. If target was last region,
defender retires in 5c. Failure outcome is PEACE when either weariness>=700,
otherwise STALEMATE; ends chain timeout/peace or timeout/stalemate. Failure
has no territorial effect and still emits CONQUEST as the chain outcome kind.
This explicit naming convention keeps the catalogue at 31. If conquest loses
an ownership lock, log pre-empted and close chain fail/stalemate.

### 15 HEGEMONY — P; threshold; phase 1; salience 750; M2b

Owner=polity ID, subject=polity ID. Eligible live polity, arc total>0 and
polityPop*1000>=arcPop*600. Set hegemony=true; 5c clears when false.
Predicate false resets latch. No draw. Trigger crossed value=polityPop*1000,
threshold=arcPop*600. An unowned majority prevents hegemony. Initial or lost
hegemony does not automatically increase O tier.

### 16 FRAGMENTATION — P; hazard; phase 2; salience 700; M2b

Owner=polity ID; live polity with >=2 regions. Terms
`stress=F(2147483*stress,1000)` and
`overhead=429496*(regionCount-1)`. Split helper; no draw. Sorted region
halves are not a random geographic partition. Politics marked fragmented.

### 17 REVOLUTION — P; hazard; phase 2; salience 650; M2b

Owner=polity ID; live, pop>0, max regional I>=1. Term
`stress=F(4294967*stress*maxI,5000)`.
Draw evt.revolution.regime below(6), indexing sorted regime enum excluding
current: full order band,chiefdom,empire,federation,republic,state,technocracy.
Set selected regime, legitimacy=700, eliteShare=F(remainingEliteShare,2),
stress=200. One regime lock. No territory changes.

### 18 SCHISM — P; hazard; phase 2; salience 600; M2b

Owner=polity ID, >=2 regions; distance is maximum culture distance from
capital across member regions. Eligible distance>=100 OR stress>=500.
Term `distance=F(4294967*max(distance,F(stress,2)),1000)`.
Second sorted half of regions takes new culture ID the flat culture form with part=1.
Draw evt.schism.coordinate below(3). Set that coordinate to
`(preCapitalCoordinate+500)%1001` for every affected region, retaining its
other coordinates. Modulo is nonnegative integer remainder. No new polity;
capital-side war distance later matters after a split/conquest. Culture sets
lock all affected regions as a group. No unspecified cultural-distance RNG.

### 19 COLLAPSE — P; hazard; phase 2; salience 900; M2a

Owner=region; eligible pop>0, era>=1, and no active collapse. Let s be its
owner's stress (100 if unowned), complexity=sum of this region's tiers.
Terms `stress=F(4294967*s*s,1000000)` and
`overhead=F(42949*complexity,7)`.
Draw evt.collapse.drop below(1)+1 (one tier). Apply collapse(r,1,300,700)
only to the owner region. Its pre-state multi-region polity may split once,
using the existing territory locks and flat IDs. Other regions retain their
stocks and tiers even if their political owner splits. Params splitCount
records accepted splits. One accepted COLLAPSE per region per tick; subsequent
firings are pre-empted target-conflict. No repeat exposure while recovery remains active or region.recoveries>=4 (M4a).
RECOVERY still restores demographic/infrastructure viability, not lost tiers;
rediscovery and diffusion restore knowledge. Losses never impose a permanent cap.

### 20 RECOVERY — P; threshold; phase 1; salience 700; M2a

Owner/subject=region. Predicate collapse!=null && active &&
pop*2>=recoverPop && infra*4>=recoverInfra*3. Clear collapse; increment region.recoveries capped at four. No tier gift.
crossed.var=region.infra, value=infra*4, threshold=recoverInfra*3. Reset when
predicate false; see collapse-episode conflict rule. Infrastructure decay can
prevent recovery unless population/build capacity supports the target.

### 21 NUCLEAR_WAR — P; hazard; phase 2; salience 1000; M2b

Owner=arc; perils=active, totalPop>0, >=2 armed live polities and an active
WAR between armed participants. Armed means any member region has E>=4 AND
M>=4. Term `prior=nuclearQ32*min(4,activeArmedWarCount)`.
Use common perils recipe below, with collapse pop loss=600, infra loss=800,
shock(600,10), cap vector `[3,5,3,4,3,4,3]`.

### 22 ENGINEERED_PANDEMIC — P; hazard; phase 2; salience 1000; M2b

Owner=arc; perils=active, totalPop>0 and one occupied region with V>=4 AND
I>=4. Term `prior=pandemicQ32`. Common recipe: pop loss=700, infra loss=200,
shock(0,0), cap vector `[6,5,5,7,3,2,5]`.

### 23 RUNAWAY_TECH — P; hazard; phase 2; salience 1000; M2b

Owner=arc; perils=active, totalPop>0 and an occupied region with I>=5.
Term `prior=runawayQ32`. Common recipe: pop loss=500, infra loss=500,
shock(0,0), cap vector `[4,4,4,4,3,3,3]`.

Common recipe: `weightedPick(out.KIND)` over IDs collapse/existential-cap/
extinction with weights respectively [700,250,50] for nuclear, [650,250,100]
for pandemic, [500,350,150] for runaway. Weights refer to those ID names, not
their presentation ordering (M1 weightedPick sorts IDs). Draw
evt.perils.drop=below(3)+1 for every firing, even non-collapse outcomes.
Draw evt.perils.shared=chance(sharedRiskPpm) once per firing. Apply regions in
ID order. Collapse invokes collapse helper with these fractions/drop; cap
outcome sets caps componentwise min(old,vector), reduces tiers to caps, and
applies half the listed population/infra loss fractions (floor division by 2).
Extinction debits 1000 permille population and infrastructure, no tier drop.
Nuclear shock applies on every outcome; zero shock inserts no record.
Params lossPermille,infraLossPermille,tierDrop,damagePermille,damageTicks,
shared (0/1), outcomeIndex (collapse=0,cap=1,extinction=2).
If shared, publish one payload with these resolved **fractions**, outcome and
cap vector. D sends it to all other currently live lineage arcs at t+1.
Recipient uses its remaining stocks with the same fractions and outcome;
it does not draw, propagate again, or require its own perils eligibility.
Payload fractions are the final effective fractions: extinction uses 1000,
cap uses the already-halved fractions, collapse uses the listed fractions.
Recipient must not halve a cap payload again. Payload tierDrop is 0 except
for collapse, and caps is null except for existential-cap. Receiver recovery
targets use its own pre-state stocks, never the source's numbers.
Source casualties are never divided among recipients. All risks remain
correlated by the one owner draw. Shared deaths also update arc.lastDeath using their delivery/application date.

### 24 CLIMATE_CATASTROPHE — P; threshold; phase 1; salience 850; M2b

Owner/subject=region. Predicate forcing>=1000000000 AND pop>0. Insert
shock(500,100); no immediate population/infra debit. Reset latch when false.
Trigger crossed forcing against 1000000000. Forcing is not reset: a sustained
high stock yields one catastrophe until it falls below threshold and recrosses.

### 25 SPACEFLIGHT — P; threshold; phase 1; salience 850; M2b

Owner/subject=region. Predicate T>=5. Set spaceflight=true. On predicate false,
reset latch and set spaceflight=false in phase 1 framework bookkeeping.
No draw. Launch also checks T, so a stale flag cannot bypass lost transport.
Trigger crossed.var=region.tiers with scalar value T, threshold 5.

### 26 LAUNCH — P; hazard; phase 2; salience 900; M2b

Owner=source region, edgeId=`regionId+"~window"` (permanent identity,
not tick bucket). Windows open when tick modulo 10=0; pause between windows.
Eligible colonizer=true, spaceflight=true, T>=5, pop>4000, pre-state affordable
capacity>=2000, and at least one reachable route of positive destination weight.
Term `window=429496730`. Launch at most once per source region/tick (window
lock, further firings pre-empt). Berths per window `[T5:4000,T6:8000,T7:16000]`
persons, no carryover; berthsUsed resets 0 each P0. Per-person costs
C_I=10 capital, C_F=5 fuel. `capacity=min(F(infra,10),F(fuel,5),berths)`;
at application accepted=min(F(remainingInfra,10),F(remainingFuel,5),
berths-berthsUsed,max(0,remainingPop-2000)). If accepted<2000 pre-empt
no-stock with no debit; otherwise infra-=10*accepted, fuel-=5*accepted,
berthsUsed+=Number(accepted), transfer accepted source.pop→transit account.
The reserve and minimum avoid launching single people as viable colonies.

Reachability reads immutable routes and locally delivered signals/targetFailures (M4a), never other arcs' live occupancy. T5/T6/T7
in-system travel years=20/5/1 respectively. Interstellar requires T7;
speed=10000 microLy/year, max distance=10000000 microLy; travelYears=
C(distanceMicroLy,10000). Only explicit directed graph edges are routes;
no implicit transitive trip. Known habitable destination weight=1000,
habitat-buildable weight=200 (requires launch E>=5,S>=5), barren=0.
Route target is a body, each pair appears once. Unavailable/unsupported
destination data cannot be assumed habitable. Draw evt.launch.destination
weightedPick with item.id=destination body ID, weight as above. Params persons,
travelYears; data.launch copies launch/source/destination IDs, exact pre-state
tiers and culture, arrivalYear=dateYear+travelYears, deliveryTick per D rules.
This launch snapshot survives later source collapse. Actual passengers live
only in transit. Arrival never imports a higher tier into an existing arc.

### 27 VOYAGE_LOST — D; hazard; phase 2; salience 900; M2b

Owner=voyage ID; eligible status transit and transit.pop>0 and this tick is
strictly before deliveryTick. Term `transit` by copied T tier:
T5=21474836, T6=4294967, T7=429496. Other tiers are invalid voyage input.
Use D-addressed advanceHazard; first eligible tick is launchTick+1, so no
retroactive risk in the launch tick. Debit all remaining transit.pop, mark
lost, close hazard. Additional same-tick firings pre-empt target-ended.
No draw beyond hazard; data.outcome=lost. Delivery boundary wins over risk
in the same tick because D0 precedes D1. No natural voyage births/deaths.

### 28 COLONY_FOUNDED — D; scheduled; phase 0; salience 1000; M2b

Owner=destination body ID; intent=m:arrival message ID, date=delivery boundary.
Process due arrivals sorted by event order. On success to empty body allocate
body episode and create arc using defaults above; transfer all transit.pop
to landing region, transit becomes zero, voyage status delivered.
If live same-lineage arc, transfer to its smallest region with K>0, or its
smallest region if all K=0; stage REINFORCEMENT, no new arc, no tier or culture
copy. If any live other-lineage arc, debit all passengers as deaths, status
turned-away, stage REJECTED, reason occupied-by-other-lineage. If no hostable
destination, debit all as deaths, status lost, reason destination-uninhabitable.
These dispositions use this scheduled kind with outcome rejected; they are
not additional VOYAGE_LOST hazard events. If already lost, consume message
without an event. An arc with pop=0 but terminal=false remains occupied until
EXTINCTION commits. Extinct terminal arcs never receive reinforcements.
Arrival eligibility uses destination epoch/lifecycle at delivery, and copied
E/S for habitat construction. A newly created colony gets one arc.colonizer
draw. Params persons,launchYear,arrivalYear,deliveryYear; data source=voyage,
target=created/existing arc (null when rejected). Close hazard on disposition.

### 29 COLONY_LOST — P; threshold; phase 1; salience 850; M2b

Owner/subject=arc. Predicate isColony && 0<totalPop<2000. Set nonviable=true.
If colony totalPop>=2000, phase 1 clears nonviable and resets latch; no recovery
event invented. At zero keep nonviable until EXTINCTION. Extra mortality begins
next tick because phase 1 changes are effects, not pre-state. No immediate
debit or terminal flag. crossed.var=region.pop (arc sum), value=totalPop,
threshold=2000.

### 30 EXTINCTION — P; threshold; phase 1; salience 1000; M2a

Owner/subject=arc. Predicate totalPop=0 && !terminal. Set terminal=true,
biological=extinct, close every local hazard, require the P3 arc-ended
invalidation record for every active chain,
retire all live polities, set every region.polityId=null. No further population
debit. Outcome axes remain separate; no empty-region natural growth follows.
No inbound delivery may revive this episode after commit. D can schedule a
new episode. Event emits the tick **after** mortality reaches zero, retaining
the dated death witness in arc.lastDeath. Natural K=0 loss has no fabricated event cause.
No need to wait for a decade of ghost industrial production: P5a skips all
natural updates for a zero-pop arc pending EXTINCTION except damage expiry.

### 31 LINEAGE_EXTINCTION — D; threshold; phase 5; salience 1000; M2b

Owner/subject=lineage ID. Predicate at D2: lineage.foundedArcs>0, no live arc IDs,
no transit-status voyage with positive passengers (after D2 archive retirement). Latch false→true
only; same-lineage new arrivals cannot occur after this condition. Classify
last actual lineage death witness (maximum application key defined below): EXTINCT_SELF for the three perils kinds or their shared
consequences; EXTINCT_NATURAL otherwise. EXTINCT_STELLAR reserved for M3.
Set lineage.extinctionCause to that event ID or null for natural-only mortality.
Date=tickEnd-1 so every P mortality cause is earlier unless same-year order
filter excludes it; no stock effect. Params livingArcs=0,transitPop=0. The default threshold crossed.var is
`region.pop`, value=0,threshold=0 as a lineage-wide aggregate annotation.
NO_LINEAGE is an origin/domain result, not a LINEAGE_EXTINCTION firing.

## Tick algorithm and causality

### P: phases 0–5

1. **0:** capture the boundary witness before inbox effects for ledger
   startState. On genesis use the empty initialized arc record with zero
   people, followed by SAPIENCE/COLONY_FOUNDED additions. Clear outbox and
   berthsUsed. Remove expired damage. Arrival transfers already resolved by
   D0 are installed first in their D event order. Apply other inbox messages
   in message.id order, then the epoch CLIMATE_SHIFT, if any; recompute K and initial
   era/energy. Messages apply even to zero-pop nonterminal arcs, but only
   ARRIVAL can add people. Terminal arc messages are consumed with no local
   effect. Freeze this complete post-inbox state as **pre-state**. The ledger
   includes a `phase0` witness as an additional M2 field: `{eventIds,state}`;
   state is a digest; naturalDelta is measured from the replayed phase-0 state. This resolves boundary replay.
2. **1:** evaluate latches and threshold intents on pre-state. Reset bookkeeping
   latches whenever false. SPACEFLIGHT false flag and viability recovery are
   queued framework effects committed at 5b before ordered event effects;
   these are deterministic consequences of the same pre-state predicates.
3. **2:** enumerate eligible opportunities in hazardKey order, lazily creating
   ledger entries; call advanceHazard with pre-state terms. Retain paused
   entries; no draw for an ineligible never-created hazard. Produce immutable
   event IDs before drawing magnitudes. The four-firing cap is exactly M1's,
   including saturation only if a fifth threshold fits. Hazard changes are
   bookkeeping committed independently of accepted stock effects.
4. **3:** enumerate active chains by chainId. Only chains present in pre-state
   can advance; nextTick==t must produce the specified step, invalidation or
   timeout. Never skip a past-due step silently: nextTick<t is invalid state.
   Chain steps use tick-start date. There is one event per chain step.
5. **4:** merge reciprocal wars; sort all phase 1–3 intents by M1 orderKey;
   assign categorical locks, annotate pre-emption. Never sort by insertion
   ordinal. Categorical losers remain in the causal log with empty effects.
6. **5a:** compute every region and polity natural update from frozen pre-state,
   in sorted IDs, replacing natural fields. K=0 environmental mortality
   happens here, before migration or launch availability. Save naturalDelta
   for each region; framework deaths update arc.lastDeath only if a negative
   natural population delta actually happened. Apply viability-recovery/spaceflight-reset bookkeeping.
7. **5b:** in event order apply accepted effects, resolving **every** fractional
   loss/transfer against the remaining stock. LAUNCH costs are atomic with
   its passenger debit: either all exact accepted costs/transfer happen or
   none. Recheck only target existence and budgets. Record the one accepted
   transfer amount on both accounts, never recompute it at the receiver.
   Install new chains/children only after their creating event is accepted.
   Closing a chain does not emit an extra event beyond its specified step.
8. **5c:** recompute K, era, energy, ownership, capitals, retirement, ceiling
   facts, outcome axes and perils onset. No new discovery or D read. Clamp
   tiers to permanent caps. Zero-pop regions have energy 0 but retain tiers.
9. **5d:** compare pre/committed era once per region and emit ENERGY_TRANSITION.
   No recursive derived events. Final sortEvents assigns dense ordinals.
10. **5e:** provenance update, ledger and checkpoint. Increment arc.tick to t+1.
    tickLedger retains M1 fields and adds phase0 and archived as above; naturalDelta rows
    are fixed tuples `[regionId,pop,infra,fuel,forcing,renewable,immunityTicks,
    culture,lowTicks]` (signed deltas). Polity natural updates are sorted tuples
    `[polityId,eliteShare,asabiya,legitimacy,stress,warWeariness]` in polityNatural.
    Inspection APIs may expand these tuples into the original named records. These are M2 ledger extensions, not event
    effects. endState is the structural digest of the complete LIVE authoritative
    arc state, including outbound records and excluding the archive. Store complete domain
    checkpoints at every globally aligned chapter boundary and genesis.

For phase-0 ARRIVAL, the D event is the authoritative transfer/founding event;
P's phase0.eventIds reference that same ID. Do not mint a second P event.
SHARED and PERILS messages are **not new catalogue kinds**: phase0 carries
message IDs and resolved effects in an extra `inboxEffects` array of
`{messageId,causeEventId,effects,sets}`. These are part of the phase0 witness
and replay contract; perils uses a set to arc.perils, SHARED uses the owning
event fractions. No schema pretending PERILS_EXIT is one of the 31 kinds.
To avoid changing a just-hashed arc endState, D consumption of outbox replaces
only its next-tick input copy; the ledger remains immutable.

Provenance follows the Mechanical provenance contract below, including its
explicit dependency map, intermediate touched sets and final score merging.

Causal edges read **pre-state** provenance only (plus explicit earlier chain,
delivery and derived-event links). For each hazard term at least 25% of total
(4*term>=h), collect the slots of every numerical driver of that term. Threshold
edges collect every predicate driver; gate edges collect required-tier/cap/
resource slots. Union duplicate `(eventId,edge)` and sum scores; discard any
cause whose orderKey is not strictly earlier. For each edge class separately,
allocate 1000 weight units in proportion to scores using F, then give the
remaining units to IDs in ascending order, one each. Chain opener and explicit
message cause score=1. No causes means []. Natural environmental baselines
have no invented EXOGENOUS event; a CLIMATE_SHIFT has only existing earlier
environmental message causes, normally []. Derived transitions use equal
score=1 for every actual enabling tier event earlier in order. Labels must say
“model attribution”, not counterfactual explanation.

### D: lockstep compilation

1. **D0, start boundary t:** process due messages/arrivals and origin schedules,
   sorted by `(deliveryTick, destination/target ID, message/origin ID)`; arrivals
   at a body use their COLONY_FOUNDED event orderKey (same-year/phase/owner/rank,
   so intentKey breaks ties). Reserve body occupancy/episodes sequentially.
   Origin schedules sort after arrivals at the same body (colonists preempt
   independent sapience). Deliver perils/shared inboxes to extant nonterminal
   arcs. Origin creation and arrivals may start P entities at this boundary.
2. **D1:** freeze voyage/transit state after D0. Advance eligible in-transit
   voyage hazards in hazardKey order, collect events and resolve them in event
   order. Voyages launched during this tick do not yet exist in this snapshot.
   Terminal source arcs are never consulted. This can run before P stepping.
3. Step each nonterminal P arc for t, in any order. Canonical collection is
   sorted arc ID. Keep all outputs isolated until every step is complete.
4. **D2, barrier:** install the P results jointly. Register launches in event
   order with their already-debited transit accounts; there is no second
   population debit. Add sorted lineage voyage/arc IDs. Queue arrival messages
   at `deliveryTick=max(C(arrivalYear,10),F(launchYear,10)+1)`.
   This is the runner correction of spec 8.4 (A1): year2+1 arrives physically
   at3, delivers at tick1/year10; arrival19 cannot deliver before tick2/year20.
   Queue shared consequences for t+1 to all other nonterminal arcs in this
   barrier snapshot, including colonies that arrived at t, excluding voyages.
5. Compute each lineage's safety predicate from the barrier snapshot:
   at least three distinct bodies with self-sustaining arcs OR any living
   arc with an occupied region O>=5. Self-sustaining means nonterminal,
   !nonviable, totalPop>=2000, totalK>=totalPop, totalInfra>=10*totalPop, and
   every occupied region S>=2 (habitat bodies additionally E>=5,S>=5).
   Compare to lineage.perilsSafe, initially false. On a change queue EXIT or
   REENTER to every nonterminal arc at t+1, then store the new predicate.
   A newly arriving arc while safe receives EXIT at t+1 even without a
   predicate transition. EXIT sets perils=exited; REENTER sets active if its
   pre-state frontier>=3 or previous perils!=none, else none.
6. Derive outcomeClass using priority: terminal LINEAGE_EXTINCTION; else
   EXISTENTIAL_CAP if any occupied region of a nonterminal arc has caps below
   maxima; else COLLAPSED_RECOVERING if any such region has active collapse; else EXTANT_MULTI_SYSTEM if living arcs span >=2 systems;
   else EXTANT_MULTI_BODY if >=2 bodies; else REGRESSED_STABLE if any occupied
   region of a nonterminal colony arc is below any component of that arc's
   immutable arc.foundingTiers; else
   EXTANT_PLANETARY. Transit-only surviving lineages use EXTANT_PLANETARY
   (A10); extinction never fires while passengers survive. Evaluate the D
   extinction latch and emit kind 31 if eligible after archive retirement. At an empty origin outcome
   query return NO_LINEAGE, without allocating an artificial lineage record.
7. Emit D tick record `{domainId,tick,startState,endState,eventIds,transfers,archived}`;
   transfers are the existing accepted launch/arrival records sorted by event
   order, with each transfer included once. Store D state with sorted message
   queue and increment domain.tick. Retain D0 events in D log only; P references
   do not duplicate Merkle event leaves.

All delivery years and arithmetic are checked for safe Number representation;
out-of-horizon scheduled messages remain in state, never dropped. Pending
voyages prevent extinction even if their delivery lies beyond the horizon.
Each query compiles the **entire declared domain** from its genesis or last
checkpoint; optional cell/narrative queries cannot change this.

Digest composition: manifest pins all tables, fixture bytes and override
records; recipeDigest=sha256Hex(canonicalBytes({seed,manifest,fromTick,untilTick})).
P chapter leaves exactly `{arcId,chapter,ledgers,events}` with only P-owned
events in events; chapter is absolute floorDiv(tick,640) as canonical decimal
string. D leaves `{domainId,chapter,ledgers,events}`. Ledgers sorted numeric
tick; events sortEvents. Arc roots use M1 merkleRoot on chapter canonical bytes
sorted by numeric chapter. Domain root uses M1 merkleRoot over canonical bytes
of `{id,root}` entries, one per arc plus `{id:"D:"+domainId,root:dRoot}`,
sorted code-unit id. Empty roots use M1's empty tree; odd leaves promote.
No materialisation record or cache witness enters these roots. Prefix roots
use the same construction truncated to complete ticks, not whole chapters.

## Closed execution contracts (M2.0 review)

### Live state and archive — runner D7

A LIVE arc stores all fixed regions, live polities, open (including paused)
hazards, active chains, current provenance/latches and pending messages. At
P5e move each ended polity, closed hazard and terminal chain exactly once into
that tick's `archived` array. An archive entry is `{scope,kind,id,record}`,
where scope is arc.id or `D:`+domain.id, kind is polity/hazard/chain/arc/voyage/
transit, and id is respectively polity.id/(hazard.key+":"+episode)/chain.chainId/arc.id/
voyage.id/transit.id. Sort by `(scope,kind,id)`; record is the complete final
closed typed record, not a digest. Remove it from the live collection. At that same retirement, discard provenance
slots and latches whose target/subject is the retired polity, chain or hazard
(including tech/pair subjects whose identity requires it); no score/latch for
an ended owner may accumulate in LIVE state. Archive entries retain the final
entity record; discarded bookkeeping is already witnessed by the preceding
ledger and is not copied into that record. Region slots stay bounded by the
fixed partition. A
polity retirement also closes every hazard whose owner/participants include
it; the framework uses the structured HazardId and typed chain refs, never
substring matching. Region and edge hazards pause while empty. Acquisition hazards additionally
close when their target tier is attained. Archive the final entry and retain only
`{key,episode:closed.episode+1}` in sorted arc.hazardEpisodes. Reacquisition after
a loss opens that next episode at H=0; no previously used RNG address returns.
Other region/edge hazards close only on arc termination. Extinction closes the remaining local entries.

D2 archives terminal arcs and disposed voyages/zero transit accounts; before
removal it merges their death witnesses into lineage.lastDeath and removes
their IDs from lineage.arcs/voyages. These lists mean **live membership**, not
history. lineage.foundedArcs counts all created arcs, incremented once at D0;
LINEAGE_EXTINCTION tests foundedArcs>0, no live arcs, and no positive live
transit. Disposed voyage hazards are archived separately with D scope, then
voyage.hazard becomes null in its final archive record. Full historical
membership is recovered from the archive, never scanned by a tick recipe.
Terminal arcs cannot retain live chains, polities or open hazards. Empty
lineages remain small summary records; there are at most four origins.

Both P and D ledgers contain `archived` for **that tick only**. startState is
the structural digest of LIVE start state; phase0.state and endState are
structural digests too. Complete states are reconstructed by checkpoint replay.
In standalone M2a only, D tick witnesses are `{domainId,tick,arcState,archived}`;
arcState is the P end digest. D has no coupling or independent events yet. At genesis and each chapter boundary a checkpoint is exactly
`{tick:BigInt,live:DomainState,archiveRecords:ArchiveEntry[]}`. archiveRecords
is the concatenation of archive batches in numeric tick order, then scope/
kind/id order within each tick; records occur once and are immutable. The
checkpoint is a replay witness, excluded from Merkle leaf bytes (the same
records already appear once in their owning ledgers). P retirements appear
only in P archived arrays; D does not copy those batches into its ledger.
Checkpoint reconstruction collects both streams in that total order. No
archive digest or growing archive list is inserted into a tick ledger.
Per-tick size is bounded by start/end live size plus that tick's retirements,
not by history length. Checkpoints may grow with history; do not reserialize
them on ordinary ticks. Ended-polity dates are never overwritten.

### Death witnesses — must-fix 7

“Last death” follows a deterministic **application** order, not the originating
event's historical date/order. The witness comparison key is
`(tick,stage,ownerId,sequence)` with numeric tick/stage/sequence and code-unit
owner. Stages: D0 arrivals=0, P0 shared=1, D1 transit hazards=2, P5a natural=3,
P5b event effects=4. ownerId is the receiving arc for P, destination body for
D0, voyage ID for D1. Within each owner/stage, sequence is the zero-based
ordinal of the population-writing operation, including non-death transfers:
D0 arrival event order, P0 message.id then region ID, D1 event order, P5a region
ID, P5b event order then recipe effect order. Count unchanged/zero operations
too; a transfer counts once. Only a **positive actual death amount** updates a
witness. Natural deaths mean negative naturalDelta; migration, launch and
arrival credits/debits never create death witnesses. Arrival rejection and
voyage loss are deaths. Natural witnesses use eventId=kind=null and
 dateYear=tickEnd-1; shared witnesses use source event ID/kind and delivery
boundary year; other event deaths use that event's dateYear. The key, not
this descriptive dateYear, orders witnesses. Each arc/voyage retains the max
witness, and D2 merges maxima into lineage.lastDeath before archive removal.

LINEAGE_EXTINCTION uses lineage.lastDeath: kind in NUCLEAR_WAR,
ENGINEERED_PANDEMIC,RUNAWAY_TECH means EXTINCT_SELF; all other kinds and null
mean EXTINCT_NATURAL. extinctionCause is its eventId, or null for a natural
witness/no deaths. An event-caused early extinction on one body followed by a
later natural death on another therefore classifies NATURAL. Causes still
obey strict M1 order: death classification does not add a backward DAG edge.

### Chain retirement and extinction — must-fix 3

At P3, if a pre-state arc has zero population and its extinction threshold is
eligible, every active chain emits its next step **now**, at tick start, with
stage INVALIDATED, status invalidate, reason arc-ended, no magnitude draw or
stock effect. This takes precedence over all ordinary chain branches and
uses WAR (even when step=3 would otherwise be CONQUEST) or PLAGUE. It is the
one accepted invalidation record for that chain, with the next attempted
step=old.step+1. At P5b EXTINCTION marks terminal and retires polities (endedYear=its event.dateYear
only if null); the
already scheduled invalidation steps still commit even on a terminal arc.
EXTINCTION does not silently mutate chains or emit duplicate invalidations.
Chains cannot be newly opened on this zero-pop pre-state. A positive-pop arc
that loses everyone during P5b invalidates chains on the following tick.
For ordinary active WAR/SPREAD steps set step=old.step+1 and nextTick=t+1;
complete/fail/invalidate/timeout always use the terminal normalization above.
PLAGUE deadline/burnout/invalidation preserves visited and clears frontier;
a SPREAD that finds no victims changes neither visited nor stocks. The
CONQUEST lock-loss record carries the final fail state in event.chain despite
empty effects; chain lifecycle bookkeeping is not a hidden stock effect.

### Complete serialization examples — must-fix 4

Params are closed and variant-specific. Numeric tuple changes use set effects
with amount="0", never a scalar tuple delta; each distinct changed `(target,field)`
has exactly one final set value. The complete parameter key sets are:

| Kind/variant | Exact params keys (all values decimal strings) |
|---|---|
| SAPIENCE | regionCount |
| MIGRATION | fraction |
| AGRICULTURE, DISCOVERY, DIFFUSION | domainIndex,targetTier |
| FAMINE | damage,lossPermille |
| PLAGUE OUTBREAK/SPREAD with victims; WAR CAMPAIGN | lossPermille |
| PLAGUE BURNOUT/INVALIDATED; WAR DECLARED/INVALIDATED | none |
| NATURAL_CATASTROPHE | damageTicks,extinctionPpm,lossPermille |
| TECH_LOSS | domainIndex,drop |
| ENERGY_TRANSITION | fromEra,toEra |
| CONQUEST | winPpm,won (p and chance result, won=0/1) |
| COLLAPSE | drop,splitCount |
| REVOLUTION | regimeIndex (index in the six-element excluded-current list) |
| SCHISM | coordinate (draw index 0..2) |
| NUCLEAR_WAR, ENGINEERED_PANDEMIC, RUNAWAY_TECH | damagePermille,damageTicks,infraLossPermille,lossPermille,outcomeIndex,shared,tierDrop |
| SPACEFLIGHT | domainIndex=3 |
| LAUNCH | persons,travelYears |
| COLONY_FOUNDED (all dispositions) | arrivalYear,deliveryYear,launchYear,persons |
| LINEAGE_EXTINCTION | livingArcs=0,transitPop=0 |
| CLIMATE_SHIFT, POLITY_FOUNDING, HEGEMONY, FRAGMENTATION, RECOVERY, CLIMATE_CATASTROPHE, VOYAGE_LOST, COLONY_LOST, EXTINCTION | none |

Pre-empted LAUNCH keeps persons equal to its pre-state proposed affordability
minimum with the 2000-person reserve (possibly >=2000); accepted LAUNCH replaces
it with accepted passengers. CONQUEST that loses its lock keeps the sampled
winPpm/won. Invalidated WAR at step3 is WAR, never a CONQUEST without a draw.
Only refs/data carry victim lists; there are no variable-name numeric params.



Initialization first reserves an empty arc skeleton: all identities, immutable
founding metadata, default tuples/flags, environment fields and zero stocks
are INIT writes, witnessed by ledger.startState/phase0.state. A founding event
then records every nonzero stock addition and every departure from that
skeleton (colony tiers/culture use atomic sets). Initialization helpers declare
the complete founding writes in the table even though unchanged defaults emit
no effect. Creation of a polity similarly records its full initialized record
in an arc.polities set and region.polityId set; do not duplicate its member
writes as separate effects. Containers used for record creation are atomic
set payloads; their declared member writes are still required permissions.
Chain lifecycle changes live in event.chain and the live/archive chain record,
not stock effects; data.stage pins the branch. No effect is manufactured for
provenance, latches, hazards, death witnesses or derived framework fields.

The following four **complete canonical event records** are serialization
vectors [scenario], not claims that any seed generated them. Each displayed
single line is canonical JSON (in text fences to preserve the sole catalogue
json block). All omitted data members below would be an error; null/default
members are included. Event ordinals are zero in these isolated examples.
Amounts are decimal strings; tuple set values use JSON Numbers. The first
founding vector has exactly one positive founding region selected, other
regions at their empty skeleton defaults. The transfer vector is a LAUNCH
with a valid T6 snapshot, 2000 passengers and costs20000/10000, showing the
cross-root toField. The chain vector is a WAR step invalidation with empty
frontier/visited, nextTick=null in the archived record. The pre-emption vector
is a threshold TECH_LOSS intent blocked by no-people after natural mortality.

Founding stock effect order is region ID, then pop, infra, then tuple/culture
sets by field; LAUNCH order is infra, fuel, berthsUsed, passenger transfer.
On invalidation event.reason equals the terminal chain reason; other accepted
chain terminal reasons likewise use event.reason. For all remaining accepted
events reason=null except explicitly rejected arrival dispositions.

Founding:

```text
{"causes":[],"chain":null,"data":{"launch":null,"outcome":null,"sets":[],"source":null,"stage":null,"survivor":null,"target":null},"dateYear":0,"effects":[{"amount":"1000","field":"region.pop","op":"add","target":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00"},{"amount":"1000","field":"region.infra","op":"add","target":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00"}],"forced":false,"id":"arc:stub:s00:b0:lin:stub:s00:b0:0|SAPIENCE|0|m:origin:530000000b737475623a7330303a6230","intentKey":"m:origin:530000000b737475623a7330303a6230","kind":"SAPIENCE","kindRank":1,"level":"P","modelVersion":"civ-m2-1","ordinal":0,"ownerId":"arc:stub:s00:b0:lin:stub:s00:b0:0","params":{"regionCount":"1"},"phase":0,"precision":"decade","reason":null,"refs":[{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0","role":"arc"}],"resolution":"accepted","salience":1000,"tick":"0","trigger":{"mode":"scheduled"}}
```

Launch transfer:

```text
{"causes":[],"chain":null,"data":{"launch":{"arrivalYear":105,"culture":[500,500,500],"cultureId":"arc:stub:s00:b0:lin:stub:s00:b0:0#cul:founder","deliveryTick":"11","destination":"stub:s00:b1","id":"arc:stub:s00:b0:lin:stub:s00:b0:0#voy:10:r00","launchEventId":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00|LAUNCH|10|h:53000000256172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a302372303053000000064c41554e4348490000000130490000000130490000000131530000002c6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a30237230307e77696e646f77:0","launchYear":100,"lineageId":"lin:stub:s00:b0","sourceArc":"arc:stub:s00:b0:lin:stub:s00:b0:0","sourceRegion":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00","status":"transit","tiers":[5,5,4,6,4,3,4]},"outcome":null,"sets":[],"source":null,"stage":null,"survivor":null,"target":null},"dateYear":100,"effects":[{"amount":"-20000","field":"region.infra","op":"add","target":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00"},{"amount":"-10000","field":"region.fuel","op":"add","target":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00"},{"amount":"2000","field":"region.berthsUsed","op":"add","target":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00"},{"amount":"2000","field":"region.pop","op":"transfer","target":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00","to":"transit:arc:stub:s00:b0:lin:stub:s00:b0:0#voy:10:r00","toField":"transit.pop"}],"forced":false,"id":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00|LAUNCH|10|h:53000000256172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a302372303053000000064c41554e4348490000000130490000000130490000000131530000002c6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a30237230307e77696e646f77:0","intentKey":"h:53000000256172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a302372303053000000064c41554e4348490000000130490000000130490000000131530000002c6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a30237230307e77696e646f77:0","kind":"LAUNCH","kindRank":26,"level":"P","modelVersion":"civ-m2-1","ordinal":0,"ownerId":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00","params":{"persons":"2000","travelYears":"5"},"phase":2,"precision":"year","reason":null,"refs":[{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0","role":"arc"}],"resolution":"accepted","salience":900,"tick":"10","trigger":{"H_start_q32":"0","distance_q32":"1","episode":"0","h_q32":"429496730","hazardId":"53000000256172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a302372303053000000064c41554e4348490000000130490000000130490000000131530000002c6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a30237230307e77696e646f77","mode":"hazard","saturated":false}}
```

Chain invalidation:

```text
{"causes":[{"edge":"CHAIN","eventId":"arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0>arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0|WAR|1|h:53000000616172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230303a303e6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230313a305300000003574152490000000130490000000130490000000130:0","weightPermille":1000}],"chain":{"chainId":"arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0>arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0|WAR|1|h:53000000616172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230303a303e6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230313a305300000003574152490000000130490000000130490000000130:0","deadlineTick":"4","status":"invalidate","step":1},"data":{"launch":null,"outcome":null,"sets":[],"source":null,"stage":"INVALIDATED","survivor":null,"target":null},"dateYear":20,"effects":[],"forced":false,"id":"arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0>arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0|WAR|2|c:arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0>arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0|WAR|1|h:53000000616172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230303a303e6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230313a305300000003574152490000000130490000000130490000000130:0:1","intentKey":"c:arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0>arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0|WAR|1|h:53000000616172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230303a303e6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230313a305300000003574152490000000130490000000130490000000130:0:1","kind":"WAR","kindRank":13,"level":"P","modelVersion":"civ-m2-1","ordinal":0,"ownerId":"arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0>arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0","params":{},"phase":3,"precision":"decade","reason":"participant-ended","refs":[{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0","role":"arc"},{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0","role":"attacker"},{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r00:0>arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0|WAR|1|h:53000000616172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230303a303e6172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a3023706f6c3a303a31323a7230313a305300000003574152490000000130490000000130490000000130:0","role":"chain"},{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0#pol:0:12:r01:0","role":"defender"},{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0#r01","role":"target"}],"resolution":"accepted","salience":700,"tick":"2","trigger":{"mode":"chain"}}
```

Pre-emption:

```text
{"causes":[],"chain":null,"data":{"launch":null,"outcome":null,"sets":[],"source":null,"stage":null,"survivor":null,"target":null},"dateYear":30,"effects":[],"forced":false,"id":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00|TECH_LOSS|3|t:53000000366172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a30237230307e746563683a496e666f726d6174696f6e","intentKey":"t:53000000366172633a737475623a7330303a62303a6c696e3a737475623a7330303a62303a30237230307e746563683a496e666f726d6174696f6e","kind":"TECH_LOSS","kindRank":10,"level":"P","modelVersion":"civ-m2-1","ordinal":0,"ownerId":"arc:stub:s00:b0:lin:stub:s00:b0:0#r00","params":{"domainIndex":"4","drop":"1"},"phase":1,"precision":"decade","reason":"no-people","refs":[{"entityId":"arc:stub:s00:b0:lin:stub:s00:b0:0","role":"arc"}],"resolution":"pre-empted","salience":500,"tick":"3","trigger":{"crossed":{"threshold":"2","value":"2","var":"region.lowTicks"},"mode":"threshold"}}
```

### Exact manifest construction — must-fix 1

No caller chooses a representation for compiled constants. Normalize **this
entire document** from UTF-8 by removing one leading BOM if present, replacing
CRLF and CR with LF, removing trailing LF characters then appending exactly
one LF. `contractDigest=sha256Hex(UTF8(normalizedDocument))`. This commits every
recipe constant and rule, including prose; there is no self-reference because
this document contains the construction, not the resulting digest. The
machine-readable table is parsed independently, without coercing its JSON
Numbers to strings, and `tableDigest=sha256Hex(canonicalBytes(parsedTable))`.
A compiler must use the constants in this committed contract; its incidental
object layout is **never** manifest input. No source-code digest is used.

For a run, B is exactly `{domain,systems,forced}`: domain is the fully expanded
DomainStub with systems references retained in their declared sorted form;
systems is the resolved SystemStub array sorted id (substitutions already
applied, all bodies and routes expanded); forced is null for an ordinary run
or the complete selected ForcedFixture with fully expanded InitialOverride
and Override records, including seed/expect/ticks. Canonical input values
remain JSON types (NatString/IntString stay strings). Relative fixture paths
use `/`, are relative to repository root, and cannot contain `.` or `..` path
segments. File order, formatting and unresolved file copies are not hashed.
Standalone planet P runs are wrapped in one SystemStub with id=planet.system,
bodies=[planet], routes=[], and one DomainStub id=`standalone:`+system,
systems=[{id:system,fixture:planetFixturePath,bodyPrefix:body prefix before its
last colon}], routes=[], origins=[body], fromYear=0,untilYear=400000. A forced
initial atTick changes the run's fromTick only, not those domain bounds.
Ordinary M2a post-sapience genesis is a declared origin.deliveryYear override
of "0" in a ForcedFixture; never a silent initialization mode.

Let O be [] when forced=null; otherwise O is forced.overrides sorted by key,
with unique keys and raw canonical JSON values. `initial` is represented only
by forced.initial: if supplied as an override key, remove that key after
copying its value into forced.initial, rejecting disagreement. Apply each
remaining override once; no materialized duplicate of effective constants
enters the manifest. Parameters is exactly
`{version:"civ-transition-table-1",milestone,overrides:O}`.

The manifest is exactly the following record (metavariables have only the
values/constructions just defined; serialization is M1 canonicalBytes):

```text
{
  manifestVersion: "civ-manifest-1", modelVersion: "civ-m2-1",
  rngVersion: "civ-rng-1", samplerVersion: "civ-samplers-1",
  arithmeticVersion: "civ-fixed-1", catalogueVersion: "civ-catalogue-1",
  partitionVersion: "civ-stub-regions-1",
  tickYears: 10, chapterTicks: 640, envEpochYears: 1000,
  atlasVersions: {}, inputBundleDigest: SHA256(canonicalBytes(B)),
  scenarioPriors: {
    parameters: Parameters, contractDigest: contractDigest, tableDigest: tableDigest,
    originRateLog2: [12,22], learningLog2: [8,12], innovationLog2: [17,23],
    nuclearLog2: [8,24], pandemicLog2: [12,28], runawayLog2: [14,29],
    sharedLog2: [0,19], colonizerLog2: [15,19]
  }
}
```

milestone is exactly M2a or M2b. Enabled kinds are those whose milestone is
M2a, plus all M2b kinds when selected; no redundant enabled-kind list enters
the bytes. manifestDigest=SHA256(canonicalBytes(manifest)). Sampled prior
values go into lineage state, never retroactively into the manifest. seed is
an exact well-formed string and must equal forced.seed when forced is nonnull. fromTick/untilTick in recipeDigest are BigInts,
validated inside domain bounds; they are independent of horizonYear string
formatting. Defaults are F(domain.fromYear,10),F(domain.untilYear,10); a forced
run uses initial.atTick (or 0n if null) and fromTick+BigInt(forced.ticks).
No manifest timestamp, implementation path or optional keys are permitted.

### Fixture expansion and founding closure [scenario initialization] — must-fix 2

Every InitialOverride voyage supplies sourceLocalRegionId (r00 in both listed
voyage fixtures). sourceBody must name the initialized source arc's body;
sourceArc is that arc's reserved episode-0 ID, sourceRegion is its region ID,
lineageId is that arc's lineage, cultureId/culture are copied from that source
region after RegionOverride application. Reject missing source/region rather
than guess. Fixture tiers are its explicit launch snapshot; they need not
match the source's later initialized tiers. launchEventId uses the fixture
witness form above, status=transit, lastDeath=null. Validate
arrivalYear>launchYear and deliveryTick=max(C(arrivalYear,10),F(launchYear,10)+1).
Initialize hazard with the exact two-member HazardId, episode=0n,H=0n,
E=expQ32 at level D, closed=false; account id=`transit:`+voyage.id and pop is
the supplied stock. Add live lineage/directory membership once; queue ARRIVAL
with causeEventId=launchEventId, targetId=destination and payload.voyageId=id.
Fixture queue message ID is `domainId+"#fixture-arrival:"+label`; it cannot
collide with barrier message IDs. The fixture witness is genesis metadata,
not a fabricated catalogue event or causal edge. All omitted launch payload
members use the closed defaults. Fixture arcs set foundingTiers to the tiers
of their smallest occupied local region if isColony, otherwise all zero
(empty colony: all zero). Initial lineage.foundedArcs=1 and lastDeath=null.

LAUNCH owns the transfer into a newly staged transit account during P5b;
transit.id/pop are explicit kind writes. The staged account travels in the
resolved outbound transfer witness, separate from data.launch's metadata.
D2 registers exactly that account and launch snapshot, initializing the voyage
hazard once; it does not recompute passengers or debit them again. account
identity is derived from launch owner/tick, so no P read of live D is needed.
`Launch` is exactly the voyage record excluding hazard and lastDeath (which
start with their standard defaults); it never contains a passenger stock.

### Mechanical provenance [scenario scoring] — must-fix 9

Primitive scoring uses each accepted operation's actual before/after values
at application; sum absolute deltas, not the absolute net delta. Numeric tuple
scores sum component magnitudes; damage scores sum absolute changes of total
damage permille. Other records/IDs/enums/Booleans score 1 per changed operation.
A transfer contributes its accepted amount to both explicit field slots.
A source event delivered repeatedly into a slot accumulates into one eventId
entry, even if it already has a decayed entry. Natural/framework-only changes
create no primitive score. Pre-empted events score zero, except their genuine
chain retirement is lifecycle bookkeeping and is unscored in either case.

For derived fields take B=the pre-P0 boundary snapshot of the field and A=the
final P5c value. Build a touched set per event from intermediate primitive
operations whose before/after differ, including phase0 inbox sources. Even
if gain and loss cancel, both remain touched. For each derived target below,
union event IDs touching its transitive dependency slots. The gross score is
distance(A,B): scalar absolute difference, tuple L1, categorical/record canonical
inequality 0/1. Subtract the sum of primitive scores already credited directly
to that same target field this tick, then clamp at zero. This avoids counting
a direct CLIMATE_SHIFT Kbase set again as a derived change. If this residual
score=0 or the contributor set is empty, add nothing. Otherwise divide it by
contributor count with F, remainder one each to first event IDs; discard zero
shares. A gain then loss leaving endpoint era/K unchanged scores zero there,
although both primitive tier touches retain their scores. Natural changes
alone have no contributor, hence no score; when natural and event inputs both
change a derived endpoint this heuristic attributes the residual endpoint
difference to the event contributors. It is expressly not a counterfactual.
The dependency map is **exhaustive**:

| Derived slot | Primitive slots (same region unless stated) |
|---|---|
| region.Kbase | region.tiers |
| region.K | region.Kbase, region.tiers, region.damage |
| region.era | region.tiers |
| region.energy | region.pop, region.tiers |
| region.ceilings | region.tiers, region.caps, region.resources |
| polity.regions, polity.capital, polity.endedYear | all arc region.polityId; explicit retirement of this polity |
| polity.hegemony (clearing) | all arc region.pop, region.polityId; this polity.hegemony |
| arc.outcome | region.pop, region.tiers, region.polityId, polity.endedYear; split occurrence this tick |
| arc.perils (onset only) | all arc region.tiers, region.pop |

Permanent-cap tier clamps count as a derived region.tiers change with inputs
region.tiers and region.caps, preceding K/era derivation. Expand this dependency
into downstream rows. Immutable input.environment supplies no event provenance;
CLIMATE_SHIFT's actual installed Kbase/resources changes do. For ownership
lists the score is categorical 0/1, not territory count. No unlisted framework
field, latch, hazard, chain metadata, death witness or archive gets provenance.
After accumulating all primitive/derived additions, merge by eventId with old
F(score,2), drop every zero, sort score descending/eventId ascending, keep three.
ENERGY_TRANSITION contributors use this same touched dependency set for tiers
and the strict earlier-order filter; its date is their maximum event date (or
tick start), never a transient derived transition. Repeated SHARED deliveries
merge under original source IDs and use original event order for DAG filtering.

## Expected event mix [scenario] — runner D5/D6

Back-of-envelope checks (rates are Q32 per decade, before chain spread): WAR
ratio1000/stress300/weariness0 now gives 128849019=0.03Q, about one declaration
per directed pair per 330 years while exposed. COLLAPSE now acts per region: stress500 contributes
1073741 (about 40000 years); stress300 contributes 386547 (about 111111 years),
plus local overhead. A tier sum of 28 adds 171796 (about 250000 years). PLAGUE S2,V0 with pressure1000,
connectivity2000,susceptible1000 has product 600000000000000 and rate42949672,
about 0.01Q (1000 years); S0 urban10 gives1431655, about0.000333Q (30000 years).
Medicine reduces later urban outbreaks by its stated factor. Origin rates
4096..4194304 yield mean step waits Q/rate=1048576..1024 years; three ordered
steps allow both origins within400000 years and failures of the2000000-year
window. These are runner-authored calibration changes, not measured ensembles.

For a temperate **20000-year post-sapience** M2a run, report counts of every
kind including zeros. Expect one SAPIENCE, MIGRATION as forager regions fill,
occasional PLAGUE openers/steps, and seed-dependent AGRICULTURE, DISCOVERY,
DIFFUSION and ENERGY_TRANSITION. Faster-progressing seeds should expose
POLITY_FOUNDING, WAR/CAMPAIGN/CONQUEST, COLLAPSE, TECH_LOSS, FAMINE and RECOVERY;
slow innovation seeds can remain foragers throughout. EXTINCTION is possible,
not expected in every seed. M2b adds occasional natural/environmental shocks,
HEGEMONY and political events when eligible; industrial/perils and space
kinds may remain zero in this horizon. Constant temperate epoch inputs produce
no CLIMATE_SHIFT before lifecycle closure. Do not assert this qualitative mix
as truth or tune away inconvenient seeds: print exposures, opener/step counts,
pre-emptions and zero-count kinds, then compare with these expectations.
The M2a fix round below revises collapse scope/rate and Subsistence calibration.

## Fixture JSON schema and exact fixture recipes [scenario]

The type tables below are the normative closed JSON schema, including semantic
constraints that JSON Schema alone cannot express. A structural JSON Schema
for PlanetStub/SystemStub/DomainStub follows the tables.
Every listed key is required unless marked optional; additional keys are
rejected. JSON has no BigInt: `NatString` is `^(0|[1-9][0-9]*)$`, parsed to
BigInt; `IntString` permits an optional minus except `-0`. `Int` means a safe
JSON integer, not an integer-looking string. All IDs are well-formed Unicode
with the body-ID grammar above; local region IDs are `r00`..`r31`. JSON
input arrays must already have the sorting and uniqueness specified here;
reject duplicates and asymmetrical region adjacency. The normalized fixture
bundle is exactly B in the manifest construction, with systems in code-unit ID
order; inputBundleDigest commits that record. File formatting is immaterial;
canonical parsed fixture data is hashed, not fixture whitespace. The exact keys below also define the Environment
compound type from the state register. Parameters is a closed record
`{version:"civ-transition-table-1",milestone:"M2a"|"M2b",overrides:Override[]}`;
every constant here is compiled under that version. Changing a constant
requires a new version or declared override.

| Type | Required keys and validation |
|---|---|
| PlanetStub | schemaVersion:`civ-planet-stub-1`; body:String; system:String; profile:temperate/arid/cold/anoxic/habitat/barren; lifecycle:AvailabilityLifecycle; partition:AvailabilityPartition; epochs:AvailabilityEpochs; hosting:habitable/habitat-buildable/barren |
| Lifecycle | habitableFromYear:Int; habitableUntilYear:Int greater than from; complexLifeFromYear:IntOrNull; stellarDoomYear:IntOrNull; endpoints multiples of 10 |
| Partition | partitionVersion:`civ-stub-regions-1`; regions:RegionStub[8..32] sorted id |
| RegionStub | id:String; weight:NatString; adjacency:EdgeStub[] sorted to; cells:CellStub[16] sorted id |
| EdgeStub | to:local region ID different from self; contactPermille:Int 0..1000; barrier:Boolean; reverse edge required with identical values |
| CellStub | id:`c00`..`c15`; weight:NatString |
| Epochs | rows:EpochStub[] sorted `(fromEpoch,regionId)` numerically then code-unit; non-overlapping and covering the full model interval for every region |
| EpochStub | fromEpoch:IntString; untilEpoch:IntString greater; regionId:String; Kbase:NatString; landPpm:Int 0..1000000; tempClass:Int 0..4; aridityClass:Int 0..4; airClass:oxic/anoxic/none; gravityMicroMS2:Int 1..100000000; resources:Int[4] each 0..1000; domesticablesPpm:Int 0..1000000 |
| SystemStub | schemaVersion:`civ-system-stub-1`; id:String; bodies:PlanetStub[1..8] sorted body; routes:RouteStub[] sorted `(from,to)` |
| DomainStub | schemaVersion:`civ-domain-stub-1`; id:String; systems:SystemRef[1..32] sorted id; routes:RouteStub[] sorted `(from,to)`; origins:String[0..4] sorted unique body IDs; fromYear:Int; untilYear:Int greater, both multiples of 10 |
| SystemRef | id:String; fixture:String relative planet/system fixture path; bodyPrefix:String (canonical body IDs must be unique after substitution) |
| RouteStub | from:body ID; to:body ID; kind:in-system/interstellar; distanceMicroLy:NatString (0 for in-system, positive for interstellar); travelYearsByTransportTier:IntOrNull[8] indexed T0..T7; destinationHosting:habitable/habitat-buildable/barren |
| ForcedFixture | schemaVersion:`civ-forced-stub-1`; id:String; base:String; seed:String; ticks:Int 1..40000; initial:InitialOverrideOrNull; overrides:Override[] sorted key; expect:catalogue kind |
| InitialOverride | atTick:IntString; regions:RegionOverride[] sorted localId; polities:PolityOverride[] sorted label; arc:ArcOverride; voyages:VoyageOverride[] sorted label |
| RegionOverride | localId:String; pop:NatString; infra:NatString; fuel:NatString; forcing:NatString; tiers:Int[7]; culture:Int[3]; lowTicks:Int[7]; collapse:CollapseOrNull (BigInts as NatString); damage:damage records (tick as IntString) |
| PolityOverride | label:String; regionIds:String[]; regime:regime enum; eliteShare,asabiya,legitimacy,stress,warWeariness:Int each 0..1000; hegemony:Boolean |
| ArcOverride | isColony:Boolean; colonizer:Boolean; perils:none/active/exited; nonviable:Boolean; caps:Int[7]; chains:chain records with IDs expanded from fixture labels |
| VoyageOverride | label:String; sourceBody:String; sourceLocalRegionId:String; destination:String; pop:NatString; tiers:Int[7]; launchYear:Int; arrivalYear:Int; deliveryTick:IntString |
| Override | key:String from the override registry below; value:canonical integer string or typed replacement input value prescribed by that key |

```jsonschema
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:civ:stub-schema:1",
  "oneOf": [
    {
      "$ref": "#/$defs/PlanetStub"
    },
    {
      "$ref": "#/$defs/SystemStub"
    },
    {
      "$ref": "#/$defs/DomainStub"
    }
  ],
  "$defs": {
    "AvailabilityEpochs": {
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "digest",
            "status",
            "value"
          ],
          "properties": {
            "status": {
              "const": "known"
            },
            "value": {
              "$ref": "#/$defs/Epochs"
            },
            "digest": {
              "type": "string",
              "pattern": "^[a-f0-9]{64}$"
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "reason",
            "status"
          ],
          "properties": {
            "status": {
              "const": "absent"
            },
            "reason": {
              "type": "string",
              "minLength": 1
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "capability",
            "status"
          ],
          "properties": {
            "status": {
              "const": "unsupported"
            },
            "capability": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      ]
    },
    "AvailabilityLifecycle": {
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "digest",
            "status",
            "value"
          ],
          "properties": {
            "status": {
              "const": "known"
            },
            "value": {
              "$ref": "#/$defs/Lifecycle"
            },
            "digest": {
              "type": "string",
              "pattern": "^[a-f0-9]{64}$"
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "reason",
            "status"
          ],
          "properties": {
            "status": {
              "const": "absent"
            },
            "reason": {
              "type": "string",
              "minLength": 1
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "capability",
            "status"
          ],
          "properties": {
            "status": {
              "const": "unsupported"
            },
            "capability": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      ]
    },
    "AvailabilityPartition": {
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "digest",
            "status",
            "value"
          ],
          "properties": {
            "status": {
              "const": "known"
            },
            "value": {
              "$ref": "#/$defs/Partition"
            },
            "digest": {
              "type": "string",
              "pattern": "^[a-f0-9]{64}$"
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "reason",
            "status"
          ],
          "properties": {
            "status": {
              "const": "absent"
            },
            "reason": {
              "type": "string",
              "minLength": 1
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "capability",
            "status"
          ],
          "properties": {
            "status": {
              "const": "unsupported"
            },
            "capability": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      ]
    },
    "CellStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "weight"
      ],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^c(0[0-9]|1[0-5])$"
        },
        "weight": {
          "type": "string",
          "pattern": "^(0|[1-9][0-9]*)$"
        }
      }
    },
    "DomainStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "fromYear",
        "id",
        "origins",
        "routes",
        "schemaVersion",
        "systems",
        "untilYear"
      ],
      "properties": {
        "schemaVersion": {
          "const": "civ-domain-stub-1"
        },
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        },
        "systems": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/SystemRef"
          },
          "minItems": 1,
          "maxItems": 32
        },
        "routes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/RouteStub"
          },
          "minItems": 0
        },
        "origins": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[A-Za-z0-9_./:-]+$"
          },
          "minItems": 0,
          "maxItems": 4
        },
        "fromYear": {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        },
        "untilYear": {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        }
      }
    },
    "EdgeStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "barrier",
        "contactPermille",
        "to"
      ],
      "properties": {
        "to": {
          "type": "string",
          "pattern": "^r(0[0-9]|[12][0-9]|3[01])$"
        },
        "contactPermille": {
          "type": "integer",
          "minimum": 0,
          "maximum": 1000
        },
        "barrier": {
          "type": "boolean"
        }
      }
    },
    "EpochStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "Kbase",
        "airClass",
        "aridityClass",
        "domesticablesPpm",
        "fromEpoch",
        "gravityMicroMS2",
        "landPpm",
        "regionId",
        "resources",
        "tempClass",
        "untilEpoch"
      ],
      "properties": {
        "fromEpoch": {
          "type": "string",
          "pattern": "^(0|-?[1-9][0-9]*)$"
        },
        "untilEpoch": {
          "type": "string",
          "pattern": "^(0|-?[1-9][0-9]*)$"
        },
        "regionId": {
          "type": "string",
          "pattern": "^r(0[0-9]|[12][0-9]|3[01])$"
        },
        "Kbase": {
          "type": "string",
          "pattern": "^(0|[1-9][0-9]*)$"
        },
        "landPpm": {
          "type": "integer",
          "minimum": 0,
          "maximum": 1000000
        },
        "tempClass": {
          "type": "integer",
          "minimum": 0,
          "maximum": 4
        },
        "aridityClass": {
          "type": "integer",
          "minimum": 0,
          "maximum": 4
        },
        "airClass": {
          "enum": [
            "oxic",
            "anoxic",
            "none"
          ]
        },
        "gravityMicroMS2": {
          "type": "integer",
          "minimum": 1,
          "maximum": 100000000
        },
        "resources": {
          "type": "array",
          "items": {
            "type": "integer",
            "minimum": 0,
            "maximum": 1000
          },
          "minItems": 4,
          "maxItems": 4
        },
        "domesticablesPpm": {
          "type": "integer",
          "minimum": 0,
          "maximum": 1000000
        },
        "cellWeights": {
          "type": "array",
          "minItems": 16,
          "maxItems": 16,
          "items": {
            "type": "string",
            "pattern": "^(0|[1-9][0-9]*)$"
          }
        }
      }
    },
    "Epochs": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "rows"
      ],
      "properties": {
        "rows": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/EpochStub"
          },
          "minItems": 1
        }
      }
    },
    "Lifecycle": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "complexLifeFromYear",
        "habitableFromYear",
        "habitableUntilYear"
      ],
      "properties": {
        "habitableFromYear": {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        },
        "habitableUntilYear": {
          "type": "integer",
          "minimum": -9007199254740991,
          "maximum": 9007199254740991
        },
        "complexLifeFromYear": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": -9007199254740991,
              "maximum": 9007199254740991
            },
            {
              "type": "null"
            }
          ]
        },
        "stellarDoomYear": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": -9007199254740991,
              "maximum": 9007199254740991
            },
            {
              "type": "null"
            }
          ],
          "default": null
        }
      }
    },
    "Partition": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "partitionVersion",
        "regions"
      ],
      "properties": {
        "partitionVersion": {
          "const": "civ-stub-regions-1"
        },
        "regions": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/RegionStub"
          },
          "minItems": 8,
          "maxItems": 32
        }
      }
    },
    "PlanetStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "body",
        "epochs",
        "hosting",
        "lifecycle",
        "partition",
        "profile",
        "schemaVersion",
        "system"
      ],
      "properties": {
        "schemaVersion": {
          "const": "civ-planet-stub-1"
        },
        "body": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        },
        "system": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        },
        "profile": {
          "enum": [
            "temperate",
            "arid",
            "cold",
            "anoxic",
            "habitat",
            "barren"
          ]
        },
        "lifecycle": {
          "$ref": "#/$defs/AvailabilityLifecycle"
        },
        "partition": {
          "$ref": "#/$defs/AvailabilityPartition"
        },
        "epochs": {
          "$ref": "#/$defs/AvailabilityEpochs"
        },
        "hosting": {
          "enum": [
            "habitable",
            "habitat-buildable",
            "barren"
          ]
        }
      }
    },
    "RegionStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "adjacency",
        "id",
        "weight"
      ],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^r(0[0-9]|[12][0-9]|3[01])$"
        },
        "weight": {
          "type": "string",
          "pattern": "^(0|[1-9][0-9]*)$"
        },
        "adjacency": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/EdgeStub"
          },
          "minItems": 0
        },
        "cells": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/CellStub"
          },
          "minItems": 16,
          "maxItems": 16
        }
      }
    },
    "RouteStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "destinationHosting",
        "distanceMicroLy",
        "from",
        "kind",
        "to",
        "travelYearsByTransportTier"
      ],
      "properties": {
        "from": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        },
        "to": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        },
        "kind": {
          "enum": [
            "in-system",
            "interstellar"
          ]
        },
        "distanceMicroLy": {
          "type": "string",
          "pattern": "^(0|[1-9][0-9]*)$"
        },
        "travelYearsByTransportTier": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "type": "integer",
                "minimum": 1,
                "maximum": 9007199254740991
              },
              {
                "type": "null"
              }
            ]
          },
          "minItems": 8,
          "maxItems": 8
        },
        "destinationHosting": {
          "enum": [
            "habitable",
            "habitat-buildable",
            "barren"
          ]
        },
        "lightYears": {
          "type": "integer",
          "minimum": 0,
          "maximum": 2000000
        }
      }
    },
    "SystemRef": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "bodyPrefix",
        "fixture",
        "id"
      ],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        },
        "fixture": {
          "type": "string",
          "minLength": 1
        },
        "bodyPrefix": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        }
      }
    },
    "SystemStub": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "bodies",
        "id",
        "routes",
        "schemaVersion"
      ],
      "properties": {
        "schemaVersion": {
          "const": "civ-system-stub-1"
        },
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z0-9_./:-]+$"
        },
        "bodies": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/PlanetStub"
          },
          "minItems": 1,
          "maxItems": 8
        },
        "routes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/RouteStub"
          },
          "minItems": 0
        }
      }
    }
  }
}
```

The schema is data for validation, not a network dependency; do not fetch its
draft URI. Relational constraints, digest checks and sort checks use the
normative tables above. The M2 implementation remains dependency-free.

Availability wrappers are exactly one of:
`{status:"known",value:T,digest:String}` (64 lowercase hex SHA256 of
canonicalBytes(value)), `{status:"absent",reason:String}` (nonempty reason),
or `{status:"unsupported",capability:String}` (nonempty capability).
AvailabilityLifecycle/Partition/Epochs substitute T above. StubEnvironment
lifecycle(body) returns the stored wrapper. regions(body) returns partition.
epoch(body,region,millenniumIndex) returns the matching EpochStub **value**
without its range keys, in a fresh known wrapper with its own content digest.
routes(domain) returns sorted RouteStub records in a known wrapper.
Unknown body=absent/unknown-body; missing required capability=unsupported with
that method name. An unsupported required input stops compilation with
status not-modelled; it never supplies zeros. Absent lifecycle means
uninhabited/not-habitable. Known lifecycle with complexLifeFromYear=null means
no local origin, not inability to host a colony. Epoch gaps are invalid input,
not absent. A body outside its lifecycle has known zero Kbase, preserved
resources and explicit not-habitable status; no lookup extrapolates a live K.
`resources.domesticables=F(domesticablesPpm,1000)` must agree; reject mismatch.

The runtime route validator checks the table: in-system values for T0..T7
are `[null,null,null,null,null,20,5,1]`; interstellar values are
`[null,null,null,null,null,null,null,C(distanceMicroLy,10000)]` if within range,
otherwise all null. DestinationHosting is immutable potential, not occupancy;
at arrival the destination's actual lifecycle/epoch still decides viability.

Exact input recipes (expand these into explicit JSON arrays in M2a/M2b;
there are no random fixture-generation parameters):

* All ordinary lifecycles: from=0, until=2000000, complex=0, doom=null.
  Domain declared interval [0,2000000); compilation defaults to 400000 years after the first scheduled sapience boundary, capped by the declared interval. Every region weight=1 and 16 cell
  weights=1. Epoch rows cover [0,2000) with constant values unless changed
  below. IDs zero-pad to two digits. No optional property is omitted.
* `fixtures/planets/temperate.json`: body `stub:s00:b0`, system `s00`, profile
  temperate, hosting habitable. 12 regions in an undirected ring (i connected
  to (i+1)%12), contact=500, barrier=false. Every Kbase=5000, landPpm=700000,
  tempClass=2, aridityClass=1, airClass=oxic, gravityMicroMS2=9810000,
  resources=[800,800,500,800], domesticablesPpm=800000.
* `arid.json`: body `stub:arid:b0`, system arid, 8-ring, contact=300, no
  barrier; Kbase=1500, landPpm=900000,tempClass=3,aridityClass=4,oxic,
  gravity=9810000, resources=[800,600,300,200], domesticablesPpm=200000.
* `cold-archipelago.json`: body `stub:cold:b0`, system cold, 10-ring,
  contact=100, barrier=true (effective 25); Kbase=1000,landPpm=200000,
  tempClass=0,aridityClass=2,oxic,gravity=9810000,
  resources=[500,300,100,300],domesticablesPpm=300000.
* `anoxic.json`: body `stub:anoxic:b0`, system anoxic, 12-ring contact=400,
  no barriers; Kbase=4000,landPpm=700000,tempClass=2,aridityClass=1,anoxic,
  gravity=9810000,resources=[800,0,500,800],domesticablesPpm=800000.
  It selects the alternative gate rows; zero fuel deposits do not prevent
  synthetic fuel manufacture at E5. No claim that this is a real anoxic path.
* `home-system.json`: SystemStub s00, body b0 is temperate exactly. Bodies
  `stub:s00:b1` and b2 have profile habitat, hosting habitat-buildable, 8-ring
  contact=500, no barriers, Kbase potential=1000,landPpm=1000000,tempClass=0,
  aridityClass=4,airClass=none,gravity=1600000,resources=[800,0,300,800],
  domesticablesPpm=800000; complex=null. b3 profile barren/hosting barren,
  same geometry/quantities but Kbase=0,resources=[0,0,0,0],domesticablesPpm=0.
  All have lifecycle [0,2000000). Explicit directed routes connect every
  distinct pair of the four bodies with the in-system travel table.
* `fixtures/domains/toy-12.json`: id `toy-12`, systems s00..s11. s00 loads
  home-system; other systems load temperate, substituting system/body prefix
  `sNN`/`stub:sNN` (one b0 body each). Origins=[stub:s00:b0]. Include home
  system routes plus both directions of edges s00–s01–...–s10, between b0
  bodies, each distanceMicroLy=4000000. s11 is disconnected. Interstellar
  travel is 400 years. No edge from b1/b2 to another system: launches from
  habitats must first reach local b0. Domain fixture references are resolved
  and expanded before hashing so filesystem lookup order is irrelevant.

For M2a the standalone temperate/arid/cold/anoxic solver accepts a recorded
post-sapience genesis to exercise P without D. SAPIENCE still owns genesis
event and initial population. M2a uses the same ranks/gates/natural rules as
M2b; M2b-only kinds are disabled by the **milestone manifest**, not omitted
random calls. Compare query orders within one manifest, not M2a against M2b.

### Forced reachability fixtures

These are deterministic test inputs, not `event.forced=true`. Seed is exactly
`m2-reach:<KIND>` in each row; base=temperate unless specified. The manifest
records every override and initial state. This table specifies constructions,
not seeds claimed to have been run. All initialized quantities not mentioned
use SAPIENCE defaults. Each region mentioned as occupied defaults pop=10000,
infra=100000,fuel=100000; all seven tiers default 0. Parameter overrides are
test-fixture input, never an unrecorded runtime seam.
In an InitialOverride, every region not explicitly occupied has pop=infra=
fuel=0 and tiers all0; do not run the randomized SAPIENCE region-count draw
again. The SAPIENCE reach fixture itself has initial=null. For other rows
“r00 S1” also means r00 is occupied; a named r01 is occupied unless its stated
population is zero. All unmentioned polities/chains/voyages are empty,
arc.isColony=false, colonizer=true, perils=none, nonviable=false. A forced
fixture therefore expands to one full initial record, never a query-time
partial patch. Initialization provenance and latches are empty.

Override registry: `origin.deliveryYear` (Int, bypass hard-step schedule only
in forced fixtures), `hazard.<KIND>.q32` (BigInt replacement total rate),
`magnitude.<purpose>` (fixed result within the named sampler support),
`outcome.<KIND>` (fixed supported outcome), `initial` (closed typed initial
state above), `epoch.rows` (replacement valid epoch rows),
`parameters.g` (eight nonnegative integers), `parameters.keepPermille`
(0..1000), `parameters.build` (eight nonnegative integers),
`parameters.naturalExtinctionPpm` (0..1000000 with the natural cap validation).
No arbitrary functions or injected events. H overrides do not alter E or
episode keys; use `h=171798691840` (40Q), larger than M1 expQ32's maximum,
to guarantee a firing in the first eligible tick. Only the chosen kind gets
this override. Unrelated hazards may be set to zero to isolate the test;
list those zero overrides in the manifest in kind order. Threshold and chain
fixtures need no hazard injection unless starting their opener.

| Kind | Exact forcing construction and maximum run |
|---|---|
| SAPIENCE | origin.deliveryYear=0; 1 tick |
| MIGRATION | r00 pop=100000, r01 pop=1000, h=40Q, fraction=250; 1 tick |
| AGRICULTURE | r00 S0, h=40Q; 1 tick |
| FAMINE | r00 pop=100000 with default Kbase5000; 1 tick |
| PLAGUE | r00 occupied, immunity20, h=40Q; 4 ticks also reaches SPREAD/BURNOUT when r01 occupied |
| CLIMATE_SHIFT | start tick99, at epoch1 change all Kbase5000→1000; 2 ticks |
| NATURAL_CATASTROPHE | r00 occupied, h=40Q, naturalExtinctionPpm=0; 1 tick (only survivable branch; do not violate cap) |
| DISCOVERY | r00 tiers=[0,1,0,0,0,0,0], h=40Q; 1 tick |
| DIFFUSION | r00 tiers=[0,1,0,0,0,0,0], r01 all0, h=40Q; 1 tick |
| TECH_LOSS | r00 pop=1, tiers=[0,0,0,0,4,0,0], lowTicks[I]=2; 1 tick |
| ENERGY_TRANSITION | AGRICULTURE fixture; 1 tick |
| POLITY_FOUNDING | r00 S2, unowned, h=40Q; 1 tick |
| WAR | polities a on r00, b on r01; positive pop; h=40Q; 1 tick |
| CONQUEST | WAR fixture; all other hazards0; magnitude.evt.conquest.win=1 is Boolean chance success, attacker pop100000/defender1000; 4 ticks |
| HEGEMONY | polity a on r00, only occupied region; 1 tick |
| FRAGMENTATION | polity a owns r00,r01, h=40Q; 1 tick |
| REVOLUTION | polity a owns r00, I1, stress1000, h=40Q; 1 tick |
| SCHISM | polity a owns r00,r01, stress1000, h=40Q; 1 tick |
| COLLAPSE | r00 S1, h=40Q; 1 tick |
| RECOVERY | r00 collapse={active:true,recoverPop:10000,recoverInfra:100000}, pop10000,infra100000; 1 tick |
| NUCLEAR_WAR | WAR fixture with both participants E4,M4, arc.perils=active, h.nuclear=40Q; 2 ticks (first declares war); outcome=collapse |
| ENGINEERED_PANDEMIC | r00 V4,I4, perils active, h=40Q; outcome=existential-cap; 1 tick |
| RUNAWAY_TECH | r00 I5, perils active, h=40Q; outcome=extinction; 2 ticks for EXTINCTION |
| CLIMATE_CATASTROPHE | r00 forcing=1000000000; 1 tick |
| SPACEFLIGHT | r00 T5; 1 tick |
| LAUNCH | home-system, r00 tiers=[5,5,4,6,4,3,4], pop10000,infra100000,fuel100000, colonizer true, tick9; h=40Q; 2 ticks (SPACEFLIGHT then window) |
| VOYAGE_LOST | toy-12 initial voyage home b0→s01 b0, T7,pop2000,launchYear0,arrivalYear400,deliveryTick40; start tick1, h=40Q; 1 tick |
| COLONY_FOUNDED | home-system initial voyage b0→b1, tiers=[5,5,4,6,4,3,4],pop4000,launchYear0,arrivalYear5,deliveryTick1; start tick1; 1 tick |
| COLONY_LOST | isColony=true, r00 pop1000; 1 tick |
| EXTINCTION | every region pop0; 1 tick |
| LINEAGE_EXTINCTION | domain with one initialized arc, every region pop0, no voyages; 1 tick |

Use exact uppercase kind spellings in override keys (the nuclear row's
`h.nuclear` means `hazard.NUCLEAR_WAR.q32`). Override chance values are
represented by canonical integer strings 0 or 1, not arbitrary sampler return
types. Outcome override is the named supported enum in its closed input
record. Fixture initial polities use the flat fixture polity IDs defined above;
their founding witnesses are explicit genesis metadata, not fictitious events.
Initial chain fixtures are optional; all listed chain reachability cases
actually declare their opener. Initial voyages have launch-event witness IDs
`sourceArc+"#launch-fixture:"+label` and balanced initial transit accounts,
not a second unaccounted population addition. No fixture may force a transfer
above its source stock or bypass resource/cap gates.

Additional mandatory interaction fixtures: two 800-permille migrations from
100 with g/build=0 (extend the migration magnitude support only in this
explicit override record), K=0 with a launch/migration intent, simultaneous
loss+gain, reciprocal war, overlapping splits, same-time competing lineages,
lost voyage before delivery, source extinction after launch, nonviable rescue,
three self-sufficient bodies then loss of two, same-lineage reinforcement,
anoxic E1/E3 path, missing fissiles ceiling, colony innovation beyond inherited
tiers, and a natural catastrophe with conditional extinction support under the
cap using ordinary rate plus a recorded outcome override. The cap is checked
on the ordinary distribution; a labelled branch-forcing outcome override is
not a stochastic ensemble and must never be used for a rate claim.

## Calibration and bounded cost [scenario]

Targets, not observed results: temperate typical foraging duration on the order
of 10000..100000 years **after SAPIENCE**; agrarian-to-industrial within a few
1000 years after that. The local a_S=40, domesticables, 12-region diffusion and
wide innovation prior are starting parameters only. No seed is rejected to
meet the target. Report medians/quantiles conditional on actual exposure,
plus censored and NO_LINEAGE counts. Across seeds require reachable collapse
+recovery, self-extinction, multi-body lineage and NO_LINEAGE. Outcome bands
in spec §14 remain scenario goals. Forced reachability cannot establish
typical durations, performance or empirical plausibility.

Per tick candidates are at most 7R next-tier discoveries, R agriculture,
7 directed-edge diffusions, directed-edge migrations, adjacent polity pairs,
R fixed thresholds and a bounded number of arc hazards/chains. Compute N_eff,
power-distance contributions, polity aggregates and gate predicates once per
pre-state. Cache static shortest-path hop distances and immutable gate tables.
Do not enumerate every historical tier or every ended polity on every tick;
keep a sorted active index as a reconstructible cache. Hazard entries retain
episodes even when dormant. Active plagues<=R; active wars<=unordered live
polity pairs; live polities<=R. Four firings cap each hazard/tick. Domain has
<=32 systems and <=4 origins; route-neighbour arrays are fixed. Launch windows
bound active voyage creation to R per 10 ticks per live arc. Do not resample
thresholds or serialize the full history to advance one tick. Hash complete
chapter leaves once; checkpoints need state, never RNG stream cursors.

The required measurements remain 20000 years of the temperate stub inside a
2-second test, and 400000 years/12 regions within a 10-second CLI target.
No measurement was made in this documentation run. Provenance/event retention
and increasing body episodes may dominate memory; measure before optimizing.
No fast-forward may replace canonical ticks without an identity proof.

## Spec ambiguities resolved here

1. **A1 — Delivery (runner D1).** Runner correction of spec 8.4 (A1):
   deliveryTick=max(C(arrivalYear,10),F(launchYear,10)+1). Never early.
2. **A2 — K=0 ordering in §6.2.** Its parenthesis says migration/launch have
   “already” resolved, contradicting §§3.4/5.3. Natural mortality goes first,
   then remaining-stock debits. A zero-capacity evacuation cannot escape in
   that tick under this chronology. This is the explicit O1 compromise.
3. **A3 — Identity (runner D2 accepted; D8 supersedes its alias mechanism).**
   Flat readable polity/culture IDs replace founding-event IDs and encoded
   owners. This deviates from spec 6.1 to bound identity length independently
   of ancestry depth; owner and pair IDs follow spec 4.4 directly.
4. **A4 — M1 schema is toy-specific.** M2 needs catalogue-aware validation,
   D hazard thresholds, resolution/data fields, nonnumeric sets, phase0 and
   polityNatural ledger witnesses. Preserve toy versions/goldens; do not
   pretend M1 already accepts the 31 kinds or those extensions.
5. **A5 — Phase-0 stock and digest boundary.** Ledger startState is before
   inbox; phase0 is an explicit witness; naturalDelta starts after inbox.
   An ARRIVAL is one D event referenced by P, never two transfers/events.
6. **A6 — Derived trigger spelling and terminal timing.** ENERGY_TRANSITION
   uses M1 threshold mode at phase5, comparison instead of persistent latch.
   EXTINCTION remains a next-tick threshold, with biological zero recorded
   immediately; a zero-pop nonterminal occupation blocks arrivals until it
   retires. No extra phase5 extinction kind is invented.
7. **A7 — PERILS and shared consequences are messages, not catalogue kinds.**
   Use phase0 inboxEffects and original cause IDs. Shared risk affects arcs
   present at the emission barrier, not future colonies or transit accounts.
8. **A8 — Log-uniform discretization and origin alignment.** Use uniform
   integer binary exponents. Three hard steps and aligned genesis are authored.
   A missing origin after horizon is pending, not NO_LINEAGE. Equal-boundary
   arrivals preempt sapience; body episodes count across lineages.
9. **A9 — Runner D3, accepted for M2b.** Cap on the sampled direct
   natural-extinction branch only; delayed demographic extinction after a
   survivable catastrophe is not bounded. No broader rate claim or pending
   runner gate remains.
10. **A10 — Outcome coverage and precedence.** A surviving transit-only lineage
    uses EXTANT_PLANETARY because the enum lacks EXTANT_IN_TRANSIT. Extinction
    follows last actual death, not last catastrophe intent. REGRESSED_STABLE
    uses inherited colony tiers; no invented historical maximum state.
11. **A11 — War/plague catalogue variants.** WAR and PLAGUE own their steps;
    CONQUEST also represents failed END outcomes. Dead participants invalidate
    chains. Split IDs include part indices, and COLLAPSE split components may
    lose locks independently of stock losses. No M3 event kinds are introduced.
12. **A12 — Threshold hysteresis.** Ordinary thresholds reset when predicate is
    false; famine/climate shocks do not refire each tick of one excursion.
    TECH_LOSS resets its two-tick counter. COLONY_LOST adds mortality starting
    the following tick; viability recovery is bookkeeping without a new kind.
13. **A13 — Unspecified ecology, politics and technology.** All coefficients,
    renewable pressure, stress/regime/culture rules, distance attenuation,
    prerequisite tables (including anoxic alternatives), Henrich thresholds,
    damage duration/stacking, forcing and era E7 capture are scenario rules.
    No claimed calibration or automatic prerequisite-loss cascade.
14. **A14 — Launch logistics and habitats.** Costs/berths are per passenger,
    reserve is 2000, minimum shipment/colony is 2000, launch windows 100 years,
    and arrival infrastructure is an explicit addition. Route choice knows
    immutable potential only; no instantaneous occupancy read. Colony tiers
    are inherited starting knowledge, never ceilings. Reinforcement does not
    import tech; an empty body's new episode does. Conquest changes ownership
    without moving people between regional accounts.
15. **A15 — Self-sufficiency and onset.** Specify stocks, maintained tiers and
    body separation; D messages alone exit/reenter perils. O5 on a living
    occupied region suffices for the spec's alternative. New colonies receive
    an EXIT message if the lineage was already safe.
16. **A16 — Attribution and fixtures.** Define categorical score=1, tuple
    scoring, weights, cap/gate provenance and strict-order filtering. Forced
    fixtures are declared manifest overrides with forced=false events, not
    empirical samples. Their hashes differ from production manifests.
17. **A17 — Stubs and root composition.** Use closed typed input schemas,
    explicit unsupported handling, absolute chapter indices, sorted domain
    wrapper leaves and a separate D event log. All fixture numbers and file
    recipes are authored; Atlas integration remains deferred.

Calibration, forced reachability and timing budgets remain unmeasured. The
accepted D3 scope is not a claim about delayed demographic extinction.
There are no deferred implementation choices in this contract.

### Runner decisions and additional resolutions

- **D1:** A1 corrected delivery uses ceil arrival and the next-launch-tick floor.
- **D2:** A2, A3..A8 and A10..A17 accepted as written in the reviewed draft,
  subject to the explicit D8 identity supersession and completion rules here.
- **D3 / critique 10:** A9 direct-branch compliance is sufficient for M2b;
  delayed demographic extinction after a survivable catastrophe is not bounded.
- **D4 / critique 8:** frameworkReads/frameworkWrites separated; per-kind
  permissions are exact recipe unions. Container reads do not grant members.
  DIFFUSION reads region.id; lineage latches use shared framework reads;
  LAUNCH writes staged transit; Kbase/tiers include P5c, era/energy include P0.
- **D5 [scenario]:** WAR stress x100, density/medicine-aware PLAGUE, COLLAPSE
  stress x100 and origin Log(12,22), with arithmetic checks above.
- **D6 [scenario]:** expected event mix is qualitative reporting guidance.
- **D7 / SF1:** live/archive split; one retirement record, live tick witnesses,
  checkpoints with complete archive records; no history-sized tick ledgers.
- **D8 / SF2:** flat IDs and unique anchor locks supersede spec 6.1 polity
  founding-event identity; fixed 65536-character bound and long-run test.
- **D9 / SF3 [scenario]:** O5 gate I4,T6, including original homeworlds.
- **D10 / SF4 [scenario]:** BH nearest/half-up, with zero guards and bound proof.
- **D11 / SF5:** living outcome precedence uses only occupied nonterminal arcs.
- **C1:** exact manifest schema, normalized contract/table digests, expanded
  input bundle and canonical override representation fixed before any draw.
- **C2 [scenario where initialization is authored]:** voyage HazardId optionals
  absent; immutable foundingTiers; complete fixture voyage expansion; one
  positive founding region clamps the count, zero suppresses the origin.
- **C3:** terminal nextTick=null/frontier=[]/visited preserved; accepted P3
  extinction invalidations, no silent duplicate closure; preserve endedYear.
- **C4:** sets sorted by target/field, atomic tuple sets, complete chain refs,
  transfer toField and full record constructors below pin serialization.
- **C5 [scenario]:** effectiveContact in migration/diffusion/plague; Energy
  domain selects synthetic fuel while era selects coefficient/growth rows.
- **C6 [scenario]:** lifecycle installs zero capacity on its exact tick in
  P0/P5c; event in M2b, framework-only install in M2a; O1 mortality remains.
- **C7:** dated separate death witnesses ordered by application, retained D
  summary across archives; transfers never overwrite last death.
- **C9 [scenario scoring]:** intermediate primitive touches, explicit derived
  dependency map and endpoint scores, zero removal, shared-source merging.

## Revision log (M2.0 review)

M2a implementation corrections (runner review pending): repaired the six
malformed rows in the mechanical provenance dependency map, whose right-hand
cells accidentally repeated field-register type/unit/writer columns. The
corresponding explicit dependency lists are now also in rules.provenanceDependencies.
Raised ForcedFixture.ticks maximum from 640 to 40000 (rules.forcedTickMaximum):
the required 20 kyr and 400 kyr post-sapience runs must be recorded forced
genesis inputs and could not fit the previous cap. Reachability recipes retain
their stated one-to-four-tick bounds. No rates or gates changed.

Replaced early delivery, recursive IDs, full-history tick witnesses and
undated loss attribution. Applied all four rate changes, the O5 gate and BH
rounding; added event-mix guidance. Completed manifests, initialization,
chain retirement, event serialization, lifecycle closure and mechanical
provenance. Rebuilt minimal permissions and field writers. Recorded every
runner decision and critique resolution; no source code or fixture file changed.

## Revision log (M2a fix round)

All changes here are authored scenario/representation choices, not research claims.

1. P start/phase0/end witnesses now contain structural SHA-256 digests. Complete
   checkpoints and tick archives remain replay inputs. The digest is exactly
   SHA256 of `[rest,regionTuples,hazardRoot,episodeRoot]` in canonical JSON.
   The machine block specifies every tuple position; all remaining arc fields
   keep their canonical sorted keys. HazardRoot hashes the ordered list of
   per-entry SHA256 hashes; episodeRoot hashes the compact episode counters.
   Natural delta rows use the machine block's fixed tuples to reduce key overhead. Checkpoint replay must
   reproduce every tick digest and chapter root. Standalone M2a D witnesses
   reference the P digest; M2b is not implemented.
2. M2 hazard keys use SHA-256 of the M1 hex key. Threshold RNG addresses retain
   the original key. Event/cause references retain full event IDs with compact
   intents. M1 encoding is unchanged.
3. M2 hazard records add atTick and rate. Effective accumulated hazard at boundary
   t is H_q32+(t-atTick)*rate. Same-rate non-firing ticks need no record mutation;
   rate changes, pauses and firings materialize H. No RNG cursor is stored.
4. Subsistence coefficient is 400 rather than 40 (agriculture domesticables
   multiplier stays). This also reconciles the implementation's existing 400
   for post-agriculture Subsistence discoveries with the table. D6 still permits
   slow seeds. This is a general rate change, not a seed exception.
5. Collapse is regional, stress coefficient 4294967 (one tenth), local complexity,
   exactly one tier per domain and no exposure during active recovery. Population
   and infrastructure losses remain 300/700 permille. Only the victim's polity
   can split; one collapse is accepted per victim per tick. Recovery has no tier gift; neighbouring knowledge survives for
   diffusion. ENERGY_TRANSITION still records both increases and decreases.
6. Natural wartime legitimacy losses and stress increases propagate WAR opener
   attribution. Pre-state legitimacy/stress/weariness contributors propagate into
   increasing stress. Stress score decay rounds up while stress exceeds 100,
   retaining at most three real sources; other score decay stays floor-half.
   No historical event is invented for natural baseline stress. Famine lowers
   population pressure in this model and need not raise collapse hazard.
7. CLI selects in descending base salience/event order, at most three per kind
   within 30 rows, and resolves causes to kind/year/owner. It reports historical
   maximum occupied era and its earliest committed boundary year. This diversity
   cap is presentation only; all events remain in the digest and count report.

8. Completed acquisition hazards now retire into the append-only archive when
   the target tier is attained. A compact next-episode counter prevents RNG reuse
   after a later loss. This removes completed targets from the per-tick working
   set; other ineligible hazards remain paused. Retirement materializes their
   final accumulated H at the ending boundary. Archive IDs include the episode.

## Revision log (M2b)

- [scenario] Expand the toy-12 declared domain bounds to [0,2000000), matching
  its unchanged lifecycle/epoch coverage. The CLI compiles from genesis to
  first sapience delivery + 400000 years, or + --years N, capped by those bounds
  and stopping when every founded lineage is terminal and no further origin
  is due before the horizon. A pending hard step is never redrawn. The old
  absolute 400000-year bound could truncate the requested post-sapience history.
- Extend the representation-only delta witness to D: replace domain.arcs by
  sorted {id,root} commitments to P (structural at a checkpoint, delta otherwise),
  retain every other domain field, and chain the annex valueDelta encoding as
  SHA256('m2b-domain-delta-1;'+previous+delta). Genesis commits full structural P
  roots; complete states remain in checkpoints. This avoids serializing every
  arc twice each tick. The machine block enumerates every D field. Voyage,
  lineage, transit and message compounds retain all sorted keyed members.
- No M2a calibration constants changed. M2b kinds are enabled in the milestone
  manifest; M2 stability goldens must be regenerated. M1 bytes are unchanged.

## Revision log (M3a, 2026-10-04)

The execution horizon is excluded from the standalone default input bundle and
both P/D recipes. Default standalone forced data declares a fixed 40,000-tick
model bound. Explicit forced fixtures retain their declared bounds as data.
Only canonical chapter boundaries and terminal ticks carry structural P hashes.
Pending origins beyond an execution slice do not permit early terminal stopping.

STELLAR_DOOM (32, P, phase 0) reads nullable lifecycle.stellarDoomYear (omission
means null). At that exact boundary, any inhabited Energy>=5 region sets
arc.evacuating=true; otherwise it removes every region's population, with the
stellar death witness determining EXTINCT_STELLAR. Evacuation opens LAUNCH each
tick with 10 times its ordinary pressure, subject to ordinary stock/route gates.
The four new P fields initialize to false/empty and participate in every witness.

SIGNAL_ARRIVAL (33, D, scheduled phase 0) delivers the first I>=3 emission on
each outgoing route. Optional route.lightYears is an integer; the default is
ceil(distanceMicroLy/1000000), including zero in-system. The existing ceil-based
delivery rule applies, never earlier than the next tick. A signal payload is
{source,lineageId,body,tiers,strength,physical,arrivalYear}; ordinary payloads carry signal=null.
Signals addressed to the same lineage are ignored. Receivers retain signals sorted by source; the inbox snapshot omits arrivalYear. Duplicate sources do not duplicate
edges. An occupied-body voyage rejection also supplies a physical-meeting signal.
No extinct source is needed to deliver an already emitted signal.

FIRST_CONTACT (34, P receiver hazard) uses max Information times strength with
Q32 coefficient 42949673/1000; physical encounters allow Information zero using
max(1,I). It writes a contact {source,eventId,dateYear} and one diffusion edge
holding the signal's immutable tier snapshot. Only DIFFUSION can acquire tiers,
using the ordinary gate, rate coefficient and per-domain acquisition lock.
There is no immediate technology transfer on either arrival or contact.

C-only ranks 35..39 are RAID, TOWN_FOUNDED, TOWN_ABANDONED, LOCAL_FLOOD and
LOCAL_SUCCESSION. They annotate, never write stocks. C uses civ-cell-binary-1,
16 sorted cells, recursive floor splits, unit-leaf zero-weight fallback and the
epoch containing each boundary. Optional epoch.cellWeights overrides the static
cell weights. The town threshold is 1000 persons [scenario], with transition IDs
keyed by site and boundary tick. Local annotations have salience below macro
events; placement/date purposes are ref.cell.site, ref.cell.anchor, ref.cell.local.
Annual interior samples apply floorDiv(j*naturalDelta,10); resolved effects and
staircase changes appear at the end boundary. N has separate nar.* addresses.

Bounded scenario overrides may set origins.startingRegime=1 to initialize all
origins in the declared regime. The fixture-only oracle.launchPeriodYears schedules
one launch at foundedYear+period, a positive multiple of ten, retaining stock and
route gates; existing overrides disable growth/hazards for the speed oracle.
Missing RegionStub.cells derives 16 integer weights by quotient/remainder from
region.weight in sorted cell order. These rules are authored fixture parameters.

The new atomic P fields are arc.evacuating:Boolean (initial false),
arc.signals:Array, arc.contacts:Array and arc.diffusionEdges:Array (initial empty).
Their compound shapes are specified above; all enter the structural digest and
the m3a-delta-witness-1 field vector. A received radio signal has strength=1000
[scenario]. Its one-shot tier snapshot records knowledge at first emission.
A region refinement contract may carry its own canonical boundary-population
history, from the bounded initial state through the requested end. This is used
only to recover town founding ticks, never sibling state. Town identity is the
site ID plus that founding tick, including on abandonment and later re-founding.
When no earlier history is supplied, the left boundary declares the settlement
view genesis. Every annotation retains zero stock effects.

## Revision log (M4a, 2026-10-04)

This is a dynamics revision, not research calibration. All new numbers below
are **[scenario]**. Only the existing Morris energy figures retain their prior
research attribution; none of these new costs, durations or mechanisms does.
The intended rough spans, before measuring the ensemble, are E0->E1 1--20 kyr,
E1->E3 2--30 kyr, E3->E4 0.3--5 kyr, E4->E5 1--15 kyr,
E5->E6 2--30 kyr and E6->E7 2--50 kyr. These are diagnostic targets, not
assertions, guarantees or a claim that historical futures are known.

* Natural dynamics / recipes 3,8,10,11: replace the flat discovery rate and
  Nstar with the per-domain/target rows above. Era gates and capture figures
  are unchanged. No new RNG purpose: existing addressed acquisition hazards.
* Recipes 25--30: colonies carry a finite founding knowledge archive/automation
  reserve for 1,000 years from foundedYear. For an occupied region maintaining
  a tier no greater than foundingTiers[d], maintenanceN_eff=max(local N_eff,
  floor(Nstar[d][tier]*learningBias/1000)) until that deadline; otherwise it
  equals local N_eff. This represents manuals, tools and automated instruction,
  not extra people or live omniscient parent support. It neither increases
  invention nor gifts/reacquires a tier. After expiry ordinary maintenance
  applies. Founder count, costs, habitat gates and casualty rules are unchanged.
* Recipe 26: exclude destinations in delivered arc.signals (including own
  observed settlements) or unexpired arc.targetFailures. Unknown occupants
  remain targetable. FIRST_CONTACT ignores same-lineage signals. Stale occupied
  observations remain conservative until a failure notice; P never reads live
  D occupancy. Existing alien broadcasts remain one-shot.
* D2 after recipes 27--30: lost voyages, rejected arrivals, COLONY_LOST and
  colony EXTINCTION publish TARGET_FAILURE to surviving same-lineage arcs
  connected by a declared route in either direction (or on the same body).
  Assume an automated failure beacon at the destination; lost voyages report
  no earlier than planned arrival. Delivery=max(t+1,ceil((max(tickEnd,
  plannedArrivalIfLost)+ceil(distanceMicroLy/1000000))/10)). Successful arrivals
  send SIGNAL observations of the colony on those links. Payload adds failure
  (null by default, otherwise {body,eventId}); other defaults are unchanged.
* P0 TARGET_FAILURE deduplicates the last eventId per target and removes that
  body's delivered occupancy signals. Store {body,count,eventId,untilYear}
  sorted by body in arc.targetFailures, initially []. count=min(4,oldCount+1);
  untilYear=deliveryYear+1000*2^(count-1). Separate loss/extinction notices each
  increase backoff. This is local lineage knowledge carried by dated messages
  and committed in structural and delta witnesses, not a query-order cache.
* Recipes 19/20: region.recoveries initially 0 increments to a maximum 4 on
  accepted RECOVERY, including recovery from perils. Generic COLLAPSE requires
  recoveries<4. Four learned safeguards exhaust this model's generic complexity
  failure modes per region/arc; catastrophes and perils remain possible. This
  coarse finite bound is not universal immunity and does not reset on tier loss.
* Recipe 17: with perils exited and polity max Information>=4, REVOLUTION gets
  a renewal term of 4294967 Q32/decade (roughly a 10 kyr standalone mean),
  representing generational constitutional replacement even at zero stress.
  Reuse haz.REVOLUTION and evt.revolution.regime; no new purposes. Existing
  natural risks and expansion continue after perils exit.
* Append recoveries to the structural region tuple. Add sorted recoveries and
  targetFailures delta slots; witness version becomes m4a-delta-witness-1.
* lonely-earthlike uses a 2 Myr stable habitability window and 320 kyr horizon,
  retaining the hard-step lottery. The prior 100 kyr cutoff imposed closure
  on a temperate world without a stellar/ecological reason. forager-future
  starts with the existing E0 post-sapience fixture in that domain for 120 kyr.
  NO_LINEAGE remains possible in lonely-earthlike.

M1 is unchanged. M2/M3 roots change because these rules change the contract
and RNG namespace. Exact old/new receipts appear in the append-only M4a receipt
below and docs/m4-implementation.md, outside the hash to avoid self-reference.
P-path inputBundleDigest and forced.ticks horizon handling are unchanged.

## Machine-readable table

This is the sole fenced `json` block in this document. `phase` and `trigger`
name the primary variant; WAR/PLAGUE chain variants use phase 3 as defined
above. Per-kind reads/writes are minimal recipe access sets, including helper
expansions, all variants and effect-resolution reads. Shared framework access
is declared once in frameworkReads/frameworkWrites; a container grants only
iteration/membership access, never undeclared member access. The catalogue test
checks reads against kind.reads union frameworkReads and writes against
kind.writes union frameworkWrites, rejecting every other path. Framework
permissions cover only the specified framework operations; they cannot be used
to hide extra recipe dependencies. Natural/derived writes remain phase-scoped
in writtenBy. Initialization of identities/default metadata is framework INIT;
founding kinds own the non-default primitive additions/copies listed below.
Atomic records do not grant permission to create undeclared record members.

```json
{
  "version": "civ-transition-table-1",
  "pathGrammar": "root.member; atomic compound fields; no wildcards",
  "rules": {
    "authoredChoices": "scenario",
    "deliveryTick": "max(ceilDiv(arrivalYear,10),floorDiv(launchYear,10)+1)",
    "naturalExtinctionScope": "cap on the sampled direct natural-extinction branch only; delayed demographic extinction after a survivable catastrophe is not bounded",
    "naturalExtinctionRateBoundQ32": "3067833",
    "warStressCoefficientQ32": "429496730",
    "plague": {
      "coefficientQ32": "71582788",
      "denominator": "1000000000000000",
      "urban": [
        10,
        100,
        300,
        600,
        1000,
        1000
      ],
      "medicine": [
        1000,
        700,
        400,
        150,
        50
      ],
      "formula": "F(coefficientQ32*min(2000,pressure)*connectivity*susceptible*urban[S]*medicine[V],denominator)",
      "contact": "effectiveContact"
    },
    "collapseStressCoefficientQ32": "4294967",
    "originRateLog2": [
      12,
      22
    ],
    "O5Gate": {
      "Information": 4,
      "Transport": 6,
      "requiresColony": false
    },
    "bevertonHolt": {
      "zeroCases": "P=0 or K=0 -> 0",
      "num": "P*K*(1000000+g)",
      "den": "1000000*K+g*P",
      "rounding": "F(2*num+den,2*den)"
    },
    "syntheticFuelSwitch": "Energy-domain tier >= 5; coefficients indexed by era",
    "migrationContact": "effectiveContact",
    "lifecycleInstall": "P0 at exact habitableUntilYear tick; outside-lifecycle zero also enforced in P5c",
    "outcomeFilter": "occupied regions of nonterminal arcs",
    "maximumIdCharacters": 65536,
    "bodyIdMaxCharacters": 128,
    "chainTerminal": {
      "nextTick": null,
      "frontier": [],
      "visited": "preserve actual visited union",
      "step": "attempted next step"
    },
    "archive": {
      "entryKeys": [
        "scope",
        "kind",
        "id",
        "record"
      ],
      "tickLedgerField": "archived",
      "entrySort": [
        "scope",
        "kind",
        "id"
      ],
      "checkpointKeys": [
        "tick",
        "live",
        "archiveRecords"
      ],
      "endState": "structural digest of LIVE state",
      "hazardId": "key + colon + episode"
    },
    "deathOrder": [
      "tick",
      "stage",
      "ownerId",
      "sequence"
    ],
    "deathStages": {
      "D0": 0,
      "P0": 1,
      "D1": 2,
      "P5a": 3,
      "P5b": 4
    },
    "voyageHazardId": {
      "ownerId": "voyage.id",
      "kind": "VOYAGE_LOST",
      "optionalComponents": "absent"
    },
    "foundingPositiveCapacityRule": "min(1+below(2),positiveCount); zero -> no-lineage before draw",
    "transferReceiverField": "toField",
    "setSort": [
      "target",
      "field"
    ],
    "provenanceDerivedScore": "max(0,distance(final,preP0)-sumPrimitiveScoresToSameField); intermediate touched contributors; divide by sorted unique eventId; merge then drop zeros",
    "manifestConstants": "SHA256(normalized complete UTF-8 contract with LF and one terminal LF); tableDigest=SHA256(canonicalBytes(parsedTable))",
    "provenanceDependencies": {
      "region.Kbase": [
        "region.tiers"
      ],
      "region.K": [
        "region.Kbase",
        "region.tiers",
        "region.damage"
      ],
      "region.era": [
        "region.tiers"
      ],
      "region.energy": [
        "region.pop",
        "region.tiers"
      ],
      "region.ceilings": [
        "region.tiers",
        "region.caps",
        "region.resources"
      ],
      "arc.outcome": [
        "region.pop",
        "region.tiers",
        "region.polityId",
        "polity.endedYear"
      ]
    },
    "forcedTickMaximum": 40000,
    "collapse": {
      "owner": "region",
      "eligible": "pop>0 && era>=1 && !collapse.active",
      "complexity": "sum(region.tiers)",
      "drop": 1,
      "populationLossPermille": 300,
      "infrastructureLossPermille": 700,
      "split": "only victim region pre-state polity; existing locks",
      "recovery": "unchanged; no tier gift",
      "sameTick": "one accepted collapse per region; later firings pre-empted target-conflict"
    },
    "subsistenceCoefficientQ32": "400",
    "tickWitness": {
      "version": "m2a-state-witness-2",
      "arc": "SHA256(UTF8(JSON array [rest, regionTuples, hazardRoot, episodeRoot]))",
      "rest": "all arc fields except regions, hazardLedger, hazardEpisodes; canonical sorted keys",
      "regionTuple": [
        "id",
        "localId",
        "pop",
        "Kbase",
        "K",
        "renewable",
        "infra",
        "fuel",
        "forcing",
        "immunityTicks",
        "damage",
        "polityId",
        "cultureId",
        "culture",
        "tiers",
        "caps",
        "era",
        "energy",
        "resources",
        "collapse",
        "lowTicks",
        "ceilings",
        "spaceflight",
        "berthsUsed",
        "recoveries"
      ],
      "regionNestedTuples": {
        "damage": [
          "eventId",
          "permille",
          "untilTick"
        ],
        "collapse": [
          "active",
          "recoverPop",
          "recoverInfra"
        ],
        "ceilings": [
          "domain",
          "targetTier",
          "reason"
        ]
      },
      "bigints": "decimal JSON strings, same as M1",
      "hazardRoot": "SHA256(canonicalBytes(hazardLedger.map(h => SHA256(canonicalBytes(h)))))",
      "episodeRoot": "SHA256(canonicalBytes(hazardEpisodes))",
      "phase0": "state digest",
      "endState": "state digest",
      "naturalDeltaTuple": [
        "regionId",
        "pop",
        "infra",
        "fuel",
        "forcing",
        "renewable",
        "immunityTicks",
        "culture",
        "lowTicks"
      ],
      "polityNaturalTuple": [
        "polityId",
        "eliteShare",
        "asabiya",
        "legitimacy",
        "stress",
        "warWeariness"
      ],
      "standaloneD": [
        "domainId",
        "tick",
        "arcState",
        "archived"
      ]
    },
    "compactHazardKey": "SHA256(UTF8(M1 hex hazard key)); RNG threshold address remains M1 hex key",
    "hazardClock": {
      "atTick": "BigInt boundary of stored H_q32",
      "rate": "BigInt Q32 per tick; zero when paused",
      "effectiveH": "H_q32+(tick-atTick)*rate",
      "anchor": "rewrite only on rate change, pause or firing; store next boundary after advance",
      "firing": "unchanged M1 advanceHazard and evidence"
    },
    "naturalStressProvenance": {
      "legitimacyLoss": "credit active WAR opener with size of natural loss",
      "stressIncrease": "credit active WAR opener and pre-state legitimacy/stress/warWeariness contributors with size of increase",
      "stressDecay": "ceil(score/2) while polity stress>100, otherwise floor(score/2); existing top-three cap",
      "interpretation": "bounded persistent model attribution while stress remains elevated"
    },
    "cliSelection": {
      "order": "base salience descending then event order",
      "capPerKind": 3,
      "causes": "kind@year (owner); resolve stored event IDs",
      "maxEra": "highest occupied era from initial state and committed ENERGY_TRANSITION; earliest commit boundary year"
    },
    "acquisitionHazardRetirement": {
      "eligibleKinds": [
        "AGRICULTURE",
        "DISCOVERY",
        "DIFFUSION"
      ],
      "close": "target region tier >= targetTier after effects",
      "archiveId": "key + colon + episode",
      "counter": "arc.hazardEpisodes sorted {key,episode}; next episode = closed entry episode + 1",
      "reopen": "zero accumulated H and threshold at saved episode; previous pending threshold invalidated",
      "otherHazards": "retain paused entries until owner retirement or terminal arc"
    },
    "domainHorizon": {
      "boundsUntilYear": 2000000,
      "defaultYearsAfterFirstSapience": 400000,
      "explicitYearsAfterFirstSapience": true,
      "stopAtTerminal": true
    },
    "domainWitness": {
      "version": "m2b-domain-delta-1",
      "fields": [
        "arcs",
        "bodyEpisodes",
        "coverage",
        "id",
        "latches",
        "lineages",
        "messages",
        "origins",
        "tick",
        "transit",
        "voyages"
      ],
      "arcReplacement": "sorted {id,root}; root is P structural at checkpoint, otherwise P delta commitment",
      "encoding": "SHA256(version+semicolon+previous+valueDelta(before,after)); valueDelta is the M2a annex grammar",
      "genesis": "structural SHA256 of the domain view with complete structural P roots",
      "checkpoint": "complete LIVE domain plus append-only archive; no RNG state"
    },
    "m3a": {
      "horizon": "Execution horizon excluded from default forced data, manifest and recipe; structural witnesses only at canonical chapter boundaries or terminal state.",
      "cellPartition": "civ-cell-binary-1",
      "cellAllocation": "fixed binary sorted IDs; floorDiv at each node; zero sum uses unit leaf weights; boundary weights use containing epoch",
      "townThreshold": 1000,
      "signalLightYearsDefault": "ceilDiv(distanceMicroLy,1000000); zero in-system; delivery uses the existing ceil rule",
      "contactRateQ32": "42949673 * receiver max Information * signal strength / 1000; physical meeting uses strength 1000 and max(1,Information)",
      "doom": "phase0 at stellarDoomYear; E>=5 opens permanent evacuation pressure, else remove all persons; null disables",
      "annotations": "RAID,TOWN_FOUNDED,TOWN_ABANDONED,LOCAL_FLOOD,LOCAL_SUCCESSION have no stock effects",
      "signal": "first post-commit I>=3 emits once on each outgoing route; immutable tier snapshot; no technology transfer on arrival/contact; DIFFUSION only",
      "startingRegime": "origins.startingRegime=1 copies the declared bounded initial regime to each origin, without replaying SAPIENCE stock grants",
      "frontOracle": "oracle.launchPeriodYears is a fixture-only scheduled launch at foundedYear+period, once per arc; period is a positive multiple of ten. Ordinary stock, tier and route gates still apply; natural dynamics and losses are disabled only by explicit existing fixture overrides.",
      "narrative": "N consumes sorted event log and IDs; grammar and N result are separately digested; no solver imports N",
      "witnessVersion": "m3a-delta-witness-1",
      "townIdentity": "(siteId, foundingTick) from region-only canonical boundary history; omitted history declares left-boundary view genesis"
    },
    "m4a": {
      "label": "scenario",
      "discoveryBaseQ32": 400,
      "discoveryCost": [
        [
          0,
          2,
          5,
          10,
          20,
          100,
          3000
        ],
        [
          0,
          2,
          5,
          10,
          20,
          100
        ],
        [
          0,
          2,
          5,
          10,
          20,
          100
        ],
        [
          0,
          2,
          5,
          10,
          20,
          100,
          500,
          2000
        ],
        [
          0,
          2,
          5,
          10,
          20,
          100
        ],
        [
          0,
          2,
          5,
          10,
          20
        ],
        [
          0,
          2,
          5,
          10,
          20,
          100
        ]
      ],
      "Nstar": [
        [
          0,
          100,
          500,
          2000,
          10000,
          40000,
          100000
        ],
        [
          0,
          50,
          100,
          500,
          5000,
          30000
        ],
        [
          0,
          100,
          500,
          1000,
          10000,
          50000
        ],
        [
          0,
          100,
          300,
          1000,
          5000,
          15000,
          40000,
          80000
        ],
        [
          0,
          50,
          200,
          1000,
          10000,
          40000
        ],
        [
          0,
          50,
          200,
          1000,
          10000
        ],
        [
          0,
          100,
          300,
          1000,
          10000,
          40000
        ]
      ],
      "colonyArchiveYears": 1000,
      "maintenance": "max(N_eff,floor(Nstar*learningBias/1000)) for occupied colony region with tier<=foundingTiers before foundedYear+1000; ordinary N_eff otherwise",
      "maxRecoveries": 4,
      "renewalQ32": 4294967,
      "cooldownYears": 1000,
      "backoffCountCap": 4,
      "targetFailuresRecord": [
        "body",
        "count",
        "eventId",
        "untilYear"
      ],
      "failurePayload": [
        "body",
        "eventId"
      ],
      "failureMessage": "TARGET_FAILURE",
      "failureDelivery": "declared link either direction; light speed, at least next tick; lost voyage waits at least planned arrival",
      "targetFilter": "exclude delivered signal body or targetFailures.untilYear > currentYear",
      "newPurposes": [],
      "scenarios": {
        "lonely-earthlike": {
          "habitabilityYears": 2000000,
          "untilYear": 320000
        },
        "forager-future": {
          "startEra": 0,
          "untilYear": 120000
        }
      }
    }
  },
  "frameworkReads": [
    "arc.body",
    "arc.chains",
    "arc.episode",
    "arc.hazardEpisodes",
    "arc.hazardLedger",
    "arc.id",
    "arc.inbox",
    "arc.lastDeath",
    "arc.latches",
    "arc.lineageId",
    "arc.outbox",
    "arc.polities",
    "arc.provenance",
    "arc.regions",
    "arc.targetFailures",
    "arc.tick",
    "domain.arcs",
    "domain.bodyEpisodes",
    "domain.id",
    "domain.latches",
    "domain.lineages",
    "domain.messages",
    "domain.origins",
    "domain.tick",
    "domain.transit",
    "domain.voyages",
    "hazard.E_q32",
    "hazard.H_q32",
    "hazard.closed",
    "hazard.episode",
    "hazard.hazardId",
    "hazard.key",
    "input.parameters",
    "latch.active",
    "latch.kind",
    "latch.subject",
    "lineage.arcs",
    "lineage.voyages",
    "provenance.entries",
    "provenance.field",
    "provenance.target",
    "region.recoveries",
    "voyage.hazard",
    "voyage.lastDeath"
  ],
  "frameworkWrites": [
    "arc.hazardEpisodes",
    "arc.hazardLedger",
    "arc.lastDeath",
    "arc.latches",
    "arc.provenance",
    "arc.targetFailures",
    "arc.tick",
    "domain.latches",
    "domain.tick",
    "hazard.E_q32",
    "hazard.H_q32",
    "hazard.closed",
    "hazard.episode",
    "hazard.hazardId",
    "hazard.key",
    "latch.active",
    "latch.kind",
    "latch.subject",
    "lineage.lastDeath",
    "provenance.entries",
    "provenance.field",
    "provenance.target",
    "region.recoveries",
    "voyage.hazard",
    "voyage.lastDeath"
  ],
  "kinds": [
    {
      "kind": "SAPIENCE",
      "kindRank": 1,
      "owner": "P",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M2a",
      "reads": [
        "input.environment",
        "lineage.scenarioParams",
        "origin.body",
        "origin.deliveryTick",
        "origin.status",
        "region.Kbase",
        "region.id",
        "region.localId"
      ],
      "writes": [
        "arc.body",
        "arc.chains",
        "arc.colonizer",
        "arc.episode",
        "arc.foundedYear",
        "arc.foundingTiers",
        "arc.id",
        "arc.inbox",
        "arc.isColony",
        "arc.lineageId",
        "arc.nonviable",
        "arc.outbox",
        "arc.outcome",
        "arc.perils",
        "arc.polities",
        "arc.regions",
        "arc.scenarioParams",
        "region.K",
        "region.Kbase",
        "region.berthsUsed",
        "region.caps",
        "region.ceilings",
        "region.collapse",
        "region.culture",
        "region.cultureId",
        "region.damage",
        "region.energy",
        "region.era",
        "region.forcing",
        "region.fuel",
        "region.id",
        "region.immunityTicks",
        "region.infra",
        "region.localId",
        "region.lowTicks",
        "region.polityId",
        "region.pop",
        "region.renewable",
        "region.resources",
        "region.spaceflight",
        "region.tiers"
      ]
    },
    {
      "kind": "MIGRATION",
      "kindRank": 2,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "chain.kind",
        "chain.refs",
        "chain.status",
        "input.environment",
        "region.K",
        "region.damage",
        "region.id",
        "region.polityId",
        "region.pop",
        "region.renewable"
      ],
      "writes": [
        "region.pop"
      ]
    },
    {
      "kind": "AGRICULTURE",
      "kindRank": 3,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "arc.scenarioParams",
        "input.environment",
        "region.caps",
        "region.id",
        "region.pop",
        "region.resources",
        "region.tiers"
      ],
      "writes": [
        "region.tiers"
      ]
    },
    {
      "kind": "FAMINE",
      "kindRank": 4,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2a",
      "reads": [
        "region.K",
        "region.damage",
        "region.id",
        "region.pop",
        "region.renewable"
      ],
      "writes": [
        "region.pop",
        "region.renewable"
      ]
    },
    {
      "kind": "PLAGUE",
      "kindRank": 5,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "chain.chainId",
        "chain.deadlineTick",
        "chain.frontier",
        "chain.kind",
        "chain.nextTick",
        "chain.refs",
        "chain.status",
        "chain.step",
        "chain.visited",
        "input.environment",
        "polity.eliteShare",
        "polity.id",
        "region.K",
        "region.id",
        "region.immunityTicks",
        "region.polityId",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "arc.chains",
        "chain.chainId",
        "chain.deadlineTick",
        "chain.frontier",
        "chain.kind",
        "chain.nextTick",
        "chain.reason",
        "chain.refs",
        "chain.status",
        "chain.step",
        "chain.visited",
        "polity.eliteShare",
        "region.immunityTicks",
        "region.pop"
      ]
    },
    {
      "kind": "CLIMATE_SHIFT",
      "kindRank": 6,
      "owner": "P",
      "trigger": "exogenous",
      "phase": 0,
      "milestone": "M2b",
      "reads": [
        "input.environment",
        "region.Kbase",
        "region.id",
        "region.localId",
        "region.resources"
      ],
      "writes": [
        "region.Kbase",
        "region.resources"
      ]
    },
    {
      "kind": "NATURAL_CATASTROPHE",
      "kindRank": 7,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "region.damage",
        "region.id",
        "region.infra",
        "region.pop"
      ],
      "writes": [
        "region.damage",
        "region.infra",
        "region.pop"
      ]
    },
    {
      "kind": "DISCOVERY",
      "kindRank": 8,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "arc.scenarioParams",
        "input.environment",
        "polity.hegemony",
        "polity.id",
        "region.caps",
        "region.id",
        "region.polityId",
        "region.pop",
        "region.resources",
        "region.tiers"
      ],
      "writes": [
        "region.tiers"
      ]
    },
    {
      "kind": "DIFFUSION",
      "kindRank": 9,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "arc.diffusionEdges",
        "input.environment",
        "polity.hegemony",
        "polity.id",
        "region.caps",
        "region.id",
        "region.polityId",
        "region.pop",
        "region.resources",
        "region.tiers"
      ],
      "writes": [
        "region.tiers"
      ]
    },
    {
      "kind": "TECH_LOSS",
      "kindRank": 10,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2a",
      "reads": [
        "arc.foundedYear",
        "arc.foundingTiers",
        "arc.isColony",
        "region.id",
        "region.lowTicks",
        "region.tiers"
      ],
      "writes": [
        "region.lowTicks",
        "region.tiers"
      ]
    },
    {
      "kind": "ENERGY_TRANSITION",
      "kindRank": 11,
      "owner": "P",
      "trigger": "threshold",
      "phase": 5,
      "milestone": "M2a",
      "reads": [
        "region.era",
        "region.id",
        "region.tiers"
      ],
      "writes": []
    },
    {
      "kind": "POLITY_FOUNDING",
      "kindRank": 12,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "region.K",
        "region.id",
        "region.localId",
        "region.polityId",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "arc.polities",
        "polity.asabiya",
        "polity.capital",
        "polity.eliteShare",
        "polity.endedYear",
        "polity.foundedYear",
        "polity.hegemony",
        "polity.id",
        "polity.legitimacy",
        "polity.parentIds",
        "polity.regime",
        "polity.regions",
        "polity.stress",
        "polity.warWeariness",
        "region.polityId"
      ]
    },
    {
      "kind": "WAR",
      "kindRank": 13,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "chain.chainId",
        "chain.deadlineTick",
        "chain.kind",
        "chain.nextTick",
        "chain.refs",
        "chain.status",
        "chain.step",
        "input.environment",
        "polity.asabiya",
        "polity.capital",
        "polity.endedYear",
        "polity.id",
        "polity.regions",
        "polity.stress",
        "polity.warWeariness",
        "region.culture",
        "region.id",
        "region.infra",
        "region.polityId",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "arc.chains",
        "chain.chainId",
        "chain.deadlineTick",
        "chain.frontier",
        "chain.kind",
        "chain.nextTick",
        "chain.reason",
        "chain.refs",
        "chain.status",
        "chain.step",
        "chain.visited",
        "polity.warWeariness",
        "region.infra",
        "region.pop"
      ]
    },
    {
      "kind": "CONQUEST",
      "kindRank": 14,
      "owner": "P",
      "trigger": "chain",
      "phase": 3,
      "milestone": "M2a",
      "reads": [
        "chain.chainId",
        "chain.deadlineTick",
        "chain.kind",
        "chain.nextTick",
        "chain.refs",
        "chain.status",
        "chain.step",
        "input.environment",
        "polity.asabiya",
        "polity.endedYear",
        "polity.id",
        "polity.regions",
        "polity.warWeariness",
        "region.id",
        "region.polityId",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "chain.frontier",
        "chain.nextTick",
        "chain.reason",
        "chain.status",
        "chain.step",
        "chain.visited",
        "region.polityId"
      ]
    },
    {
      "kind": "HEGEMONY",
      "kindRank": 15,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2b",
      "reads": [
        "polity.endedYear",
        "polity.hegemony",
        "polity.id",
        "polity.regions",
        "region.id",
        "region.pop"
      ],
      "writes": [
        "polity.hegemony"
      ]
    },
    {
      "kind": "FRAGMENTATION",
      "kindRank": 16,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "polity.eliteShare",
        "polity.endedYear",
        "polity.id",
        "polity.regime",
        "polity.regions",
        "polity.stress",
        "polity.warWeariness",
        "region.id",
        "region.localId",
        "region.polityId"
      ],
      "writes": [
        "arc.polities",
        "polity.asabiya",
        "polity.capital",
        "polity.eliteShare",
        "polity.endedYear",
        "polity.foundedYear",
        "polity.hegemony",
        "polity.id",
        "polity.legitimacy",
        "polity.parentIds",
        "polity.regime",
        "polity.regions",
        "polity.stress",
        "polity.warWeariness",
        "region.polityId"
      ]
    },
    {
      "kind": "REVOLUTION",
      "kindRank": 17,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "arc.perils",
        "polity.eliteShare",
        "polity.endedYear",
        "polity.id",
        "polity.legitimacy",
        "polity.regime",
        "polity.regions",
        "polity.stress",
        "region.id",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "polity.eliteShare",
        "polity.legitimacy",
        "polity.regime",
        "polity.stress"
      ]
    },
    {
      "kind": "SCHISM",
      "kindRank": 18,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "polity.capital",
        "polity.endedYear",
        "polity.id",
        "polity.regions",
        "polity.stress",
        "region.culture",
        "region.cultureId",
        "region.id",
        "region.localId"
      ],
      "writes": [
        "region.culture",
        "region.cultureId"
      ]
    },
    {
      "kind": "COLLAPSE",
      "kindRank": 19,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2a",
      "reads": [
        "polity.eliteShare",
        "polity.endedYear",
        "polity.id",
        "polity.regime",
        "polity.regions",
        "polity.stress",
        "polity.warWeariness",
        "region.collapse",
        "region.era",
        "region.id",
        "region.infra",
        "region.localId",
        "region.polityId",
        "region.pop",
        "region.recoveries",
        "region.tiers"
      ],
      "writes": [
        "arc.polities",
        "polity.asabiya",
        "polity.capital",
        "polity.eliteShare",
        "polity.endedYear",
        "polity.foundedYear",
        "polity.hegemony",
        "polity.id",
        "polity.legitimacy",
        "polity.parentIds",
        "polity.regime",
        "polity.regions",
        "polity.stress",
        "polity.warWeariness",
        "region.collapse",
        "region.infra",
        "region.polityId",
        "region.pop",
        "region.tiers"
      ]
    },
    {
      "kind": "RECOVERY",
      "kindRank": 20,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2a",
      "reads": [
        "region.collapse",
        "region.id",
        "region.infra",
        "region.pop",
        "region.recoveries"
      ],
      "writes": [
        "region.collapse",
        "region.recoveries"
      ]
    },
    {
      "kind": "NUCLEAR_WAR",
      "kindRank": 21,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "arc.perils",
        "arc.scenarioParams",
        "chain.kind",
        "chain.refs",
        "chain.status",
        "polity.endedYear",
        "polity.id",
        "polity.regions",
        "region.caps",
        "region.collapse",
        "region.damage",
        "region.id",
        "region.infra",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "arc.outbox",
        "message.causeEventId",
        "message.deliveryTick",
        "message.id",
        "message.payload",
        "message.targetId",
        "message.type",
        "region.caps",
        "region.collapse",
        "region.damage",
        "region.infra",
        "region.pop",
        "region.tiers"
      ]
    },
    {
      "kind": "ENGINEERED_PANDEMIC",
      "kindRank": 22,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "arc.perils",
        "arc.scenarioParams",
        "region.caps",
        "region.collapse",
        "region.id",
        "region.infra",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "arc.outbox",
        "message.causeEventId",
        "message.deliveryTick",
        "message.id",
        "message.payload",
        "message.targetId",
        "message.type",
        "region.caps",
        "region.collapse",
        "region.infra",
        "region.pop",
        "region.tiers"
      ]
    },
    {
      "kind": "RUNAWAY_TECH",
      "kindRank": 23,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "arc.perils",
        "arc.scenarioParams",
        "region.caps",
        "region.collapse",
        "region.id",
        "region.infra",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "arc.outbox",
        "message.causeEventId",
        "message.deliveryTick",
        "message.id",
        "message.payload",
        "message.targetId",
        "message.type",
        "region.caps",
        "region.collapse",
        "region.infra",
        "region.pop",
        "region.tiers"
      ]
    },
    {
      "kind": "CLIMATE_CATASTROPHE",
      "kindRank": 24,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2b",
      "reads": [
        "region.damage",
        "region.forcing",
        "region.id",
        "region.pop"
      ],
      "writes": [
        "region.damage"
      ]
    },
    {
      "kind": "SPACEFLIGHT",
      "kindRank": 25,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2b",
      "reads": [
        "region.id",
        "region.spaceflight",
        "region.tiers"
      ],
      "writes": [
        "region.spaceflight"
      ]
    },
    {
      "kind": "LAUNCH",
      "kindRank": 26,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "arc.colonizer",
        "arc.evacuating",
        "arc.signals",
        "arc.targetFailures",
        "input.routes",
        "region.berthsUsed",
        "region.culture",
        "region.cultureId",
        "region.fuel",
        "region.id",
        "region.infra",
        "region.localId",
        "region.pop",
        "region.spaceflight",
        "region.tiers"
      ],
      "writes": [
        "arc.outbox",
        "message.causeEventId",
        "message.deliveryTick",
        "message.id",
        "message.payload",
        "message.targetId",
        "message.type",
        "region.berthsUsed",
        "region.fuel",
        "region.infra",
        "region.pop",
        "transit.id",
        "transit.pop"
      ]
    },
    {
      "kind": "VOYAGE_LOST",
      "kindRank": 27,
      "owner": "D",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M2b",
      "reads": [
        "transit.id",
        "transit.pop",
        "voyage.deliveryTick",
        "voyage.id",
        "voyage.launchYear",
        "voyage.status",
        "voyage.tiers"
      ],
      "writes": [
        "transit.pop",
        "voyage.status"
      ]
    },
    {
      "kind": "COLONY_FOUNDED",
      "kindRank": 28,
      "owner": "D",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M2b",
      "reads": [
        "arc.outcome",
        "input.environment",
        "lineage.id",
        "lineage.scenarioParams",
        "message.deliveryTick",
        "message.id",
        "message.payload",
        "region.K",
        "region.Kbase",
        "region.id",
        "region.localId",
        "region.pop",
        "transit.id",
        "transit.pop",
        "voyage.arrivalYear",
        "voyage.culture",
        "voyage.cultureId",
        "voyage.deliveryTick",
        "voyage.destination",
        "voyage.id",
        "voyage.launchEventId",
        "voyage.launchYear",
        "voyage.lineageId",
        "voyage.status",
        "voyage.tiers"
      ],
      "writes": [
        "arc.body",
        "arc.chains",
        "arc.colonizer",
        "arc.episode",
        "arc.foundedYear",
        "arc.foundingTiers",
        "arc.id",
        "arc.inbox",
        "arc.isColony",
        "arc.lineageId",
        "arc.nonviable",
        "arc.outbox",
        "arc.outcome",
        "arc.perils",
        "arc.polities",
        "arc.regions",
        "arc.scenarioParams",
        "domain.arcs",
        "domain.bodyEpisodes",
        "lineage.arcs",
        "lineage.foundedArcs",
        "region.K",
        "region.Kbase",
        "region.berthsUsed",
        "region.caps",
        "region.ceilings",
        "region.collapse",
        "region.culture",
        "region.cultureId",
        "region.damage",
        "region.energy",
        "region.era",
        "region.forcing",
        "region.fuel",
        "region.id",
        "region.immunityTicks",
        "region.infra",
        "region.localId",
        "region.lowTicks",
        "region.polityId",
        "region.pop",
        "region.renewable",
        "region.resources",
        "region.spaceflight",
        "region.tiers",
        "transit.pop",
        "voyage.status"
      ]
    },
    {
      "kind": "COLONY_LOST",
      "kindRank": 29,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2b",
      "reads": [
        "arc.isColony",
        "arc.nonviable",
        "region.pop"
      ],
      "writes": [
        "arc.nonviable"
      ]
    },
    {
      "kind": "EXTINCTION",
      "kindRank": 30,
      "owner": "P",
      "trigger": "threshold",
      "phase": 1,
      "milestone": "M2a",
      "reads": [
        "arc.outcome",
        "polity.endedYear",
        "polity.id",
        "region.id",
        "region.polityId",
        "region.pop"
      ],
      "writes": [
        "arc.outcome",
        "polity.endedYear",
        "region.polityId"
      ]
    },
    {
      "kind": "LINEAGE_EXTINCTION",
      "kindRank": 31,
      "owner": "D",
      "trigger": "threshold",
      "phase": 5,
      "milestone": "M2b",
      "reads": [
        "lineage.foundedArcs",
        "lineage.id",
        "lineage.lastDeath",
        "transit.id",
        "transit.pop",
        "voyage.lineageId",
        "voyage.status"
      ],
      "writes": [
        "lineage.extinctionCause",
        "lineage.outcomeClass"
      ]
    },
    {
      "kind": "STELLAR_DOOM",
      "kindRank": 32,
      "owner": "P",
      "trigger": "exogenous",
      "phase": 0,
      "milestone": "M3a",
      "reads": [
        "arc.evacuating",
        "input.environment",
        "region.pop",
        "region.tiers"
      ],
      "writes": [
        "arc.evacuating",
        "region.pop"
      ],
      "salience": 1000
    },
    {
      "kind": "SIGNAL_ARRIVAL",
      "kindRank": 33,
      "owner": "D",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M3a",
      "reads": [
        "arc.signals",
        "message.deliveryTick",
        "message.payload",
        "message.targetId"
      ],
      "writes": [
        "arc.signals"
      ],
      "salience": 650
    },
    {
      "kind": "FIRST_CONTACT",
      "kindRank": 34,
      "owner": "P",
      "trigger": "hazard",
      "phase": 2,
      "milestone": "M3a",
      "reads": [
        "arc.contacts",
        "arc.lineageId",
        "arc.signals",
        "region.tiers"
      ],
      "writes": [
        "arc.contacts",
        "arc.diffusionEdges"
      ],
      "salience": 900
    },
    {
      "kind": "RAID",
      "kindRank": 35,
      "owner": "C",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M3a",
      "reads": [
        "cell.pop"
      ],
      "writes": [],
      "salience": 100
    },
    {
      "kind": "TOWN_FOUNDED",
      "kindRank": 36,
      "owner": "C",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M3a",
      "reads": [
        "cell.pop"
      ],
      "writes": [],
      "salience": 100
    },
    {
      "kind": "TOWN_ABANDONED",
      "kindRank": 37,
      "owner": "C",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M3a",
      "reads": [
        "cell.pop"
      ],
      "writes": [],
      "salience": 100
    },
    {
      "kind": "LOCAL_FLOOD",
      "kindRank": 38,
      "owner": "C",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M3a",
      "reads": [
        "cell.pop"
      ],
      "writes": [],
      "salience": 100
    },
    {
      "kind": "LOCAL_SUCCESSION",
      "kindRank": 39,
      "owner": "C",
      "trigger": "scheduled",
      "phase": 0,
      "milestone": "M3a",
      "reads": [
        "cell.pop"
      ],
      "writes": [],
      "salience": 100
    }
  ],
  "fields": [
    {
      "path": "arc.body",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.chains",
      "type": "Array",
      "unit": "chain_records",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P3",
        "P5e",
        "PLAGUE",
        "SAPIENCE",
        "WAR"
      ]
    },
    {
      "path": "arc.colonizer",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.contacts",
      "type": "Array",
      "unit": "contact_records",
      "writtenBy": [
        "INIT",
        "FIRST_CONTACT"
      ]
    },
    {
      "path": "arc.diffusionEdges",
      "type": "Array",
      "unit": "received_tier_snapshots",
      "writtenBy": [
        "INIT",
        "FIRST_CONTACT"
      ]
    },
    {
      "path": "arc.episode",
      "type": "Number",
      "unit": "count",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.evacuating",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "INIT",
        "STELLAR_DOOM"
      ]
    },
    {
      "path": "arc.foundedYear",
      "type": "Number",
      "unit": "year",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.foundingTiers",
      "type": "NumberTuple7",
      "unit": "inherited_tiers",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.hazardEpisodes",
      "type": "Array",
      "unit": "next_episode_per_acquisition_key",
      "writtenBy": [
        "INIT",
        "P5e"
      ]
    },
    {
      "path": "arc.hazardLedger",
      "type": "Array",
      "unit": "hazard_records",
      "writtenBy": [
        "INIT",
        "P2",
        "P5c",
        "P5e"
      ]
    },
    {
      "path": "arc.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.inbox",
      "type": "Array",
      "unit": "message_records",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D0",
        "INIT",
        "P0",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.isColony",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.lastDeath",
      "type": "DeathWitnessOrNull",
      "unit": "death_witness",
      "writtenBy": [
        "INIT",
        "P0",
        "P5a",
        "P5b"
      ]
    },
    {
      "path": "arc.latches",
      "type": "Array",
      "unit": "latch_records",
      "writtenBy": [
        "INIT",
        "P1",
        "P5e"
      ]
    },
    {
      "path": "arc.lineageId",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.nonviable",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "COLONY_FOUNDED",
        "COLONY_LOST",
        "INIT",
        "P5b",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.outbox",
      "type": "Array",
      "unit": "message_records",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D2",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NUCLEAR_WAR",
        "P0",
        "P5b",
        "RUNAWAY_TECH",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.outcome",
      "type": "Outcome",
      "unit": "outcome_axes",
      "writtenBy": [
        "COLONY_FOUNDED",
        "EXTINCTION",
        "INIT",
        "P0",
        "P5c",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.perils",
      "type": "String",
      "unit": "perils_state",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P0",
        "P5c",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.polities",
      "type": "Array",
      "unit": "polity_records",
      "writtenBy": [
        "COLLAPSE",
        "COLONY_FOUNDED",
        "FRAGMENTATION",
        "INIT",
        "P5e",
        "POLITY_FOUNDING",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.provenance",
      "type": "Array",
      "unit": "provenance_records",
      "writtenBy": [
        "INIT",
        "P5e"
      ]
    },
    {
      "path": "arc.regions",
      "type": "Array",
      "unit": "region_records",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.scenarioParams",
      "type": "Priors",
      "unit": "parameters",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "arc.signals",
      "type": "Array",
      "unit": "signal_records",
      "writtenBy": [
        "INIT",
        "P0",
        "SIGNAL_ARRIVAL"
      ]
    },
    {
      "path": "arc.targetFailures",
      "type": "Array",
      "unit": "failure_memory_records",
      "writtenBy": [
        "INIT",
        "P0"
      ]
    },
    {
      "path": "arc.tick",
      "type": "BigInt",
      "unit": "tick",
      "writtenBy": [
        "INIT",
        "P5e"
      ]
    },
    {
      "path": "cell.pop",
      "type": "BigInt",
      "unit": "persons",
      "writtenBy": [
        "C"
      ]
    },
    {
      "path": "chain.chainId",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "INIT",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.deadlineTick",
      "type": "BigInt",
      "unit": "tick",
      "writtenBy": [
        "INIT",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.frontier",
      "type": "StringArray",
      "unit": "identities",
      "writtenBy": [
        "CONQUEST",
        "INIT",
        "P3",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.kind",
      "type": "String",
      "unit": "kind",
      "writtenBy": [
        "INIT",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.nextTick",
      "type": "BigIntOrNull",
      "unit": "tick",
      "writtenBy": [
        "CONQUEST",
        "INIT",
        "P3",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.reason",
      "type": "StringOrNull",
      "unit": "reason",
      "writtenBy": [
        "CONQUEST",
        "INIT",
        "P3",
        "P5c",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.refs",
      "type": "Array",
      "unit": "typed_references",
      "writtenBy": [
        "INIT",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.status",
      "type": "String",
      "unit": "chain_status",
      "writtenBy": [
        "CONQUEST",
        "INIT",
        "P3",
        "P5c",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.step",
      "type": "Number",
      "unit": "count",
      "writtenBy": [
        "CONQUEST",
        "INIT",
        "P3",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "chain.visited",
      "type": "StringArray",
      "unit": "identities",
      "writtenBy": [
        "CONQUEST",
        "INIT",
        "P3",
        "PLAGUE",
        "WAR"
      ]
    },
    {
      "path": "domain.arcs",
      "type": "Array",
      "unit": "arc_records",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D0",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "domain.bodyEpisodes",
      "type": "Array",
      "unit": "body_episode_records",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D0",
        "INIT"
      ]
    },
    {
      "path": "domain.coverage",
      "type": "String",
      "unit": "coverage",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "domain.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "domain.latches",
      "type": "Array",
      "unit": "latch_records",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "domain.lineages",
      "type": "Array",
      "unit": "lineage_records",
      "writtenBy": [
        "D0",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "domain.messages",
      "type": "Array",
      "unit": "message_records",
      "writtenBy": [
        "D0",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "domain.origins",
      "type": "Array",
      "unit": "origin_records",
      "writtenBy": [
        "D0",
        "INIT"
      ]
    },
    {
      "path": "domain.tick",
      "type": "BigInt",
      "unit": "tick",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "domain.transit",
      "type": "Array",
      "unit": "transit_records",
      "writtenBy": [
        "D0",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "domain.voyages",
      "type": "Array",
      "unit": "voyage_records",
      "writtenBy": [
        "D0",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "hazard.E_q32",
      "type": "BigInt",
      "unit": "threshold_q32",
      "writtenBy": [
        "D1",
        "INIT",
        "P2"
      ]
    },
    {
      "path": "hazard.H_q32",
      "type": "BigInt",
      "unit": "integrated_hazard_q32",
      "writtenBy": [
        "D1",
        "INIT",
        "P2"
      ]
    },
    {
      "path": "hazard.closed",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "D2",
        "INIT",
        "P5c"
      ]
    },
    {
      "path": "hazard.episode",
      "type": "BigInt",
      "unit": "count",
      "writtenBy": [
        "D1",
        "INIT",
        "P2"
      ]
    },
    {
      "path": "hazard.hazardId",
      "type": "HazardId",
      "unit": "identity_tuple",
      "writtenBy": [
        "D1",
        "INIT",
        "P2"
      ]
    },
    {
      "path": "hazard.key",
      "type": "String",
      "unit": "hex_identity",
      "writtenBy": [
        "D1",
        "INIT",
        "P2"
      ]
    },
    {
      "path": "input.environment",
      "type": "Environment",
      "unit": "immutable_adapter_data",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "input.parameters",
      "type": "Parameters",
      "unit": "immutable_model_data",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "input.routes",
      "type": "Array",
      "unit": "route_records",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "latch.active",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "D2",
        "INIT",
        "P1"
      ]
    },
    {
      "path": "latch.kind",
      "type": "String",
      "unit": "kind",
      "writtenBy": [
        "D2",
        "INIT",
        "P1"
      ]
    },
    {
      "path": "latch.subject",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "INIT",
        "P1"
      ]
    },
    {
      "path": "lineage.arcs",
      "type": "StringArray",
      "unit": "identities",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D0",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "lineage.contacts",
      "type": "StringArray",
      "unit": "identities",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "lineage.extinctionCause",
      "type": "StringOrNull",
      "unit": "event_identity",
      "writtenBy": [
        "D2",
        "INIT",
        "LINEAGE_EXTINCTION"
      ]
    },
    {
      "path": "lineage.foundedArcs",
      "type": "Number",
      "unit": "count",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D0",
        "INIT"
      ]
    },
    {
      "path": "lineage.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "lineage.lastDeath",
      "type": "DeathWitnessOrNull",
      "unit": "death_witness",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "lineage.outcomeClass",
      "type": "String",
      "unit": "outcome_class",
      "writtenBy": [
        "D2",
        "INIT",
        "LINEAGE_EXTINCTION"
      ]
    },
    {
      "path": "lineage.perilsSafe",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "lineage.scenarioParams",
      "type": "Priors",
      "unit": "parameters",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "lineage.voyages",
      "type": "StringArray",
      "unit": "identities",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "message.causeEventId",
      "type": "StringOrNull",
      "unit": "event_identity",
      "writtenBy": [
        "D2",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NUCLEAR_WAR",
        "RUNAWAY_TECH"
      ]
    },
    {
      "path": "message.deliveryTick",
      "type": "BigInt",
      "unit": "tick",
      "writtenBy": [
        "D2",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NUCLEAR_WAR",
        "RUNAWAY_TECH"
      ]
    },
    {
      "path": "message.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NUCLEAR_WAR",
        "P5e",
        "RUNAWAY_TECH"
      ]
    },
    {
      "path": "message.payload",
      "type": "Payload",
      "unit": "message_data",
      "writtenBy": [
        "D2",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NUCLEAR_WAR",
        "RUNAWAY_TECH"
      ]
    },
    {
      "path": "message.targetId",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NUCLEAR_WAR",
        "RUNAWAY_TECH"
      ]
    },
    {
      "path": "message.type",
      "type": "String",
      "unit": "message_type",
      "writtenBy": [
        "D2",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NUCLEAR_WAR",
        "RUNAWAY_TECH"
      ]
    },
    {
      "path": "origin.body",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "origin.deliveryTick",
      "type": "BigIntOrNull",
      "unit": "tick",
      "writtenBy": [
        "D0",
        "INIT"
      ]
    },
    {
      "path": "origin.rates",
      "type": "BigIntTuple3",
      "unit": "annual_hazard_q32",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "origin.sapienceYear",
      "type": "NumberOrNull",
      "unit": "year",
      "writtenBy": [
        "D0",
        "INIT"
      ]
    },
    {
      "path": "origin.status",
      "type": "String",
      "unit": "origin_status",
      "writtenBy": [
        "D0",
        "INIT"
      ]
    },
    {
      "path": "origin.waitYears",
      "type": "BigIntTuple3",
      "unit": "years",
      "writtenBy": [
        "INIT"
      ]
    },
    {
      "path": "polity.asabiya",
      "type": "Number",
      "unit": "permille",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "P5a",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.capital",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "P5c",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.eliteShare",
      "type": "Number",
      "unit": "permille",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "P5a",
        "PLAGUE",
        "POLITY_FOUNDING",
        "REVOLUTION"
      ]
    },
    {
      "path": "polity.endedYear",
      "type": "NumberOrNull",
      "unit": "year",
      "writtenBy": [
        "COLLAPSE",
        "EXTINCTION",
        "FRAGMENTATION",
        "INIT",
        "P5c",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.foundedYear",
      "type": "Number",
      "unit": "year",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.hegemony",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "HEGEMONY",
        "INIT",
        "P5c",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.legitimacy",
      "type": "Number",
      "unit": "permille",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "P5a",
        "POLITY_FOUNDING",
        "REVOLUTION"
      ]
    },
    {
      "path": "polity.parentIds",
      "type": "StringArray",
      "unit": "identities",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.regime",
      "type": "String",
      "unit": "regime",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "POLITY_FOUNDING",
        "REVOLUTION"
      ]
    },
    {
      "path": "polity.regions",
      "type": "StringArray",
      "unit": "identities",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "P5c",
        "POLITY_FOUNDING"
      ]
    },
    {
      "path": "polity.stress",
      "type": "Number",
      "unit": "permille",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "P5a",
        "POLITY_FOUNDING",
        "REVOLUTION"
      ]
    },
    {
      "path": "polity.warWeariness",
      "type": "Number",
      "unit": "permille",
      "writtenBy": [
        "COLLAPSE",
        "FRAGMENTATION",
        "INIT",
        "P5a",
        "POLITY_FOUNDING",
        "WAR"
      ]
    },
    {
      "path": "provenance.entries",
      "type": "Array",
      "unit": "scored_event_references",
      "writtenBy": [
        "INIT",
        "P5e"
      ]
    },
    {
      "path": "provenance.field",
      "type": "String",
      "unit": "field_path",
      "writtenBy": [
        "INIT",
        "P5e"
      ]
    },
    {
      "path": "provenance.target",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "INIT",
        "P5e"
      ]
    },
    {
      "path": "region.K",
      "type": "BigInt",
      "unit": "persons",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P0",
        "P5c",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.Kbase",
      "type": "BigInt",
      "unit": "persons",
      "writtenBy": [
        "CLIMATE_SHIFT",
        "COLONY_FOUNDED",
        "INIT",
        "P0",
        "P5c",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.berthsUsed",
      "type": "Number",
      "unit": "persons_this_tick",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "LAUNCH",
        "P0",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.caps",
      "type": "NumberTuple7",
      "unit": "tiers",
      "writtenBy": [
        "COLONY_FOUNDED",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "NUCLEAR_WAR",
        "P0",
        "RUNAWAY_TECH",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.ceilings",
      "type": "Array",
      "unit": "ceiling_records",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P5c",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.collapse",
      "type": "CollapseOrNull",
      "unit": "recovery_targets",
      "writtenBy": [
        "COLLAPSE",
        "COLONY_FOUNDED",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "NUCLEAR_WAR",
        "P0",
        "RECOVERY",
        "RUNAWAY_TECH",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.culture",
      "type": "NumberTuple3",
      "unit": "permille",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P5a",
        "SAPIENCE",
        "SCHISM"
      ]
    },
    {
      "path": "region.cultureId",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE",
        "SCHISM"
      ]
    },
    {
      "path": "region.damage",
      "type": "Array",
      "unit": "damage_records",
      "writtenBy": [
        "CLIMATE_CATASTROPHE",
        "COLONY_FOUNDED",
        "INIT",
        "NATURAL_CATASTROPHE",
        "NUCLEAR_WAR",
        "P0",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.energy",
      "type": "BigInt",
      "unit": "kcal_per_day",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P0",
        "P5c",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.era",
      "type": "Number",
      "unit": "era",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P0",
        "P5c",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.forcing",
      "type": "BigInt",
      "unit": "forcing_units",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P5a",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.fuel",
      "type": "BigInt",
      "unit": "fuel_units",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "LAUNCH",
        "P5a",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.immunityTicks",
      "type": "Number",
      "unit": "ticks",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P5a",
        "PLAGUE",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.infra",
      "type": "BigInt",
      "unit": "capital",
      "writtenBy": [
        "COLLAPSE",
        "COLONY_FOUNDED",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "LAUNCH",
        "NATURAL_CATASTROPHE",
        "NUCLEAR_WAR",
        "P0",
        "P5a",
        "RUNAWAY_TECH",
        "SAPIENCE",
        "WAR"
      ]
    },
    {
      "path": "region.localId",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.lowTicks",
      "type": "NumberTuple7",
      "unit": "ticks",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P5a",
        "SAPIENCE",
        "TECH_LOSS"
      ]
    },
    {
      "path": "region.polityId",
      "type": "StringOrNull",
      "unit": "identity",
      "writtenBy": [
        "COLLAPSE",
        "COLONY_FOUNDED",
        "CONQUEST",
        "EXTINCTION",
        "FRAGMENTATION",
        "INIT",
        "P5c",
        "POLITY_FOUNDING",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.pop",
      "type": "BigInt",
      "unit": "persons",
      "writtenBy": [
        "COLLAPSE",
        "COLONY_FOUNDED",
        "ENGINEERED_PANDEMIC",
        "FAMINE",
        "INIT",
        "LAUNCH",
        "MIGRATION",
        "NATURAL_CATASTROPHE",
        "NUCLEAR_WAR",
        "P0",
        "P5a",
        "PLAGUE",
        "RUNAWAY_TECH",
        "SAPIENCE",
        "WAR",
        "STELLAR_DOOM"
      ]
    },
    {
      "path": "region.recoveries",
      "type": "Number",
      "unit": "completed_recoveries",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "RECOVERY",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.renewable",
      "type": "Number",
      "unit": "permille",
      "writtenBy": [
        "COLONY_FOUNDED",
        "FAMINE",
        "INIT",
        "P5a",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.resources",
      "type": "NumberTuple4",
      "unit": "permille",
      "writtenBy": [
        "CLIMATE_SHIFT",
        "COLONY_FOUNDED",
        "INIT",
        "P0",
        "SAPIENCE"
      ]
    },
    {
      "path": "region.spaceflight",
      "type": "Boolean",
      "unit": "flag",
      "writtenBy": [
        "COLONY_FOUNDED",
        "INIT",
        "P1",
        "P5b",
        "SAPIENCE",
        "SPACEFLIGHT"
      ]
    },
    {
      "path": "region.tiers",
      "type": "NumberTuple7",
      "unit": "tiers",
      "writtenBy": [
        "AGRICULTURE",
        "COLLAPSE",
        "COLONY_FOUNDED",
        "DIFFUSION",
        "DISCOVERY",
        "ENGINEERED_PANDEMIC",
        "INIT",
        "NUCLEAR_WAR",
        "P0",
        "P5c",
        "RUNAWAY_TECH",
        "SAPIENCE",
        "TECH_LOSS"
      ]
    },
    {
      "path": "transit.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "INIT",
        "LAUNCH"
      ]
    },
    {
      "path": "transit.pop",
      "type": "BigInt",
      "unit": "persons",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D0",
        "D1",
        "D2",
        "INIT",
        "LAUNCH",
        "VOYAGE_LOST"
      ]
    },
    {
      "path": "voyage.arrivalYear",
      "type": "Number",
      "unit": "year",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.culture",
      "type": "NumberTuple3",
      "unit": "permille",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.cultureId",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.deliveryTick",
      "type": "BigInt",
      "unit": "tick",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.destination",
      "type": "String",
      "unit": "body_identity",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.hazard",
      "type": "HazardOrNull",
      "unit": "hazard_record",
      "writtenBy": [
        "D0",
        "D1",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.id",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.lastDeath",
      "type": "DeathWitnessOrNull",
      "unit": "death_witness",
      "writtenBy": [
        "D0",
        "D1",
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.launchEventId",
      "type": "String",
      "unit": "event_identity",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.launchYear",
      "type": "Number",
      "unit": "year",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.lineageId",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.sourceArc",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.sourceRegion",
      "type": "String",
      "unit": "identity",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    },
    {
      "path": "voyage.status",
      "type": "String",
      "unit": "voyage_status",
      "writtenBy": [
        "COLONY_FOUNDED",
        "D0",
        "D2",
        "INIT",
        "VOYAGE_LOST"
      ]
    },
    {
      "path": "voyage.tiers",
      "type": "NumberTuple7",
      "unit": "tiers",
      "writtenBy": [
        "D2",
        "INIT"
      ]
    }
  ]
}
```

<!-- M2A-WITNESS-ANNEX -->
## Revision log (M2a performance round 2)

This append-only, representation-only annex supersedes the compact tick-witness
encoding above. The original machine block continues to specify the full
structural state digest at boundaries. Rates, gates, event outcomes and RNG
addresses are unchanged. `CONTRACT_TEXT` excludes the delimiter newline and this
annex, retaining the exact prior contract bytes in the RNG manifest. The new
version is committed in every P tick ledger and delta hash, hence in chapter and
result roots. Editing the original contract still changes the RNG manifest.

A delta commits every changed arc/region field and every changed live hazard
record, plus the previous witness. It is value-defined: shared identity is only
a fast equality check. Existing hazard identities cannot change without a new
key. Full structural boundary commitments and complete checkpoints let replay
from any checkpoint reproduce every tick witness and the chapter root without
a hidden RNG cursor or cached digest. Intermediate witnesses describe transitions,
not standalone structural state hashes. Auditors must replay the transition;
`stateDigest` still verifies a complete boundary state independently.

Natural-step rows remain available in inspection output. Compact leaves commit
the resulting state delta and event IDs instead of repeating those rows. P and
D chapter encoding remains canonical JSON, now hashed as bounded UTF-8 chunks.
Chapter memoization is a two-entry LRU; only explicit `run()` inspection requests
retain per-tick snapshots. Caches may be evicted without changing results.

### Delta witness encoding (normative)

Lengths count JavaScript UTF-16 code units; the completed text is encoded as
UTF-8 for SHA-256. Counts and indices are nonnegative decimal integers. Scalars
use the same integer/BigInt semantics as canonical JSON. Prefix tags and counts
make the encoding self-delimiting, including arbitrary Unicode and delimiters
inside string values. Omitted fields/entries retain their previous values.

```json
{
  "version": "m4a-delta-witness-1",
  "arcFields": [
    "body",
    "chains",
    "colonizer",
    "contacts",
    "diffusionEdges",
    "episode",
    "evacuating",
    "foundedYear",
    "foundingTiers",
    "hazardEpisodes",
    "id",
    "inbox",
    "isColony",
    "lastDeath",
    "latches",
    "lineageId",
    "nonviable",
    "outbox",
    "outcome",
    "perils",
    "polities",
    "provenance",
    "scenarioParams",
    "signals",
    "targetFailures",
    "tick"
  ],
  "regionFields": [
    "K",
    "Kbase",
    "berthsUsed",
    "caps",
    "ceilings",
    "collapse",
    "culture",
    "cultureId",
    "damage",
    "energy",
    "era",
    "forcing",
    "fuel",
    "id",
    "immunityTicks",
    "infra",
    "localId",
    "lowTicks",
    "polityId",
    "pop",
    "recoveries",
    "renewable",
    "resources",
    "spaceflight",
    "tiers"
  ],
  "hash": "SHA256(UTF8(transitionText))",
  "text": "version + semicolon + previous digest (64 hex characters) + arc field patch + region patch + hazard patch",
  "value": "z=null; f/t=boolean; n<integer>;=Number; s<UTF16 length>:<text>=string (BigInts become decimal strings); a<count>:<values>=array; o<count>:<sorted string key/value pairs>=object",
  "delta": "v<value>=replace; a<count>:<index>;<delta>...=patch equal-length array; o<count>:<index>;<delta>...=patch equal-key object, indices into sorted old keys; equality emits nothing",
  "fields": "<count>:<field index>;<delta>...; indices into arcFields or regionFields",
  "regions": "<count>:<region index>;<field patch>...; fixed partition order",
  "hazards": "<count>:<64-hex-key><operation>... in sorted key order. d=delete. v<value>=new complete record. c<H>;<atTick>;<rate>;<E or empty>;<episode or empty>;<t/f closed>=update. Empty E/episode means unchanged; identity is immutable for an existing key.",
  "ledger": [
    "witnessVersion",
    "arcId",
    "tick",
    "startState",
    "eventIds",
    "endState",
    "structural",
    "phase0",
    "archived"
  ],
  "boundaries": "At chapter/checkpoint boundaries (tick divisible by 640), terminal tick, structural is the full stateDigest. Otherwise null. The following startState uses structural when present, else previous endState. A checkpoint starts with stateDigest(live arc). Phase0 commits a boundary-to-pre delta when environment/founding runs, otherwise startState. EndState commits the pre-to-end delta.",
  "natural": "Compact ledgers omit redundant naturalDelta/polityNatural rows. stepPlanet still returns updates by default; run inspection ledgers expand them. EndState commits all resulting state changes; replay recomputes natural updates."
}
```

## Runner decision 2026-10-04 (M3b)

The M3a independent annual child floors and permanent evacuation pressure
are superseded. Annual samples use hierarchical largest-remainder apportionment
as specified in spec 9.4; categorical fields still change only at j=10.
The scenario field parameters.stellarGraceYears defaults to 500 years (integer
multiple of ten, 0..2000000). At doom plus grace the body becomes permanently
uninhabitable. STELLAR_DOOM removes all remaining people in phase 0 regardless
of tier; D rejects later arrivals. A lineage survives if another arc or voyage
survives, otherwise its stellar death witness yields EXTINCT_STELLAR.

```json
{"version":"m3b-stellar-1","stellarGraceYears":{"override":"parameters.stellarGraceYears","default":500,"unit":"years","range":"0..2000000, multiple of 10","label":"scenario"},"annualApportionment":"hierarchical largest positive remainders; ties by child ID"}
```

This appended policy is committed in manifests with non-null stellar doom.
Worlds without stellar doom retain their prior RNG manifest. The original
M3a machine block is historical for these two superseded rules.


## M4a observational API table (non-causal annex)

This append-only observation contract is outside the RNG manifest text because
it changes no dynamics, state field, recipe, purpose, or witness. The public
D compileSummary/run option onPerilsTick defaults to null. When supplied it is
called once per executed tick after P steps, with a frozen fresh projection
{tick,exitedArcs}: tick is a decimal tick string and exitedArcs is a frozen,
sorted list of arc IDs whose phase-0 pre-state perils is exited. It exposes no
mutable solver object; its return value is ignored. It permits exact streaming
statistics without retaining all snapshots or simulating the history twice.
Older roots lacking this option can produce the same observations through
inspectSampleTicks. Observer presence must not change any result digest.

```json
{"version":"m4a-observation-1","scope":"non-causal D inspection","option":"onPerilsTick","default":null,"projection":{"tick":"decimal tick string","exitedArcs":"sorted frozen arc ID array; pre-state perils=exited"},"delivery":"once per executed tick after P steps","mutability":"frozen fresh projection, no live solver references","return":"ignored","digestEffect":"none"}
```


### M4a final golden receipt (2026-10-04)

The M4a dynamics revision replaces the P temperate/civ-m2a-golden/100-year root
`71ec3bb7c8f3b406a8f8b2f5c10891cc6126b9dfb8a85bacd145785986803521` with
`cfe5fb1723eb574aaf24af031359ffdfd837c9e8f21c2c0281d74df5987e2acd`, and the
D toy-12/toy-1/100-year root
`9357a58823cecb9e5e4431f5388e973edb5c5fcf2f53fe9585528fedd330a117` with
`adbb432ab45d9fa9e4d0ae7e670066f0832df76574a87348bd714c76ed6f9b0d`.
Reason: changed authored dynamics, hashed transition contract/RNG namespace,
and committed recovery/target memory state. This receipt is outside the
hashed contract to avoid self-reference. The observer annex changes no root.
M1 remains `c3d614d0bbd2be2b3745ffaf766041d45671d99bb8770a8e7dbde7f9fd6510dc`.
