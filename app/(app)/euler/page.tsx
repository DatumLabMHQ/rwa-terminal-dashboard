import { PageHeader } from '@/components/page-header';
import { EulerClustersTable, EulerPairsTable } from '@/components/rwa-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadRwa } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Euler clusters' };

export default async function Euler() {
  const d = await loadRwa();
  const { clusters, pairs } = d.euler;
  const supplied = clusters.reduce((a, c) => a + c.rwaSupplied, 0), backed = clusters.reduce((a, c) => a + c.debtBacked, 0);
  const top = clusters[0];
  const rwaPairs = pairs.filter((p) => p.collateralClass);
  const byClass = new Map<string, number>(); d.euler.vaults.filter((v) => v.role === 'collateral').forEach((v) => byClass.set(v.assetClass ?? 'Other', (byClass.get(v.assetClass ?? 'Other') ?? 0) + v.supplied));
  const classes = [...byClass.entries()].sort((a, b) => b[1] - a[1]);
  const byCluster = clusters.filter((c) => c.rwaSupplied >= 1000).map((c) => ({ name: c.name, supplied: c.rwaSupplied, backed: c.debtBacked }));
  if (!clusters.length) return (
    <PageHeader eyebrow="Euler clusters" question="Where can tokenized assets be borrowed against on Euler, and who curates it?"
      answer={<>The platform has no Euler clusters for {d.asOf} yet. They are read hourly from the Euler API once the rwa/euler resources are live.</>} />
  );
  return (
    <>
      <PageHeader eyebrow="Euler clusters" question="Where can tokenized assets be borrowed against on Euler, and who curates it?"
        answer={<>{count(clusters.length)} curator clusters on Euler hold {usd(supplied)} of tokenized RWAs, with {usd(backed)} borrowed against them ({pct(supplied ? (backed / supplied) * 100 : 0, 0)}), across {count(rwaPairs.length)} lending pairs that accept RWA collateral. {top ? `${top.name} (${top.curator}) is the largest at ${usd(top.rwaSupplied)}; most clusters are small, so Euler is where RWA composability is being tried out rather than where it is concentrated.` : ''} As of {d.asOf}.</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>RWA collateral by asset class</CardTitle><CardDescription>{classes[0] ? `${classes[0][0]} is ${pct(supplied ? (classes[0][1] / supplied) * 100 : 0, 0)} of the RWA supplied to Euler.` : 'No RWA collateral yet.'}</CardDescription></CardHeader>
          <CardContent><DonutChart items={classes.map(([name, value]) => ({ name, value }))} unit="usd" height={240} centerLabel="RWA supplied" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Supplied and borrowed against, by cluster</CardTitle><CardDescription>Clusters above $1,000 of RWA collateral. The gap between the bars is collateral nobody is borrowing against yet.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={byCluster} x="name" series={[{ key: 'supplied', label: 'RWA supplied' }, { key: 'backed', label: 'Borrowed against' }]} unit="usd" horizontal height={Math.max(220, byCluster.length * 42)} categoryWidth={170} /></CardContent>
        </Card>
      </div>
      <EulerClustersTable data={clusters} title="RWA clusters"
        caption={<><b className="font-medium text-foreground">Who curates RWA on Euler.</b> A cluster is a curator&apos;s labelled set of vaults. RWA collateral is what the cluster accepts; lends is what it lets you borrow against it. Open a cluster for its pairs and vaults.</>} />
      <EulerPairsTable data={rwaPairs} title="Lending pairs against RWA collateral"
        caption={<><b className="font-medium text-foreground">The composability map.</b> Every pair on Euler where a tokenized RWA is accepted as collateral: how far it can be borrowed against, where it liquidates, and how much debt it backs today.</>} />
    </>
  );
}
