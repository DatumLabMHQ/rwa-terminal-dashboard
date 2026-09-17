// The only file most dashboards need to edit. Name the product, the platform resources the pages
// read, and the navigation. lib/rwa.ts turns the four rwa resources into the shapes in
// lib/rwa-types.ts; without DATUM_API_KEY the pages run on labelled sample data (lib/sample.ts).
export const config = {
  // 'draft' until `datum check <slug>` prints READY and the owner signs the brief; the page says so.
  status: 'draft' as 'draft' | 'live',
  slug: 'rwa-terminal-dashboard',
  title: 'RWA Terminal',
  description: 'Tokenized real-world assets as DeFi collateral: what is deployed on Aave Horizon and Morpho, how it is used, and where it would liquidate. Built on the Datum data platform.',
  // The question the overview answers. Pages lead with it.
  question: 'Which tokenized assets are deployed as DeFi collateral, and how much of them is actually used?',
  product: { slug: 'rwa', label: 'RWA Terminal' },
  venues: {
    horizon: { label: 'Aave Horizon', logo: 'aave-v3', href: '/horizon' },
    morpho: { label: 'Morpho', logo: 'morpho-blue', href: '/markets' },
  },
  // Resources are product/name pairs from GET /api/v1/products on datum-api.
  resources: {
    totals: { product: 'rwa', name: 'totals' },            // one row per day: RWA AUM, stablecoin AUM, Horizon supplied, holders, issuers
    reserves: { product: 'rwa', name: 'reserves' },        // Horizon reserves per day; percent-as-number
    markets: { product: 'rwa', name: 'morpho-markets' },   // Morpho markets with RWA collateral per day; fractions
    assets: { product: 'rwa', name: 'assets' },            // tokenized-asset AUM per day, back to 2024 for the seeded assets
    // DefiLlama's TVL for one issuer the platform tracks, beside our AUM for that issuer's assets, for the reconciliation note.
    comparison: { product: 'defillama', name: 'tvl', filters: { slug: 'superstate' } as Record<string, string>, issuer: 'Superstate' },
  },
  // Which tickers are stablecoins (supplied to be borrowed) rather than tokenized assets (supplied as collateral).
  stablecoins: ['USDC', 'RLUSD', 'GHO', 'USDT', 'PYUSD', 'EURC'],
  // Asset class and issuer per ticker. The platform's asset rows carry the issuer; the reserve rows do not.
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
    mGLOBAL: { class: 'Other', issuer: 'Midas' },
  } as Record<string, { class: string; issuer: string }>,
  // How far back the overview trends go (daily rows, one call per resource) and the asset AUM history.
  trend: { days: 90 },
  assetHistoryFrom: '2024-01-01',
  // The sign-in gate: the overview is open to everyone; every other page asks once for a name, an email
  // and an occupation (kept on that browser). Leads join the Datum Labs list through app/api/gate.
  gate: { enabled: true, free: ['/'] as string[] },
  nav: [
    { href: '/', label: 'Overview' },
    { href: '/horizon', label: 'Aave Horizon' },
    { href: '/markets', label: 'Morpho markets' },
    { href: '/assets', label: 'Assets' },
    { href: '/methodology', label: 'Methodology' },
  ],
  // Shown on the methodology page. Keep them honest: what is read, how often, what it excludes.
  sources: [
    { name: 'Datum data platform: Horizon reserves', role: 'headline' as 'headline' | 'comparison', cadence: 'every 5 minutes, daily grain', detail: 'Every reserve of the Aave Horizon pool on Ethereum read from the pool contracts: supplied, borrowed, rates, LTV, liquidation threshold, oracle price and NAV. Daily rows are the last snapshot of the UTC day.' },
    { name: 'Datum data platform: Morpho RWA markets', role: 'headline' as 'headline' | 'comparison', cadence: 'every 5 minutes, daily grain', detail: 'Morpho markets whose collateral is on a curated list of RWA-backed tokens, read from the Morpho API. The API\'s own rwa tag is not used: it tags synthetic dollars and misses real ones.' },
    { name: 'Datum data platform: tokenized assets', role: 'headline' as 'headline' | 'comparison', cadence: 'daily', detail: 'AUM per asset from the issuer API where one exists (Superstate, Hashnote) and otherwise from on-chain supply at the oracle price. History back to January 2024 for the seeded assets.' },
    { name: 'DefiLlama', role: 'comparison' as 'headline' | 'comparison', cadence: 'daily', detail: 'Read for the reconciliation note only: its TVL for Superstate beside our AUM for Superstate\'s assets (USTB, USCC), which the platform reads from the issuer\'s own API. DefiLlama does not track the Horizon pool as its own protocol.' },
  ],
  definitions: [
    { term: 'RWA AUM', unit: 'USD', text: 'Value of the tracked tokenized assets, stablecoins excluded. The asset universe, whether or not any of it is deployed.' },
    { term: 'Deployed', unit: 'USD', text: 'Tokenized-asset value posted as collateral on a tracked venue: RWA reserves supplied on Aave Horizon plus collateral in Morpho RWA markets. Two distinct positions, never double counted.' },
    { term: 'Borrowed', unit: 'USD', text: 'Outstanding debt on the venues: stablecoins borrowed from Horizon and loans outstanding in Morpho RWA markets.' },
    { term: 'Utilisation', unit: '%', text: 'Borrowed divided by supplied in the same reserve or market. RWA reserves on Horizon are supply-only collateral, so their own utilisation is zero by design.' },
    { term: 'LTV, LLTV', unit: '%', text: 'Horizon: the maximum loan to value for borrowing against the reserve; the liquidation threshold is where the position can be liquidated. Morpho: one liquidation LTV per market.' },
    { term: 'NAV', unit: 'USD', text: 'The issuer\'s net asset value per token, beside the oracle price the venue uses. A gap between them is the pricing risk.' },
    { term: 'Holders', unit: 'count', text: 'Addresses holding a Horizon aToken, from the platform\'s holder snapshot. Forward-only since August 2026.' },
    { term: 'Asset class', unit: 'label', text: 'Set in datum.config.ts for Horizon tickers and carried by the platform for Morpho markets. Unknown tickers are labelled Other.' },
  ],
};
export type DatumConfig = typeof config;
