'use client';

import { useEffect, useState } from 'react';
import {
  Package, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  BarChart3, TrendingUp, TrendingDown, AlertTriangle,
  Download, RefreshCw, Layers, ChevronRight, ChevronDown,
  Building2, FolderTree
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchProducts, Product } from '@/services/product-service';
import { fetchWarehouses, Warehouse as WarehouseType } from '@/services/warehouse-service';
import { getInventoryStats, getLowStockAlerts, getWarehouseInventory, InventoryItem } from '@/services/inventory-service';
import { fetchInboundOrders } from '@/services/inbound-service';
import { fetchOutboundOrders } from '@/services/outbound-service';
import { fetchTransferOrders } from '@/services/transfer-service';
import { fetchStockCounts } from '@/services/stockcount-service';
import { fetchOrganizations, Organization } from '@/services/organization-service';
import { getProductInventory } from '@/services/inventory-service';

// 辅助函数
function isToday(dateStr: string) {
  const d = new Date(dateStr), t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}
function isThisMonth(dateStr: string) {
  const d = new Date(dateStr), t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
}

interface WarehouseInventorySummary {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  totalProducts: number;
  totalQuantity: number;
  items: InventoryItem[];
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 基础数据
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState({ totalProducts: 0, totalQuantity: 0, lowStockCount: 0, warehouseCount: 0 });

  // 业务单据
  const [inboundOrders, setInboundOrders] = useState<any[]>([]);
  const [outboundOrders, setOutboundOrders] = useState<any[]>([]);
  const [transferOrders, setTransferOrders] = useState<any[]>([]);
  const [stockCounts, setStockCounts] = useState<any[]>([]);

  // 仓库库存汇总
  const [warehouseSummaries, setWarehouseSummaries] = useState<WarehouseInventorySummary[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  // 组织和树状明细
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [treeMode, setTreeMode] = useState<'warehouse' | 'product'>('warehouse');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  // 商品库存映射：productId → InventoryItem[]
  const [productInventoryMap, setProductInventoryMap] = useState<Record<number, InventoryItem[]>>({});

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [
        productsData, warehousesData, statsData, lowStock,
        inbound, outbound, transfer, counts, orgsData
      ] = await Promise.all([
        fetchProducts().catch(() => []),
        fetchWarehouses().catch(() => []),
        getInventoryStats().catch(() => ({ totalProducts: 0, totalQuantity: 0, lowStockCount: 0, warehouseCount: 0 })),
        getLowStockAlerts(10).catch(() => []),
        fetchInboundOrders().catch(() => []),
        fetchOutboundOrders().catch(() => []),
        fetchTransferOrders().catch(() => []),
        fetchStockCounts().catch(() => []),
        fetchOrganizations().catch(() => []),
      ]);

      setProducts(productsData);
      setWarehouses(warehousesData);
      setInventoryStats(statsData);
      setLowStockItems(lowStock);
      setInboundOrders(inbound);
      setOutboundOrders(outbound);
      setTransferOrders(transfer);
      setStockCounts(counts);
      setOrganizations(orgsData);

      // 获取每个仓库的库存明细
      const summaries: WarehouseInventorySummary[] = [];
      const inventoryResults = await Promise.all(
        warehousesData.map(w => getWarehouseInventory(w.id).catch(() => []))
      );
      warehousesData.forEach((w, i) => {
        const items = inventoryResults[i];
        summaries.push({
          warehouseId: w.id,
          warehouseName: w.name,
          warehouseCode: w.code,
          totalProducts: items.length,
          totalQuantity: items.reduce((sum, it) => sum + it.quantity, 0),
          items,
        });
      });
      setWarehouseSummaries(summaries);

      // 获取每个商品的库存分布
      const prodInvResults = await Promise.all(
        productsData.map(p => getProductInventory(p.id).catch(() => []))
      );
      const pMap: Record<number, InventoryItem[]> = {};
      productsData.forEach((p, i) => { pMap[p.id] = prodInvResults[i]; });
      setProductInventoryMap(pMap);
    } catch (error) {
      console.error('加载报表数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  // 计算统计
  const todayInbound = inboundOrders.filter(o => isToday(o.created_at)).length;
  const todayOutbound = outboundOrders.filter(o => isToday(o.created_at)).length;
  const monthInbound = inboundOrders.filter(o => isThisMonth(o.created_at)).length;
  const monthOutbound = outboundOrders.filter(o => isThisMonth(o.created_at)).length;
  const pendingTotal = [
    ...inboundOrders.filter(o => o.status === 'pending'),
    ...outboundOrders.filter(o => o.status === 'pending'),
    ...transferOrders.filter(o => o.status === 'pending'),
    ...stockCounts.filter(o => o.status === 'pending'),
  ].length;

  // 按类别统计商品
  const categoryStats = products.reduce((acc, p) => {
    const cat = p.category || '未分类';
    if (!acc[cat]) acc[cat] = { count: 0, totalValue: 0 };
    acc[cat].count++;
    acc[cat].totalValue += parseFloat(p.purchase_price || '0') || 0;
    return acc;
  }, {} as Record<string, { count: number; totalValue: number }>);

  // 仓库映射
  const warehouseMap: Record<number, string> = {};
  warehouses.forEach(w => { warehouseMap[w.id] = w.name; });

  // 树状节点展开/折叠
  const toggleNode = (key: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };
  const expandAll = () => {
    const all = new Set<string>();
    if (treeMode === 'warehouse') {
      organizations.forEach(o => all.add(`org-${o.id}`));
      warehouses.forEach(w => all.add(`wh-${w.id}`));
    } else {
      Object.keys(categoryStats).forEach(cat => all.add(`cat-${cat}`));
      products.forEach(p => all.add(`prod-${p.id}`));
    }
    setExpandedNodes(all);
  };
  const collapseAll = () => setExpandedNodes(new Set());

  // 构建组织树（含子级）
  const buildOrgTree = (orgs: Organization[], parentId: number | null = null): Organization[] => {
    return orgs
      .filter(o => o.parent_id === parentId)
      .map(o => ({ ...o, children: buildOrgTree(orgs, o.id) }));
  };
  const orgTree = buildOrgTree(organizations);

  // 导出库存报表
  const handleExportInventory = () => {
    const rows: any[] = [];
    warehouseSummaries.forEach(ws => {
      ws.items.forEach(item => {
        rows.push({
          '仓库编码': ws.warehouseCode,
          '仓库名称': ws.warehouseName,
          '商品编码': item.product?.code || '',
          '商品名称': item.product?.name || '',
          '单位': item.product?.unit || '',
          '库存数量': item.quantity,
        });
      });
    });
    if (rows.length === 0) {
      rows.push({ '仓库编码': '', '仓库名称': '', '商品编码': '', '商品名称': '', '单位': '', '库存数量': '暂无数据' });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '库存报表');
    XLSX.writeFile(wb, `库存报表_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // 导出业务单据报表
  const handleExportOrders = () => {
    const rows: any[] = [];
    inboundOrders.forEach(o => rows.push({ '类型': '入库', '单号': o.order_no, '仓库': warehouseMap[o.warehouse_id] || '', '状态': o.status, '创建人': o.created_by || '', '创建时间': o.created_at }));
    outboundOrders.forEach(o => rows.push({ '类型': '出库', '单号': o.order_no, '仓库': warehouseMap[o.warehouse_id] || '', '状态': o.status, '创建人': o.created_by || '', '创建时间': o.created_at }));
    transferOrders.forEach(o => rows.push({ '类型': '调拨', '单号': o.order_no, '仓库': `${warehouseMap[o.from_warehouse_id] || ''} → ${warehouseMap[o.to_warehouse_id] || ''}`, '状态': o.status, '创建人': o.created_by || '', '创建时间': o.created_at }));
    if (rows.length === 0) rows.push({ '类型': '', '单号': '', '仓库': '', '状态': '', '创建人': '', '创建时间': '暂无数据' });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '业务单据报表');
    XLSX.writeFile(wb, `业务单据报表_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载报表数据中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">统计报表</h1>
          <p className="text-muted-foreground mt-2">库存统计、业务分析与数据导出</p>
        </div>
        <Button variant="outline" onClick={loadAllData} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">商品总数</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Warehouse className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">仓库数量</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg">
                <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">库存总量</p>
                <p className="text-2xl font-bold">{inventoryStats.totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">低库存预警</p>
                <p className="text-2xl font-bold text-amber-600">{inventoryStats.lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <ArrowDownToLine className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">今日入库</p>
                <p className="text-2xl font-bold">{todayInbound}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-900 rounded-lg">
                <ArrowUpFromLine className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">今日出库</p>
                <p className="text-2xl font-bold">{todayOutbound}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs 详细报表 */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">库存报表</TabsTrigger>
          <TabsTrigger value="tree">树状明细</TabsTrigger>
          <TabsTrigger value="orders">业务单据</TabsTrigger>
          <TabsTrigger value="categories">商品分类</TabsTrigger>
          <TabsTrigger value="lowstock">低库存预警</TabsTrigger>
        </TabsList>

        {/* 库存报表 Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="选择仓库" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部仓库</SelectItem>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExportInventory}>
              <Download className="mr-2 h-4 w-4" />
              导出库存报表
            </Button>
          </div>

          {/* 仓库库存汇总卡片 */}
          {selectedWarehouse === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouseSummaries.map(ws => (
                <Card key={ws.warehouseId} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedWarehouse(String(ws.warehouseId))}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      {ws.warehouseName}
                    </CardTitle>
                    <CardDescription>{ws.warehouseCode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">商品种类</span>
                      <span className="font-medium">{ws.totalProducts}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">库存总量</span>
                      <span className="font-medium">{ws.totalQuantity}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {warehouseSummaries.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">暂无仓库数据</div>
              )}
            </div>
          )}

          {/* 仓库库存明细表 */}
          {selectedWarehouse !== 'all' && (() => {
            const ws = warehouseSummaries.find(s => String(s.warehouseId) === selectedWarehouse);
            if (!ws) return <div className="text-center py-8 text-muted-foreground">未找到仓库数据</div>;
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{ws.warehouseName} - 库存明细</CardTitle>
                  <CardDescription>共 {ws.totalProducts} 种商品，库存总量 {ws.totalQuantity}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品编码</TableHead>
                        <TableHead>商品名称</TableHead>
                        <TableHead>单位</TableHead>
                        <TableHead className="text-right">库存数量</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ws.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">暂无库存</TableCell>
                        </TableRow>
                      ) : ws.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product?.code || '-'}</TableCell>
                          <TableCell>{item.product?.name || '-'}</TableCell>
                          <TableCell>{item.product?.unit || '-'}</TableCell>
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* 树状明细 Tab */}
        <TabsContent value="tree" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={treeMode === 'warehouse' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setTreeMode('warehouse'); setExpandedNodes(new Set()); }}
              >
                <Building2 className="mr-1.5 h-4 w-4" />
                按单位/仓库
              </Button>
              <Button
                variant={treeMode === 'product' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setTreeMode('product'); setExpandedNodes(new Set()); }}
              >
                <Package className="mr-1.5 h-4 w-4" />
                按商品
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={expandAll}>全部展开</Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>全部折叠</Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                {treeMode === 'warehouse' ? '单位 / 仓库 / 商品明细' : '商品分类 / 商品 / 仓库分布'}
              </CardTitle>
              <CardDescription>
                {treeMode === 'warehouse'
                  ? '按组织单位和仓库层级展示库存商品明细'
                  : '按商品分类展示各商品在各仓库的库存分布'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treeMode === 'warehouse' ? (
                /* ===== 仓库维度树 ===== */
                <div className="space-y-1">
                  {/* 如果有组织数据，按组织树展示 */}
                  {orgTree.length > 0 ? (
                    orgTree.map(function renderOrgNode(org: Organization, depth = 0): React.ReactNode {
                      const orgKey = `org-${org.id}`;
                      const isExpanded = expandedNodes.has(orgKey);
                      const children = org.children || [];
                      // 该组织直接归属的仓库
                      const orgWarehouses = warehouseSummaries.filter(ws => {
                        const wh = warehouses.find(w => w.id === ws.warehouseId);
                        return wh?.organization_id === org.id;
                      });
                      // 递归收集子组织下所有仓库数量
                      const collectCount = (o: Organization): number => {
                        const directCount = warehouseSummaries.filter(ws => {
                          const wh = warehouses.find(w => w.id === ws.warehouseId);
                          return wh?.organization_id === o.id;
                        }).length;
                        return directCount + (o.children || []).reduce((s, c) => s + collectCount(c), 0);
                      };
                      const totalWhCount = collectCount(org);
                      return (
                        <div key={orgKey}>
                          <div
                            className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                            style={{ paddingLeft: `${depth * 24 + 8}px` }}
                            onClick={() => toggleNode(orgKey)}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                            <span className="font-medium text-sm">{org.name}</span>
                            <Badge variant="outline" className="ml-auto text-xs">{totalWhCount} 个仓库</Badge>
                          </div>
                          {isExpanded && (
                            <div>
                              {/* 递归渲染子组织 */}
                              {children.map(child => renderOrgNode(child, depth + 1))}
                              {/* 该组织直接归属的仓库 */}
                              {orgWarehouses.map(ws => {
                                const whKey = `wh-${ws.warehouseId}`;
                                const whExpanded = expandedNodes.has(whKey);
                                return (
                                  <div key={whKey}>
                                    <div
                                      className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                      style={{ paddingLeft: `${(depth + 1) * 24 + 8}px` }}
                                      onClick={() => toggleNode(whKey)}
                                    >
                                      {whExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                      <Warehouse className="h-4 w-4 text-green-500 shrink-0" />
                                      <span className="text-sm">{ws.warehouseName}</span>
                                      <span className="text-xs text-muted-foreground">({ws.warehouseCode})</span>
                                      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{ws.totalProducts} 种商品</span>
                                        <Badge variant="secondary" className="text-xs">库存 {ws.totalQuantity}</Badge>
                                      </div>
                                    </div>
                                    {whExpanded && ws.items.length > 0 && (
                                      <div className="ml-4" style={{ paddingLeft: `${(depth + 2) * 24 + 8}px` }}>
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                              <TableHead className="h-8 text-xs">商品编码</TableHead>
                                              <TableHead className="h-8 text-xs">商品名称</TableHead>
                                              <TableHead className="h-8 text-xs">单位</TableHead>
                                              <TableHead className="h-8 text-xs text-right">数量</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {ws.items.map(item => (
                                              <TableRow key={item.id} className="hover:bg-muted/30">
                                                <TableCell className="py-1.5 text-xs font-mono">{item.product?.code || '-'}</TableCell>
                                                <TableCell className="py-1.5 text-xs">{item.product?.name || '-'}</TableCell>
                                                <TableCell className="py-1.5 text-xs">{item.product?.unit || '-'}</TableCell>
                                                <TableCell className="py-1.5 text-xs text-right font-medium">{item.quantity}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    )}
                                    {whExpanded && ws.items.length === 0 && (
                                      <div className="text-xs text-muted-foreground py-2" style={{ paddingLeft: `${(depth + 2) * 24 + 32}px` }}>
                                        暂无库存
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    /* 无组织数据时直接列出仓库 */
                    warehouseSummaries.map(ws => {
                      const whKey = `wh-${ws.warehouseId}`;
                      const whExpanded = expandedNodes.has(whKey);
                      return (
                        <div key={whKey}>
                          <div
                            className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => toggleNode(whKey)}
                          >
                            {whExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                            <Warehouse className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="font-medium text-sm">{ws.warehouseName}</span>
                            <span className="text-xs text-muted-foreground">({ws.warehouseCode})</span>
                            <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{ws.totalProducts} 种商品</span>
                              <Badge variant="secondary" className="text-xs">库存 {ws.totalQuantity}</Badge>
                            </div>
                          </div>
                          {whExpanded && ws.items.length > 0 && (
                            <div className="ml-8">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-8 text-xs">商品编码</TableHead>
                                    <TableHead className="h-8 text-xs">商品名称</TableHead>
                                    <TableHead className="h-8 text-xs">单位</TableHead>
                                    <TableHead className="h-8 text-xs text-right">数量</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {ws.items.map(item => (
                                    <TableRow key={item.id} className="hover:bg-muted/30">
                                      <TableCell className="py-1.5 text-xs font-mono">{item.product?.code || '-'}</TableCell>
                                      <TableCell className="py-1.5 text-xs">{item.product?.name || '-'}</TableCell>
                                      <TableCell className="py-1.5 text-xs">{item.product?.unit || '-'}</TableCell>
                                      <TableCell className="py-1.5 text-xs text-right font-medium">{item.quantity}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                          {whExpanded && ws.items.length === 0 && (
                            <div className="text-xs text-muted-foreground py-2 pl-12">暂无库存</div>
                          )}
                        </div>
                      );
                    })
                  )}
                  {/* 未分配单位的仓库 */}
                  {orgTree.length > 0 && (() => {
                    const unassigned = warehouseSummaries.filter(ws => {
                      const wh = warehouses.find(w => w.id === ws.warehouseId);
                      return !wh?.organization_id;
                    });
                    if (unassigned.length === 0) return null;
                    const uaKey = 'org-unassigned';
                    const uaExpanded = expandedNodes.has(uaKey);
                    return (
                      <div>
                        <div
                          className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => toggleNode(uaKey)}
                        >
                          {uaExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="font-medium text-sm text-muted-foreground">未分配单位</span>
                          <Badge variant="outline" className="ml-auto text-xs">{unassigned.length} 个仓库</Badge>
                        </div>
                        {uaExpanded && unassigned.map(ws => {
                          const whKey = `wh-${ws.warehouseId}`;
                          const whExpanded = expandedNodes.has(whKey);
                          return (
                            <div key={whKey}>
                              <div
                                className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                style={{ paddingLeft: '32px' }}
                                onClick={() => toggleNode(whKey)}
                              >
                                {whExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                <Warehouse className="h-4 w-4 text-green-500 shrink-0" />
                                <span className="text-sm">{ws.warehouseName}</span>
                                <span className="text-xs text-muted-foreground">({ws.warehouseCode})</span>
                                <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{ws.totalProducts} 种商品</span>
                                  <Badge variant="secondary" className="text-xs">库存 {ws.totalQuantity}</Badge>
                                </div>
                              </div>
                              {whExpanded && ws.items.length > 0 && (
                                <div className="ml-8" style={{ paddingLeft: '56px' }}>
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-8 text-xs">商品编码</TableHead>
                                        <TableHead className="h-8 text-xs">商品名称</TableHead>
                                        <TableHead className="h-8 text-xs">单位</TableHead>
                                        <TableHead className="h-8 text-xs text-right">数量</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {ws.items.map(item => (
                                        <TableRow key={item.id} className="hover:bg-muted/30">
                                          <TableCell className="py-1.5 text-xs font-mono">{item.product?.code || '-'}</TableCell>
                                          <TableCell className="py-1.5 text-xs">{item.product?.name || '-'}</TableCell>
                                          <TableCell className="py-1.5 text-xs">{item.product?.unit || '-'}</TableCell>
                                          <TableCell className="py-1.5 text-xs text-right font-medium">{item.quantity}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                              {whExpanded && ws.items.length === 0 && (
                                <div className="text-xs text-muted-foreground py-2" style={{ paddingLeft: '80px' }}>暂无库存</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  {warehouseSummaries.length === 0 && orgTree.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">暂无数据</div>
                  )}
                </div>
              ) : (
                /* ===== 商品维度树 ===== */
                <div className="space-y-1">
                  {Object.entries(categoryStats).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">暂无商品数据</div>
                  ) : (
                    Object.entries(categoryStats)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([cat, data]) => {
                        const catKey = `cat-${cat}`;
                        const catExpanded = expandedNodes.has(catKey);
                        const catProducts = products.filter(p => (p.category || '未分类') === cat);
                        const catTotalQty = catProducts.reduce((sum, p) => {
                          const items = productInventoryMap[p.id] || [];
                          return sum + items.reduce((s, i) => s + i.quantity, 0);
                        }, 0);
                        return (
                          <div key={catKey}>
                            {/* 分类节点 */}
                            <div
                              className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => toggleNode(catKey)}
                            >
                              {catExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                              <FolderTree className="h-4 w-4 text-violet-500 shrink-0" />
                              <span className="font-medium text-sm">{cat}</span>
                              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{data.count} 种商品</span>
                                <Badge variant="secondary" className="text-xs">库存 {catTotalQty}</Badge>
                              </div>
                            </div>
                            {catExpanded && (
                              <div className="ml-4">
                                {catProducts.map(p => {
                                  const prodKey = `prod-${p.id}`;
                                  const prodExpanded = expandedNodes.has(prodKey);
                                  const invItems = productInventoryMap[p.id] || [];
                                  const totalQty = invItems.reduce((s, i) => s + i.quantity, 0);
                                  return (
                                    <div key={prodKey}>
                                      {/* 商品节点 */}
                                      <div
                                        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors ml-4"
                                        onClick={() => toggleNode(prodKey)}
                                      >
                                        {invItems.length > 0 ? (
                                          prodExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        ) : (
                                          <span className="w-3.5" />
                                        )}
                                        <Package className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                        <span className="text-sm">{p.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">({p.code})</span>
                                        <div className="ml-auto flex items-center gap-2 text-xs">
                                          <span className="text-muted-foreground">{p.unit}</span>
                                          {totalQty > 0 ? (
                                            <Badge variant="outline" className="text-xs">库存 {totalQty}</Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs text-muted-foreground">无库存</Badge>
                                          )}
                                        </div>
                                      </div>
                                      {/* 仓库分布 */}
                                      {prodExpanded && invItems.length > 0 && (
                                        <div className="ml-16">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="hover:bg-transparent">
                                                <TableHead className="h-8 text-xs">仓库名称</TableHead>
                                                <TableHead className="h-8 text-xs">仓库编码</TableHead>
                                                <TableHead className="h-8 text-xs text-right">库存数量</TableHead>
                                                <TableHead className="h-8 text-xs text-right">占比</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {invItems.map(inv => (
                                                <TableRow key={inv.id} className="hover:bg-muted/30">
                                                  <TableCell className="py-1.5 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                      <Warehouse className="h-3 w-3 text-green-500" />
                                                      {inv.warehouse?.name || '未知仓库'}
                                                    </div>
                                                  </TableCell>
                                                  <TableCell className="py-1.5 text-xs font-mono">{inv.warehouse?.code || '-'}</TableCell>
                                                  <TableCell className="py-1.5 text-xs text-right font-medium">{inv.quantity}</TableCell>
                                                  <TableCell className="py-1.5 text-xs text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalQty > 0 ? (inv.quantity / totalQty) * 100 : 0}%` }} />
                                                      </div>
                                                      <span>{totalQty > 0 ? ((inv.quantity / totalQty) * 100).toFixed(0) : 0}%</span>
                                                    </div>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 业务单据 Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-4 gap-4 flex-1 max-w-2xl">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">本月入库</p>
                  <p className="text-xl font-bold text-cyan-600">{monthInbound}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">本月出库</p>
                  <p className="text-xl font-bold text-rose-600">{monthOutbound}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">调拨单</p>
                  <p className="text-xl font-bold text-violet-600">{transferOrders.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground">待审核</p>
                  <p className="text-xl font-bold text-amber-600">{pendingTotal}</p>
                </CardContent>
              </Card>
            </div>
            <Button variant="outline" onClick={handleExportOrders}>
              <Download className="mr-2 h-4 w-4" />
              导出单据报表
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近业务单据</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>单号</TableHead>
                    <TableHead>仓库</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建人</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const all = [
                      ...inboundOrders.map(o => ({ ...o, _type: '入库', _warehouse: warehouseMap[o.warehouse_id] || '-' })),
                      ...outboundOrders.map(o => ({ ...o, _type: '出库', _warehouse: warehouseMap[o.warehouse_id] || '-' })),
                      ...transferOrders.map(o => ({ ...o, _type: '调拨', _warehouse: `${warehouseMap[o.from_warehouse_id] || ''} → ${warehouseMap[o.to_warehouse_id] || ''}` })),
                    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

                    if (all.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">暂无单据</TableCell>
                        </TableRow>
                      );
                    }

                    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
                      pending: { label: '待审核', variant: 'outline' },
                      approved: { label: '已审核', variant: 'default' },
                      rejected: { label: '已拒绝', variant: 'destructive' },
                      completed: { label: '已完成', variant: 'default' },
                      in_progress: { label: '进行中', variant: 'secondary' },
                      in_transit: { label: '运输中', variant: 'secondary' },
                    };

                    return all.map((o, i) => {
                      const s = statusMap[o.status] || { label: o.status, variant: 'outline' as const };
                      return (
                        <TableRow key={`${o._type}-${o.id}-${i}`}>
                          <TableCell>
                            <Badge variant={o._type === '入库' ? 'default' : o._type === '出库' ? 'destructive' : 'secondary'}>
                              {o._type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{o.order_no}</TableCell>
                          <TableCell>{o._warehouse}</TableCell>
                          <TableCell>
                            <Badge variant={s.variant}>{s.label}</Badge>
                          </TableCell>
                          <TableCell>{o.created_by || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(o.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 商品分类 Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">商品分类统计</CardTitle>
              <CardDescription>按类别汇总商品数量和采购价值</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类别</TableHead>
                    <TableHead className="text-right">商品数量</TableHead>
                    <TableHead className="text-right">采购价值合计</TableHead>
                    <TableHead className="text-right">占比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(categoryStats).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">暂无数据</TableCell>
                    </TableRow>
                  ) : Object.entries(categoryStats)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([cat, data]) => (
                      <TableRow key={cat}>
                        <TableCell className="font-medium">{cat}</TableCell>
                        <TableCell className="text-right">{data.count}</TableCell>
                        <TableCell className="text-right">¥{data.totalValue.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(data.count / products.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {((data.count / products.length) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 低库存预警 Tab */}
        <TabsContent value="lowstock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                低库存预警商品
              </CardTitle>
              <CardDescription>库存数量低于阈值（10）的商品列表</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品编码</TableHead>
                    <TableHead>商品名称</TableHead>
                    <TableHead>所在仓库</TableHead>
                    <TableHead className="text-right">当前库存</TableHead>
                    <TableHead className="text-right">最低库存</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">暂无低库存预警</TableCell>
                    </TableRow>
                  ) : lowStockItems.map(item => {
                    const minStock = (item.product as any)?.min_stock || 10;
                    const ratio = item.quantity / minStock;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product?.code || '-'}</TableCell>
                        <TableCell>{item.product?.name || '-'}</TableCell>
                        <TableCell>{item.warehouse?.name || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-amber-600">{item.quantity}</TableCell>
                        <TableCell className="text-right">{minStock}</TableCell>
                        <TableCell>
                          <Badge variant={ratio < 0.3 ? 'destructive' : 'outline'} className="text-xs">
                            {ratio < 0.3 ? '紧急' : '偏低'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
