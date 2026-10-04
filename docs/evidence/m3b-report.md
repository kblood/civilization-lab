# Civilization Lab ensemble
seeded scenarios, model attribution, not predictions

Runs: 64. Seeds: global index i = 0..N-1; scenario = named scenario, or SCENARIOS[i % 5]; seed = <scenario>-<i>. No seed is dropped. Jobs affect execution only and are excluded from report bytes.
Percentages truncate to one decimal using integer arithmetic. Measures count runs with at least one qualifying lineage; outcome classes can overlap in multi-origin domains. Proximate cause counts count lineages within that outcome class; INITIAL_STATE and NATURAL_UPDATE explicitly indicate no proximate event. E2/E3 times are years since the earliest origin (initial fixtures start at their boundary); lower median among attained runs. Zero attained runs are reported as undefined.
First era years mean first attainment of at least that era. Physical multi-body/system occupancy includes past arcs, grouped by lineage, independently of E5/E6. Colony-only loss is an EXTINCTION of a colony arc with its lineage extant at the horizon; COLONY_LOST alone means nonviability, not extinction.

| Measure | Count / runs (%) |
|---|---|
| industrialE3 | 48/64 (75.0%) |
| atomicE4 | 40/64 (62.5%) |
| interplanetary | 31/64 (48.4%) |
| eraE5 | 33/64 (51.5%) |
| interstellar | 30/64 (46.8%) |
| eraE6 | 30/64 (46.8%) |
| extinct | 10/64 (15.6%) |
| extinctSelf | 5/64 (7.8%) |
| extinctNatural | 1/64 (1.5%) |
| extinctStellar | 4/64 (6.2%) |
| extinctNaturalStellar | 5/64 (7.8%) |
| colonyOnlyLoss | 27/64 (42.1%) |
| noLineage | 10/64 (15.6%) |
| collapseRecovery | 43/64 (67.1%) |
| firstContact | 13/64 (20.3%) |
| existentialCap | 9/64 (14.0%) |
| error | 0/64 (0.0%) |

```text
Aggregate (seeded scenarios, model attribution, not predictions)
industrialE3: 48/64 (75.0%)
atomicE4: 40/64 (62.5%)
interplanetary: 31/64 (48.4%)
eraE5: 33/64 (51.5%)
interstellar: 30/64 (46.8%)
eraE6: 30/64 (46.8%)
extinct: 10/64 (15.6%)
extinctSelf: 5/64 (7.8%)
extinctNatural: 1/64 (1.5%)
extinctStellar: 4/64 (6.2%)
extinctNaturalStellar: 5/64 (7.8%)
colonyOnlyLoss: 27/64 (42.1%)
noLineage: 10/64 (15.6%)
collapseRecovery: 43/64 (67.1%)
firstContact: 13/64 (20.3%)
existentialCap: 9/64 (14.0%)
error: 0/64 (0.0%)
COLLAPSED_RECOVERING: 16/64 (25.0%); proximate causes: 14 COLLAPSE, 2 RUNAWAY_TECH, 1 ENGINEERED_PANDEMIC
EXISTENTIAL_CAP: 8/64 (12.5%); proximate causes: 5 RUNAWAY_TECH, 3 ENGINEERED_PANDEMIC, 1 NUCLEAR_WAR
EXTANT_MULTI_BODY: 7/64 (10.9%); proximate causes: 4 COLONY_FOUNDED, 3 ENERGY_TRANSITION
EXTANT_MULTI_SYSTEM: 23/64 (35.9%); proximate causes: 13 COLONY_FOUNDED, 12 ENERGY_TRANSITION
EXTANT_PLANETARY: 17/64 (26.5%); proximate causes: 21 ENERGY_TRANSITION, 2 INITIAL_STATE
EXTINCT_NATURAL: 1/64 (1.5%); proximate causes: 1 NATURAL_UPDATE
EXTINCT_SELF: 5/64 (7.8%); proximate causes: 3 ENGINEERED_PANDEMIC, 2 RUNAWAY_TECH
EXTINCT_STELLAR: 4/64 (6.2%); proximate causes: 4 STELLAR_DOOM
NO_LINEAGE: 10/64 (15.6%); proximate causes: none / not extinct
REGRESSED_STABLE: 2/64 (3.1%); proximate causes: 2 ENERGY_TRANSITION
Lower median time to E2: 0
Lower median time to E3: 0
PASS: outcome classes >= 4; observed 10
PASS: collapse then recovery >= 1; observed 43
PASS: E3 >= 1; observed 48
PASS: self-extinction >= 1; observed 5
PASS: multi-body lineage >= 1; observed 31
PASS: NO_LINEAGE >= 1; observed 10
```

## crowded-domain

| Measure | Count / runs (%) |
|---|---|
| industrialE3 | 13/13 (100.0%) |
| atomicE4 | 13/13 (100.0%) |
| interplanetary | 13/13 (100.0%) |
| eraE5 | 13/13 (100.0%) |
| interstellar | 13/13 (100.0%) |
| eraE6 | 13/13 (100.0%) |
| extinct | 4/13 (30.7%) |
| extinctSelf | 4/13 (30.7%) |
| extinctNatural | 0/13 (0.0%) |
| extinctStellar | 0/13 (0.0%) |
| extinctNaturalStellar | 0/13 (0.0%) |
| colonyOnlyLoss | 10/13 (76.9%) |
| noLineage | 0/13 (0.0%) |
| collapseRecovery | 13/13 (100.0%) |
| firstContact | 13/13 (100.0%) |
| existentialCap | 5/13 (38.4%) |
| error | 0/13 (0.0%) |

Lower median E2: 0; E3: 0.

## doomed-star

| Measure | Count / runs (%) |
|---|---|
| industrialE3 | 13/13 (100.0%) |
| atomicE4 | 10/13 (76.9%) |
| interplanetary | 8/13 (61.5%) |
| eraE5 | 8/13 (61.5%) |
| interstellar | 8/13 (61.5%) |
| eraE6 | 8/13 (61.5%) |
| extinct | 5/13 (38.4%) |
| extinctSelf | 1/13 (7.6%) |
| extinctNatural | 0/13 (0.0%) |
| extinctStellar | 4/13 (30.7%) |
| extinctNaturalStellar | 4/13 (30.7%) |
| colonyOnlyLoss | 8/13 (61.5%) |
| noLineage | 0/13 (0.0%) |
| collapseRecovery | 8/13 (61.5%) |
| firstContact | 0/13 (0.0%) |
| existentialCap | 0/13 (0.0%) |
| error | 0/13 (0.0%) |

Lower median E2: 0; E3: 0.

## harsh-anoxic

| Measure | Count / runs (%) |
|---|---|
| industrialE3 | 8/13 (61.5%) |
| atomicE4 | 8/13 (61.5%) |
| interplanetary | 8/13 (61.5%) |
| eraE5 | 8/13 (61.5%) |
| interstellar | 7/13 (53.8%) |
| eraE6 | 7/13 (53.8%) |
| extinct | 0/13 (0.0%) |
| extinctSelf | 0/13 (0.0%) |
| extinctNatural | 0/13 (0.0%) |
| extinctStellar | 0/13 (0.0%) |
| extinctNaturalStellar | 0/13 (0.0%) |
| colonyOnlyLoss | 7/13 (53.8%) |
| noLineage | 0/13 (0.0%) |
| collapseRecovery | 8/13 (61.5%) |
| firstContact | 0/13 (0.0%) |
| existentialCap | 1/13 (7.6%) |
| error | 0/13 (0.0%) |

Lower median E2: 4430; E3: 5760.

## high-perils

| Measure | Count / runs (%) |
|---|---|
| industrialE3 | 12/12 (100.0%) |
| atomicE4 | 7/12 (58.3%) |
| interplanetary | 0/12 (0.0%) |
| eraE5 | 2/12 (16.6%) |
| interstellar | 0/12 (0.0%) |
| eraE6 | 0/12 (0.0%) |
| extinct | 0/12 (0.0%) |
| extinctSelf | 0/12 (0.0%) |
| extinctNatural | 0/12 (0.0%) |
| extinctStellar | 0/12 (0.0%) |
| extinctNaturalStellar | 0/12 (0.0%) |
| colonyOnlyLoss | 0/12 (0.0%) |
| noLineage | 0/12 (0.0%) |
| collapseRecovery | 12/12 (100.0%) |
| firstContact | 0/12 (0.0%) |
| existentialCap | 3/12 (25.0%) |
| error | 0/12 (0.0%) |

Lower median E2: 0; E3: 0.

## lonely-earthlike

| Measure | Count / runs (%) |
|---|---|
| industrialE3 | 2/13 (15.3%) |
| atomicE4 | 2/13 (15.3%) |
| interplanetary | 2/13 (15.3%) |
| eraE5 | 2/13 (15.3%) |
| interstellar | 2/13 (15.3%) |
| eraE6 | 2/13 (15.3%) |
| extinct | 1/13 (7.6%) |
| extinctSelf | 0/13 (0.0%) |
| extinctNatural | 1/13 (7.6%) |
| extinctStellar | 0/13 (0.0%) |
| extinctNaturalStellar | 1/13 (7.6%) |
| colonyOnlyLoss | 2/13 (15.3%) |
| noLineage | 10/13 (76.9%) |
| collapseRecovery | 2/13 (15.3%) |
| firstContact | 0/13 (0.0%) |
| existentialCap | 0/13 (0.0%) |
| error | 0/13 (0.0%) |

Lower median E2: 23960; E3: 17250.

## Seeds, explanations and digests

- crowded-domain/crowded-domain-1; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_BODY: LAUNCH@29707 -> PLAGUE@29783 -> LAUNCH@29909 -> COLONY_FOUNDED@29930; first expansion chronology: SPACEFLIGHT@460 ; LAUNCH@609 ; COLONY_FOUNDED@630 | lin:stub:s01:b0: EXTANT_PLANETARY: WAR@29517 -> WAR@29530 -> LAUNCH@29606 -> WAR@29684 -> WAR@29690 -> WAR@29811 -> WAR@29820 -> LAUNCH@29900; first expansion chronology: SPACEFLIGHT@860 ; LAUNCH@2404 | lin:stub:s02:b0: EXTANT_PLANETARY: WAR@29736 -> WAR@29740 -> WAR@29756 -> WAR@29760 -> LAUNCH@29807 -> PLAGUE@29837 -> PLAGUE@29840 -> LAUNCH@29904; first expansion chronology: SPACEFLIGHT@330 ; LAUNCH@1104 | lin:stub:s03:b0: COLLAPSED_RECOVERING: WAR@29564 -> WAR@29570 -> WAR@29696 -> WAR@29700 -> WAR@29813 -> WAR@29820 -> DISCOVERY@29934 -> SPACEFLIGHT@29940; first expansion chronology: SPACEFLIGHT@1630 ; LAUNCH@3301 ; COLONY_FOUNDED@3710; first interstellar colony: COLONY_FOUNDED@3710
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=310, E5=360, E6=410, E7=430
  - Manifest: 046ea269e2ddc2559f7d9759c042aa004ae7d9b9adbabab67e946508d52dad57; recipe: e316fc83bfa9a7f5f1a8dd028323bd2bf8ed69a21e15c294aecfdc53991ce7c0; result: 442c444bf27b32117674b655bacaf062e75fd6b2581410b50425ce3491933565
  - [Timeline](timeline-crowded-domain-crowded-domain-1.svg)

- crowded-domain/crowded-domain-11; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_BODY: WAR@29580 -> WAR@29590 -> WAR@29675 -> WAR@29680 -> WAR@29784 -> WAR@29790 -> LAUNCH@29800 -> LAUNCH@29900; first expansion chronology: SPACEFLIGHT@750 ; LAUNCH@1403 ; COLONY_FOUNDED@1410 | lin:stub:s01:b0: EXTANT_PLANETARY: WAR@28639 -> WAR@28640 -> WAR@28988 -> WAR@28990 -> LAUNCH@29000 -> WAR@29080 -> WAR@29090 -> LAUNCH@29303; first expansion chronology: SPACEFLIGHT@290 ; LAUNCH@604 | lin:stub:s02:b0: EXTANT_PLANETARY: WAR@29595 -> WAR@29600 -> DISCOVERY@29691 -> WAR@29706 -> WAR@29710 -> WAR@29856 -> WAR@29860 -> LAUNCH@29902; first expansion chronology: SPACEFLIGHT@820 ; LAUNCH@2006 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: DISCOVERY@29870 -> SPACEFLIGHT@29880; first expansion chronology: SPACEFLIGHT@870 ; LAUNCH@1601 ; COLONY_FOUNDED@2410; first interstellar colony: COLONY_FOUNDED@2410
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=210, E5=380, E6=420, E7=430
  - Manifest: abc547d2e00d85d459a82f6f0280ba374592ef625ee3f9581f4eb2bb4117990b; recipe: b5b2b70f2df527f6b1fb4cd1a1c4451df288d7a9de636c3756022747f0dce4e2; result: 8f77d346cdc735ec5fa0f27d008576d0ded917a2fa96a154ac50c851969f58d4

- crowded-domain/crowded-domain-16; horizon 30000; max era 7; lin:stub:s00:b0: EXISTENTIAL_CAP: DISCOVERY@5920 -> SPACEFLIGHT@5930; first expansion chronology: SPACEFLIGHT@5930 | lin:stub:s01:b0: EXTANT_PLANETARY: LAUNCH@29801; first expansion chronology: SPACEFLIGHT@390 ; LAUNCH@1301 | lin:stub:s02:b0: EXISTENTIAL_CAP: FAMINE@450 -> WAR@463 -> WAR@470 -> REVOLUTION@14621 -> WAR@21588 -> WAR@21590 -> DISCOVERY@21649 -> SPACEFLIGHT@21650; first expansion chronology: SPACEFLIGHT@7240 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: LAUNCH@21704 -> WAR@21774 -> WAR@21780 -> REVOLUTION@24550 -> WAR@29117 -> WAR@29120 -> LAUNCH@29207 -> COLONY_FOUNDED@29610; first expansion chronology: SPACEFLIGHT@550 ; LAUNCH@1803 ; COLONY_FOUNDED@2210; first interstellar colony: COLONY_FOUNDED@2210
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=340, E5=440, E6=540, E7=570
  - Manifest: 0412f839aa7ae1a4a5b1983ca30a67f25df096f8b3284276947e6a47a6ecb787; recipe: 4b81e897b3fbca370c6e41e608f0a8bc9573bbdf6ff34cd9b98de44d5498d778; result: 297d472adbf5142171bf58e8d6db84dd6cb9080d6cd730949abe746918490023

- crowded-domain/crowded-domain-21; horizon 30000; max era 7; lin:stub:s00:b0: EXTINCT_SELF: RUNAWAY_TECH@1506 -> LINEAGE_EXTINCTION@1519; first expansion chronology: SPACEFLIGHT@1470 | lin:stub:s01:b0: EXTANT_MULTI_SYSTEM: LAUNCH@29904 -> COLONY_FOUNDED@29930; first expansion chronology: SPACEFLIGHT@380 ; LAUNCH@705 ; COLONY_FOUNDED@3310; first interstellar colony: COLONY_FOUNDED@3310 | lin:stub:s02:b0: EXTANT_PLANETARY: LAUNCH@29806; first expansion chronology: SPACEFLIGHT@6570 ; LAUNCH@9201 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: DIFFUSION@29777 -> SPACEFLIGHT@29780; first expansion chronology: SPACEFLIGHT@2760 ; LAUNCH@4609 ; COLONY_FOUNDED@5010; first interstellar colony: COLONY_FOUNDED@5010
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=240, E5=480, E6=520, E7=530
  - Manifest: 2597f8fa477b81ec16a5bbae160a2e9a40bcfb2bf7a46c92cc62d7333e44d3a7; recipe: f2c70194ae62d4308551c516ba8cf7b67d1f2d1c8f7830eca7dc161781b17f2b; result: 6b043c134b64b41658a2dd82d0d96c9fc93a52f918f35d5a99778dbd0c49cc41

- crowded-domain/crowded-domain-26; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_PLANETARY: PLAGUE@29490 -> LAUNCH@29602; first expansion chronology: SPACEFLIGHT@5030 ; LAUNCH@5206 ; COLONY_FOUNDED@5230 | lin:stub:s01:b0: EXTINCT_SELF: DIFFUSION@1840 -> ENGINEERED_PANDEMIC@1852 -> LINEAGE_EXTINCTION@1869; first expansion chronology: SPACEFLIGHT@800 | lin:stub:s02:b0: EXTANT_MULTI_SYSTEM: COLLAPSE@28344 -> FAMINE@28350 -> WAR@28512 -> WAR@28520 -> WAR@29387 -> WAR@29390 -> LAUNCH@29409 -> COLONY_FOUNDED@29810; first expansion chronology: SPACEFLIGHT@2910 ; LAUNCH@5802 ; COLONY_FOUNDED@6310; first interstellar colony: COLONY_FOUNDED@6310 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: FAMINE@24450 -> WAR@24550 -> WAR@24560 -> COLLAPSE@29735 -> FAMINE@29740 -> WAR@29781 -> WAR@29790 -> LAUNCH@29801; first expansion chronology: SPACEFLIGHT@220 ; LAUNCH@2107 ; COLONY_FOUNDED@2510; first interstellar colony: COLONY_FOUNDED@2510
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=200, E5=310, E6=390, E7=440
  - Manifest: 62a4bed9111e98b390c89c64e9b3b9ba09ce088f7d8252b4eee74fcbeac090de; recipe: 80109673e42062ce6a0d75d31ae5cd9fbe6f1a3b388de9f83e749c3ffddf2a05; result: 31641feee16618847ae3df8254bba47d77d44c886c5556bda6d4a93084d717af

- crowded-domain/crowded-domain-31; horizon 30000; max era 7; lin:stub:s00:b0: EXISTENTIAL_CAP: CLIMATE_CATASTROPHE@1090 -> FAMINE@1100 -> DISCOVERY@1148 -> SPACEFLIGHT@1150; first expansion chronology: SPACEFLIGHT@420 | lin:stub:s01:b0: EXTANT_PLANETARY: COLLAPSE@24800 -> FAMINE@24810 -> WAR@24977 -> WAR@24980 -> WAR@25220 -> WAR@29887 -> WAR@29890 -> LAUNCH@29907; first expansion chronology: SPACEFLIGHT@1140 ; LAUNCH@4709 | lin:stub:s02:b0: EXTANT_PLANETARY: COLLAPSE@28635 -> FAMINE@28640 -> WAR@28702 -> WAR@28710 -> WAR@28795 -> WAR@28800 -> PLAGUE@28917 -> LAUNCH@29006; first expansion chronology: SPACEFLIGHT@910 ; LAUNCH@1702 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: WAR@29465 -> WAR@29480 -> WAR@29649 -> WAR@29650 -> LAUNCH@29708 -> PLAGUE@29789 -> PLAGUE@29790 -> LAUNCH@29804; first expansion chronology: SPACEFLIGHT@230 ; LAUNCH@805 ; COLONY_FOUNDED@2410; first interstellar colony: COLONY_FOUNDED@2410
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=190, E5=450, E6=490, E7=540
  - Manifest: 2c3a4bae78a366dc9c5e523df8cd8cb6d0eb016655ff93504d22b8cc8105af61; recipe: ef155c9fad38ce8f66bc89bc77b5f6f07c9d765c4ed9698c9de667f024ebb409; result: a28712ac8c147605059262d74bad8d995d618ab5275fce09b7cc98254ab10529

- crowded-domain/crowded-domain-36; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_BODY: LAUNCH@29907; first expansion chronology: SPACEFLIGHT@7970 ; LAUNCH@9804 ; COLONY_FOUNDED@9810 | lin:stub:s01:b0: EXISTENTIAL_CAP: PLAGUE@29923 -> PLAGUE@29940 | lin:stub:s02:b0: COLLAPSED_RECOVERING: REVOLUTION@25941 -> REVOLUTION@25978 -> COLLAPSE@29454 -> FAMINE@29460 -> DISCOVERY@29572 -> WAR@29580 -> WAR@29590 -> LAUNCH@29704; first expansion chronology: SPACEFLIGHT@580 ; LAUNCH@1903 | lin:stub:s03:b0: COLLAPSED_RECOVERING: WAR@29362 -> WAR@29380 -> LAUNCH@29600 -> WAR@29697 -> WAR@29700 -> WAR@29717 -> WAR@29720 -> LAUNCH@29905; first expansion chronology: SPACEFLIGHT@3240 ; LAUNCH@5509 ; COLONY_FOUNDED@5910; first interstellar colony: COLONY_FOUNDED@5910
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=440, E5=680, E6=710, E7=770
  - Manifest: 43e28147eb708ea34c5a85d72b3f34fb8f59ee5e9ec74356f3bfc1fe38b480b1; recipe: 107e76efed4b3a7c6d5056c7d477b9b0ea1e0c4e62b972393e405f4bdd209f00; result: 68ee013fc383352e238915b4841776d9fcbc49783817266f0d40cd12fe87d5d7

- crowded-domain/crowded-domain-41; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_BODY: LAUNCH@29900 -> COLONY_FOUNDED@29920; first expansion chronology: SPACEFLIGHT@1370 ; LAUNCH@1406 ; COLONY_FOUNDED@1430 | lin:stub:s01:b0: EXISTENTIAL_CAP: DIFFUSION@29856 | lin:stub:s02:b0: COLLAPSED_RECOVERING: FAMINE@28450 -> WAR@28610 -> WAR@28620 -> WAR@29732 -> WAR@29740 -> WAR@29883 -> WAR@29890 -> LAUNCH@29903; first expansion chronology: SPACEFLIGHT@1550 ; LAUNCH@7905 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: WAR@24850 -> WAR@24860 -> REVOLUTION@25882 -> REVOLUTION@27129 -> WAR@29676 -> WAR@29680 -> LAUNCH@29701 -> LAUNCH@29809; first expansion chronology: SPACEFLIGHT@1480 ; LAUNCH@2203 ; COLONY_FOUNDED@2610; first interstellar colony: COLONY_FOUNDED@2610
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=700, E5=1570, E6=2110, E7=2420
  - Manifest: cfed72919eed477ac005d48ac82863f0bd91766ee6f08c5fb5327b9b7cff70fa; recipe: a93cf6f50983b130be573dc4070b5eda184d097c595a5ea3e3f07b2c6f7be767; result: d347497bbd8d56a6e2ff00908d07660ef41d614cf86ffc2bda8f28440cb75cdc

- crowded-domain/crowded-domain-46; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_BODY: PLAGUE@29890 -> PLAGUE@29900 -> DISCOVERY@29929 -> SPACEFLIGHT@29930; first expansion chronology: SPACEFLIGHT@9500 ; LAUNCH@11707 ; COLONY_FOUNDED@11730 | lin:stub:s01:b0: COLLAPSED_RECOVERING: LAUNCH@29301 -> WAR@29357 -> WAR@29360 -> PLAGUE@29477 -> PLAGUE@29480 -> WAR@29532 -> WAR@29540 -> LAUNCH@29709; first expansion chronology: SPACEFLIGHT@450 ; LAUNCH@1006 | lin:stub:s02:b0: EXTANT_MULTI_SYSTEM: WAR@28430 -> WAR@28543 -> WAR@28550 -> LAUNCH@28603 -> WAR@28652 -> WAR@28660 -> LAUNCH@28809 -> COLONY_FOUNDED@29210; first expansion chronology: SPACEFLIGHT@12700 ; LAUNCH@14905 ; COLONY_FOUNDED@17210; first interstellar colony: COLONY_FOUNDED@17210 | lin:stub:s03:b0: EXTINCT_SELF: PLAGUE@664 -> PLAGUE@670 -> DISCOVERY@732 -> DISCOVERY@743 -> RUNAWAY_TECH@757 -> LINEAGE_EXTINCTION@769; first expansion chronology: SPACEFLIGHT@600
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=390, E5=520, E6=560, E7=580
  - Manifest: 38bba6af7a47fe77f05fa777bf9fc3f7357db90b33d426c710b1dde09c7aae62; recipe: a4f7b6d2c5db546fcc63c61bb54b6a2c6672bca09b9f64e02133eb669732a549; result: fc5b8baac9fd376f466ea9150ce162e0690d65c7803fbdec674156ff0681262b

- crowded-domain/crowded-domain-51; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_BODY: WAR@29250 -> LAUNCH@29403 -> WAR@29437 -> WAR@29440 -> WAR@29546 -> WAR@29560 -> LAUNCH@29703 -> COLONY_FOUNDED@29730; first expansion chronology: SPACEFLIGHT@340 ; LAUNCH@803 ; COLONY_FOUNDED@2710 | lin:stub:s01:b0: EXTANT_PLANETARY: WAR@28630 -> LAUNCH@28808 -> LAUNCH@28903 -> WAR@28919 -> WAR@28920 -> WAR@29010 -> WAR@29020 -> LAUNCH@29101; first expansion chronology: SPACEFLIGHT@510 ; LAUNCH@901 | lin:stub:s02:b0: EXTANT_PLANETARY: PLAGUE@29752 -> PLAGUE@29770 -> LAUNCH@29809; first expansion chronology: SPACEFLIGHT@5940 ; LAUNCH@13701 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: LAUNCH@29508 -> COLONY_FOUNDED@29910; first expansion chronology: SPACEFLIGHT@410 ; LAUNCH@1109 ; COLONY_FOUNDED@1810; first interstellar colony: COLONY_FOUNDED@1810
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=210, E5=410, E6=520, E7=580
  - Manifest: 2b88227132e7936452e6445d9d8b8cef348c54d8490c2a247623889d66bffe23; recipe: 1fabf227da3c355f07c75bdf33ea5183d4cb9e93ce4dc0b25d7b34404adb9784; result: d44443d3e93911ed31e341135ef8e112f14856b8154c8d7ab11b6394c83ea5f4

- crowded-domain/crowded-domain-56; horizon 30000; max era 7; lin:stub:s00:b0: COLLAPSED_RECOVERING: DISCOVERY@22691 -> SPACEFLIGHT@22700; first expansion chronology: SPACEFLIGHT@5840 ; LAUNCH@8105 ; COLONY_FOUNDED@8110 | lin:stub:s01:b0: EXTANT_PLANETARY: LAUNCH@29806; first expansion chronology: SPACEFLIGHT@3520 ; LAUNCH@7106 | lin:stub:s02:b0: EXTANT_PLANETARY: WAR@29488 -> WAR@29490 -> WAR@29545 -> WAR@29550 -> LAUNCH@29709 -> WAR@29742 -> WAR@29750 -> LAUNCH@29900; first expansion chronology: SPACEFLIGHT@520 ; LAUNCH@1003 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: PLAGUE@29714 -> LAUNCH@29808; first expansion chronology: SPACEFLIGHT@3640 ; LAUNCH@8207 ; COLONY_FOUNDED@10210; first interstellar colony: COLONY_FOUNDED@10210
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=480, E5=590, E6=670, E7=710
  - Manifest: 182658fa98dea2252ba7b695df7cb77e05540dd3dd58fea833451cb1bdd24081; recipe: 752789d3d613763608c3e083af88ba7d96c66ef6872593f9ebc80fe380a9f517; result: 555eca20c6b554812285da908f6be39488865da306877c5d6edf9836d73f173c

- crowded-domain/crowded-domain-6; horizon 30000; max era 7; lin:stub:s00:b0: EXTINCT_SELF: DISCOVERY@325 -> ENGINEERED_PANDEMIC@337 -> LINEAGE_EXTINCTION@349; first expansion chronology: SPACEFLIGHT@250 | lin:stub:s01:b0: COLLAPSED_RECOVERING: LAUNCH@29208 -> COLONY_FOUNDED@29610; first expansion chronology: SPACEFLIGHT@1690 ; LAUNCH@3708 ; COLONY_FOUNDED@4110; first interstellar colony: COLONY_FOUNDED@4110 | lin:stub:s02:b0: EXTANT_PLANETARY: LAUNCH@29600; first expansion chronology: SPACEFLIGHT@2970 ; LAUNCH@6406 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: LAUNCH@29605; first expansion chronology: SPACEFLIGHT@4780 ; LAUNCH@9805 ; COLONY_FOUNDED@10210; first interstellar colony: COLONY_FOUNDED@10210
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=200, E5=300, E6=2830, E7=3120
  - Manifest: 95daaedd59239f9014a7b0ae21d9b2b3227d36c1fb208f65d89667c2b198c6fe; recipe: 9c7acc81f9ba6873fed1ed735991904480e62d949cdd3b05a10f4c7403287a37; result: cd91c0bc2b9899fdab16bcd587d377cd5dad95b54c09c80c2a0b4df8d0857da2

- crowded-domain/crowded-domain-61; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_BODY: LAUNCH@29701 -> COLONY_FOUNDED@29710; first expansion chronology: SPACEFLIGHT@330 ; LAUNCH@1109 ; COLONY_FOUNDED@1610 | lin:stub:s01:b0: EXTANT_PLANETARY: WAR@29130 -> WAR@29287 -> WAR@29290 -> LAUNCH@29506 -> WAR@29623 -> WAR@29630 -> PLAGUE@29717 -> LAUNCH@29802; first expansion chronology: SPACEFLIGHT@6310 ; LAUNCH@10702 | lin:stub:s02:b0: EXTANT_PLANETARY: LAUNCH@29604; first expansion chronology: SPACEFLIGHT@380 ; LAUNCH@1507 | lin:stub:s03:b0: EXTANT_MULTI_SYSTEM: WAR@29630 -> PLAGUE@29653 -> PLAGUE@29660 -> WAR@29671 -> WAR@29680 -> PLAGUE@29782 -> PLAGUE@29800 -> LAUNCH@29900; first expansion chronology: SPACEFLIGHT@500 ; LAUNCH@805 ; COLONY_FOUNDED@1210; first interstellar colony: COLONY_FOUNDED@1210
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=290, E5=340, E6=400, E7=410
  - Manifest: 02c4b8774947d115542b5bc30779c478545502a083a02ed3b61eef902e65c5d8; recipe: 7d9b0e84ad74402b605842c8d27798a19a0c526537cb1b05b95c7163805347cf; result: 90e454278a39dfd202f0ca5b8b2527d6653ee067a754a5673ba020d927942585

- doomed-star/doomed-star-13; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: LAUNCH@29609; first expansion chronology: SPACEFLIGHT@970 ; LAUNCH@1407 ; COLONY_FOUNDED@1420; first interstellar colony: COLONY_FOUNDED@2810
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=940, E5=1360, E6=2020, E7=2040
  - Manifest: bd61a0c282339df08349f08c9340681a15b932e2fda6d6e58431ef3cba3b0129; recipe: 72855d7b2aa31942d77a5ff726317ac86d91ff11f98ae296febc91bcd311cde3; result: eed1cbdbb6c00f8037c514db033188fc12923b08d3dfe4d8e0d0b3d41c7ef056
  - [Timeline](timeline-doomed-star-doomed-star-13.svg)

- doomed-star/doomed-star-18; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_PLANETARY: DISCOVERY@13888 -> SPACEFLIGHT@13890; first expansion chronology: SPACEFLIGHT@650 ; LAUNCH@1504 ; COLONY_FOUNDED@1910; first interstellar colony: COLONY_FOUNDED@1910
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=560, E5=680, E6=880, E7=1000
  - Manifest: a562cc9afd0b2a88e972d01a930271ba608a5fb5133a7335d7b007a676554fee; recipe: cbd59da697ae99ee5378bac6a666a4b4d2cd2d915617c8a75c4b1e4e900f32a6; result: 549480a4a0e4893ed5b60cca7898ef929e6615452fbda6b64a27e34960055682

- doomed-star/doomed-star-23; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: DISCOVERY@29091 -> DISCOVERY@29103 -> DISCOVERY@29115 -> DISCOVERY@29126 -> DISCOVERY@29130 -> DISCOVERY@29144 -> DISCOVERY@29157 -> SPACEFLIGHT@29160; first expansion chronology: SPACEFLIGHT@340 ; LAUNCH@903 ; COLONY_FOUNDED@1310; first interstellar colony: COLONY_FOUNDED@1310
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=270, E5=380, E6=440, E7=450
  - Manifest: 1a95374e85c052a1ac81dce5db8c3690b3066df2fbb874c8bc0db0a165b87ab5; recipe: 2d489b46ee37c8bec44fbf9a4665b6c69971f198f14bc204477011f6250b1789; result: 5f27b15c7ca89379dcee5d2792d13b7e577d7f4223ffc9e5370ab5ac6925118c

- doomed-star/doomed-star-28; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: WAR@23059 -> WAR@23060 -> WAR@26333 -> COLLAPSE@29477 -> FAMINE@29480 -> WAR@29651 -> WAR@29670 -> LAUNCH@29908; first expansion chronology: SPACEFLIGHT@720 ; LAUNCH@909 ; COLONY_FOUNDED@920; first interstellar colony: COLONY_FOUNDED@1710
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=480, E5=810, E6=910, E7=960
  - Manifest: 297a055e9c4a187d6a530646e675c77adb35c1415036d2cb2abc9cdd47126aa1; recipe: 658551db48a5715b863178260dc489dfba1dcc7ffc840be3d90686dd10f1c8fb; result: 4296d73801ef004e495ddd566167c58128e2e7969690977215eb32179587b56d

- doomed-star/doomed-star-3; horizon 30000; max era 3; lin:stub:s00:b0: EXTINCT_STELLAR: STELLAR_DOOM@3000 -> LINEAGE_EXTINCTION@3009
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: f10ba7bda9e99b0e880da5d05003fc403160adb7e7ea26bb1bfbc1a5c1235a5f; recipe: 0583ee738d80c68652e0af3e6eb1a30c1159eae6de50c4e94ed213a14f6f154b; result: 0eb67e3b5850737dad7cc83e78be4c7358ded690debbf3b970c6e7c9535fb854

- doomed-star/doomed-star-33; horizon 30000; max era 4; lin:stub:s00:b0: EXTINCT_STELLAR: STELLAR_DOOM@3000 -> LINEAGE_EXTINCTION@3009
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=2780, E5=not reached, E6=not reached, E7=not reached
  - Manifest: d8d71478857397286c9d372d61a363cf6c45f17150352018a8b9475c555ccedf; recipe: cdb5fa2f3659237abec0f4a1a33f108577fed36526aa1a5f4bc8f77925d65df6; result: e230fc03a3b0558e871d3a3fdb49819866f8cc8daea5453c4327e887d13f6d4c

- doomed-star/doomed-star-38; horizon 30000; max era 3; lin:stub:s00:b0: EXTINCT_STELLAR: STELLAR_DOOM@3000 -> LINEAGE_EXTINCTION@3009
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 48119406e893bf37590b5ef04612919091305d897b9d79f384a66c58fb1fe742; recipe: e0d5ff77874ecbd4b86e818794b3fe49d365ca20e53e0e15b43aef51b46a9407; result: 477d8d692f4826748035d1fd35362806a51bebf74d7ef1688181f9e4c2704ce1

- doomed-star/doomed-star-43; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: WAR@14180 -> WAR@15090 -> WAR@15100 -> WAR@15642 -> WAR@15650 -> WAR@29735 -> WAR@29740 -> LAUNCH@29807; first expansion chronology: SPACEFLIGHT@1570 ; LAUNCH@2705 ; COLONY_FOUNDED@2730; first interstellar colony: COLONY_FOUNDED@3870
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=1160, E5=2760, E6=3440, E7=4880
  - Manifest: eb2362eba98bb25a5c1551010d9a468acb0916eb2d28a39aea065c95639480b0; recipe: 22b66bd70b63e5c9c429a5882d206fbf1337905fd0c64da89411c4bc0fe16edc; result: c32985c8e4c3a781f46a54ef86574a132e7057611a96d4a5b5e6f2509b3e97ec

- doomed-star/doomed-star-48; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: LAUNCH@29506 -> COLONY_FOUNDED@29910; first expansion chronology: SPACEFLIGHT@310 ; LAUNCH@802 ; COLONY_FOUNDED@1010; first interstellar colony: COLONY_FOUNDED@1210
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=270, E5=360, E6=410, E7=430
  - Manifest: 85d076736e253484e9314ac4475acece412ed560ad87c28623d7869e5127e9be; recipe: 2fbdd3036a07b8d9c71e3946108c1db3259a95919f3a8555a302e382f7b7ecb2; result: 54b0d8af0c4b5965225460e269912552c2338c026d9cca25470793a879465170

- doomed-star/doomed-star-53; horizon 30000; max era 7; lin:stub:s00:b0: REGRESSED_STABLE: DISCOVERY@22889 -> DISCOVERY@22893 -> DIFFUSION@22905 -> SPACEFLIGHT@22910; first expansion chronology: SPACEFLIGHT@1130 ; LAUNCH@1208 ; COLONY_FOUNDED@1230; first interstellar colony: COLONY_FOUNDED@3200
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=1040, E5=1250, E6=1590, E7=1980
  - Manifest: 0651789e203567d1a4c75131767848d9870a170e236591436aa8b073f632d717; recipe: c5e925fdb3d3a2a2ccdf48e09756bff24392e1a528b2f54fb37e35c96bec50c5; result: b1132473c2eb505daf4d84d7634b82d35971398a3fced09b76bb770a2ce160f6

- doomed-star/doomed-star-58; horizon 30000; max era 4; lin:stub:s00:b0: EXTINCT_SELF: ENGINEERED_PANDEMIC@742 -> LINEAGE_EXTINCTION@759; first expansion chronology: SPACEFLIGHT@610
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=410, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 89dc94af891ecccabdbdb50dc040a89e4e8e5451906519ca16dc92e70507a1a7; recipe: 201f6e12cdec98a2a19df44ac5726d1a5f3abb8aa65c79855539f35cf9572c76; result: d5dc2ef9de3083ca2c700a37f7578ac8522e11561a371fdccf8462a59b246f4f

- doomed-star/doomed-star-63; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_PLANETARY: WAR@29359 -> WAR@29360 -> WAR@29518 -> WAR@29520 -> WAR@29674 -> WAR@29680 -> DISCOVERY@29693 -> SPACEFLIGHT@29700; first expansion chronology: SPACEFLIGHT@280 ; LAUNCH@808 ; COLONY_FOUNDED@810; first interstellar colony: COLONY_FOUNDED@1310
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=160, E5=290, E6=350, E7=380
  - Manifest: 889351b33ed5d9c8249e0b9410eeff3eaccdb8aa31a8dc7914b56ac499f1fb71; recipe: 8c445728f465d5c33808eaabcf04a2128a73ea97c94c44d49387f8ca01d40d82; result: 93f4ecca05592b96319aa931a4c43d35b62d8adfcebcfe24aca3c85aeabca5cf

- doomed-star/doomed-star-8; horizon 30000; max era 3; lin:stub:s00:b0: EXTINCT_STELLAR: STELLAR_DOOM@3000 -> LINEAGE_EXTINCTION@3009
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 9cf834e7a0aec35fd413dcf11d018694f61d0c6299a0181734ac0e6656fe2056; recipe: 8d82f749369f7d96265aaf4952853b3b9538eaed207dc5ae3face9e27274c8c0; result: b5ef4a4ada06b1a09c0b7b443b7b392cad090a8711a8ed273ecef5131bd60569

- harsh-anoxic/harsh-anoxic-12; horizon 30000; max era 1; lin:stub:s00:b0: EXTANT_PLANETARY: PLAGUE@29877 -> PLAGUE@29900
  - First eras: E0=0, E1=9270, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: c96d90e2b357e95e0416d5f7ec833b33831c5fe7fb66517d5958e145438955bf; recipe: 6ac2fdaec8651e14de2001045ebced7fdf4066de186733ed028e52f26b9c3019; result: 6dc5c603dc8a4e19b8766954d8e666e1ef4b2dcf7c486700ee9eb6a796fe221e
  - [Timeline](timeline-harsh-anoxic-harsh-anoxic-12.svg)

- harsh-anoxic/harsh-anoxic-17; horizon 30000; max era 0; lin:stub:s00:b0: EXTANT_PLANETARY: WAR@2097 -> WAR@2352 -> WAR@2901 -> WAR@29885 -> CONQUEST@29910
  - First eras: E0=0, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67f69dbaf70518d4d2e51e5554c7764baca6b4c1cc2c7dba5eaf2875371897dc; recipe: 6f278195efbd1534236c52cd0fea2d47f184a5447275991fc424dac1541f32dd; result: c50c2444bfb50015ce11d16ff64dd5e7df50b1868f16fbd590f9dabeddbd0b5b

- harsh-anoxic/harsh-anoxic-2; horizon 30000; max era 1; lin:stub:s00:b0: EXTANT_PLANETARY: DIFFUSION@28819
  - First eras: E0=0, E1=15460, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 36b5621feb60f5124a3fe07744d415c7d15f51c02cc513ffd4f11ae73b1dc568; recipe: e20c0d4b7aac60543a1d64144125028c660ce1ae55f354d5a83400196fa83b66; result: 82878b611441ebb6b1da4dcf6c4069479d03d0d775e619fe1a28ebe09f07e31a

- harsh-anoxic/harsh-anoxic-22; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: WAR@29324 -> WAR@29330 -> WAR@29485 -> WAR@29490 -> WAR@29578 -> WAR@29580 -> LAUNCH@29608 -> COLONY_FOUNDED@29610; first expansion chronology: SPACEFLIGHT@5260 ; LAUNCH@5800 ; COLONY_FOUNDED@6200; first interstellar colony: COLONY_FOUNDED@6200
  - First eras: E0=0, E1=870, E2=3560, E3=4820, E4=5230, E5=5400, E6=5550, E7=5590
  - Manifest: 1832f276e6587ca97de72fd576650c5e06b2bcc540fac72af46904d3ff9f25de; recipe: 510241c28d9c49ae752a7f6418e12076bf8e747bdacbca743a47821d32b2ffb6; result: 6e96c7bbd39f601e6a0de7dccf9873889d469399868f6f1e94c2d50f6d1883f0

- harsh-anoxic/harsh-anoxic-27; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: WAR@29290 -> LAUNCH@29303 -> WAR@29327 -> WAR@29330 -> WAR@29389 -> WAR@29390 -> LAUNCH@29505 -> COLONY_FOUNDED@29910; first expansion chronology: SPACEFLIGHT@7830 ; LAUNCH@8206 ; COLONY_FOUNDED@8220; first interstellar colony: COLONY_FOUNDED@9310
  - First eras: E0=0, E1=410, E2=4430, E3=7640, E4=7790, E5=8150, E6=8320, E7=8330
  - Manifest: 4bc7d80cb50b040ae62b0f398326f60dff33b8acbc8d38636c59e087439bf30d; recipe: 0a938496fcd6d3976e89681c23991d4e4c20616860a9f3156e15b3f7dfa3818c; result: 9e98c72e87d51f8c70e219339620601c3208bbc01e75f88374bcfda0bb3e953d

- harsh-anoxic/harsh-anoxic-32; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: LAUNCH@28807 -> COLONY_FOUNDED@28810 -> WAR@28940 -> WAR@29257 -> WAR@29260 -> LAUNCH@29309 -> COLONY_FOUNDED@29710; first expansion chronology: SPACEFLIGHT@11670 ; LAUNCH@21305 ; COLONY_FOUNDED@21310; first interstellar colony: COLONY_FOUNDED@21910
  - First eras: E0=0, E1=140, E2=9710, E3=11030, E4=11460, E5=20400, E6=20760, E7=20800
  - Manifest: f7e8a80d8e3164077596019f2a3a9a0c188882f3ec298763f12f553eabe9c785; recipe: c9eaf8fa9bca1386dd6b83afb895c9365218a8c86503c3133da20a4f76c6629f; result: 3b19f000b2dd368ad3650b1e63e2aa3da1db7938cee399a69a24b86b3332008f

- harsh-anoxic/harsh-anoxic-37; horizon 30000; max era 1; lin:stub:s00:b0: EXTANT_PLANETARY: PLAGUE@29794 -> PLAGUE@29810
  - First eras: E0=0, E1=15310, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 61699184974520b28702a169c8dfcbfbde1e6ff6f0169c1b9f455c609100afe9; recipe: f6b099daa48654cfabb251ad41765b012d0cdfcf6b427e6eccea008e1580586b; result: c9e5ab23cda46776101a690f4d9e09da40bd5417c7f30222114c31936658c51c

- harsh-anoxic/harsh-anoxic-42; horizon 30000; max era 0; lin:stub:s00:b0: EXTANT_PLANETARY: WAR@25000 -> WAR@25181 -> WAR@25303 -> WAR@29744 -> CONQUEST@29770
  - First eras: E0=0, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 3f662ecdf3aa26d16d324aaddaeefd6bd055403f424776e99fbc00a7dd2b1304; recipe: 5b18d61540cb1e8c85c0008d6188e68aefe7b115e84769b901a50659d03a7ec4; result: 647935be3df12916e7f2dfd46f346e99e81b174ef49d427ed96c5609d666f4b2

- harsh-anoxic/harsh-anoxic-47; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: WAR@29217 -> WAR@29220 -> WAR@29263 -> WAR@29270 -> PLAGUE@29399 -> PLAGUE@29410 -> LAUNCH@29506 -> COLONY_FOUNDED@29910; first expansion chronology: SPACEFLIGHT@7310 ; LAUNCH@7607 ; COLONY_FOUNDED@8010; first interstellar colony: COLONY_FOUNDED@8010
  - First eras: E0=0, E1=480, E2=6060, E3=6200, E4=7180, E5=7480, E6=7590, E7=7630
  - Manifest: 20ce5eaf56c09539493e8237411aeac9ed1b7feca83249b7d3b097f4367fda60; recipe: 88a88c3a00defb0d7a5a636ae103c21dea0a3e4ce0803f40e36aa75ce8e70fcc; result: 50769cf0305aae74bba2f20c2620384092e078f03bc3991792f21f1fcad16050

- harsh-anoxic/harsh-anoxic-52; horizon 30000; max era 7; lin:stub:s00:b0: COLLAPSED_RECOVERING: LAUNCH@29507 -> COLONY_FOUNDED@29910; first expansion chronology: SPACEFLIGHT@5940 ; LAUNCH@6708 ; COLONY_FOUNDED@7020; first interstellar colony: COLONY_FOUNDED@7110
  - First eras: E0=0, E1=2190, E2=5160, E3=5760, E4=5920, E5=6350, E6=6410, E7=6430
  - Manifest: 777932c87e3d357e9b81eea37da3edac19dd0f554da629ee0e4832297d286e99; recipe: 76fd04058090b3e574de6d3536790d2a2eba2c3dd61882e17c4e9acfefc5d913; result: 8e4ad45159fd78ecb4d2f30a4bb4932a82c9af573df524df1954fcb7fd7d3aa1

- harsh-anoxic/harsh-anoxic-57; horizon 30000; max era 5; lin:stub:s00:b0: EXISTENTIAL_CAP: SPACEFLIGHT@12820; first expansion chronology: SPACEFLIGHT@4880 ; LAUNCH@6207 ; COLONY_FOUNDED@6220
  - First eras: E0=0, E1=1610, E2=3930, E3=4720, E4=4860, E5=5070, E6=not reached, E7=not reached
  - Manifest: 4d48066063c554b58ad9742cf67ae479d17785506e21d09d6bb10f19fd311e3b; recipe: e93badfadf7174b03422b87a4e49ff09f9d43d76848ea892a59712c65f15ce3a; result: c704bb48dffd8058f39e377331dfb8e512fe013133011b7b18dd28be977d3387

- harsh-anoxic/harsh-anoxic-62; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: REVOLUTION@23153 -> REVOLUTION@26058 -> WAR@29765 -> WAR@29770 -> WAR@29889 -> WAR@29890 -> LAUNCH@29905 -> COLONY_FOUNDED@29930; first expansion chronology: SPACEFLIGHT@4050 ; LAUNCH@4805 ; COLONY_FOUNDED@4810; first interstellar colony: COLONY_FOUNDED@8310
  - First eras: E0=0, E1=1250, E2=3240, E3=3850, E4=3990, E5=4210, E6=4270, E7=4280
  - Manifest: 33f565e555c2a84e9713cd979c78999ef81fb3317cce3574a3268d39270917e8; recipe: 737012c3f7711b48b154c3385204ed4bff4911b77e78739c375e7ef5f95da43c; result: e2fc6dbf1f542ab291f5bc0e52c393552e2a5467c4fa488743e21753dbf62275

- harsh-anoxic/harsh-anoxic-7; horizon 30000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: LAUNCH@29100 -> COLONY_FOUNDED@29500; first expansion chronology: SPACEFLIGHT@6500 ; LAUNCH@7300 ; COLONY_FOUNDED@7310; first interstellar colony: COLONY_FOUNDED@11410
  - First eras: E0=0, E1=2930, E2=5680, E3=6220, E4=6440, E5=6650, E6=6710, E7=6730
  - Manifest: 99c7616612bac240fb01a1efd48a442c89ed42d548eca8b1f53cb3897ff3449c; recipe: 8b9465a5bbde7558d9b25c7f190a2aab8de2edce4129ea8b6967173076a517c2; result: 10dab520a22014d4d9d43bd76e182de584e034272cfdcdf7df72c6a150191ffa

- high-perils/high-perils-14; horizon 30000; max era 3; lin:stub:s00:b0: COLLAPSED_RECOVERING: REVOLUTION@25407 -> COLLAPSE@25835 -> FAMINE@25840 -> WAR@25880 -> WAR@26099 -> WAR@26312 -> COLLAPSE@29759 -> FAMINE@29760
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: e78f0702ccf01ddbe278ce2fcb3fc40d9fd99042ce73b00799ef9ecadce83fbc; recipe: 7f6950fdaf241c7882319f9ad0a08ca34276ec712414c0917a6975e1cae64266; result: fdf28c0e37853ff4448b38352806043bc528888b1bfa7351e646aaffdc0c862b
  - [Timeline](timeline-high-perils-high-perils-14.svg)

- high-perils/high-perils-19; horizon 30000; max era 4; lin:stub:s00:b0: COLLAPSED_RECOVERING: DISCOVERY@28371 -> SPACEFLIGHT@28380; first expansion chronology: SPACEFLIGHT@12220
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=11670, E5=not reached, E6=not reached, E7=not reached
  - Manifest: a66e3508ec4fe2fbc47cd2078e80e6810056fcec6a82b4ae0b7926ab7b4c5e3f; recipe: 704bcf616fe0c6865259475d73f2886bda4b78c9e10c2d7273848b319459f84e; result: 8d092ac97f9e2b8d1cc314269a5669ecde48d6945c08cd205fa9aa8a209c509a

- high-perils/high-perils-24; horizon 30000; max era 3; lin:stub:s00:b0: COLLAPSED_RECOVERING: DIFFUSION@29999 -> ENERGY_TRANSITION@29999
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 16ead67c4cf0ecc4b05eea8f99c47b642d7f90e760160044a1aa36f58d4e42e2; recipe: 81f192d228ffae68b6efe59857bfa1b21bd34c65a001185d70673b76933ba920; result: 8e2dfb8fbeea6daa32eca1f174001432ce5a8491bf06732b81b3fbf58dd122f6

- high-perils/high-perils-29; horizon 30000; max era 3; lin:stub:s00:b0: COLLAPSED_RECOVERING: NATURAL_CATASTROPHE@28611 -> FAMINE@28620
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 52beb82138473b0c3a99dafcc53abfb64616020c7e02f8465e2542332c85a9cf; recipe: 402fae1084dc16d1a40fe4cbefea45f37a6665a9880bcd4d4ed8a70eddf09f6b; result: 93c08a43a64e810bbb73e2ca1c01f93490e8ad295a2e9aa6a503aba91fe12b9e

- high-perils/high-perils-34; horizon 30000; max era 5; lin:stub:s00:b0: COLLAPSED_RECOVERING: WAR@23236 -> WAR@23403 -> WAR@23410 -> WAR@24229 -> WAR@24230 -> DISCOVERY@24262 -> SPACEFLIGHT@24270; first expansion chronology: SPACEFLIGHT@24270
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=22920, E5=24590, E6=not reached, E7=not reached
  - Manifest: c5ecf02c8085b826cf6a020b36763f2483ac1d9586449096aa06e7b76cbbed98; recipe: 4cac42d04603934eee9bf473a748556fa1f0df48fb53a9b3fe2d7465059fd13c; result: 78e780e1166b4e08cac84a89e679d587b9c0fffd2500a9b2bd5bd3b372a72fb4

- high-perils/high-perils-39; horizon 30000; max era 4; lin:stub:s00:b0: COLLAPSED_RECOVERING: DISCOVERY@29939
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=16340, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 616b1989c7d7dfa1b5b7d4c7d2a7315a0e7fe7230d33a8039ce76870bcc047f5; recipe: 24422119313bee2d9dff8fafad039872cba4b94386f4b30ecdc04bcd8b1be142; result: aa78ef9120b2b128211f6eac11a92714fea0f740fc5e4be44d38a6b9930a349f

- high-perils/high-perils-4; horizon 30000; max era 3; lin:stub:s00:b0: COLLAPSED_RECOVERING: PLAGUE@29909 -> PLAGUE@29910 -> WAR@29924 -> CONQUEST@29950
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 5e7394a6c34e53fba1b824c025b180f61543b366bc162087c6c67e03c7701081; recipe: cbdee16ca3a6d29e1cafba4b5626a1b11cbb5ac89ce121fa95638f993b8fb939; result: 6d0046c3d187b84eec370d07e7843003c0d6b63044c97a6af4f4fa170f540895

- high-perils/high-perils-44; horizon 30000; max era 4; lin:stub:s00:b0: EXISTENTIAL_CAP: COLLAPSE@345 -> WAR@390 -> WAR@400 -> DISCOVERY@465 -> DISCOVERY@475 -> SPACEFLIGHT@480; first expansion chronology: SPACEFLIGHT@300
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=280, E5=not reached, E6=not reached, E7=not reached
  - Manifest: ebe89f65e001aac4ece4a164be2b9a1bbb5eae3e5ff321bb222e0218c51eb364; recipe: 07da6954f4a325fed6522e6e4b4c5ed273b130ed9739d0bb61ed4a0d222a9726; result: f5ef356881768094640d33879569dde6c87c7a04d98bacdd8eacc0ad6faf484e

- high-perils/high-perils-49; horizon 30000; max era 4; lin:stub:s00:b0: COLLAPSED_RECOVERING: PLAGUE@29675 -> PLAGUE@29680 -> PLAGUE@29812 -> PLAGUE@29820 -> DISCOVERY@29935
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=15660, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 7fdb3b289bb69ca5a7771f3c29fd88d82fc9af7207627f8a18bd810d36df407e; recipe: 0dd4e1086efd7ea9c9ce74631856aaa45fdcf56c051bec2ec03da2598e9bf98e; result: c0300d9c7ec68efbe2fa5c4c10ee3f7a133c401736f7a1e095a2cdb5469c9448

- high-perils/high-perils-54; horizon 30000; max era 3; lin:stub:s00:b0: COLLAPSED_RECOVERING: RECOVERY@29930
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: cc867eb82ec2348f8351fae91f30150e8b13ab0a219cfcbe1705c753bdc62c90; recipe: 73161da136d8bc3920dc7d382aadf2534af01b78de9f6c72d8484d17bde84b57; result: 125b191f18fb75afe115d4d1fe6770dee543b35f2c0f8602eba888ee5f991a1a

- high-perils/high-perils-59; horizon 30000; max era 4; lin:stub:s00:b0: EXISTENTIAL_CAP: WAR@29410 -> WAR@29463 -> WAR@29470 -> COLLAPSE@29813 -> FAMINE@29820 -> WAR@29866 -> WAR@29870 -> DISCOVERY@29999
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=2260, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 64ca7166efeff9256795ac9f120f97342b31517c224383411169367a60998985; recipe: 2e64c912e5ac5d09c590133c6546541012423782d68f4736e752ac16e27b987d; result: 2a81fa0c79709a941d2b7939b7605c841f507ac39fa550af7f32798e2b3564fc

- high-perils/high-perils-9; horizon 30000; max era 5; lin:stub:s00:b0: EXISTENTIAL_CAP: DISCOVERY@14196 -> SPACEFLIGHT@14200; first expansion chronology: SPACEFLIGHT@14200
  - First eras: E0=0, E1=0, E2=0, E3=0, E4=13980, E5=14230, E6=not reached, E7=not reached
  - Manifest: 88e63a0363806f8cc9f7fdc2d157c89e0a040305ffd3eb25471acd27572f7f49; recipe: 5ed6b3b49d6a0f713b202811f47bf3fbe95c17e4c2b401db4ec2448047ce6a7a; result: 8a25b86f378e5c8011a7c51c52c63b91c657a72819fd5825b614e50d47356fad

- lonely-earthlike/lonely-earthlike-0; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: ad4c012eb0b3b428e6a49ad52938fe084a9ed0551c292586175232b87da2fa95; result: bb7ff0687e386ad6e063b0c59f44e756bba76c2d08d087a6b747ac45a5e88971
  - [Timeline](timeline-lonely-earthlike-lonely-earthlike-0.svg)

- lonely-earthlike/lonely-earthlike-10; horizon 120000; max era 7; lin:stub:s00:b0: REGRESSED_STABLE: DISCOVERY@111962 -> SPACEFLIGHT@111970; first expansion chronology: SPACEFLIGHT@91120 ; LAUNCH@92805 ; COLONY_FOUNDED@92810; first interstellar colony: COLONY_FOUNDED@93510
  - First eras: E0=36610, E1=74160, E2=86600, E3=87420, E4=91010, E5=92750, E6=93010, E7=93170
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 018bb2a45cf50986d32da9e643b2ce7cf5c9e43288014d22c1ee975bc2cbd8d5; result: 3d4f96654d032cdff7d8c3529a9eacdc3eb0b620927176445991f7e163376111

- lonely-earthlike/lonely-earthlike-15; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: de650620481f32f7467d081456a41af0540900eb37c74b93ceba22d8720f370c; result: 9a4c6eb7f39e7f94e9b8fadad8aa98db386bf4cc9b33452e0c4cab312257355a

- lonely-earthlike/lonely-earthlike-20; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: ec5f4d25bd75239fa5ebed5ade22cf2e0b2e55e097ee2ecd6f4682552f186fe3; result: e264e8a7b3b0aa76df71d94ccdd030a2f9f744dd6ba8d544f07e2fad661bb11c

- lonely-earthlike/lonely-earthlike-25; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 7296fc378de4ebbd59af88ff1e1eeb3b2ae3bbf72a32fd34c8d93f97daf34137; result: 62bb18943411d09eb1f8d0e59e410b988ebdd04f040f2deea241200048334255

- lonely-earthlike/lonely-earthlike-30; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 3c386b9089a7cbc1737fa289640e6273c5c42dddebd5528a3104ef23f445d0d7; result: dca17e922d3d7ba38c9eab7df58e6b7884c8d024de127a79ecb99b455afce650

- lonely-earthlike/lonely-earthlike-35; horizon 120000; max era 7; lin:stub:s00:b0: EXTANT_MULTI_SYSTEM: WAR@118769 -> WAR@118770 -> WAR@119318 -> WAR@119320 -> WAR@119399 -> WAR@119400 -> LAUNCH@119509 -> COLONY_FOUNDED@119910; first expansion chronology: SPACEFLIGHT@65450 ; LAUNCH@65700 ; COLONY_FOUNDED@65720; first interstellar colony: COLONY_FOUNDED@66410
  - First eras: E0=47990, E1=57170, E2=64600, E3=65240, E4=65350, E5=65550, E6=65790, E7=65800
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 33257d433aec3b321ff7bb3ecbec9862611f71dc645279e039afab3973b7868a; result: 64ab58a21ba7ca60c8d7f310c639b5b8b5e57b71264cf7005bb9f16735ad21ea

- lonely-earthlike/lonely-earthlike-40; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 2c1ed6814582cbe487f0edce0389560377a5cadf3320581e32453a9a0a6c2fe6; result: c381d6fc2884fa8f23c1f6c1ba4a756b1ed4cbbede4ebcec50fb2c02b0e0d02f

- lonely-earthlike/lonely-earthlike-45; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 2dd8856f05149eb2797859095a0ae59d0a67d9ce27e62f38329e615ecb43d166; result: 8650e27d734d1dccadd1d032d41b1ad4633322b81b6b6bbdbbe0944c1cbdb46f

- lonely-earthlike/lonely-earthlike-5; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 2abdcf1f56c11112617d66bbee5026a70baf78180dba401b9b07e22d4ddb14f7; result: 15efc6e93397fb2d2cc2e99398b26129bb3a3390073c8a69455baf61b7b7fdfc

- lonely-earthlike/lonely-earthlike-50; horizon 120000; max era 2; lin:stub:s00:b0: EXTINCT_NATURAL: LINEAGE_EXTINCTION@100019
  - First eras: E0=75660, E1=81180, E2=99620, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 2b05d41580b05b50090d3d6acc27ea8b3aff40fede21aab0a49cd1ae9ea959ea; result: 7c850f3151b74cd8fe0e0717cb81c32afb7c1499084277482b2fe7c69ec01d7a

- lonely-earthlike/lonely-earthlike-55; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: f9ecf118175b663fd7e3fceca605fbafa16fe8dc5f574a64740b150c6838ace2; result: c2ffcefe472d44c217f22f1eb0e71c6efcf471b1e08c290d5113926f06459b3d

- lonely-earthlike/lonely-earthlike-60; horizon 120000; max era 0; NO_LINEAGE: hard-step origin not attained within the observation window
  - First eras: E0=not reached, E1=not reached, E2=not reached, E3=not reached, E4=not reached, E5=not reached, E6=not reached, E7=not reached
  - Manifest: 67ecaaabe09e6ec5c551763ccbd28491f1add8079c6a6d2c8048613825de4dcd; recipe: 1d6e18d05d9eaa2a189ea11311e8b001aa91ca8bcec83eb2f3159980d4e0324a; result: e8d5584ffd6141fe6a347a455b2a61d3ab439590437c640786d47aac905f6129
