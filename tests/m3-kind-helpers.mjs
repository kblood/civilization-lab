import {graph} from './domain-helpers.mjs';
import {forced,region,setOverride} from './civ-helpers.mjs';
export function contactFixture(){const input=graph(3);input.origins.push('stub:s01:b0');input.routes[0].lightYears=20;
  const f=forced('FIRST_CONTACT');f.ticks=6;f.initial.regions=[region('r00',{pop:'100000',tiers:[3,3,3,3,3,2,3]})];
  setOverride(f,'origins.startingRegime','1');setOverride(f,'parameters.g',Array(8).fill(0));return {input,f};}
