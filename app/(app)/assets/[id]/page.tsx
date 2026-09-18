import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRightIcon } from '@phosphor-icons/react/ssr';
import { loadAsset } from '@/lib/data';
import { pct, usd } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar } from '@/components/asset-avatar';
import { RadialChart } from '@/components/charts';
import { DetailCharts } from '@/components/detail-charts';
import { MarketDetailLayout } from '@/components/market-detail-layout';
import { MarketFacts } from '@/components/market-facts';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const d = await loadAsset(id);
  return { title: d ? `${d.asset.ticker}, ${d.asset.name}` : 'Asset' };
}

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await loadAsset(id);
  if (!d) notFound();
  const a = d.asset, r = d.reserve;
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  const change30 = d.facts.find((f) => f.label === 'Change, 30 days')?.value ?? 'n/a';
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Assets', href: '/assets' }, { label: a.ticker }]} />
        <div className="flex flex-wrap items-center gap-3">
          <AssetAvatar symbol={a.ticker} className="size-9" />
          <div>
            <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{a.ticker}{a.name !== a.ticker ? <span className="text-muted-foreground"> · {a.name}</span> : null}</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{a.issuer}</span><span>·</span><span>{a.assetClass}</span>
              <Badge variant={a.kind === 'rwa' ? 'secondary' : 'outline'}>{a.kind === 'rwa' ? 'Tokenized asset' : 'Stablecoin'}</Badge>
            </p>
          </div>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {usd(a.aum)} outstanding, {change30} over thirty days. {r ? (r.kind === 'rwa' ? (r.supplied ? <>{usd(r.supplied)} of it, {pct(a.deployedPct, 1)}, is posted as collateral on Aave Horizon at a max LTV of {pct(r.ltv, 0)}.</> : <>It is listed as collateral on Aave Horizon at a max LTV of {pct(r.ltv, 0)}, but nothing is posted there yet.</>) : <>{usd(r.supplied)} of it is supplied to Aave Horizon to be borrowed.</>) : 'It is not listed on Aave Horizon; whatever is deployed elsewhere is outside this terminal.'} As of {d.asOf}.
        </p>
      </div>
      <MarketDetailLayout
        main={<>
          <div className="grid grid-cols-2 gap-4 @2xl/main:grid-cols-4">
            {stat('AUM', usd(a.aum), a.source === 'onchain_derived' ? 'on-chain supply × price' : 'issuer NAV')}
            {stat('Change, 30 days', change30, 'issuance and price')}
            {stat('On Aave Horizon', r ? (r.supplied ? usd(r.supplied) : '$0') : 'n/a', r ? (r.kind === 'rwa' ? (r.supplied ? 'as collateral' : 'listed, nothing posted') : 'to be borrowed') : 'not listed')}
            {stat(a.kind === 'rwa' ? 'Deployed' : 'Issuer', a.kind === 'rwa' ? pct(a.deployedPct, 1) : a.issuer, a.kind === 'rwa' ? 'of AUM on Horizon' : a.assetClass)}
          </div>
          <DetailCharts asOf={d.asOf} history={d.history} historySeries={[{ key: 'aum', label: 'AUM' }]} historyTitle="Assets under management"
            historyDescription={`Since ${d.history[0]?.day ?? 'the first snapshot'}. Growth is issuance for NAV-stable assets; for gold and carry it is also price.`} />
        </>}
        aside={<>
          {a.kind === 'rwa' ? (
            <Card>
              <CardHeader><CardTitle>Share deployed</CardTitle><CardDescription>How much of this asset&apos;s supply is posted as collateral on Aave Horizon.</CardDescription></CardHeader>
              <CardContent><RadialChart value={a.deployedPct} label="on Horizon" height={180} /></CardContent>
            </Card>
          ) : null}
          {r ? <Button variant="outline" nativeButton={false} render={<Link href={`/horizon/${r.symbol}`} />}>Open the Horizon reserve<ArrowRightIcon /></Button> : null}
          {/* The facts card comes last: the aside's last child grows to the column's height. */}
          <MarketFacts facts={d.facts} />
        </>}
      />
    </>
  );
}
