import { describe, expect, it } from 'vitest';
import { crowds, xpExtras, XP_DRAW } from './meadow';
import { buildTrack, FINISH, LAKE_FROM, N, shore, TOWNS } from './track-ladakh';

describe('the Bliss land', () => {
  it('lets no tree, bush, flower or animal grow through a house, shop, wall or board beside the road', () => {
    for (const salt of [0, 17, 4242]) {
      const segs = buildTrack([], { salt });
      for (let i = 0; i < 1260; i++) for (const e of xpExtras(i, salt, segs[i].props)) for (const q of segs[i].props) expect(crowds(e, q), `${e.type} at ${e.o.toFixed(1)} with ${q.type} at ${q.o.toFixed(1)}, segment ${i}, salt ${salt}`).toBe(false);
    }
  });
  it('keeps trees clear of the animals and the pond in the same field', () => {
    for (let i = 0; i < N; i++) {
      const e = xpExtras(i);
      for (const t of e.filter((x) => x.type === 'tree' || x.type === 'bush' || x.type === 'flowers')) for (const h of e.filter((x) => x.type !== 'tree' && x.type !== 'bush' && x.type !== 'flowers')) expect(crowds(t, h), `${t.type} with ${h.type}, segment ${i}`).toBe(false);
    }
  });
  it('always puts the same trees and flowers beside the same stretch of road', () => {
    for (const i of [10, 333, 900]) expect(xpExtras(i)).toEqual(xpExtras(i));
  });
  it('adds trees, bushes and flowers along the whole route', () => {
    const all = Array.from({ length: N }, (_, i) => xpExtras(i)).flat();
    for (const type of ['tree', 'bush', 'flowers']) expect(all.filter((e) => e.type === type).length, type).toBeGreaterThan(40);
  });
  it('keeps clear of the town streets, the river, the lake and the garage forecourt', () => {
    for (let i = 0; i < N; i++) for (const e of xpExtras(i)) {
      if (TOWNS.some((t) => i >= t.gate - 8 && i <= t.to + 4)) expect(Math.abs(e.o), `town ${i}`).toBeGreaterThanOrEqual(5);
      if (i >= 270 && i < 620) expect(e.o < -2.4 && e.o > -9.5, `river ${i}`).toBe(false);
      if (i >= LAKE_FROM - 10 && i < 1260 && e.o > 0) expect(e.o, `lake ${i}`).toBeLessThanOrEqual(shore(i) - 1.2);
      if (i >= FINISH - 56 && i <= FINISH + 8) expect(Math.abs(e.o), `garage ${i}`).toBeGreaterThanOrEqual(8);
    }
  });
  it('dresses every Himalayan home, landmark and animal for the green hills, and drops the snow', () => {
    for (const t of ['house', 'shop', 'gate', 'stall', 'monk', 'tourer', 'lamp', 'dhaba', 'village', 'gompa', 'palace', 'monastery', 'stupahill', 'buddha', 'gurdwara', 'checkpost', 'camp', 'summit', 'canopy', 'chorten', 'mani', 'flags', 'darchog', 'flagmound', 'boulder', 'scrub', 'tuft', 'cairn', 'yak', 'camel', 'kiang', 'marmot', 'dog']) expect(XP_DRAW[t], t).toBeTypeOf('function');
    expect(XP_DRAW.snow).toBeNull();
  });
  it('adds farm animals, barns and windmills to the fields', () => {
    const all = Array.from({ length: N }, (_, i) => xpExtras(i)).flat();
    for (const type of ['cows', 'flock', 'paddock', 'deer', 'hens', 'flagmound', 'windmill', 'farm', 'wall']) expect(all.filter((e) => e.type === type).length, type).toBeGreaterThan(3);
    for (const e of all) expect(XP_DRAW[e.type], e.type).toBeTypeOf('function');
  });
});
