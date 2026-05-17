import { writable } from 'svelte/store';

export interface Route {
  path: string;
  hash: string;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, hash = ''] = raw.split('#');
  return { path, hash };
}

export const route = writable<Route>(parse());

window.addEventListener('hashchange', () => {
  route.set(parse());
  // scroll to in-page hash if present
  const { hash } = parse();
  if (hash) {
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  } else {
    window.scrollTo({ top: 0 });
  }
});

export function navigate(path: string, hash?: string) {
  window.location.hash = hash ? `${path}#${hash}` : path;
}

export function href(path: string, hash?: string): string {
  return hash ? `#${path}#${hash}` : `#${path}`;
}
