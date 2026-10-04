// Observation adapter. Refiners never import this module or the solver.
export function inspectionTicks(world,result,domain=false){
  const ticks=!domain?result.ledgers.map(l=>({tick:BigInt(l.tick),def:world.def,start:l.boundaryState,pre:l.phase0.state,end:l.endState,updates:{naturalDelta:l.naturalDelta},events:result.events.filter(e=>e.tick===l.tick)})):
    result.ledgers.flatMap(s=>s.planets.map(p=>({tick:BigInt(p.ledger.tick),def:{...world.def,planet:world.def.planets.find(b=>b.body===p.pre.body)},start:p.boundary,pre:p.pre,end:p.state,updates:p.updates,events:[...s.ledger.eventIds.map(id=>result.events.find(e=>e.id===id)).filter(e=>e?.data.target===p.id),...p.events]})));
  const histories=new Map();
  for(const t of ticks){t.regionHistory={};for(const r of t.start.regions){const previous=histories.get(r.id),history=previous?.at(-1).tick===String(t.tick)?previous:[{tick:String(t.tick),pop:r.pop}];const next=[...history,{tick:String(t.tick+1n),pop:t.end.regions.find(x=>x.id===r.id).pop}];histories.set(r.id,next);t.regionHistory[r.id]=next;}}
  return ticks;
}
