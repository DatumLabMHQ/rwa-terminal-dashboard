import { PageHeader } from '@/components/page-header';
import { RwaMarketsTable } from '@/components/rwa-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadRwa } from '@/lib/data';
import { count, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Morpho markets' };

export default async function Markets() {
  const d = await loadRwa();
  const collateral = d.markets.reduce((a, m) => a + m.collateralUsd, 0), borrowed = d.markets.reduce((a, m) => a + m.borrowed, 0);
  const high = d.markets.filter((m) => m.risk === 'high');
  const byClass = new Map<string, number>(); d.markets.forEach((m) => byClass.set(m.assetClass, (byClass.get(m.assetClass) ?? 0) + m.collateralUsd));
  const lltv = d.markets.map((m) => ({ name: `${m.collateralSymbol} / ${m.loanSymbol}`, lltv: m.lltv }));
  return (
    <>
      <PageHeader eyebrow="Morpho markets" question="Which RWA-backed tokens are collateral on Morpho, and how far are they levered?"
        answer={<>{count(d.markets.length)} markets hold {usd(collateral)} of RWA-backed collateral against {usd(borrowed)} borrowed, as of {d.asOf}. These are isolated markets with one liquidation LTV each and no shared pool, so the risk is per market: {high.length === 0 ? 'none is above 85% utilisation.' : `${high.length} ${high.length === 1 ? 'is' : 'are'} above 85% utilisation, where lenders may wait to withdraw.`}</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Collateral by asset class</CardTitle><CardDescription>Morpho&apos;s RWA is not Horizon&apos;s: RWA-backed dollars, private credit and gold rather than tokenized treasury funds.</CardDescription></CardHeader>
          <CardContent><DonutChart items={[...byClass.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)} unit="usd" height={240} centerLabel="collateral" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Liquidation LTV by market</CardTitle><CardDescription>The higher the LLTV, the thinner the buffer before liquidation. Stable-on-stable markets run above 90%; gold runs far lower.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={lltv} x="name" series={[{ key: 'lltv', label: 'LLTV' }]} unit="pct" horizontal labels height={Math.max(220, lltv.length * 30)} categoryWidth={140} /></CardContent>
        </Card>
      </div>
      <RwaMarketsTable data={d.markets} title="RWA collateral markets"
        caption={<><b className="font-medium text-foreground">Per-market risk.</b> Collateral posted, debt against it, the utilisation lenders feel, and the LLTV at which a borrower is liquidated. This is the risk the aggregate venue number hides.</>} />
    </>
  );
}
