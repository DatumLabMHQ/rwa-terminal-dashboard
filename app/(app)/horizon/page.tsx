import { PageHeader } from '@/components/page-header';
import { ReservesTable } from '@/components/rwa-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadRwa } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Aave Horizon' };

export default async function Horizon() {
  const d = await loadRwa();
  const supplied = d.reserves.reduce((a, r) => a + r.supplied, 0), borrowed = d.reserves.reduce((a, r) => a + r.borrowed, 0);
  const rwa = d.reserves.filter((r) => r.kind === 'rwa'), stables = d.reserves.filter((r) => r.kind === 'stable');
  const rwaSupplied = rwa.reduce((a, r) => a + r.supplied, 0);
  const util = supplied ? (borrowed / supplied) * 100 : 0;
  const tight = stables.filter((r) => r.utilization > 85);
  const liquidity = d.reserves.filter((r) => r.supplied > 0).map((r) => ({ name: r.symbol, borrowed: r.borrowed, available: r.available }));
  const byClass = new Map<string, number>(); d.reserves.forEach((r) => byClass.set(r.assetClass, (byClass.get(r.assetClass) ?? 0) + r.supplied));
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  return (
    <>
      <PageHeader eyebrow="Aave Horizon" question="How is the Horizon pool being used?"
        answer={<>{usd(supplied)} is supplied across {count(d.reserves.length)} reserves and {usd(borrowed)} of it is borrowed, {pct(util, 1)} of the pool. Tokenized assets are {usd(rwaSupplied)} of the supply and are collateral only; all the borrowing is in the {count(stables.length)} stablecoin reserves. {tight.length === 0 ? 'No stablecoin reserve is above 85% utilisation, the line where withdrawals start to queue.' : `${tight.map((r) => r.symbol).join(', ')} ${tight.length === 1 ? 'is' : 'are'} above 85% utilisation, where withdrawals start to queue.`} As of {d.asOf}.</>} />
      <div className="grid grid-cols-2 gap-4 px-4 lg:px-6 @2xl/main:grid-cols-4">
        {stat('Supplied', usd(supplied), `${count(d.reserves.length)} reserves`)}
        {stat('Borrowed', usd(borrowed), `${pct(util, 1)} of supply`)}
        {stat('RWA collateral', usd(rwaSupplied), `${pct(supplied ? (rwaSupplied / supplied) * 100 : 0, 1)} of supply, ${count(rwa.length)} reserves`)}
        {stat('Stablecoins', usd(supplied - rwaSupplied), `${count(stables.length)} reserves, what gets borrowed`)}
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader><CardTitle>Liquidity by reserve</CardTitle><CardDescription>Each bar is what is supplied; the darker part is borrowed out. Tokenized assets are never borrowed, so their bars are all available. As of {d.asOf}.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={liquidity} x="name" series={[{ key: 'borrowed', label: 'Borrowed' }, { key: 'available', label: 'Available' }]} unit="usd" stacked horizontal legend height={Math.max(220, liquidity.length * 32)} categoryWidth={72} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Supplied by asset class</CardTitle><CardDescription>Stablecoins included: they are the pool&apos;s borrowable side and the largest slice.</CardDescription></CardHeader>
          <CardContent><DonutChart items={[...byClass.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)} unit="usd" height={240} centerLabel="supplied" /></CardContent>
        </Card>
      </div>
      <ReservesTable data={d.reserves} title="Reserves"
        caption={<><b className="font-medium text-foreground">Per-reserve risk.</b> For a tokenized asset the numbers that matter are max LTV and the liquidation threshold; for a stablecoin they are utilisation and the borrow rate. Oracle price beside the issuer&apos;s NAV is on each reserve&apos;s page.</>} />
    </>
  );
}
