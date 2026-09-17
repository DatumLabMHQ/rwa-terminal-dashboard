import { notFound } from 'next/navigation';
import { config } from '@/datum.config';
import { loadReserve } from '@/lib/data';
import { pct, price, usd } from '@/lib/format';
import { protocolLogo } from '@/lib/chains';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar } from '@/components/asset-avatar';
import { RadialChart } from '@/components/charts';
import { DetailCharts } from '@/components/detail-charts';
import { MarketDetailLayout } from '@/components/market-detail-layout';
import { MarketFacts } from '@/components/market-facts';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params; const d = await loadReserve(symbol);
  return { title: d ? `${d.reserve.symbol} on Aave Horizon` : 'Reserve' };
}

const RISK_CLASS = { safe: 'text-(--green)', moderate: 'text-(--yellow)', high: 'text-(--red)' } as const;

export default async function ReservePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const d = await loadReserve(symbol);
  if (!d) notFound();
  const r = d.reserve;
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Aave Horizon', href: '/horizon' }, { label: r.symbol }]} />
        <div className="flex flex-wrap items-center gap-3">
          <AssetAvatar symbol={r.symbol} className="size-9" />
          <div>
            <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{r.symbol}</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><AssetAvatar symbol="Aave" src={protocolLogo(config.venues.horizon.logo)} className="size-4" />Aave Horizon</span>
              <span>·</span><span>{r.issuer}</span><span>·</span><span>{r.assetClass}</span>
              {r.kind === 'stable' ? <Badge variant="outline" className={RISK_CLASS[r.risk]}><span className="size-1.5 rounded-full bg-current" />{pct(r.utilization, 1)} utilised</Badge> : <Badge variant="secondary">collateral only</Badge>}
            </p>
          </div>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {r.kind === 'rwa'
            ? <>{r.supplied ? `${usd(r.supplied)} of ${r.symbol} is posted as collateral.` : `${r.symbol} is listed as collateral but nothing is posted yet.`} It can be borrowed against up to {pct(r.ltv, 0)} of its value and is liquidated at {pct(r.liqThreshold, 0)}; the venue prices it at {price(r.price)} against an issuer NAV of {price(r.nav)}. As of {d.asOf}.</>
            : <>{usd(r.supplied)} supplied, {usd(r.borrowed)} borrowed, {usd(r.available)} available. {r.risk === 'high' ? 'Utilisation is above 85%, so withdrawals may queue and rates are climbing.' : r.risk === 'moderate' ? 'Utilisation is in the healthy band: demand without a withdrawal queue.' : 'Plenty of idle liquidity, so rates are soft.'} As of {d.asOf}.</>}
        </p>
      </div>
      <MarketDetailLayout
        main={<>
          <div className="grid grid-cols-2 gap-4 @2xl/main:grid-cols-4">
            {stat('Supplied', usd(r.supplied), r.kind === 'rwa' ? 'as collateral' : 'to be borrowed')}
            {r.kind === 'rwa' ? stat('Max LTV', pct(r.ltv, 0), `liquidates at ${pct(r.liqThreshold, 0)}`) : stat('Borrowed', usd(r.borrowed), `${pct(r.utilization, 1)} of supply`)}
            {r.kind === 'rwa' ? stat('Oracle price', price(r.price), `NAV ${price(r.nav)}`) : stat('Supply APY', pct(r.supplyApy), 'annualised')}
            {r.kind === 'rwa' ? stat('Issuer', r.issuer, r.assetClass) : stat('Borrow APY', pct(r.borrowApy), 'annualised')}
          </div>
          <DetailCharts asOf={d.asOf} history={d.history} historySeries={r.kind === 'rwa' ? [{ key: 'supplied', label: 'Supplied' }] : [{ key: 'supplied', label: 'Supplied' }, { key: 'borrowed', label: 'Borrowed' }]}
            historyTitle={r.kind === 'rwa' ? 'Collateral posted' : 'Supplied and borrowed'} historyDescription={r.kind === 'rwa' ? 'How much of this asset sits in the pool as collateral.' : 'Supplied is the ceiling, borrowed is the demand; the gap is what can be withdrawn now.'}
            rates={r.kind === 'stable' ? d.rates : undefined} ratesSeries={[{ key: 'supply_apy', label: 'Supply APY' }, { key: 'borrow_apy', label: 'Borrow APY' }, { key: 'utilization', label: 'Utilisation' }]}
            ratesTitle="Rates and utilisation" ratesDescription="What suppliers earn, what borrowers pay, and the utilisation that drives both. Above 85% withdrawals start to queue." />
        </>}
        aside={<>
          <Card>
            <CardHeader><CardTitle>{r.kind === 'rwa' ? 'Liquidation threshold' : 'Utilisation'}</CardTitle><CardDescription>{r.kind === 'rwa' ? 'Debt as a share of collateral at which a borrower is liquidated. Max LTV is the entry limit; this is the exit.' : 'Against the 85% line where withdrawals start to queue.'}</CardDescription></CardHeader>
            <CardContent><RadialChart value={r.kind === 'rwa' ? r.liqThreshold : r.utilization} label={r.kind === 'rwa' ? 'threshold' : 'utilised'} height={180} color={r.kind === 'rwa' ? 'var(--chart-1)' : r.risk === 'high' ? 'var(--red)' : r.risk === 'moderate' ? 'var(--yellow)' : 'var(--chart-1)'} /></CardContent>
          </Card>
          <MarketFacts facts={d.facts} />
        </>}
      />
    </>
  );
}
