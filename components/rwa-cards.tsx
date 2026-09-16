// The KPI row: shadcn's section-cards recipe on the RWA overview numbers. No "use client":
// nothing here has state, so it renders on the server with the data.
import { TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react/ssr';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { count, delta, pct, usd } from '@/lib/format';
import type { RwaOverview } from '@/lib/rwa-types';

type Stat = { label: string; value: string; change?: number; headline: string; detail: string };

function Trend({ change }: { change: number }) {
  const Icon = change >= 0 ? TrendUpIcon : TrendDownIcon;
  return <Badge variant="outline"><Icon />{delta(change)}</Badge>;
}

export function RwaCards({ kpis: k, asOf }: { kpis: RwaOverview['kpis']; asOf: string }) {
  const stats: Stat[] = [
    { label: 'Tokenized AUM', value: usd(k.rwaAum), change: k.rwaAumChange7d,
      headline: k.rwaAumChange7d >= 0 ? 'Growing over the week' : 'Shrinking over the week', detail: `${count(k.rwaAssets)} tracked assets from ${count(k.issuers)} issuers, stablecoins excluded, as of ${asOf}` },
    { label: 'Deployed as collateral', value: usd(k.deployed), change: k.deployedChange7d,
      headline: `${pct(k.deployedPct, 1)} of tracked AUM sits on Horizon`, detail: `${usd(k.horizonSupplied)} on Aave Horizon, ${usd(k.morphoCollateral)} in Morpho RWA markets` },
    { label: 'Borrowed against it', value: usd(k.borrowed),
      headline: k.utilization > 85 ? 'Above the withdrawal-queue line' : k.utilization > 50 ? 'Collateral that is actually working' : 'Most of the collateral is idle', detail: `${pct(k.utilization, 1)} of everything supplied across both venues` },
    { label: 'Holders on Horizon', value: count(k.holders),
      headline: 'Addresses holding a Horizon position', detail: 'Forward-only count since August 2026' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {stats.map((s) => (
        <Card key={s.label} className="@container/card">
          <CardHeader>
            <CardDescription>{s.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{s.value}</CardTitle>
            {s.change !== undefined ? <CardAction><Trend change={s.change} /></CardAction> : null}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {s.headline}
              {s.change !== undefined ? (s.change >= 0 ? <TrendUpIcon className="size-4" /> : <TrendDownIcon className="size-4" />) : null}
            </div>
            <div className="text-muted-foreground">{s.detail}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
