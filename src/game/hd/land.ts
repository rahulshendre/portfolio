// Which land the ride is in, so the props, the traffic and the garage can each dress for it without importing one another.
export type Land = 'himalaya' | 'xp';
let LAND: Land = 'himalaya';
export const setLand = (l: Land) => { LAND = l; };
export const getLand = () => LAND;
export const isBliss = () => LAND === 'xp';
