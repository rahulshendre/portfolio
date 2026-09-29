// The garage TV's terminal window: a real dialog over the stage (focus trapped, Esc closes, back button closes).
import { BOOT, complete, run, type Effect, type Line } from './terminal';

export interface TerminalHooks {
  night(): void;
  radio(): void;
  ride(): void;
  /** Called after the dialog closes, so focus can go back to the TV. */
  closed(): void;
}

const HASH = '#terminal';

export function mountTerminal(hooks: TerminalHooks) {
  const root = document.getElementById('term') as HTMLElement;
  const out = root.querySelector('.term-out') as HTMLElement;
  const form = root.querySelector('form') as HTMLFormElement;
  const input = root.querySelector('input') as HTMLInputElement;
  const closeBtn = root.querySelector('.term-close') as HTMLButtonElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const past: string[] = [];
  let hpos = 0, isOpen = false, booted = false;

  const print = (l: Line) => {
    const el = document.createElement(l.href ? 'a' : 'div');
    el.textContent = l.text;
    if (l.tone) el.className = l.tone;
    if (l.href && el instanceof HTMLAnchorElement) {
      el.href = l.href;
      if (l.external) { el.target = '_blank'; el.rel = 'noopener'; }
    }
    out.append(el);
    out.scrollTop = out.scrollHeight;
  };

  const printAll = async (lines: Line[]) => {
    for (const l of lines) { print(l); if (!reduced) await new Promise((r) => setTimeout(r, 40)); }
  };

  function open() {
    if (isOpen) return;
    isOpen = true;
    root.hidden = false;
    if (location.hash !== HASH) history.pushState({ term: 1 }, '', HASH);
    if (!booted) { booted = true; void printAll(BOOT); }
    input.focus();
  }

  function close(fromPop = false) {
    if (!isOpen) return;
    isOpen = false;
    root.hidden = true;
    if (!fromPop && location.hash === HASH) history.back();
    hooks.closed();
  }

  function apply(effect: Effect | undefined) {
    if (!effect) return;
    if (effect === 'close') close();
    else if (effect === 'clear') out.replaceChildren();
    else if (effect === 'night') hooks.night();
    else if (effect === 'radio') hooks.radio();
    else if (effect === 'ride') { close(); hooks.ride(); }
    else if (effect.external) window.open(effect.go, '_blank', 'noopener');
    else location.href = effect.go;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cmd = input.value;
    input.value = '';
    if (cmd.trim()) { past.push(cmd); hpos = past.length; }
    print({ text: `> ${cmd}`, tone: 'dim' });
    const res = run(cmd);
    if (res.effect === 'clear') { apply(res.effect); return; }
    void printAll(res.lines).then(() => apply(res.effect));
  });

  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (document.activeElement === input) {
        const hit = complete(input.value);
        if (hit.length === 1) { input.value = hit[0]; return; }
        if (hit.length > 1) { print({ text: hit.join('  '), tone: 'dim' }); return; }
        closeBtn.focus();
      } else input.focus();
      return;
    }
    if (document.activeElement !== input) return;
    if (e.key === 'ArrowUp' && past.length) { e.preventDefault(); hpos = Math.max(0, hpos - 1); input.value = past[hpos]; }
    if (e.key === 'ArrowDown') { e.preventDefault(); hpos = Math.min(past.length, hpos + 1); input.value = past[hpos] ?? ''; }
  });
  closeBtn.addEventListener('click', () => close());
  root.addEventListener('pointerdown', (e) => { if (e.target === root) close(); }); // the dim backdrop
  root.querySelector('.term-win')!.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('a,button')) input.focus(); });
  addEventListener('popstate', () => {
    if (isOpen && location.hash !== HASH) close(true);
    else if (!isOpen && location.hash === HASH) open();
  });

  return { open, close, get isOpen() { return isOpen; } };
}
