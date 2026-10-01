import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { use } from './draw';
import { XP_DRAW } from './meadow';
import { drawBlissCar } from './farm';
import { drawButterflies, drawFireflies } from './ambient';
import { setLand } from './land';

/** A canvas context that accepts every call and draws nothing: enough to find a drawing that reaches for something that is not there. */
function nullContext() {
  const grad = { addColorStop: () => {} };
  const state: Record<string, unknown> = {};
  return new Proxy(state, {
    get: (t, k: string) => {
      if (k in t) return t[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
      if (k === 'measureText') return () => ({ width: 10 });
      return () => {};
    },
    set: (t, k: string, v) => { t[k] = v; return true; },
  }) as unknown as CanvasRenderingContext2D;
}

describe('the Bliss land draws', () => {
  const had = (globalThis as { document?: unknown }).document;
  beforeAll(() => {
    (globalThis as { document?: unknown }).document = { createElement: () => ({ width: 0, height: 0, getContext: () => nullContext() }) };   // the hills paint themselves into a small canvas once
    use(nullContext()); setLand('xp');
  });
  afterAll(() => { (globalThis as { document?: unknown }).document = had; setLand('himalaya'); });

  it('every prop it dresses, at several sizes and variants', () => {
    for (const [type, fn] of Object.entries(XP_DRAW)) {
      if (!fn) continue;
      for (const v of [0, 1, 2, 3, 5, 7]) for (const k of [0.1, 0.4, 1, 3]) expect(() => fn(300, 300, k, { v, label: 'LEH', sub: '4 KM', lines: ['A', 'B'] }), `${type} v${v} k${k}`).not.toThrow();
    }
  });
  it('every vehicle and animal on the road, and leaves riders to the usual drawing', () => {
    for (const kind of ['army', 'tanker', 'tempo', 'suv', 'yak', 'goats', 'marmot']) expect(() => drawBlissCar(kind, 300, 300, 1, 0.5), kind).not.toThrow();
    for (const kind of ['army', 'tanker', 'tempo', 'suv', 'yak', 'goats', 'marmot']) expect(drawBlissCar(kind, 300, 300, 1, 0), kind).toBe(true);
    expect(drawBlissCar('biker', 300, 300, 1, 0)).toBe(false);
  });
  it('the butterflies and the fireflies, in and out of view', () => {
    for (const k of [0, 0.5, 1]) {
      expect(() => drawButterflies(nullContext(), 1280, 720, 0.4, 3.3, k)).not.toThrow();
      expect(() => drawFireflies(nullContext(), 1280, 720, 0.4, 3.3, k)).not.toThrow();
    }
  });
});
