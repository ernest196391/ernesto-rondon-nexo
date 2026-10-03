// Shared UI pieces of the POS shell: icons (Tabler outline, as in the
// design), the store logo and bottom sheets.

const ICONS: Record<string, string> = {
  tag: '<circle cx="7.5" cy="7.5" r="1.5"></circle><path d="M3 6v5.2a2 2 0 0 0 .6 1.4l7.7 7.7a2.4 2.4 0 0 0 3.4 0l5.6-5.6a2.4 2.4 0 0 0 0-3.4L12.6 3.6A2 2 0 0 0 11.2 3H6a3 3 0 0 0-3 3z"></path>',
  wallet: '<path d="M17 8V5a1 1 0 0 0-1-1H6a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6"></path><path d="M20 12v4h-4a2 2 0 0 1 0-4h4"></path>',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3"></path><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"></path>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect>',
  search: '<circle cx="10" cy="10" r="7"></circle><path d="M21 21l-6-6"></path>',
  scan: '<path d="M4 7V6a2 2 0 0 1 2-2h2M4 17v1a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v1M16 20h2a2 2 0 0 0 2-2v-1M7 9v6M10 9v6M13 9v6M17 9v6"></path>',
  chevron: '<path d="M9 6l6 6-6 6"></path>',
  back: '<path d="M15 6l-6 6 6 6"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  minus: '<path d="M5 12h14"></path>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"></path>',
  cash: '<rect x="3" y="6" width="18" height="12" rx="2"></rect><circle cx="12" cy="12" r="2.5"></circle>',
  transfer: '<path d="M7 10h14l-4-4M17 14H3l4 4"></path>',
  offline: '<path d="M3 3l18 18"></path><path d="M18 18H7a4 4 0 0 1-.9-7.9A5 5 0 0 1 8 6.5M10.7 5.2A5 5 0 0 1 17 9h1a4 4 0 0 1 2.5 7.1"></path>',
  cloud: '<path d="M7 18a4 4 0 0 1-.9-7.9A5 5 0 0 1 17 9h1a4 4 0 0 1 0 9H7z"></path>',
  check: '<path d="M5 12l5 5L20 7"></path>',
  share: '<circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="6" r="2.5"></circle><circle cx="18" cy="18" r="2.5"></circle><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"></path>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path>',
  clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path>',
  alert: '<path d="M12 9v4M12 17h.01"></path><path d="M10.3 3.9L2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path>',
};

export function icon(name: keyof typeof ICONS | string, size: "" | "sm" | "lg" = "") {
  return `<svg class="i${size ? ` i-${size}` : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;
}

/** Casa Viva isotipo (official vector, casa-viva-logo.zip), in the text color. */
export const ISOTIPO = `<svg class="isotipo" viewBox="0 0 983 1000" aria-hidden="true"><path fill="currentColor" d="M473.3 995.1C211.9 995.1 0 772.4 0 497.6C0 222.8 211.9 0 473.3 0C582 0 682.2 38.6 762.1 103.4V196.7C700.9 127.4 618.5 85 527.9 85C338.9 85 185.7 269.7 185.7 497.6C185.7 725.5 338.9 910.2 527.9 910.2C535.3 910.2 542.7 909.9 550 909.3L575.3 983.6C542.4 991.1 508.3 995.1 473.3 995.1ZM322.8 245.1H555.8V264.6Q542.2 264.6 532.6 269.6L677.4 694.3L863.9 267.8Q855.6 264.6 844.7 264.6V245.1H983V264.6Q951.5 264.6 941.7 291.3H921.6L611.7 1000L370.1 291.3H364.1Q354.4 264.6 322.8 264.6ZM710.5 846.6C765.2 804.9 809.5 745 837.4 674V815.5C790.8 874.4 731.5 921.8 663.9 953.1Z"></path></svg>`;

export const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type Sheet = { el: HTMLElement; close: () => void; closed: Promise<void> };

/**
 * Opens a bottom sheet (centered dialog on wide screens) inside the app
 * root, so the theme applies. Tapping outside or `close()` removes it.
 */
export function openSheet(html: string, label: string): Sheet {
  const app = document.querySelector<HTMLElement>(".nx.app") ?? document.body;
  const wrap = document.createElement("div");
  wrap.className = "overlay";
  wrap.innerHTML = `<button class="scrim" aria-label="Cerrar"></button>
    <section class="sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(label)}"><div class="handle"></div>${html}</section>`;
  app.appendChild(wrap);
  let resolve!: () => void;
  const closed = new Promise<void>(r => (resolve = r));
  const close = () => {
    if (!wrap.isConnected) return;
    wrap.remove();
    resolve();
  };
  wrap.querySelector<HTMLButtonElement>(".scrim")!.onclick = close;
  return { el: wrap.querySelector<HTMLElement>(".sheet")!, close, closed };
}
