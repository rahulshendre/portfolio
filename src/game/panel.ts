// Sections open in a panel over the garage instead of leaving it. The panel is an iframe of the real page,
// so the page still works on its own (deep link, no JS, middle click). Pure helpers first, DOM below.
import { nav } from '../data/site';

// Only same-site page paths (with an optional #anchor) may ever reach the iframe: the hash is user-controlled.
const SAFE = /^\/[a-z0-9][a-z0-9/-]*(#[\w-]+)?$/i;

export const isPanelHref = (href: string) => SAFE.test(href);
export const panelHash = (href: string) => `#p=${encodeURIComponent(href)}`;

export function parsePanelHash(hash: string): string | null {
  if (!hash.startsWith('#p=')) return null;
  let href: string;
  try { href = decodeURIComponent(hash.slice(3)); } catch { return null; }
  return isPanelHref(href) ? href : null;
}

export function titleFor(href: string): string {
  const path = href.split('#')[0];
  return (nav.find((n) => n.href === path)?.label ?? path.slice(1).replace(/-/g, ' ')).toUpperCase();
}

export interface PanelHooks { closed(): void }

export function mountPanel(hooks: PanelHooks) {
  const root = document.getElementById('panel') as HTMLElement;
  const win = root.querySelector('.panel-win') as HTMLElement;
  const frame = document.getElementById('panel-frame') as HTMLIFrameElement;
  const title = document.getElementById('panel-title') as HTMLElement;
  const full = document.getElementById('panel-full') as HTMLAnchorElement;
  const closeBtn = root.querySelector('.panel-close') as HTMLButtonElement;
  let isOpen = false, opener: HTMLElement | null = null;

  // location.replace, not src=: setting src adds to the browser's history, which would break the back button.
  const go = (url: string) => { try { frame.contentWindow!.location.replace(url); } catch { frame.src = url; } };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };

  function open(href: string, label = titleFor(href), from?: HTMLElement) {
    if (!isPanelHref(href)) return;
    opener = from ?? (document.activeElement as HTMLElement | null);
    const hash = panelHash(href);
    if (!isOpen) {
      if (location.hash === '#terminal') history.replaceState({ panel: 1 }, '', hash); // came from the terminal: swap, don't stack
      else if (location.hash !== hash) history.pushState({ panel: 1 }, '', hash);
    }
    isOpen = true;
    title.textContent = label;
    full.href = href;
    go(href);
    root.hidden = false;
    const r = (from ?? opener)?.getBoundingClientRect(), w = win.getBoundingClientRect(); // grow out of the thing you clicked
    if (r) { win.style.setProperty('--ox', `${r.left + r.width / 2 - w.left}px`); win.style.setProperty('--oy', `${r.top + r.height / 2 - w.top}px`); }
    closeBtn.focus();
  }

  function close(fromPop = false) {
    if (!isOpen) return;
    isOpen = false;
    root.hidden = true;
    go('about:blank'); // stop anything playing
    if (!fromPop && parsePanelHash(location.hash)) history.back();
    hooks.closed();
    opener?.focus?.();
  }

  frame.addEventListener('load', () => {
    if (!isOpen) return;
    try { frame.contentWindow?.addEventListener('keydown', onKey); frame.contentWindow?.focus(); } catch { /* cross-origin: ignore */ }
  });
  closeBtn.addEventListener('click', () => close());
  root.addEventListener('keydown', onKey);
  root.addEventListener('pointerdown', (e) => { if (e.target === root) close(); });
  addEventListener('popstate', () => {
    const href = parsePanelHash(location.hash);
    if (isOpen && !href) close(true);
    else if (!isOpen && href) open(href);
  });
  // The embedded page asks to leave (its "garage" links): close the panel.
  addEventListener('message', (e) => { if (e.origin === location.origin && e.data?.rs === 'close-panel') close(); });

  return { open, close, get isOpen() { return isOpen; } };
}
