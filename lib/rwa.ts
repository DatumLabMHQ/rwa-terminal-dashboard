// Loads the RWA shapes the pages read. From the platform when DATUM_API_KEY is set, otherwise from
// lib/sample.ts, labelled as sample on every page. Four resources, all daily grain: rwa/totals,
// rwa/reserves, rwa/morpho-markets, rwa/assets.
import { cache } from 'react';
import { config } from '@/datum.config';
import { hasKey, query } from './datum';
import { num, pct, price, usd } from './format';
import { protocolLogo } from './chains';
import { sampleAsset, sampleReserve, sampleRwa, sampleRwaMarket } from './sample';
import type { Asset, AssetDetail, Kind, Point, Position, Reserve, ReserveDetail, Risk, RwaMarket, RwaMarketDetail, RwaOverview, Share } from './rwa-types';

const R = config.resources;
const STABLE = new Set(config.stablecoins);
export const meta = (sym: string) => config.assets[sym] ?? { class: 'Other', issuer: 'n/a' };
export const kindOf = (sym: string): Kind => (STABLE.has(sym) ? 'stable' : 'rwa');
const risk = (u: number): Risk => (u > 85 ? 'high' : u > 70 ? 'moderate' : 'safe');
const dayOf = (v: unknown) => String(v ?? '').slice(0, 10);
const byDayAsc = (a: { day: string }, b: { day: string }) => a.day.localeCompare(b.day);
const isoDaysAgo = (n: number, from = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const addTo = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v);
const shares = (m: Map<string, number>): Share[] => [...m.entries()].map(([name, value]) => ({ name, value })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
const change = (now: number, then: number | undefined) => (then ? (now / then - 1) * 100 : 0);
const SOURCE_LABEL: Record<string, string> = { superstate_api: 'Superstate API (NAV)', hashnote_api: 'Hashnote API (NAV)', onchain_derived: 'On-chain supply at the oracle price' };
export const sourceLabel = (s: string) => SOURCE_LABEL[s] ?? s;

export function toReserve(r: Record<string, unknown>): Reserve {
  const symbol = String(r.symbol ?? ''); const supplied = num(r.supplied_usd), borrowed = num(r.borrowed_usd);
  const utilization = r.utilization != null ? num(r.utilization) : supplied ? (borrowed / supplied) * 100 : 0;
  return { id: String(r.reserve ?? '').toLowerCase(), symbol, kind: kindOf(symbol), assetClass: meta(symbol).class, issuer: meta(symbol).issuer,
    supplied, borrowed, available: Math.max(0, supplied - borrowed), utilization, supplyApy: num(r.supply_apy), borrowApy: num(r.borrow_apy),
    ltv: num(r.ltv), liqThreshold: num(r.liquidation_threshold), price: num(r.oracle_price), nav: num(r.nav), risk: risk(utilization) };
}
export function toMarket(r: Record<string, unknown>): RwaMarket {
  const utilization = num(r.utilization) * 100;
  return { id: String(r.market_id ?? '').toLowerCase(), collateralSymbol: String(r.collateral_symbol ?? ''), loanSymbol: String(r.loan_symbol ?? ''), assetClass: String(r.asset_class ?? 'Other'),
    lltv: num(r.lltv) * 100, collateralUsd: num(r.collateral_usd), borrowed: num(r.borrow_usd), utilization, borrowApy: num(r.borrow_apy) * 100, risk: risk(utilization) };
}
export function toAsset(r: Record<string, unknown>, horizon: Map<string, number>): Asset {
  const ticker = String(r.ticker ?? ''); const aum = num(r.aum_usd); const horizonSupplied = horizon.get(ticker) ?? 0;
  return { id: String(r.asset_id ?? ''), ticker, name: String(r.asset_name ?? ticker), issuer: String(r.issuer ?? meta(ticker).issuer), kind: kindOf(ticker), assetClass: meta(ticker).class,
    aum, source: String(r.source ?? ''), horizonSupplied, deployedPct: aum ? (horizonSupplied / aum) * 100 : 0 };
}
export function toPositions(reserves: Reserve[], markets: RwaMarket[]): Position[] {
  const h: Position[] = reserves.filter((r) => r.kind === 'rwa').map((r) => ({ id: `horizon-${r.symbol}`, venue: 'Aave Horizon', asset: r.symbol, loan: null, assetClass: r.assetClass,
    collateral: r.supplied, borrowed: null, maxLtv: r.ltv, liqThreshold: r.liqThreshold, utilization: null, borrowApy: null, href: `/horizon/${r.symbol}`, logo: protocolLogo(config.venues.horizon.logo) }));
  const m: Position[] = markets.map((x) => ({ id: `morpho-${x.id}`, venue: 'Morpho', asset: x.collateralSymbol, loan: x.loanSymbol, assetClass: x.assetClass,
    collateral: x.collateralUsd, borrowed: x.borrowed, maxLtv: x.lltv, liqThreshold: null, utilization: x.utilization, borrowApy: x.borrowApy, href: `/markets/${x.id}`, logo: protocolLogo(config.venues.morpho.logo) }));
  return [...h, ...m].sort((a, b) => b.collateral - a.collateral);
}

/** The overview: the latest day of every resource, ninety days of daily history for the trends. */
export const loadRwa = cache(async (): Promise<RwaOverview> => {
  if (!hasKey()) return sampleRwa();
  const since = isoDaysAgo(config.trend.days + 2);
  const [t, rs, ms, as, rh] = await Promise.all([
    query(R.totals.product, R.totals.name, { since, limit: 400 }),
    query(R.reserves.product, R.reserves.name, { limit: 500 }),
    query(R.markets.product, R.markets.name, { limit: 500 }),
    query(R.assets.product, R.assets.name, { limit: 500 }),
    query(R.reserves.product, R.reserves.name, { since, limit: 5000 }),
  ]);
  const reserves = rs.rows.map(toReserve).sort((a, b) => b.supplied - a.supplied);
  const markets = ms.rows.map(toMarket).sort((a, b) => b.collateralUsd - a.collateralUsd);
  const horizonBySymbol = new Map(reserves.map((r) => [r.symbol, r.supplied]));
  const assets = as.rows.map((r) => toAsset(r, horizonBySymbol)).sort((a, b) => b.aum - a.aum);
  const totals = t.rows.map((r) => ({ day: dayOf(r.day), aum: num(r.rwa_aum_usd), holders: num(r.holders), issuers: num(r.issuers), horizon: num(r.horizon_supplied_usd) })).filter((r) => r.day).sort(byDayAsc);
  const latest = totals[totals.length - 1];
  const asOf = dayOf(rs.day ?? latest?.day ?? new Date().toISOString());
  const asOfDate = new Date(asOf + 'T00:00:00Z');

  // Horizon history: one row per reserve per day, summed into RWA supplied, stablecoins supplied, borrowed.
  const days = new Map<string, { rwa: number; stable: number; borrowed: number }>();
  rh.rows.forEach((r) => {
    const d = dayOf(r.day); if (!d) return;
    const cur = days.get(d) ?? { rwa: 0, stable: 0, borrowed: 0 };
    if (kindOf(String(r.symbol ?? '')) === 'rwa') cur.rwa += num(r.supplied_usd); else cur.stable += num(r.supplied_usd);
    cur.borrowed += num(r.borrowed_usd); days.set(d, cur);
  });
  const horizon: Point[] = [...days.entries()].map(([day, v]) => ({ day, ...v })).sort(byDayAsc);
  const aum: Point[] = totals.map((r) => ({ day: r.day, aum: r.aum, holders: r.holders }));

  const rwaReserves = reserves.filter((r) => r.kind === 'rwa');
  const horizonSupplied = sum(rwaReserves, (r) => r.supplied), morphoCollateral = sum(markets, (m) => m.collateralUsd);
  const deployed = horizonSupplied + morphoCollateral;
  const rwaAum = latest?.aum || sum(assets.filter((a) => a.kind === 'rwa'), (a) => a.aum);
  // The share deployed is measured on the tracked assets themselves, so numerator and denominator are the same universe.
  const trackedOnHorizon = sum(assets.filter((a) => a.kind === 'rwa'), (a) => a.horizonSupplied);
  const weekAgo = totals.find((r) => r.day === isoDaysAgo(7, asOfDate));
  const horizonWeekAgo = horizon.find((p) => p.day === isoDaysAgo(7, asOfDate));
  const borrowed = sum(reserves, (r) => r.borrowed) + sum(markets, (m) => m.borrowed);
  const suppliedAll = sum(reserves, (r) => r.supplied) + morphoCollateral;

  const byVenue = shares(new Map([[config.venues.horizon.label, horizonSupplied], [config.venues.morpho.label, morphoCollateral]]));
  const cls = new Map<string, number>(); rwaReserves.forEach((r) => addTo(cls, r.assetClass, r.supplied)); markets.forEach((m) => addTo(cls, m.assetClass, m.collateralUsd));
  const iss = new Map<string, number>(); assets.filter((a) => a.kind === 'rwa').forEach((a) => addTo(iss, a.issuer, a.aum));

  let reconciliation: RwaOverview['reconciliation'] = null;
  try {
    const c = await query(R.comparison.product, R.comparison.name, { ...R.comparison.filters, limit: 100 });
    const tvl = sum(c.rows, (r) => num(r.tvl_usd));
    const ours = sum(assets.filter((a) => a.issuer === R.comparison.issuer), (a) => a.aum);
    if (tvl && ours) reconciliation = { ours, theirs: tvl, theirsSource: `DefiLlama, ${R.comparison.issuer} (${dayOf(c.day)})`, note: `Our figure is the AUM of ${R.comparison.issuer}'s tokens from the issuer's own API; DefiLlama's is its TVL for the same issuer at its own prices. They should sit close; a gap is timing, pricing, or a token one side does not count.` };
  } catch { reconciliation = null; }

  return {
    asOf, sample: false,
    kpis: {
      rwaAum, rwaAumChange7d: change(rwaAum, weekAgo?.aum), rwaAssets: assets.filter((a) => a.kind === 'rwa').length,
      deployed, deployedPct: rwaAum ? (trackedOnHorizon / rwaAum) * 100 : 0, horizonSupplied, morphoCollateral,
      deployedChange7d: change(horizonSupplied, horizonWeekAgo ? num(horizonWeekAgo.rwa) : undefined),
      borrowed, utilization: suppliedAll ? (borrowed / suppliedAll) * 100 : 0, holders: latest?.holders ?? 0, issuers: latest?.issuers ?? iss.size,
    },
    horizon, aum, byVenue, byClass: shares(cls), byIssuer: shares(iss), reserves, markets, assets, positions: toPositions(reserves, markets), reconciliation,
  };
});

/** One Horizon reserve: its own daily rows for the trend window. */
export const loadReserve = cache(async (symbol: string): Promise<ReserveDetail | null> => {
  if (!hasKey()) return sampleReserve(symbol);
  const o = await loadRwa();
  const reserve = o.reserves.find((r) => r.symbol.toLowerCase() === symbol.toLowerCase());
  if (!reserve) return null;
  const h = await query(R.reserves.product, R.reserves.name, { symbol: reserve.symbol, since: isoDaysAgo(config.trend.days, new Date(o.asOf + 'T00:00:00Z')), limit: 1000 });
  const rows = h.rows.map((r) => ({ day: dayOf(r.day), supplied: num(r.supplied_usd), borrowed: num(r.borrowed_usd), sa: num(r.supply_apy), ba: num(r.borrow_apy), u: num(r.utilization) })).filter((r) => r.day).sort(byDayAsc);
  return { asOf: o.asOf, sample: false, reserve,
    history: rows.map((r) => ({ day: r.day, supplied: r.supplied, borrowed: r.borrowed })),
    rates: rows.map((r) => ({ day: r.day, supply_apy: r.sa, borrow_apy: r.ba, utilization: r.u })),
    facts: reserveFacts(reserve) };
});
export const reserveFacts = (r: Reserve) => [
  ...(r.kind === 'rwa' ? [{ label: 'Max LTV', value: pct(r.ltv, 0), note: 'How much can be borrowed against this collateral' }, { label: 'Liquidation threshold', value: pct(r.liqThreshold, 0), note: 'Debt to collateral ratio at which the position can be liquidated' }]
    : [{ label: 'Role', value: 'Borrowable stablecoin', note: 'Supplied to be lent out; not accepted as collateral' }]),
  { label: 'Oracle price', value: price(r.price), note: 'What the venue values one token at' },
  ...(r.nav ? [{ label: 'Issuer NAV', value: price(r.nav), note: r.price && Math.abs(r.price / r.nav - 1) > 0.005 ? 'Differs from the oracle price by more than 0.5%: pricing risk' : 'In line with the oracle price' }] : []),
  { label: 'Issuer', value: r.issuer }, { label: 'Asset class', value: r.assetClass },
  { label: 'Reserve address', value: r.id || 'n/a' },
];

/** One Morpho RWA market: its own daily rows for the trend window. */
export const loadRwaMarket = cache(async (id: string): Promise<RwaMarketDetail | null> => {
  if (!hasKey()) return sampleRwaMarket(id);
  const o = await loadRwa();
  const market = o.markets.find((m) => m.id === id.toLowerCase());
  if (!market) return null;
  const h = await query(R.markets.product, R.markets.name, { market_id: market.id, since: isoDaysAgo(config.trend.days, new Date(o.asOf + 'T00:00:00Z')), limit: 1000 });
  const rows = h.rows.map((r) => ({ day: dayOf(r.day), collateral: num(r.collateral_usd), borrowed: num(r.borrow_usd), u: num(r.utilization) * 100, ba: num(r.borrow_apy) * 100 })).filter((r) => r.day).sort(byDayAsc);
  return { asOf: o.asOf, sample: false, market,
    history: rows.map((r) => ({ day: r.day, collateral: r.collateral, borrowed: r.borrowed })),
    rates: rows.map((r) => ({ day: r.day, utilization: r.u, borrow_apy: r.ba })),
    facts: marketFacts(market) };
});
export const marketFacts = (m: RwaMarket) => [
  { label: 'Liquidation LTV', value: pct(m.lltv, 1), note: 'Debt to collateral ratio at which a position can be liquidated' },
  { label: 'Liquidation incentive', value: pct(Math.min(1.15, 1 / (0.3 * (m.lltv / 100) + 0.7)) * 100 - 100, 1), note: 'Discount a liquidator earns, from the LLTV' },
  { label: 'Loan asset', value: m.loanSymbol }, { label: 'Asset class', value: m.assetClass },
  { label: 'Market id', value: m.id },
];

/** One tokenized asset: AUM history back to the seeded start, and its Horizon reserve if listed. */
export const loadAsset = cache(async (id: string): Promise<AssetDetail | null> => {
  if (!hasKey()) return sampleAsset(id);
  const o = await loadRwa();
  const asset = o.assets.find((a) => a.id === id);
  if (!asset) return null;
  const h = await query(R.assets.product, R.assets.name, { asset_id: asset.id, since: config.assetHistoryFrom, limit: 5000 });
  const history: Point[] = h.rows.map((r) => ({ day: dayOf(r.day), aum: num(r.aum_usd) })).filter((r) => r.day).sort(byDayAsc);
  const reserve = o.reserves.find((r) => r.symbol === asset.ticker) ?? null;
  return { asOf: o.asOf, sample: false, asset, history, facts: assetFacts(asset, history, reserve), reserve };
});
export const assetFacts = (a: Asset, history: Point[], reserve: Reserve | null) => {
  const at = (n: number) => { const p = history[history.length - 1 - n]; return p ? num(p.aum) : undefined; };
  const chg = (n: number) => { const then = at(n); return then ? `${change(a.aum, then) >= 0 ? '+' : ''}${change(a.aum, then).toFixed(1)}%` : 'n/a'; };
  return [
    { label: 'Issuer', value: a.issuer }, { label: 'Asset class', value: a.assetClass },
    { label: 'AUM source', value: sourceLabel(a.source) },
    { label: 'Change, 30 days', value: chg(30), note: 'Issuance and price together' }, { label: 'Change, 90 days', value: chg(90) },
    ...(reserve ? [{ label: 'On Aave Horizon', value: reserve.supplied ? usd(reserve.supplied) : 'Listed, nothing posted', note: reserve.kind === 'rwa' ? `${pct(a.deployedPct, 1)} of AUM, max LTV ${pct(reserve.ltv, 0)}` : 'Borrowable stablecoin reserve' }] : [{ label: 'On Aave Horizon', value: 'Not listed' }]),
    { label: 'History since', value: history[0]?.day ?? 'n/a' },
  ];
};
