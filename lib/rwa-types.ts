// The shapes the RWA pages read. lib/rwa.ts fills them from the platform's rwa resources
// (or lib/sample.ts without a key), so pages never depend on a resource's raw column names.
import type { Point, Share } from './types';
export type { Point, Share, Fact } from './types';

export type Risk = 'safe' | 'moderate' | 'high';
export type Kind = 'rwa' | 'stable';
export type Venue = 'Aave Horizon' | 'Morpho' | 'Euler';

/** One Aave Horizon reserve on the latest day. Rates, utilisation, LTV and threshold in percent. */
export type Reserve = {
  id: string; symbol: string; kind: Kind; assetClass: string; issuer: string;
  supplied: number; borrowed: number; available: number; utilization: number; supplyApy: number; borrowApy: number;
  ltv: number; liqThreshold: number; price: number; nav: number; risk: Risk;
  // The e-mode category this reserve is collateral in: higher parameters, but only for the listed borrowable
  // assets (GHO for most RWA reserves). Base ltv/liqThreshold apply to every other stablecoin. Null before 2026-09-26.
  emodeLtv: number | null; emodeLiqThreshold: number | null; emodeBorrowable: string | null; emodeLabel: string | null;
};
/** One Morpho market with RWA collateral on the latest day. LLTV, utilisation and APY in percent. */
export type RwaMarket = {
  id: string; chainId: number; collateralSymbol: string; loanSymbol: string; assetClass: string; issuer: string; listed: boolean;
  lltv: number; collateralUsd: number; borrowed: number; utilization: number; borrowApy: number; risk: Risk;
};
/** One Euler vault in an RWA cluster on the latest day. role: collateral (its asset is a tokenized RWA) or borrowable. */
export type EulerVault = {
  id: string; chainId: number; vault: string; symbol: string; assetClass: string | null; issuer: string | null; cluster: string; clusterId: string; curator: string;
  role: 'collateral' | 'borrowable' | 'candidate'; supplied: number; borrowed: number; utilization: number | null; supplyApy: number | null; borrowApy: number | null;
};
/** One Euler lending pair touching an RWA: borrow from this vault against that collateral. LTVs in percent. */
export type EulerPair = {
  id: string; chainId: number; cluster: string; clusterId: string; curator: string; borrowSymbol: string; collateralSymbol: string; collateralClass: string | null;
  collateralIssuer: string | null; borrowLtv: number; liqLtv: number; debtBacked: number;
};
/** An Euler cluster (a curator's labelled product) holding or lending against tokenized RWAs. */
export type EulerCluster = {
  id: string; name: string; curator: string; chainId: number; rwaAssets: string[]; borrowable: string[]; rwaSupplied: number; debtBacked: number; pairs: number;
};
/** One tokenized asset (or stablecoin) in the tracked universe, with what is deployed on Horizon. */
export type Asset = {
  id: string; ticker: string; name: string; issuer: string; kind: Kind; assetClass: string;
  aum: number; source: string; horizonSupplied: number; deployedPct: number;
};
/** Asset × venue: the unit the terminal is about. Horizon RWA reserves are supply-only, so their
 *  borrowed, utilisation and borrow APY are null rather than zero. */
export type Position = {
  id: string; venue: Venue; chainId: number; asset: string; loan: string | null; assetClass: string;
  collateral: number; borrowed: number | null; maxLtv: number; liqThreshold: number | null; utilization: number | null; borrowApy: number | null;
  href: string; logo?: string;
};
export type RwaOverview = {
  asOf: string; sample: boolean;
  kpis: {
    rwaAum: number; rwaAumChange7d: number; rwaAssets: number;
    deployed: number; deployedPct: number; horizonSupplied: number; morphoCollateral: number; eulerCollateral: number; horizonSuppliedChange7d: number;
    // Borrowed per dollar of RWA collateral, per venue and together. Horizon's stablecoin reserves carry no LTV,
    // so every Horizon loan is backed by the RWA reserves alone.
    borrowed: number; horizonBorrowed: number; morphoBorrowed: number; eulerBorrowed: number; borrowedPerCollateral: number;
    holders: number; holdersDay: string; issuers: number;
  };
  horizon: Point[];   // day, rwa (RWA reserves supplied), stable (stablecoin reserves supplied), borrowed
  aum: Point[];       // day, aum (tokenized RWA AUM), holders
  byVenue: Share[]; byClass: Share[]; byIssuer: Share[];
  reserves: Reserve[]; markets: RwaMarket[]; assets: Asset[]; positions: Position[];
  euler: { vaults: EulerVault[]; pairs: EulerPair[]; clusters: EulerCluster[] };
  reconciliation: { ours: number; theirs: number; theirsSource: string; note: string } | null;
};
export type ReserveDetail = { asOf: string; sample: boolean; reserve: Reserve; history: Point[]; rates: Point[]; pricing: Point[]; facts: import('./types').Fact[] };
export type RwaMarketDetail = { asOf: string; sample: boolean; market: RwaMarket; history: Point[]; rates: Point[]; facts: import('./types').Fact[] };
export type EulerClusterDetail = { asOf: string; sample: boolean; cluster: EulerCluster; vaults: EulerVault[]; pairs: EulerPair[] };
export type AssetDetail = { asOf: string; sample: boolean; asset: Asset; history: Point[]; facts: import('./types').Fact[]; reserve: Reserve | null };
