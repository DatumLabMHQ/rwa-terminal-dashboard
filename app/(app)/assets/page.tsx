import { PageHeader } from '@/components/page-header';
import { AssetsTable } from '@/components/rwa-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadRwa } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Assets' };

export default async function Assets() {
  const d = await loadRwa();
  const rwa = d.assets.filter((a) => a.kind === 'rwa'), stables = d.assets.filter((a) => a.kind === 'stable');
  const rwaAum = rwa.reduce((a, x) => a + x.aum, 0), stableAum = stables.reduce((a, x) => a + x.aum, 0);
  const onHorizon = rwa.reduce((a, x) => a + x.horizonSupplied, 0);
  const issuers = new Set(rwa.map((a) => a.issuer)).size;
  const deployed = rwa.map((a) => ({ name: a.ticker, deployed: a.deployedPct })).sort((a, b) => b.deployed - a.deployed);
  return (
    <>
      <PageHeader eyebrow="Assets" question="Which tokenized assets exist, who issues them, and how much is put to work?"
        answer={<>{count(rwa.length)} tokenized assets worth {usd(rwaAum)} from {count(issuers)} issuers, beside {count(stables.length)} stablecoins worth {usd(stableAum)}. {usd(onHorizon)} of the tokenized value, {pct(rwaAum ? (onHorizon / rwaAum) * 100 : 0, 1)}, sits on Aave Horizon as collateral; the rest is held in wallets and venues this terminal does not track. As of {d.asOf}.</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tokenized AUM by issuer</CardTitle><CardDescription>Stablecoins excluded. The registry view: who has issued what, whether or not it is deployed anywhere.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.byIssuer} unit="usd" height={240} centerLabel="AUM" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Share deployed on Horizon</CardTitle><CardDescription>What fraction of each asset&apos;s supply is posted as collateral. The gap between existing and used is the whole story.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={deployed} x="name" series={[{ key: 'deployed', label: 'Deployed' }]} unit="pct" horizontal labels height={Math.max(220, deployed.length * 30)} categoryWidth={72} /></CardContent>
        </Card>
      </div>
      <AssetsTable data={d.assets} title="Tracked assets"
        caption={<><b className="font-medium text-foreground">The universe.</b> AUM from the issuer&apos;s API where one exists and otherwise from on-chain supply at the oracle price; the Horizon column is what is posted there as collateral. Open an asset for its AUM history.</>} />
    </>
  );
}
