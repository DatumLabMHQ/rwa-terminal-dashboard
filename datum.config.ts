// The only file most dashboards need to edit. Name the product, the platform resources the pages
// read, and the navigation. lib/rwa.ts turns the four rwa resources into the shapes in
// lib/rwa-types.ts; without DATUM_API_KEY the pages run on labelled sample data (lib/sample.ts).
export const config = {
  // 'draft' until `datum check <slug>` prints READY and the owner signs the brief; the page says so.
  status: 'live' as 'draft' | 'live',
  slug: 'rwa-terminal-dashboard',
  // The name this dashboard's brief, product note and reconciliation rows use in datum-context.
  context: 'rwa-terminal',
  title: 'RWA Terminal',
  description: 'Tokenized real-world assets as DeFi collateral: what is deployed on Aave Horizon, Morpho and Euler, how it is used, and where it would liquidate. Built on the Datum data platform.',
  // The question the overview answers. Pages lead with it.
  question: 'Which tokenized assets are deployed as DeFi collateral, and how much of them is actually used?',
  product: { slug: 'rwa', label: 'RWA Terminal' },
  venues: {
    horizon: { label: 'Aave Horizon', logo: 'aave-v3', href: '/horizon' },
    morpho: { label: 'Morpho', logo: 'morpho-blue', href: '/markets' },
    euler: { label: 'Euler', logo: 'euler-v2', href: '/euler' },
  },
  // Resources are product/name pairs from GET /api/v1/products on datum-api.
  resources: {
    totals: { product: 'rwa', name: 'totals' },            // one row per day: RWA AUM, stablecoin AUM, Horizon supplied, holders, issuers
    reserves: { product: 'rwa', name: 'reserves' },        // Horizon reserves per day; percent-as-number
    markets: { product: 'rwa', name: 'morpho-markets' },   // Morpho markets with RWA collateral per day; fractions
    assets: { product: 'rwa', name: 'assets' },            // tokenized-asset AUM per day on every chain, class and issuer from the platform
    eulerVaults: { product: 'rwa', name: 'euler-vaults' },  // Euler vaults in RWA clusters per day: collateral (RWA) or borrowable
    eulerPairs: { product: 'rwa', name: 'euler-pairs' },    // Euler lending pairs touching an RWA per day; fractions for LTVs
    // DefiLlama's TVL for one issuer the platform tracks, beside our AUM for that issuer's assets, for the reconciliation note.
    comparison: { product: 'defillama', name: 'tvl', filters: { slug: 'superstate' } as Record<string, string>, issuer: 'Superstate' },
  },
  // Which tickers are stablecoins (supplied to be borrowed) rather than tokenized assets (supplied as collateral).
  stablecoins: ['USDC', 'RLUSD', 'GHO', 'USDT', 'PYUSD', 'EURC'],
  // Fallback asset class and issuer per ticker. The platform's asset rows carry both (datum-models seeds); this is used
  // only for a ticker the platform has not classified yet.
  assets: {
    USYC: { class: 'US Treasuries', issuer: 'Circle (Hashnote)' },
    USTB: { class: 'US Treasuries', issuer: 'Superstate' },
    JTRSY: { class: 'US Treasuries', issuer: 'Janus Henderson / Anemoy / Centrifuge' },
    VBILL: { class: 'US Treasuries', issuer: 'VanEck (Securitize)' },
    JAAA: { class: 'Private Credit (CLO)', issuer: 'Janus Henderson / Anemoy / Centrifuge' },
    ACRED: { class: 'Private Credit', issuer: 'Apollo / Securitize' },
    USCC: { class: 'Crypto Carry', issuer: 'Superstate' },
    USDC: { class: 'Stablecoin', issuer: 'Circle' },
    RLUSD: { class: 'Stablecoin', issuer: 'Ripple' },
    GHO: { class: 'Stablecoin', issuer: 'Aave' },
    mGLOBAL: { class: 'Private Credit', issuer: 'Midas (Fasanara)' },
  } as Record<string, { class: string; issuer: string }>,
  // How far back the overview trends go (daily rows, one call per resource) and the asset AUM history.
  trend: { days: 90 },
  assetHistoryFrom: '2024-01-01',
  // The sign-in gate: the overview is open to everyone; every other page asks once for a name, an email
  // and an occupation (kept on that browser). Leads join the Datum Labs list through app/api/gate.
  gate: { enabled: true, free: ['/'] as string[] },
  // Sidebar headings: Venues are where tokenized assets are posted as collateral, Assets are the tokens
  // themselves, Reference explains the numbers. A new venue or asset type joins its heading.
  nav: [
    { href: '/', label: 'Overview', group: 'Terminal' },
    { href: '/horizon', label: 'Aave Horizon', group: 'Venues' },
    { href: '/markets', label: 'Morpho markets', group: 'Venues' },
    { href: '/euler', label: 'Euler clusters', group: 'Venues' },
    { href: '/assets', label: 'Tokens', group: 'Assets' },
    { href: '/methodology', label: 'Methodology', group: 'Reference' },
  ],
  // Shown on the methodology page. Keep them honest: what is read, how often, what it excludes.
  sources: [
    { name: 'Datum data platform: Horizon reserves', role: 'headline' as 'headline' | 'comparison', cadence: 'every 5 minutes, daily grain', detail: 'Every reserve of the Aave Horizon pool on Ethereum read from the pool contracts: supplied, borrowed, rates, LTV, liquidation threshold, oracle price and NAV. Daily rows are the last snapshot of the UTC day.' },
    { name: 'Datum data platform: Horizon e-mode', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly', detail: 'Horizon\'s e-mode categories read from the pool contract: each tokenized asset\'s higher LTV and threshold, and the stablecoins it applies to (GHO for most). Shown beside the base parameters, which apply to every other stablecoin.' },
    { name: 'Datum data platform: Morpho RWA markets', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain', detail: 'Every Morpho market on every chain whose collateral address is in the platform\'s RWA list (58 verified addresses: issuer contracts, on-chain names, the Backed registry, Morpho listings). Up to 4 September 2026 the older 9-market Ethereum list, so the series steps up on 5 September by definition. The Morpho API\'s own rwa tag is not used: it tags synthetic dollars and misses real ones.' },
    { name: 'Datum data platform: Euler RWA clusters', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain, from 26 September 2026', detail: 'Euler v2 vaults from the Euler v3 API. A cluster is a curator\'s labelled product; a vault is RWA when its asset address is in the platform\'s Euler RWA list. Pairs carry the borrow and liquidation LTV and the debt each collateral backs (Euler\'s open interest). Midas crypto strategies and tokens with unverified issuers are left out.' },
    { name: 'Datum data platform: tokenized assets', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain', detail: 'AUM per asset on every chain it is issued on: the issuer API for USYC, USTB and USCC; the Centrifuge product for JTRSY and JAAA (restated from July 2025); supply on every chain times Horizon\'s NAV for ACRED, VBILL and mGLOBAL (from 26 September 2026; earlier days are Ethereum only). History back to January 2024 for the seeded assets.' },
    { name: 'DefiLlama', role: 'comparison' as 'headline' | 'comparison', cadence: 'daily', detail: 'Read for the reconciliation note only: its TVL for Superstate beside our AUM for Superstate\'s assets (USTB, USCC), which the platform reads from the issuer\'s own API. DefiLlama does not track the Horizon pool as its own protocol.' },
  ],
  definitions: [
    { term: 'RWA AUM', unit: 'USD', text: 'Value of the tracked tokenized assets, stablecoins excluded. The asset universe, whether or not any of it is deployed.' },
    { term: 'RWA AUM', unit: 'USD', text: 'Value of the tracked tokenized assets on every chain they are issued on, stablecoins excluded (datum-context metrics/rwa-aum.md).' },
    { term: 'Deployed', unit: 'USD', text: 'Tokenized-asset value posted as collateral on a tracked venue: RWA reserves supplied on Aave Horizon, collateral in Morpho RWA markets and supply in Euler RWA vaults. Distinct positions, never double counted (metrics/rwa-deployed.md).' },
    { term: 'Borrowed', unit: 'USD', text: 'Debt backed by RWA collateral: stablecoins borrowed from Horizon, loans in Morpho RWA markets, and Euler debt against RWA collateral vaults. Shown per dollar of collateral (metrics/rwa-borrowed-per-collateral.md).' },
    { term: 'E-mode', unit: '%', text: 'A Horizon category that lends at a higher LTV and threshold against one tokenized asset, but only for the stablecoins it names (GHO for most; USDC and RLUSD for mGLOBAL). Borrowing any other stablecoin uses the base parameters.' },
    { term: 'Euler cluster', unit: 'label', text: 'A curator\'s labelled set of Euler vaults (Euler calls it a product): which RWA vaults it holds, which stablecoins it lends, and the pairs between them.' },
    { term: 'Utilisation', unit: '%', text: 'Borrowed divided by supplied in the same reserve or market. RWA reserves on Horizon are supply-only collateral, so their own utilisation is zero by design.' },
    { term: 'LTV, LLTV', unit: '%', text: 'Horizon: the maximum loan to value for borrowing against the reserve; the liquidation threshold is where the position can be liquidated. Morpho: one liquidation LTV per market.' },
    { term: 'NAV', unit: 'USD', text: 'The issuer\'s net asset value per token, beside the oracle price the venue uses. A gap between them is the pricing risk.' },
    { term: 'Holders', unit: 'count', text: 'Addresses holding a Horizon aToken, from the platform\'s holder snapshot. Forward-only since August 2026.' },
    { term: 'Asset class', unit: 'label', text: 'Carried by the platform for every asset, market and vault: US Treasuries, Money Market (EU), Govt Bonds (EU), Private Credit, Private Credit (CLO), Fixed Income, Crypto Carry, Reinsurance, Commodities, Stocks, Multi-asset RWA.' },
  ],
};
export type DatumConfig = typeof config;
