import { PageHeader } from '@/components/page-header';
import { RwaMarketsTable } from '@/components/rwa-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadRwa } from '@/lib/data';
import { count, usd } from '@/lib/format';
import { chainName } from '@/lib/chains';
import { DUST_USD } from '@/lib/rwa';

export const revalidate = 300;
export const metadata = { title: 'Morpho markets' };

export default async function Markets() {
  const d = await loadRwa();
  // Markets under $1,000 of collateral (empty listings, test markets) are counted but not tabled.
  const markets = d.markets.filter((m) => m.collateralUsd >= DUST_USD), empty = d.markets.length - markets.length;
  const collateral = markets.reduce((a, m) => a + m.collateralUsd, 0), borrowed = markets.reduce((a, m) => a + m.borrowed, 0);
  const high = markets.filter((m) => m.risk === 'high' && m.collateralUsd >= 1e6);
  const chains = new Map<number, number>(); markets.forEach((m) => chains.set(m.chainId, (chains.get(m.chainId) ?? 0) + m.collateralUsd));
  const byClass = new Map<string, number>(); markets.forEach((m) => byClass.set(m.assetClass, (byClass.get(m.assetClass) ?? 0) + m.collateralUsd));
  const lltv = markets.filter((m) => m.collateralUsd >= 1e6).map((m) => ({ name: `${m.collateralSymbol} / ${m.loanSymbol}${m.chainId !== 1 ? ` (${chainName(m.chainId)})` : ''}`, lltv: m.lltv }));
  return (
    <>
      <PageHeader eyebrow="Morpho markets" question="Which RWA-backed tokens are collateral on Morpho, and how far are they levered?"
        answer={<>{count(markets.length)} markets on {count(chains.size)} {chains.size === 1 ? 'chain' : 'chains'} hold {usd(collateral)} of RWA-backed collateral against {usd(borrowed)} borrowed, as of {d.asOf}{empty ? `; ${count(empty)} more hold under $1,000` : ''}. These are isolated markets with one liquidation LTV each and no shared pool, so the risk is per market: {high.length === 0 ? 'no market above $1M is over 85% utilisation.' : `${high.length} of the markets above $1M ${high.length === 1 ? 'is' : 'are'} over 85% utilisation, where lenders may wait to withdraw.`}</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Collateral by asset class</CardTitle><CardDescription>Morpho&apos;s RWA is not Horizon&apos;s: private credit, reinsurance and gold rather than tokenized treasury funds.</CardDescription></CardHeader>
          <CardContent><DonutChart items={[...byClass.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)} unit="usd" height={240} centerLabel="collateral" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Liquidation LTV by market</CardTitle><CardDescription>Markets above $1M. The higher the LLTV, the thinner the buffer before liquidation; gold runs far lower than credit.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={lltv} x="name" series={[{ key: 'lltv', label: 'LLTV' }]} unit="pct" horizontal labels height={Math.max(220, lltv.length * 30)} categoryWidth={140} /></CardContent>
        </Card>
      </div>
      <RwaMarketsTable data={markets} title="RWA collateral markets"
        caption={<><b className="font-medium text-foreground">Per-market risk.</b> Collateral posted, debt against it, the utilisation lenders feel, and the LLTV at which a borrower is liquidated. This is the risk the aggregate venue number hides.</>} />
    </>
  );
}
