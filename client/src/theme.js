// ─────────────────────────────────────────────
//  SHOP THEME — change this one word to switch:
//    'tea'   = Kericho Tea (green + chai amber)
//    'spice' = Spice Market (terracotta + saffron)
//    'night' = Night Kitchen (charcoal + lime)
// ─────────────────────────────────────────────
export const SHOP_THEME = 'night';

export const BRAND_NAME = 'DMC Flavours';

const THEMES = {
  tea:   { forceDark: false, icon: 'leaf',  color: '#1F6B4A', tagline: 'Fresh from Kericho' },
  spice: { forceDark: false, icon: 'flame', color: '#C4512D', tagline: 'Spiced right, served hot' },
  night: { forceDark: false, icon: 'moon',  color: '#9BE15D', tagline: 'Late-night cravings, sorted' },
};

// Preview another theme without changing code: add ?theme=spice to any page address
function pick() {
  try {
    const q = new URLSearchParams(window.location.search).get('theme');
    if (q && THEMES[q]) { sessionStorage.setItem('preview-theme', q); return q; }
    const s = sessionStorage.getItem('preview-theme');
    if (s && THEMES[s]) return s;
  } catch { /* ignore */ }
  return SHOP_THEME;
}

export const ACTIVE_THEME = pick();
export const theme = THEMES[ACTIVE_THEME];

export function applyTheme() {
  const root = document.documentElement;
  root.dataset.theme = ACTIVE_THEME;
  if (theme.forceDark) root.classList.add('dark');
  // browser tab icon in the theme colour
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${theme.color}"/><text x="16" y="21.5" font-family="Arial,sans-serif" font-size="13" font-weight="700" text-anchor="middle" fill="${ACTIVE_THEME === 'night' ? '#12160E' : '#fff'}">DMC</text></svg>`;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  const meta = document.querySelector('meta[name="theme-color"]') || Object.assign(document.createElement('meta'), { name: 'theme-color' });
  meta.content = getComputedStyle(root).getPropertyValue('--app') ? `rgb(${getComputedStyle(root).getPropertyValue('--app').trim().replace(/ /g, ',')})` : theme.color;
  document.head.appendChild(meta);
}
