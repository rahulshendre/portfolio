// The help drawer: a HELP button under the sound switch opens a side panel with the controls for whichever scene is showing.
// While it is open the ride holds still; the buttons inside press the same keys the ride already listens for.

export interface HelpHooks {
  /** Called with true when the drawer opens and false when it closes, so the scene can hold still. */
  held: (open: boolean) => void;
}

export function mountHelp(hooks: HelpHooks) {
  const btn = document.getElementById('help-btn') as HTMLButtonElement | null;
  const drawer = document.getElementById('help') as HTMLElement | null;
  const back = document.getElementById('help-back') as HTMLElement | null;
  if (!btn || !drawer || !back) return { get isOpen() { return false; }, close() {} };

  let open = false;
  const set = (on: boolean) => {
    if (on === open) return;
    open = on;
    drawer.hidden = back.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    hooks.held(on);
    if (on) (drawer.querySelector('.help-close') as HTMLElement | null)?.focus();
    else btn.focus();
  };

  btn.addEventListener('click', () => set(!open));
  back.addEventListener('click', () => set(false));
  drawer.querySelector('.help-close')?.addEventListener('click', () => set(false));

  // Escape closes the drawer and nothing else: capture it before the ride reads it as "leave the ride".
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { e.preventDefault(); e.stopImmediatePropagation(); set(false); }
    else if (e.key === '?' && !(e.target as HTMLElement | null)?.closest?.('input,textarea')) { e.preventDefault(); set(!open); }
  }, true);

  // "Try it" buttons press a key the ride already handles (camera, night, weather, light, look, photo).
  drawer.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
    if (!b) return;
    const code = b.dataset.key!;
    dispatchEvent(new KeyboardEvent('keydown', { code, key: code }));
    dispatchEvent(new KeyboardEvent('keyup', { code, key: code }));
  });
  // Links inside the drawer (ride again, one page) leave the page or reload it: close first so nothing is left held.
  drawer.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) set(false); });

  return { get isOpen() { return open; }, close: () => set(false) };
}
