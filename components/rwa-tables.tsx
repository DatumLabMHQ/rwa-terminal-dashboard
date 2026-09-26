'use client';
// The tables of the terminal on the kit's DataTable: positions (asset × venue), Horizon reserves,
// Morpho RWA markets, Euler clusters, pairs and vaults, and tokenized assets. Every row opens its page; the first cell is a
// real link for keyboards. Assets and venues render as Avatars.
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AssetAvatar, MarketPair } from '@/components/asset-avatar';
import { DataTable, defineColumns, SortHeader } from '@/components/data-table';
import { pct, price, usd } from '@/lib/format';
import { chainLogo, chainName } from '@/lib/chains';
import type { Asset, EulerCluster, EulerPair, EulerVault, Position, Reserve, RwaMarket } from '@/lib/rwa-types';

// Risk parameters are whole percents, except placeholders such as mGLOBAL's 0.05% / 0.1% on Horizon,
// which would round to 0% and hide that the reserve is listed but not usable as collateral.
const ltvDigits = (v: number | null, whole = 0) => (v !== null && v > 0 && v < 1 ? 2 : whole);

const riskClass = (u: number) => (u > 85 ? 'text-(--red)' : u > 70 ? 'text-(--yellow)' : 'text-(--green)');
const NA = <span className="text-muted-foreground">n/a</span>;
const Util = ({ value }: { value: number | null }) => (value == null ? NA : <Badge variant="outline" className={`px-1.5 tabular-nums ${riskClass(value)}`}><span className="size-1.5 rounded-full bg-current" />{pct(value, 1)}</Badge>);
const Money = ({ value }: { value: number | null }) => <span className="tabular-nums">{value == null ? NA : usd(value)}</span>;
const Pct = ({ value, digits = 2, muted = false }: { value: number | null; digits?: number; muted?: boolean }) => <span className={`tabular-nums ${muted ? 'text-muted-foreground' : ''}`}>{value == null ? NA : pct(value, digits)}</span>;
const Kind = ({ kind }: { kind: 'rwa' | 'stable' }) => <Badge variant={kind === 'rwa' ? 'secondary' : 'outline'} className="font-normal">{kind === 'rwa' ? 'Tokenized asset' : 'Stablecoin'}</Badge>;
type Caption = React.ReactNode;
const Chain = ({ id }: { id: number }) => <span className="inline-flex items-center gap-1.5 text-muted-foreground"><AssetAvatar symbol={chainName(id)} src={chainLogo(id)} className="size-4" />{chainName(id)}</span>;
const ClassBadge = ({ value }: { value: string | null }) => (value ? <Badge variant="secondary" className="font-normal">{value}</Badge> : NA);

// ── Positions: asset × venue ──
const positionColumns = defineColumns<Position>((col) => [
  col.accessor('asset', { header: 'Asset', enableHiding: false, cell: ({ row }) => (
    <Link href={row.original.href} className="flex items-center gap-2.5 outline-none focus-visible:underline">
      {row.original.loan ? <MarketPair collateral={row.original.asset} loan={row.original.loan} /> : <AssetAvatar symbol={row.original.asset} />}
      <span className="leading-tight"><span className="block font-medium">{row.original.asset}</span><span className="block text-xs text-muted-foreground">{row.original.loan ? `${row.original.loan} loan` : 'supply-only collateral'}</span></span>
    </Link>) }),
  col.accessor('venue', { header: 'Venue', cell: ({ row }) => <span className="inline-flex items-center gap-1.5 text-muted-foreground"><AssetAvatar symbol={row.original.venue} src={row.original.logo} className="size-4" />{row.original.venue}{row.original.chainId !== 1 ? <span className="text-xs">· {chainName(row.original.chainId)}</span> : null}</span> }),
  col.accessor('assetClass', { header: 'Class', cell: ({ row }) => <Badge variant="secondary" className="font-normal">{row.original.assetClass}</Badge> }),
  col.accessor('collateral', { header: ({ column }) => <SortHeader column={column} label="Collateral" />, cell: ({ row }) => <Money value={row.original.collateral} /> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <Money value={row.original.borrowed} /> }),
  col.accessor('maxLtv', { header: ({ column }) => <SortHeader column={column} label="Max LTV" />, cell: ({ row }) => <Pct value={row.original.maxLtv} digits={ltvDigits(row.original.maxLtv, 1)} muted /> }),
  col.accessor('liqThreshold', { header: 'Liq. threshold', cell: ({ row }) => <Pct value={row.original.liqThreshold} digits={ltvDigits(row.original.liqThreshold)} muted /> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => <Util value={row.original.utilization} /> }),
  col.accessor('borrowApy', { header: 'Borrow APY', cell: ({ row }) => <Pct value={row.original.borrowApy} /> }),
]);
export function PositionsTable({ data, title, caption, pageSize = 10 }: { data: Position[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Position> rows={data} columns={positionColumns} title={title} caption={caption} getRowId={(p) => p.id} rowHref={(p) => p.href}
    search={(p, q) => `${p.asset} ${p.loan ?? ''} ${p.venue} ${p.assetClass} ${chainName(p.chainId)}`.toLowerCase().includes(q)} searchPlaceholder="Filter positions"
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
  col.accessor('ltv', { header: ({ column }) => <SortHeader column={column} label="Max LTV" />, cell: ({ row }) => <Pct value={row.original.kind === 'rwa' ? row.original.ltv : null} digits={ltvDigits(row.original.ltv)} muted /> }),
  col.accessor('liqThreshold', { header: 'Liq. threshold', cell: ({ row }) => <Pct value={row.original.kind === 'rwa' ? row.original.liqThreshold : null} digits={ltvDigits(row.original.liqThreshold)} muted /> }),
  col.accessor('emodeLtv', { header: 'E-mode', cell: ({ row }) => (row.original.emodeLtv == null ? NA : <span className="tabular-nums leading-tight"><span className="block">{pct(row.original.emodeLtv, 0)} / {pct(row.original.emodeLiqThreshold, 0)}</span><span className="block text-xs text-muted-foreground">borrowing {row.original.emodeBorrowable}</span></span>) }),
  col.accessor('price', { header: 'Oracle price', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{price(row.original.price)}</span> }),
]);
export function ReservesTable({ data, title, caption, pageSize = 12 }: { data: Reserve[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Reserve> rows={data} columns={reserveColumns} title={title} caption={caption} getRowId={(r) => r.id || r.symbol} rowHref={(r) => `/horizon/${r.symbol}`}
    search={(r, q) => `${r.symbol} ${r.issuer} ${r.assetClass} ${r.kind}`.toLowerCase().includes(q)} searchPlaceholder="Filter reserves"
    numeric={['supplied', 'borrowed', 'utilization', 'supplyApy', 'borrowApy', 'ltv', 'liqThreshold', 'emodeLtv', 'price']}
    labels={{ symbol: 'Reserve', kind: 'Role', supplied: 'Supplied', borrowed: 'Borrowed', utilization: 'Utilisation', supplyApy: 'Supply APY', borrowApy: 'Borrow APY', ltv: 'Max LTV', liqThreshold: 'Liq. threshold', emodeLtv: 'E-mode', price: 'Oracle price' }}
    initialSort={[{ id: 'supplied', desc: true }]} pageSize={pageSize} noun="reserve" empty="No reserves match." />;
}

// ── Morpho RWA markets ──
const marketColumns = defineColumns<RwaMarket>((col) => [
  col.accessor('collateralSymbol', { header: 'Market', enableHiding: false, cell: ({ row }) => (
    <Link href={`/markets/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline">
      <MarketPair collateral={row.original.collateralSymbol} loan={row.original.loanSymbol} />
      <span className="leading-tight"><span className="block font-medium">{row.original.collateralSymbol}</span><span className="block text-xs text-muted-foreground">{row.original.loanSymbol} loan</span></span>
    </Link>) }),
  col.accessor('chainId', { header: 'Chain', cell: ({ row }) => <Chain id={row.original.chainId} /> }),
  col.accessor('assetClass', { header: 'Class', cell: ({ row }) => <Badge variant="secondary" className="font-normal">{row.original.assetClass}</Badge> }),
  col.accessor('collateralUsd', { header: ({ column }) => <SortHeader column={column} label="Collateral" />, cell: ({ row }) => <Money value={row.original.collateralUsd} /> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <Money value={row.original.borrowed} /> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => <Util value={row.original.utilization} /> }),
  col.accessor('lltv', { header: 'LLTV', cell: ({ row }) => <Pct value={row.original.lltv} digits={1} muted /> }),
  col.accessor('borrowApy', { header: ({ column }) => <SortHeader column={column} label="Borrow APY" />, cell: ({ row }) => <Pct value={row.original.borrowApy} /> }),
]);
export function RwaMarketsTable({ data, title, caption, pageSize = 10 }: { data: RwaMarket[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<RwaMarket> rows={data} columns={marketColumns} title={title} caption={caption} getRowId={(m) => m.id} rowHref={(m) => `/markets/${m.id}`}
    search={(m, q) => `${m.collateralSymbol} ${m.loanSymbol} ${m.assetClass} ${m.issuer} ${chainName(m.chainId)}`.toLowerCase().includes(q)} searchPlaceholder="Filter markets"
    numeric={['collateralUsd', 'borrowed', 'utilization', 'lltv', 'borrowApy']}
    labels={{ collateralSymbol: 'Market', chainId: 'Chain', assetClass: 'Class', collateralUsd: 'Collateral', borrowed: 'Borrowed', utilization: 'Utilisation', lltv: 'LLTV', borrowApy: 'Borrow APY' }}
    initialSort={[{ id: 'collateralUsd', desc: true }]} pageSize={pageSize} noun="market" empty="No markets match." />;
}

// ── Euler clusters, pairs and vaults ──
const clusterColumns = defineColumns<EulerCluster>((col) => [
  col.accessor('name', { header: 'Cluster', enableHiding: false, cell: ({ row }) => (
    <Link href={`/euler/${row.original.id}`} className="leading-tight outline-none focus-visible:underline">
      <span className="block font-medium">{row.original.name}</span><span className="block text-xs text-muted-foreground">{row.original.curator}</span>
    </Link>) }),
  col.accessor('chainId', { header: 'Chain', cell: ({ row }) => <Chain id={row.original.chainId} /> }),
  col.accessor('rwaAssets', { header: 'RWA collateral', enableSorting: false, cell: ({ row }) => <span className="text-muted-foreground">{row.original.rwaAssets.length > 4 ? `${row.original.rwaAssets.slice(0, 4).join(', ')} +${row.original.rwaAssets.length - 4}` : row.original.rwaAssets.join(', ') || 'none'}</span> }),
  col.accessor('borrowable', { header: 'Lends', enableSorting: false, cell: ({ row }) => <span className="text-muted-foreground">{row.original.borrowable.join(', ') || 'n/a'}</span> }),
  col.accessor('rwaSupplied', { header: ({ column }) => <SortHeader column={column} label="RWA supplied" />, cell: ({ row }) => <Money value={row.original.rwaSupplied} /> }),
  col.accessor('debtBacked', { header: ({ column }) => <SortHeader column={column} label="Borrowed against" />, cell: ({ row }) => <Money value={row.original.debtBacked} /> }),
  col.accessor('pairs', { header: ({ column }) => <SortHeader column={column} label="Pairs" />, cell: ({ row }) => <span className="tabular-nums">{row.original.pairs}</span> }),
]);
export function EulerClustersTable({ data, title, caption, pageSize = 12 }: { data: EulerCluster[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<EulerCluster> rows={data} columns={clusterColumns} title={title} caption={caption} getRowId={(c) => c.id} rowHref={(c) => `/euler/${c.id}`}
    search={(c, q) => `${c.name} ${c.curator} ${c.rwaAssets.join(' ')} ${c.borrowable.join(' ')} ${chainName(c.chainId)}`.toLowerCase().includes(q)} searchPlaceholder="Filter clusters"
    numeric={['rwaSupplied', 'debtBacked', 'pairs']}
    labels={{ name: 'Cluster', chainId: 'Chain', rwaAssets: 'RWA collateral', borrowable: 'Lends', rwaSupplied: 'RWA supplied', debtBacked: 'Borrowed against', pairs: 'Pairs' }}
    initialSort={[{ id: 'rwaSupplied', desc: true }]} pageSize={pageSize} noun="cluster" empty="No clusters match." />;
}
const pairColumns = defineColumns<EulerPair>((col) => [
  col.accessor('collateralSymbol', { header: 'Pair', enableHiding: false, cell: ({ row }) => (
    <Link href={`/euler/${row.original.clusterId}`} className="flex items-center gap-2.5 outline-none focus-visible:underline">
      <MarketPair collateral={row.original.collateralSymbol} loan={row.original.borrowSymbol} />
      <span className="leading-tight"><span className="block font-medium">{row.original.collateralSymbol}</span><span className="block text-xs text-muted-foreground">borrow {row.original.borrowSymbol}</span></span>
    </Link>) }),
  col.accessor('cluster', { header: 'Cluster', cell: ({ row }) => <span className="leading-tight"><span className="block">{row.original.cluster}</span><span className="block text-xs text-muted-foreground">{chainName(row.original.chainId)}</span></span> }),
  col.accessor('collateralClass', { header: 'Collateral class', cell: ({ row }) => <ClassBadge value={row.original.collateralClass} /> }),
  col.accessor('borrowLtv', { header: ({ column }) => <SortHeader column={column} label="Borrow LTV" />, cell: ({ row }) => <Pct value={row.original.borrowLtv} digits={0} muted /> }),
  col.accessor('liqLtv', { header: 'Liq. LTV', cell: ({ row }) => <Pct value={row.original.liqLtv} digits={0} muted /> }),
  col.accessor('debtBacked', { header: ({ column }) => <SortHeader column={column} label="Borrowed against" />, cell: ({ row }) => <Money value={row.original.debtBacked} /> }),
]);
export function EulerPairsTable({ data, title, caption, pageSize = 10 }: { data: EulerPair[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<EulerPair> rows={data} columns={pairColumns} title={title} caption={caption} getRowId={(p) => p.id} rowHref={(p) => `/euler/${p.clusterId}`}
    search={(p, q) => `${p.collateralSymbol} ${p.borrowSymbol} ${p.cluster} ${p.curator} ${p.collateralClass ?? ''} ${chainName(p.chainId)}`.toLowerCase().includes(q)} searchPlaceholder="Filter pairs"
    numeric={['borrowLtv', 'liqLtv', 'debtBacked']}
    labels={{ collateralSymbol: 'Pair', cluster: 'Cluster', collateralClass: 'Collateral class', borrowLtv: 'Borrow LTV', liqLtv: 'Liq. LTV', debtBacked: 'Borrowed against' }}
    initialSort={[{ id: 'debtBacked', desc: true }]} pageSize={pageSize} noun="pair" empty="No pairs match." />;
}
const vaultColumns = defineColumns<EulerVault>((col) => [
  col.accessor('symbol', { header: 'Vault', enableHiding: false, cell: ({ row }) => (
    <span className="flex items-center gap-2.5"><AssetAvatar symbol={row.original.symbol} />
      <span className="leading-tight"><span className="block font-medium">{row.original.symbol}</span><span className="block text-xs text-muted-foreground">{row.original.issuer ?? (row.original.role === 'borrowable' ? 'lent out' : '')}</span></span></span>) }),
  col.accessor('role', { header: 'Role', cell: ({ row }) => <Badge variant={row.original.role === 'collateral' ? 'secondary' : 'outline'} className="font-normal">{row.original.role === 'collateral' ? 'RWA collateral' : 'Borrowable'}</Badge> }),
  col.accessor('assetClass', { header: 'Class', cell: ({ row }) => <ClassBadge value={row.original.assetClass} /> }),
  col.accessor('supplied', { header: ({ column }) => <SortHeader column={column} label="Supplied" />, cell: ({ row }) => <Money value={row.original.supplied} /> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <Money value={row.original.role === 'borrowable' ? row.original.borrowed : null} /> }),
  col.accessor('utilization', { header: 'Utilisation', cell: ({ row }) => <Util value={row.original.role === 'borrowable' ? row.original.utilization : null} /> }),
  col.accessor('borrowApy', { header: 'Borrow APY', cell: ({ row }) => <Pct value={row.original.role === 'borrowable' ? row.original.borrowApy : null} /> }),
]);
export function EulerVaultsTable({ data, title, caption, pageSize = 12 }: { data: EulerVault[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<EulerVault> rows={data} columns={vaultColumns} title={title} caption={caption} getRowId={(v) => v.id}
    search={(v, q) => `${v.symbol} ${v.issuer ?? ''} ${v.assetClass ?? ''} ${v.role}`.toLowerCase().includes(q)} searchPlaceholder="Filter vaults"
    numeric={['supplied', 'borrowed', 'utilization', 'borrowApy']}
    labels={{ symbol: 'Vault', role: 'Role', assetClass: 'Class', supplied: 'Supplied', borrowed: 'Borrowed', utilization: 'Utilisation', borrowApy: 'Borrow APY' }}
    initialSort={[{ id: 'supplied', desc: true }]} pageSize={pageSize} noun="vault" empty="No vaults match." />;
}

// ── Tokenized assets ──
const SOURCES: Record<string, string> = { onchain_derived: 'on-chain supply × price (Ethereum)', superstate_api: 'Superstate API', hashnote_api: 'Hashnote API',
  centrifuge_api: 'Centrifuge, every chain', chain_rpc_x_horizon_nav: 'supply on every chain × NAV' };
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
  col.accessor('source', { header: 'AUM source', cell: ({ row }) => <span className="text-xs text-muted-foreground">{SOURCES[row.original.source] ?? row.original.source}</span> }),
]);
export function AssetsTable({ data, title, caption, pageSize = 12 }: { data: Asset[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Asset> rows={data} columns={assetColumns} title={title} caption={caption} getRowId={(a) => a.id} rowHref={(a) => `/assets/${a.id}`}
    search={(a, q) => `${a.ticker} ${a.name} ${a.issuer} ${a.assetClass} ${a.kind}`.toLowerCase().includes(q)} searchPlaceholder="Filter assets"
    numeric={['aum', 'horizonSupplied', 'deployedPct']}
    labels={{ ticker: 'Asset', kind: 'Kind', assetClass: 'Class', aum: 'AUM', horizonSupplied: 'On Horizon', deployedPct: 'Deployed', source: 'AUM source' }}
    initialSort={[{ id: 'aum', desc: true }]} pageSize={pageSize} noun="asset" empty="No assets match." />;
}
