import { notFound } from 'next/navigation';
import { config } from '@/datum.config';
import { loadRwaMarket } from '@/lib/data';
import { pct, usd } from '@/lib/format';
import { protocolLogo } from '@/lib/chains';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar, MarketPair } from '@/components/asset-avatar';
import { RadialChart } from '@/components/charts';
import { DetailCharts } from '@/components/detail-charts';
import { MarketDetailLayout } from '@/components/market-detail-layout';
import { MarketFacts } from '@/components/market-facts';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const d = await loadRwaMarket(id);
  return { title: d ? `${d.market.collateralSymbol} / ${d.market.loanSymbol}` : 'Market' };
}

const RISK_CLASS = { safe: 'text-(--green)', moderate: 'text-(--yellow)', high: 'text-(--red)' } as const;

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await loadRwaMarket(id);
  if (!d) notFound();
  const m = d.market;
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Morpho markets', href: '/markets' }, { label: `${m.collateralSymbol} / ${m.loanSymbol}` }]} />
        <div className="flex flex-wrap items-center gap-3">
          <MarketPair collateral={m.collateralSymbol} loan={m.loanSymbol} className="size-9" />
          <div>
            <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{m.collateralSymbol} / {m.loanSymbol}</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><AssetAvatar symbol="Morpho" src={protocolLogo(config.venues.morpho.logo)} className="size-4" />Morpho</span>
              <span>·</span><span>Ethereum</span><span>·</span><span>{m.assetClass}</span>
              <Badge variant="outline" className={RISK_CLASS[m.risk]}><span className="size-1.5 rounded-full bg-current" />{pct(m.utilization, 1)} utilised</Badge>
            </p>
          </div>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {usd(m.collateralUsd)} of {m.collateralSymbol} backs {usd(m.borrowed)} of {m.loanSymbol} debt. Positions are liquidated once debt reaches {pct(m.lltv, 1)} of collateral value. {m.risk === 'high' ? 'Utilisation is above 85%, so lenders may wait to withdraw and the borrow rate is climbing.' : m.risk === 'moderate' ? 'Utilisation is in the healthy band.' : 'Plenty of idle liquidity on the loan side.'} As of {d.asOf}.
        </p>
      </div>
      <MarketDetailLayout
        main={<>
          <div className="grid grid-cols-2 gap-4 @2xl/main:grid-cols-4">
            {stat('Collateral', usd(m.collateralUsd), 'posted in this market')}
            {stat('Borrowed', usd(m.borrowed), `${pct(m.utilization, 1)} utilised`)}
            {stat('Liquidation LTV', pct(m.lltv, 1), 'per market, fixed')}
            {stat('Borrow APY', pct(m.borrowApy), 'annualised')}
          </div>
          <DetailCharts asOf={d.asOf} history={d.history} historySeries={[{ key: 'collateral', label: 'Collateral' }, { key: 'borrowed', label: 'Borrowed' }]}
            historyTitle="Collateral and debt" historyDescription="Collateral is what backs the market; borrowed is the debt against it. A widening gap is de-leveraging, a narrowing one is risk building."
            rates={d.rates} ratesSeries={[{ key: 'utilization', label: 'Utilisation' }, { key: 'borrow_apy', label: 'Borrow APY' }]}
            ratesTitle="Utilisation and borrow rate" ratesDescription="Utilisation is borrowed against what lenders supplied; the rate follows it. Above 85% lenders start to queue." />
        </>}
        aside={<>
          <Card>
            <CardHeader><CardTitle>Utilisation</CardTitle><CardDescription>Against the 85% line where lenders start to queue.</CardDescription></CardHeader>
            <CardContent><RadialChart value={m.utilization} label="utilised" height={180} color={m.risk === 'high' ? 'var(--red)' : m.risk === 'moderate' ? 'var(--yellow)' : 'var(--chart-1)'} /></CardContent>
          </Card>
          <MarketFacts facts={d.facts} />
        </>}
      />
    </>
  );
}
