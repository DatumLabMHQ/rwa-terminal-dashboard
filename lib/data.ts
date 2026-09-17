// What the kit's frame reads from this dashboard (lib/platform.ts FrameData), plus the loaders the
// pages use. The RWA shapes and loaders live in lib/rwa.ts.
import type { FrameData } from './platform';
import { loadRwa } from './rwa';
export { platformStatus, showKit } from './platform';
export { loadRwa, loadReserve, loadRwaMarket, loadAsset } from './rwa';

/** Assets, Horizon reserves and Morpho markets, for the cmd+k palette. */
export const searchItems: FrameData['searchItems'] = async () => {
  const o = await loadRwa();
  return [
    ...o.assets.map((a) => ({ label: `${a.ticker}, ${a.name}`, href: `/assets/${a.id}`, hint: 'Asset' })),
    ...o.reserves.map((r) => ({ label: `${r.symbol} on Aave Horizon`, href: `/horizon/${r.symbol}`, hint: 'Horizon' })),
    ...o.markets.map((m) => ({ label: `${m.collateralSymbol} / ${m.loanSymbol}`, href: `/markets/${m.id}`, hint: 'Morpho' })),
  ];
};
/** Counts next to the nav entries. */
export const navBadges: FrameData['navBadges'] = async () => {
  const o = await loadRwa();
  return { '/horizon': o.reserves.length, '/markets': o.markets.length, '/assets': o.assets.length };
};
/** The reserves, markets and assets under their pages in the sidebar. */
export const navChildren: FrameData['navChildren'] = async () => {
  const o = await loadRwa();
  return {
    '/horizon': o.reserves.map((r) => ({ label: r.symbol, href: `/horizon/${r.symbol}` })),
    '/markets': o.markets.map((m) => ({ label: `${m.collateralSymbol} / ${m.loanSymbol}`, href: `/markets/${m.id}` })),
    '/assets': o.assets.map((a) => ({ label: a.ticker, href: `/assets/${a.id}` })),
  };
};
