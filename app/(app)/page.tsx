// Overview: the question, the one-line answer, then the numbers. Cards, trend, composition and
// the positions table read the RWA shapes from lib/data.ts (the platform, or labelled sample data).
import { config } from '@/datum.config';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { PageHeader } from '@/components/page-header';
import { RwaCards } from '@/components/rwa-cards';
import { PositionsTable } from '@/components/rwa-tables';
import { AreaChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadRwa } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;

export default async function Overview() {
  const d = await loadRwa();
  const k = d.kpis;
  return (
    <>
      <PageHeader eyebrow="Overview" question={config.question}
        answer={<>{usd(k.rwaAum)} of tokenized assets is tracked across {count(k.rwaAssets)} assets from {count(k.issuers)} issuers. {usd(k.deployed)} of RWA value is posted as collateral on the two venues: {usd(k.horizonSupplied)} on Aave Horizon, which is {pct(k.deployedPct, 1)} of the tracked AUM, and {usd(k.morphoCollateral)} in Morpho RWA markets. {usd(k.borrowed)} is borrowed against it, as of {d.asOf}.</>} />
      <RwaCards kpis={k} asOf={d.asOf} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={d.horizon} asOf={d.asOf} title="Supplied to Aave Horizon" unit="usd"
          series={[{ key: 'rwa', label: 'RWA collateral' }, { key: 'stable', label: 'Stablecoins' }, { key: 'borrowed', label: 'Borrowed' }]}
          description={<>Tokenized assets are supplied as collateral and never borrowed; the stablecoins beside them are what gets borrowed against that collateral. The gap between stablecoins and borrowed is the idle liquidity that sets rates. Our own count, daily points, as of {d.asOf}.</>} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Tokenized AUM</CardTitle><CardDescription>The asset universe, stablecoins excluded, over the last {config.trend.days} days. Growth here is issuance; the cards above say how much of it is put to work.</CardDescription></CardHeader>
          <CardContent className="px-2"><AreaChart data={d.aum} series={[{ key: 'aum', label: 'RWA AUM' }]} unit="usd" height={220} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deployed by venue</CardTitle><CardDescription>Where RWA collateral sits. Horizon holds the tokenized funds; Morpho holds RWA-backed dollars and gold.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.byVenue} unit="usd" height={220} centerLabel="deployed" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Deployed by asset class</CardTitle><CardDescription>Across both venues. Treasuries dominate the funds on Horizon; private credit and gold dominate Morpho.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.byClass} unit="usd" height={220} centerLabel="deployed" /></CardContent>
        </Card>
      </div>
      <PositionsTable data={d.positions} title="Positions: asset × venue" pageSize={12}
        caption={<><b className="font-medium text-foreground">The unit this terminal is about.</b> One row per asset per venue: how much is posted, how far it can be borrowed against, and where it liquidates. Horizon rows are supply-only collateral, so their borrowing shows in the stablecoin reserves instead.</>} />
      {d.reconciliation ? (
        <p className="px-4 text-sm text-muted-foreground lg:px-6"><b className="font-medium text-foreground">Reconciliation.</b> Our AUM for {config.resources.comparison.issuer}&apos;s tokens is {usd(d.reconciliation.ours)}; {d.reconciliation.theirsSource} reports {usd(d.reconciliation.theirs)}. {d.reconciliation.note}</p>
      ) : null}
    </>
  );
}
