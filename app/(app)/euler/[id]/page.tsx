import { notFound } from 'next/navigation';
import { config } from '@/datum.config';
import { loadEulerCluster } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';
import { chainName, protocolLogo } from '@/lib/chains';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { AssetAvatar } from '@/components/asset-avatar';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EulerPairsTable, EulerVaultsTable } from '@/components/rwa-tables';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const d = await loadEulerCluster(id);
  return { title: d ? d.cluster.name : 'Euler cluster' };
}

export default async function ClusterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await loadEulerCluster(id);
  if (!d) notFound();
  const c = d.cluster;
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  const maxLtv = Math.max(0, ...d.pairs.filter((p) => p.collateralClass).map((p) => p.borrowLtv));
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Euler clusters', href: '/euler' }, { label: c.name }]} />
        <div>
          <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{c.name}</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><AssetAvatar symbol="Euler" src={protocolLogo(config.venues.euler.logo)} className="size-4" />Euler</span>
            <span>·</span><span>{chainName(c.chainId)}</span><span>·</span><span>curated by {c.curator}</span>
          </p>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {c.rwaAssets.length ? `${c.rwaAssets.join(', ')} ${c.rwaAssets.length === 1 ? 'is' : 'are'} accepted as collateral here` : 'This cluster holds no RWA vault of its own; it lends against RWA collateral held elsewhere'}{c.borrowable.length ? `, to borrow ${c.borrowable.join(', ')}` : ''}. {usd(c.rwaSupplied)} of RWA is supplied and {usd(c.debtBacked)} is borrowed against it, across {count(d.pairs.length)} {d.pairs.length === 1 ? 'pair' : 'pairs'}. As of {d.asOf}.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 px-4 lg:px-6 @2xl/main:grid-cols-4">
        {stat('RWA supplied', usd(c.rwaSupplied), `${count(c.rwaAssets.length)} RWA ${c.rwaAssets.length === 1 ? 'vault' : 'vaults'}`)}
        {stat('Borrowed against', usd(c.debtBacked), c.rwaSupplied ? `${pct((c.debtBacked / c.rwaSupplied) * 100, 0)} of the collateral` : 'no RWA supplied')}
        {stat('Pairs', count(d.pairs.length), 'collateral × borrowable')}
        {stat('Highest borrow LTV', maxLtv ? pct(maxLtv, 0) : 'n/a', 'against RWA collateral')}
      </div>
      <EulerPairsTable data={d.pairs} title="Pairs"
        caption={<><b className="font-medium text-foreground">What can be borrowed against what.</b> Borrow LTV is how far a position can go; liquidation LTV is where it is liquidated. Borrowed against is the debt each collateral backs today.</>} />
      <EulerVaultsTable data={d.vaults} title="Vaults"
        caption={<><b className="font-medium text-foreground">The cluster&apos;s vaults.</b> RWA collateral vaults hold the tokenized assets; borrowable vaults hold what is lent against them.</>} />
    </>
  );
}
