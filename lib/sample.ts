// Labelled sample data for the pages when no DATUM_API_KEY is set. Shaped like the platform's
// September 2026 numbers so the dashboard can be judged as is; every page says it is sample data.
import { SAMPLE_AS_OF } from './platform';
import { config } from '@/datum.config';
import type { Asset, AssetDetail, Point, Reserve, ReserveDetail, RwaMarket, RwaMarketDetail, RwaOverview } from './rwa-types';
export { SAMPLE_AS_OF };

const rnd = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const daysBack = (n: number, from = SAMPLE_AS_OF) => Array.from({ length: n + 1 }, (_, i) => { const d = new Date(from + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (n - i)); return d.toISOString().slice(0, 10); });
const series = (days: string[], end: number, growth: number, wobble: number, seed: number) => {
  const r = rnd(seed); const out: number[] = []; let v = end / (1 + growth);
  days.forEach(() => { v *= 1 + growth / days.length + (r() - 0.5) * wobble; out.push(v); });
  const k = end / out[out.length - 1]; return out.map((x) => x * k);
};
const STABLE = new Set(config.stablecoins);
const meta = (s: string) => config.assets[s] ?? { class: 'Other', issuer: 'n/a' };
const risk = (u: number) => (u > 85 ? 'high' : u > 70 ? 'moderate' : 'safe') as Reserve['risk'];

// symbol, address tail, supplied, borrowed, supply APY, borrow APY, LTV, liquidation threshold, oracle price
const RESERVES: [string, string, number, number, number, number, number, number, number][] = [
  ['USDC', '1c4e', 201.4e6, 124.9e6, 3.91, 6.18, 0, 0, 1], ['GHO', '6c2f', 60.0e6, 39.0e6, 1.76, 3.0, 0, 0, 1], ['RLUSD', '9d21', 45.2e6, 23.1e6, 2.08, 4.4, 0, 0, 1],
  ['USYC', '7a1b', 47.9e6, 0, 0, 0, 88, 90, 1.1027], ['USTB', '31c4', 39.0e6, 0, 0, 0, 88, 90, 11.2082], ['JTRSY', '4f3e', 33.4e6, 0, 0, 0, 85, 88, 1.1311],
  ['JAAA', '8b0d', 21.8e6, 0, 0, 0, 80, 85, 1.0244], ['USCC', '2e9a', 12.3e6, 0, 0, 0, 70, 78, 12.41], ['VBILL', 'c5d6', 6.1e6, 0, 0, 0, 75, 80, 1.0181], ['ACRED', 'f27b', 0, 0, 0, 0, 66, 76, 1110.57],
];
// market id tail, collateral, loan, asset class, LLTV %, collateral USD, borrowed USD, borrow APY %
const MARKETS: [string, string, string, string, number, number, number, number][] = [
  ['8501', 'syrupUSDC', 'PYUSD', 'Private Credit', 91.5, 60.1e6, 50.8e6, 4.52], ['d0ba', 'mF-ONE', 'USDC', 'Private Credit', 91.5, 31.7e6, 22.9e6, 7.38],
  ['1a2b', 'syrupUSDC', 'USDC', 'Private Credit', 91.5, 44.6e6, 38.2e6, 4.8], ['3c4d', 'PAXG', 'USDC', 'Commodities (Gold)', 77, 39.8e6, 15.2e6, 6.2],
  ['5e6f', 'XAUt', 'USDC', 'Commodities (Gold)', 77, 24.9e6, 9.1e6, 5.8], ['7a8b', 'wJAAA', 'USDC', 'Private Credit (CLO)', 86, 18.2e6, 12.4e6, 5.1],
  ['9c0d', 'EUTBL', 'EURC', 'Govt Bonds (EU)', 96.5, 8.3e6, 5.0e6, 2.1], ['e1f2', 'PAXG', 'USDT', 'Commodities (Gold)', 62.5, 12.1e6, 3.0e6, 4.0], ['a3b4', 'wJAAA', 'PYUSD', 'Private Credit (CLO)', 86, 6.2e6, 3.1e6, 5.5],
];
// id, ticker, name, issuer, AUM, source
const ASSETS: [string, string, string, string, number, string][] = [
  ['2', 'USDC', 'USDC', 'Circle', 50572.7e6, 'onchain_derived'], ['6', 'USYC', 'USYC', 'Circle (Hashnote)', 2604.6e6, 'hashnote_api'], ['3', 'RLUSD', 'RLUSD', 'Ripple', 1369.7e6, 'onchain_derived'],
  ['4', 'USTB', 'USTB', 'Superstate', 815.7e6, 'superstate_api'], ['7', 'JTRSY', 'JTRSY', 'Janus Henderson / Anemoy / Centrifuge', 725.2e6, 'onchain_derived'], ['1', 'GHO', 'GHO', 'Aave', 699.0e6, 'onchain_derived'],
  ['8', 'JAAA', 'JAAA', 'Janus Henderson / Anemoy / Centrifuge', 400.0e6, 'onchain_derived'], ['5', 'USCC', 'USCC', 'Superstate', 156.9e6, 'superstate_api'], ['10', 'ACRED', 'ACRED', 'Apollo / Securitize', 28.8e6, 'onchain_derived'], ['9', 'VBILL', 'VBILL', 'VanEck (Securitize)', 21.7e6, 'onchain_derived'],
];

const reserves = (): Reserve[] => RESERVES.map(([symbol, tail, supplied, borrowed, supplyApy, borrowApy, ltv, liqThreshold, price]) => {
  const utilization = supplied ? (borrowed / supplied) * 100 : 0;
  return { id: `0x${tail}${'0'.repeat(32)}${tail}`, symbol, kind: STABLE.has(symbol) ? 'stable' : 'rwa', assetClass: meta(symbol).class, issuer: meta(symbol).issuer, supplied, borrowed, available: supplied - borrowed, utilization, supplyApy, borrowApy, ltv, liqThreshold, price, nav: price, risk: risk(utilization) };
});
const markets = (): RwaMarket[] => MARKETS.map(([tail, collateralSymbol, loanSymbol, assetClass, lltv, collateralUsd, borrowed, borrowApy]) => {
  const utilization = (borrowed / (collateralUsd * lltv / 100)) * 100 * 0.9;
  return { id: `0x${tail}${'0'.repeat(56)}${tail}`, collateralSymbol, loanSymbol, assetClass, lltv, collateralUsd, borrowed, utilization, borrowApy, risk: risk(utilization) };
});
const assets = (rs: Reserve[]): Asset[] => ASSETS.map(([id, ticker, name, issuer, aum, source]) => {
  const horizonSupplied = rs.find((r) => r.symbol === ticker)?.supplied ?? 0;
  return { id, ticker, name, issuer, kind: STABLE.has(ticker) ? 'stable' : 'rwa', assetClass: meta(ticker).class, aum, source, horizonSupplied, deployedPct: aum ? (horizonSupplied / aum) * 100 : 0 };
});

export function sampleRwa(): RwaOverview {
  const rs = reserves(), ms = markets(), as = assets(rs);
  const days = daysBack(90);
  const rwaSeries = series(days, rs.filter((r) => r.kind === 'rwa').reduce((a, r) => a + r.supplied, 0), 0.14, 0.01, 7);
  const stSeries = series(days, rs.filter((r) => r.kind === 'stable').reduce((a, r) => a + r.supplied, 0), 0.08, 0.02, 11);
  const boSeries = series(days, rs.reduce((a, r) => a + r.borrowed, 0), 0.2, 0.03, 13);
  const aumSeries = series(days, 4820.3e6, 0.06, 0.004, 17);
  const horizon: Point[] = days.map((day, i) => ({ day, rwa: Math.round(rwaSeries[i]), stable: Math.round(stSeries[i]), borrowed: Math.round(boSeries[i]) }));
  const aum: Point[] = days.map((day, i) => ({ day, aum: Math.round(aumSeries[i]), holders: 430 + Math.round(i * 0.47) }));
  const horizonSupplied = rwaSeries[rwaSeries.length - 1], morphoCollateral = ms.reduce((a, m) => a + m.collateralUsd, 0);
  const borrowed = boSeries[boSeries.length - 1] + ms.reduce((a, m) => a + m.borrowed, 0);
  const suppliedAll = rs.reduce((a, r) => a + r.supplied, 0) + morphoCollateral;
  const rwaAum = aumSeries[aumSeries.length - 1];
  const share = (m: Map<string, number>) => [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const cls = new Map<string, number>(); rs.filter((r) => r.kind === 'rwa').forEach((r) => cls.set(r.assetClass, (cls.get(r.assetClass) ?? 0) + r.supplied)); ms.forEach((m) => cls.set(m.assetClass, (cls.get(m.assetClass) ?? 0) + m.collateralUsd));
  const iss = new Map<string, number>(); as.filter((a) => a.kind === 'rwa').forEach((a) => iss.set(a.issuer, (iss.get(a.issuer) ?? 0) + a.aum));
  const positions = [
    ...rs.filter((r) => r.kind === 'rwa').map((r) => ({ id: `horizon-${r.symbol}`, venue: 'Aave Horizon' as const, asset: r.symbol, loan: null, assetClass: r.assetClass, collateral: r.supplied, borrowed: null, maxLtv: r.ltv, liqThreshold: r.liqThreshold, utilization: null, borrowApy: null, href: `/horizon/${r.symbol}`, logo: '/brand/logos/aave-v3.webp' })),
    ...ms.map((m) => ({ id: `morpho-${m.id}`, venue: 'Morpho' as const, asset: m.collateralSymbol, loan: m.loanSymbol, assetClass: m.assetClass, collateral: m.collateralUsd, borrowed: m.borrowed, maxLtv: m.lltv, liqThreshold: null, utilization: m.utilization, borrowApy: m.borrowApy, href: `/markets/${m.id}`, logo: '/brand/logos/morpho-blue.webp' })),
  ].sort((a, b) => b.collateral - a.collateral);
  return {
    asOf: SAMPLE_AS_OF, sample: true,
    kpis: { rwaAum, rwaAumChange7d: (rwaAum / aumSeries[aumSeries.length - 8] - 1) * 100, rwaAssets: as.filter((a) => a.kind === 'rwa').length,
      deployed: horizonSupplied + morphoCollateral, deployedPct: (horizonSupplied / rwaAum) * 100, horizonSupplied, morphoCollateral, deployedChange7d: (horizonSupplied / rwaSeries[rwaSeries.length - 8] - 1) * 100,
      borrowed, utilization: (borrowed / suppliedAll) * 100, holders: 472, issuers: 9 },
    horizon, aum, byVenue: share(new Map([['Aave Horizon', horizonSupplied], ['Morpho', morphoCollateral]])), byClass: share(cls), byIssuer: share(iss),
    reserves: rs, markets: ms, assets: as, positions,
    reconciliation: { ours: rs.reduce((a, r) => a + r.supplied, 0), theirs: 462.1e6, theirsSource: 'DefiLlama (sample)', note: 'Both count what is supplied to the Horizon pool, stablecoins included, so they should sit close; a gap is timing or pricing.' },
  };
}

export function sampleReserve(symbol: string): ReserveDetail | null {
  const r = reserves().find((x) => x.symbol.toLowerCase() === symbol.toLowerCase()); if (!r) return null;
  const days = daysBack(90); const s = series(days, r.supplied || 1e5, 0.12, 0.015, 21), b = series(days, r.borrowed || 0, 0.2, 0.03, 23);
  const facts = [{ label: 'Max LTV', value: `${r.ltv}%`, note: 'How much can be borrowed against this collateral' }, { label: 'Liquidation threshold', value: `${r.liqThreshold}%` }, { label: 'Oracle price', value: `$${r.price.toFixed(2)}` }, { label: 'Issuer', value: r.issuer }, { label: 'Asset class', value: r.assetClass }, { label: 'Reserve address', value: r.id }];
  const nav = series(days, r.price, r.kind === 'rwa' ? 0.011 : 0, 0.0004, 29);
  return { asOf: SAMPLE_AS_OF, sample: true, reserve: r,
    history: days.map((day, i) => ({ day, supplied: Math.round(r.supplied ? s[i] : 0), borrowed: Math.round(r.borrowed ? b[i] : 0) })),
    pricing: days.map((day, i) => ({ day, oracle: +(nav[i] * (i % 9 === 0 ? 0.999 : 1)).toFixed(4), nav: +nav[i].toFixed(4) })),
    rates: days.map((day, i) => ({ day, supply_apy: r.supplyApy ? +(r.supplyApy * (0.9 + (i % 7) * 0.03)).toFixed(2) : 0, borrow_apy: r.borrowApy ? +(r.borrowApy * (0.9 + (i % 5) * 0.04)).toFixed(2) : 0, utilization: r.supplied && r.borrowed ? +((b[i] / s[i]) * 100).toFixed(1) : 0 })), facts };
}
export function sampleRwaMarket(id: string): RwaMarketDetail | null {
  const m = markets().find((x) => x.id === id.toLowerCase()); if (!m) return null;
  const days = daysBack(90); const c = series(days, m.collateralUsd, 0.18, 0.02, 31), b = series(days, m.borrowed, 0.22, 0.03, 37);
  const facts = [{ label: 'Liquidation LTV', value: `${m.lltv}%` }, { label: 'Loan asset', value: m.loanSymbol }, { label: 'Asset class', value: m.assetClass }, { label: 'Market id', value: m.id }];
  return { asOf: SAMPLE_AS_OF, sample: true, market: m,
    history: days.map((day, i) => ({ day, collateral: Math.round(c[i]), borrowed: Math.round(b[i]) })),
    rates: days.map((day, i) => ({ day, utilization: +((b[i] / (c[i] * m.lltv / 100)) * 90).toFixed(1), borrow_apy: +(m.borrowApy * (0.9 + (i % 6) * 0.03)).toFixed(2) })), facts };
}
export function sampleAsset(id: string): AssetDetail | null {
  const rs = reserves(); const a = assets(rs).find((x) => x.id === id); if (!a) return null;
  const days = daysBack(980); const s = series(days, a.aum, a.kind === 'stable' ? 0.6 : 2.4, 0.01, 41);
  const history: Point[] = days.map((day, i) => ({ day, aum: Math.round(s[i]) }));
  const reserve = rs.find((r) => r.symbol === a.ticker) ?? null;
  const facts = [{ label: 'Issuer', value: a.issuer }, { label: 'Asset class', value: a.assetClass }, { label: 'AUM source', value: a.source }, { label: 'Change, 30 days', value: `${((a.aum / s[s.length - 31] - 1) * 100).toFixed(1)}%` }, { label: 'On Aave Horizon', value: reserve ? `$${(reserve.supplied / 1e6).toFixed(1)}M` : 'Not listed' }, { label: 'History since', value: days[0] }];
  return { asOf: SAMPLE_AS_OF, sample: true, asset: a, history, facts, reserve };
}
