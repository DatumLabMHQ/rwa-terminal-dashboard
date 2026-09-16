'use client';
// The four tables of the terminal on the kit's DataTable: positions (asset × venue), Horizon
// reserves, Morpho RWA markets and tokenized assets. Every row opens its page; the first cell is a
// real link for keyboards. Assets and venues render as Avatars.
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AssetAvatar, MarketPair } from '@/components/asset-avatar';
import { DataTable, defineColumns, SortHeader } from '@/components/data-table';
import { pct, price, usd } from '@/lib/format';
import type { Asset, Position, Reserve, RwaMarket } from '@/lib/rwa-types';

const riskClass = (u: number) => (u > 85 ? 'text-(--red)' : u > 70 ? 'text-(--yellow)' : 'text-(--green)');
const NA = <span className="text-muted-foreground">n/a</span>;
const Util = ({ value }: { value: number | null }) => (value == null ? NA : <Badge variant="outline" className={`px-1.5 tabular-nums ${riskClass(value)}`}><span className="size-1.5 rounded-full bg-current" />{pct(value, 1)}</Badge>);
const Money = ({ value }: { value: number | null }) => <span className="tabular-nums">{value == null ? NA : usd(value)}</span>;
const Pct = ({ value, digits = 2, muted = false }: { value: number | null; digits?: number; muted?: boolean }) => <span className={`tabular-nums ${muted ? 'text-muted-foreground' : ''}`}>{value == null ? NA : pct(value, digits)}</span>;
const Kind = ({ kind }: { kind: 'rwa' | 'stable' }) => <Badge variant={kind === 'rwa' ? 'secondary' : 'outline'} className="font-normal">{kind === 'rwa' ? 'Tokenized asset' : 'Stablecoin'}</Badge>;
type Caption = React.ReactNode;

// ── Positions: asset × venue ──
const positionColumns = defineColumns<Position>((col) => [
  col.accessor('asset', { header: 'Asset', enableHiding: false, cell: ({ row }) => (
    <Link href={row.original.href} className="flex items-center gap-2.5 outline-none focus-visible:underline">
      {row.original.loan ? <MarketPair collateral={row.original.asset} loan={row.original.loan} /> : <AssetAvatar symbol={row.original.asset} />}
      <span className="leading-tight"><span className="block font-medium">{row.original.asset}</span><span className="block text-xs text-muted-foreground">{row.original.loan ? `${row.original.loan} loan` : 'supply-only collateral'}</span></span>
    </Link>) }),
  col.accessor('venue', { header: 'Venue', cell: ({ row }) => <span className="inline-flex items-center gap-1.5 text-muted-foreground"><AssetAvatar symbol={row.original.venue} src={row.original.logo} className="size-4" />{row.original.venue}</span> }),
  col.accessor('assetClass', { header: 'Class', cell: ({ row }) => <Badge variant="secondary" className="font-normal">{row.original.assetClass}</Badge> }),
  col.accessor('collateral', { header: ({ column }) => <SortHeader column={column} label="Collateral" />, cell: ({ row }) => <Money value={row.original.collateral} /> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <Money value={row.original.borrowed} /> }),
  col.accessor('maxLtv', { header: ({ column }) => <SortHeader column={column} label="Max LTV" />, cell: ({ row }) => <Pct value={row.original.maxLtv} digits={1} muted /> }),
  col.accessor('liqThreshold', { header: 'Liq. threshold', cell: ({ row }) => <Pct value={row.original.liqThreshold} digits={0} muted /> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => <Util value={row.original.utilization} /> }),
  col.accessor('borrowApy', { header: 'Borrow APY', cell: ({ row }) => <Pct value={row.original.borrowApy} /> }),
]);
export function PositionsTable({ data, title, caption, pageSize = 10 }: { data: Position[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Position> rows={data} columns={positionColumns} title={title} caption={caption} getRowId={(p) => p.id} rowHref={(p) => p.href}
    search={(p, q) => `${p.asset} ${p.loan ?? ''} ${p.venue} ${p.assetClass}`.toLowerCase().includes(q)} searchPlaceholder="Filter positions"
    numeric={['collateral', 'borrowed', 'maxLtv', 'liqThreshold', 'utilization', 'borrowApy']}
    labels={{ asset: 'Asset', venue: 'Venue', assetClass: 'Class', collateral: 'Collateral', borrowed: 'Borrowed', maxLtv: 'Max LTV', liqThreshold: 'Liq. threshold', utilization: 'Utilisation', borrowApy: 'Borrow APY' }}
    initialSort={[{ id: 'collateral', desc: true }]} pageSize={pageSize} noun="position" empty="No positions match." />;
}

// ── Horizon reserves ──
const reserveColumns = defineColumns<Reserve>((col) => [
  col.accessor('symbol', { header: 'Reserve', enableHiding: false, cell: ({ row }) => (
    <Link href={`/horizon/${row.original.symbol}`} className="flex items-center gap-2.5 outline-none focus-visible:underline">
      <AssetAvatar symbol={row.original.symbol} />
      <span className="leading-tight"><span className="block font-medium">{row.original.symbol}</span><span className="block text-xs text-muted-foreground">{row.original.issuer}</span></span>
    </Link>) }),
  col.accessor('kind', { header: 'Role', cell: ({ row }) => <Kind kind={row.original.kind} /> }),
  col.accessor('supplied', { header: ({ column }) => <SortHeader column={column} label="Supplied" />, cell: ({ row }) => <Money value={row.original.supplied} /> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <Money value={row.original.borrowed} /> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => (row.original.kind === 'stable' ? <Util value={row.original.utilization} /> : NA) }),
  col.accessor('supplyApy', { header: 'Supply APY', cell: ({ row }) => <Pct value={row.original.kind === 'stable' ? row.original.supplyApy : null} /> }),
  col.accessor('borrowApy', { header: 'Borrow APY', cell: ({ row }) => <Pct value={row.original.kind === 'stable' ? row.original.borrowApy : null} /> }),
  col.accessor('ltv', { header: ({ column }) => <SortHeader column={column} label="Max LTV" />, cell: ({ row }) => <Pct value={row.original.kind === 'rwa' ? row.original.ltv : null} digits={0} muted /> }),
  col.accessor('liqThreshold', { header: 'Liq. threshold', cell: ({ row }) => <Pct value={row.original.kind === 'rwa' ? row.original.liqThreshold : null} digits={0} muted /> }),
  col.accessor('price', { header: 'Oracle price', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{price(row.original.price)}</span> }),
]);
export function ReservesTable({ data, title, caption, pageSize = 12 }: { data: Reserve[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Reserve> rows={data} columns={reserveColumns} title={title} caption={caption} getRowId={(r) => r.id || r.symbol} rowHref={(r) => `/horizon/${r.symbol}`}
    search={(r, q) => `${r.symbol} ${r.issuer} ${r.assetClass} ${r.kind}`.toLowerCase().includes(q)} searchPlaceholder="Filter reserves"
    numeric={['supplied', 'borrowed', 'utilization', 'supplyApy', 'borrowApy', 'ltv', 'liqThreshold', 'price']}
    labels={{ symbol: 'Reserve', kind: 'Role', supplied: 'Supplied', borrowed: 'Borrowed', utilization: 'Utilisation', supplyApy: 'Supply APY', borrowApy: 'Borrow APY', ltv: 'Max LTV', liqThreshold: 'Liq. threshold', price: 'Oracle price' }}
    initialSort={[{ id: 'supplied', desc: true }]} pageSize={pageSize} noun="reserve" empty="No reserves match." />;
}

// ── Morpho RWA markets ──
const marketColumns = defineColumns<RwaMarket>((col) => [
  col.accessor('collateralSymbol', { header: 'Market', enableHiding: false, cell: ({ row }) => (
    <Link href={`/markets/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline">
      <MarketPair collateral={row.original.collateralSymbol} loan={row.original.loanSymbol} />
      <span className="leading-tight"><span className="block font-medium">{row.original.collateralSymbol}</span><span className="block text-xs text-muted-foreground">{row.original.loanSymbol} loan</span></span>
    </Link>) }),
  col.accessor('assetClass', { header: 'Class', cell: ({ row }) => <Badge variant="secondary" className="font-normal">{row.original.assetClass}</Badge> }),
  col.accessor('collateralUsd', { header: ({ column }) => <SortHeader column={column} label="Collateral" />, cell: ({ row }) => <Money value={row.original.collateralUsd} /> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <Money value={row.original.borrowed} /> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => <Util value={row.original.utilization} /> }),
  col.accessor('lltv', { header: 'LLTV', cell: ({ row }) => <Pct value={row.original.lltv} digits={1} muted /> }),
  col.accessor('borrowApy', { header: ({ column }) => <SortHeader column={column} label="Borrow APY" />, cell: ({ row }) => <Pct value={row.original.borrowApy} /> }),
]);
export function RwaMarketsTable({ data, title, caption, pageSize = 10 }: { data: RwaMarket[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<RwaMarket> rows={data} columns={marketColumns} title={title} caption={caption} getRowId={(m) => m.id} rowHref={(m) => `/markets/${m.id}`}
    search={(m, q) => `${m.collateralSymbol} ${m.loanSymbol} ${m.assetClass}`.toLowerCase().includes(q)} searchPlaceholder="Filter markets"
    numeric={['collateralUsd', 'borrowed', 'utilization', 'lltv', 'borrowApy']}
    labels={{ collateralSymbol: 'Market', assetClass: 'Class', collateralUsd: 'Collateral', borrowed: 'Borrowed', utilization: 'Utilisation', lltv: 'LLTV', borrowApy: 'Borrow APY' }}
    initialSort={[{ id: 'collateralUsd', desc: true }]} pageSize={pageSize} noun="market" empty="No markets match." />;
}

// ── Tokenized assets ──
const assetColumns = defineColumns<Asset>((col) => [
  col.accessor('ticker', { header: 'Asset', enableHiding: false, cell: ({ row }) => (
    <Link href={`/assets/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline">
      <AssetAvatar symbol={row.original.ticker} />
      <span className="leading-tight"><span className="block font-medium">{row.original.ticker}</span><span className="block text-xs text-muted-foreground">{row.original.issuer}</span></span>
    </Link>) }),
  col.accessor('kind', { header: 'Kind', cell: ({ row }) => <Kind kind={row.original.kind} /> }),
  col.accessor('assetClass', { header: 'Class', cell: ({ row }) => <span className="text-muted-foreground">{row.original.assetClass}</span> }),
  col.accessor('aum', { header: ({ column }) => <SortHeader column={column} label="AUM" />, cell: ({ row }) => <Money value={row.original.aum} /> }),
  col.accessor('horizonSupplied', { header: ({ column }) => <SortHeader column={column} label="On Horizon" />, cell: ({ row }) => <Money value={row.original.horizonSupplied} /> }),
  col.accessor('deployedPct', { header: ({ column }) => <SortHeader column={column} label="Deployed" />, cell: ({ row }) => (row.original.kind === 'rwa' ? <Badge variant="outline" className="px-1.5 tabular-nums">{pct(row.original.deployedPct, 1)}</Badge> : NA) }),
  col.accessor('source', { header: 'AUM source', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.source === 'onchain_derived' ? 'on-chain supply × price' : row.original.source.replace('_api', ' API')}</span> }),
]);
export function AssetsTable({ data, title, caption, pageSize = 12 }: { data: Asset[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Asset> rows={data} columns={assetColumns} title={title} caption={caption} getRowId={(a) => a.id} rowHref={(a) => `/assets/${a.id}`}
    search={(a, q) => `${a.ticker} ${a.name} ${a.issuer} ${a.assetClass} ${a.kind}`.toLowerCase().includes(q)} searchPlaceholder="Filter assets"
    numeric={['aum', 'horizonSupplied', 'deployedPct']}
    labels={{ ticker: 'Asset', kind: 'Kind', assetClass: 'Class', aum: 'AUM', horizonSupplied: 'On Horizon', deployedPct: 'Deployed', source: 'AUM source' }}
    initialSort={[{ id: 'aum', desc: true }]} pageSize={pageSize} noun="asset" empty="No assets match." />;
}
