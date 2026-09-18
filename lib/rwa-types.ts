// The shapes the RWA pages read. lib/rwa.ts fills them from the platform's four rwa resources
// (or lib/sample.ts without a key), so pages never depend on a resource's raw column names.
import type { Point, Share } from './types';
export type { Point, Share, Fact } from './types';

export type Risk = 'safe' | 'moderate' | 'high';
export type Kind = 'rwa' | 'stable';
export type Venue = 'Aave Horizon' | 'Morpho';

/** One Aave Horizon reserve on the latest day. Rates, utilisation, LTV and threshold in percent. */
export type Reserve = {
  id: string; symbol: string; kind: Kind; assetClass: string; issuer: string;
  supplied: number; borrowed: number; available: number; utilization: number; supplyApy: number; borrowApy: number;
  ltv: number; liqThreshold: number; price: number; nav: number; risk: Risk;
};
/** One Morpho market with RWA collateral on the latest day. LLTV, utilisation and APY in percent. */
export type RwaMarket = {
  id: string; collateralSymbol: string; loanSymbol: string; assetClass: string;
  lltv: number; collateralUsd: number; borrowed: number; utilization: number; borrowApy: number; risk: Risk;
};
/** One tokenized asset (or stablecoin) in the tracked universe, with what is deployed on Horizon. */
export type Asset = {
  id: string; ticker: string; name: string; issuer: string; kind: Kind; assetClass: string;
  aum: number; source: string; horizonSupplied: number; deployedPct: number;
};
/** Asset × venue: the unit the terminal is about. Horizon RWA reserves are supply-only, so their
 *  borrowed, utilisation and borrow APY are null rather than zero. */
export type Position = {
  id: string; venue: Venue; asset: string; loan: string | null; assetClass: string;
  collateral: number; borrowed: number | null; maxLtv: number; liqThreshold: number | null; utilization: number | null; borrowApy: number | null;
  href: string; logo?: string;
};
export type RwaOverview = {
  asOf: string; sample: boolean;
  kpis: {
    rwaAum: number; rwaAumChange7d: number; rwaAssets: number;
    deployed: number; deployedPct: number; horizonSupplied: number; morphoCollateral: number; deployedChange7d: number;
    borrowed: number; utilization: number; holders: number; issuers: number;
  };
  horizon: Point[];   // day, rwa (RWA reserves supplied), stable (stablecoin reserves supplied), borrowed
  aum: Point[];       // day, aum (tokenized RWA AUM), holders
  byVenue: Share[]; byClass: Share[]; byIssuer: Share[];
  reserves: Reserve[]; markets: RwaMarket[]; assets: Asset[]; positions: Position[];
  reconciliation: { ours: number; theirs: number; theirsSource: string; note: string } | null;
};
export type ReserveDetail = { asOf: string; sample: boolean; reserve: Reserve; history: Point[]; rates: Point[]; pricing: Point[]; facts: import('./types').Fact[] };
export type RwaMarketDetail = { asOf: string; sample: boolean; market: RwaMarket; history: Point[]; rates: Point[]; facts: import('./types').Fact[] };
export type AssetDetail = { asOf: string; sample: boolean; asset: Asset; history: Point[]; facts: import('./types').Fact[]; reserve: Reserve | null };
