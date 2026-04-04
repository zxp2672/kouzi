'use client';

import { useEffect, useState } from 'react';
import { Search, Check, X, Eye, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface ApprovalItem {
  id: number;
  type: 'inbound' | 'outbound' | 'stock_count' | 'transfer';
  order_no: string;
  warehouse_name: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  status: string;
  created_by: string;
  created_at: string;
  remark?: string;
  supplier?: string;
  customer?: string;
}

interface ApprovalDetail {
  id: number;
  type: 'inbound' | 'outbound' | 'stock_count' | 'transfer';
  order_no: string;
  warehouse_name: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  status: string;
  created_by: string;
  created_at: string;
  remark?: string;
  supplier?: string;
  customer?: string;
  items: Array<{
    id?: number;
    product_id: number;
    products?: {
      code: string;
      name: string;
    };
    quantity: number;
    system_quantity?: number;
    difference?: number;
  }>;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalDetail | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, [activeTab]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const client = getSupabaseClient();
      const statusFilter = activeTab === 'pending' ? 'pending' : activeTab;

      // 获取入库单
      const { data: inboundData } = await client
        .from('inbound_orders')
        .select('*, warehouses(*)')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      // 获取出库单
      const { data: outboundData } = await client
        .from('outbound_orders')
        .select('*, warehouses(*)')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      // 获取盘点单
      const { data: stockCountData } = await client
        .from('stock_counts')
        .select('*, warehouses(*)')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      // 获取调拨单
      const { data: transferData } = await client
        .from('transfer_orders')
        .select('*, from_warehouse:warehouses!transfer_orders_from_warehouse_id_fkey(*), to_warehouse:warehouses!transfer_orders_to_warehouse_id_fkey(*)')
        .eq('status', statusFilter)
        .order('created_at', { ascending: false });

      const allApprovals: ApprovalItem[] = [
        ...(inboundData || []).map((item: any) => ({
          id: item.id,
          type: 'inbound' as const,
          order_no: item.order_no,
          warehouse_name: item.warehouses?.name || '',
          status: item.status,
          created_by: item.created_by,
          created_at: item.created_at,
          remark: item.remark,
          supplier: item.supplier,
        })),
        ...(outboundData || []).map((item: any) => ({
          id: item.id,
          type: 'outbound' as const,
          order_no: item.order_no,
          warehouse_name: item.warehouses?.name || '',
          status: item.status,
          created_by: item.created_by,
          created_at: item.created_at,
          remark: item.remark,
          customer: item.customer,
        })),
        ...(stockCountData || []).map((item: any) => ({
          id: item.id,
          type: 'stock_count' as const,
          order_no: item.order_no,
          warehouse_name: item.warehouses?.name || '',
          status: item.status,
          created_by: item.created_by,
          created_at: item.created_at,
          remark: item.remark,
        })),
        ...(transferData || []).map((item: any) => ({
          id: item.id,
          type: 'transfer' as const,
          order_no: item.order_no,
          from_warehouse_name: item.from_warehouse?.name || '',
          to_warehouse_name: item.to_warehouse?.name || '',
          warehouse_name: `${item.from_warehouse?.name || ''} → ${item.to_warehouse?.name || ''}`,
          status: item.status,
          created_by: item.created_by,
          created_at: item.created_at,
          remark: item.remark,
        })),
      ];

      // 过滤搜索
      const filteredApprovals = searchQuery
        ? allApprovals.filter((item) =>
            item.order_no.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : allApprovals;

      setApprovals(filteredApprovals);
    } catch (error) {
      console.error('获取待审核列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalDetail = async (item: ApprovalItem) => {
    try {
      const client = getSupabaseClient();
      let items: any[] = [];

      // 根据类型获取明细
      if (item.type === 'inbound') {
        const { data } = await client
          .from('inbound_items')
          .select('*, products(*)')
          .eq('order_id', item.id);
        items = data || [];
      } else if (item.type === 'outbound') {
        const { data } = await client
          .from('outbound_items')
          .select('*, products(*)')
          .eq('order_id', item.id);
        items = data || [];
      } else if (item.type === 'stock_count') {
        const { data } = await client
          .from('stock_count_items')
          .select('*, products(*)')
          .eq('order_id', item.id);
        items = data || [];
      } else if (item.type === 'transfer') {
        const { data } = await client
          .from('transfer_items')
          .select('*, products(*)')
          .eq('order_id', item.id);
        items = data || [];
      }

      setSelectedApproval({
        ...item,
        items,
      });
      setDetailDialogOpen(true);
    } catch (error) {
      console.error('获取审核详情失败:', error);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    try {
      const client = getSupabaseClient();

      if (item.type === 'inbound') {
        // 获取入库单明细
        const { data: itemsData } = await client
          .from('inbound_items')
          .select('*')
          .eq('order_id', item.id);

        // 更新库存
        for (const detail of itemsData || []) {
          const { data: existingInventory } = await client
            .from('inventory')
            .select('*')
            .eq('warehouse_id', (item as any).warehouse_id)
            .eq('product_id', detail.product_id)
            .maybeSingle();

          if (existingInventory) {
            await client
              .from('inventory')
              .update({
                quantity: existingInventory.quantity + detail.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingInventory.id);
          } else {
            await client.from('inventory').insert({
              warehouse_id: (item as any).warehouse_id,
              product_id: detail.product_id,
              quantity: detail.quantity,
            });
          }
        }

        // 更新入库单状态
        await client
          .from('inbound_orders')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: '系统用户',
          })
          .eq('id', item.id);
      } else if (item.type === 'outbound') {
        // 获取出库单明细
        const { data: itemsData } = await client
          .from('outbound_items')
          .select('*')
          .eq('order_id', item.id);

        // 更新库存
        for (const detail of itemsData || []) {
          const { data: existingInventory } = await client
            .from('inventory')
            .select('*')
            .eq('warehouse_id', (item as any).warehouse_id)
            .eq('product_id', detail.product_id)
            .maybeSingle();

          if (!existingInventory || existingInventory.quantity < detail.quantity) {
            throw new Error('库存不足');
          }

          await client
            .from('inventory')
            .update({
              quantity: existingInventory.quantity - detail.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInventory.id);
        }

        // 更新出库单状态
        await client
          .from('outbound_orders')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: '系统用户',
          })
          .eq('id', item.id);
      } else if (item.type === 'stock_count') {
        // 获取盘点单明细
        const { data: itemsData } = await client
          .from('stock_count_items')
          .select('*')
          .eq('order_id', item.id);

        // 更新库存
        for (const detail of itemsData || []) {
          const { data: existingInventory } = await client
            .from('inventory')
            .select('*')
            .eq('warehouse_id', (item as any).warehouse_id)
            .eq('product_id', detail.product_id)
            .maybeSingle();

          if (existingInventory) {
            await client
              .from('inventory')
              .update({
                quantity: detail.actual_quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingInventory.id);
          }
        }

        // 更新盘点单状态
        await client
          .from('stock_counts')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: '系统用户',
          })
          .eq('id', item.id);
      } else if (item.type === 'transfer') {
        // 获取调拨单明细
        const { data: itemsData } = await client
          .from('transfer_items')
          .select('*')
          .eq('order_id', item.id);

        // 更新库存
        for (const detail of itemsData || []) {
          // 减少调出仓库库存
          const { data: fromInventory } = await client
            .from('inventory')
            .select('*')
            .eq('warehouse_id', (item as any).from_warehouse_id)
            .eq('product_id', detail.product_id)
            .maybeSingle();

          if (!fromInventory || fromInventory.quantity < detail.quantity) {
            throw new Error('库存不足');
          }

          await client
            .from('inventory')
            .update({
              quantity: fromInventory.quantity - detail.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', fromInventory.id);

          // 增加调入仓库库存
          const { data: toInventory } = await client
            .from('inventory')
            .select('*')
            .eq('warehouse_id', (item as any).to_warehouse_id)
            .eq('product_id', detail.product_id)
            .maybeSingle();

          if (toInventory) {
            await client
              .from('inventory')
              .update({
                quantity: toInventory.quantity + detail.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq('id', toInventory.id);
          } else {
            await client.from('inventory').insert({
              warehouse_id: (item as any).to_warehouse_id,
              product_id: detail.product_id,
              quantity: detail.quantity,
            });
          }
        }

        // 更新调拨单状态
        await client
          .from('transfer_orders')
          .update({
            status: 'completed',
            approved_at: new Date().toISOString(),
            approved_by: '系统用户',
            completed_at: new Date().toISOString(),
            completed_by: '系统用户',
          })
          .eq('id', item.id);
      }

      setDetailDialogOpen(false);
      fetchApprovals();
    } catch (error) {
      console.error('审核失败:', error);
      alert('审核失败，请重试');
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      const client = getSupabaseClient();
      const tableMap = {
        inbound: 'inbound_orders',
        outbound: 'outbound_orders',
        stock_count: 'stock_counts',
        transfer: 'transfer_orders',
      };

      await client
        .from(tableMap[item.type])
        .update({
          status: 'rejected',
          approved_by: '系统用户',
        })
        .eq('id', item.id);

      setDetailDialogOpen(false);
      fetchApprovals();
    } catch (error) {
      console.error('拒绝失败:', error);
      alert('操作失败，请重试');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound':
        return <ArrowDownToLine className="h-4 w-4 text-green-500" />;
      case 'outbound':
        return <ArrowUpFromLine className="h-4 w-4 text-red-500" />;
      case 'stock_count':
        return <ClipboardCheck className="h-4 w-4 text-blue-500" />;
      case 'transfer':
        return <ArrowLeftRight className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      inbound: '入库单',
      outbound: '出库单',
      stock_count: '盘点单',
      transfer: '调拨单',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: '待审核', variant: 'secondary' },
      approved: { label: '已审核', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
      completed: { label: '已完成', variant: 'default' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">审核中心</h1>
          <p className="text-muted-foreground mt-2">统一审核各类业务单据</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索单号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 审核列表 */}
      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">待审核</TabsTrigger>
          <TabsTrigger value="approved">已审核</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>单号</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>供应商/客户</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.order_no}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>{item.supplier || item.customer || '-'}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fetchApprovalDetail(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(item)}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(item)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>单号</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.order_no}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchApprovalDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>单号</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.order_no}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchApprovalDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>单号</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.order_no}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fetchApprovalDetail(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* 详情对话框 */}
      {selectedApproval && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedApproval.type)}
                  {getTypeLabel(selectedApproval.type)}详情
                </div>
              </DialogTitle>
              <DialogDescription>
                单号: {selectedApproval.order_no}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">仓库</p>
                  <p className="font-medium">{selectedApproval.warehouse_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  <p>{getStatusBadge(selectedApproval.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">创建人</p>
                  <p className="font-medium">{selectedApproval.created_by}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">创建时间</p>
                  <p className="font-medium">
                    {new Date(selectedApproval.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              {selectedApproval.remark && (
                <div>
                  <p className="text-sm text-muted-foreground">备注</p>
                  <p className="font-medium">{selectedApproval.remark}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">明细</p>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品编码</TableHead>
                        <TableHead>商品名称</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        {selectedApproval.type === 'stock_count' && (
                          <>
                            <TableHead className="text-right">系统库存</TableHead>
                            <TableHead className="text-right">差异</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedApproval.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.products?.code || '-'}</TableCell>
                          <TableCell>{item.products?.name || '-'}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          {selectedApproval.type === 'stock_count' && (
                            <>
                              <TableCell className="text-right">{item.system_quantity}</TableCell>
                              <TableCell
                                className={`text-right font-medium ${
                                  (item.difference || 0) > 0
                                    ? 'text-green-600'
                                    : (item.difference || 0) < 0
                                    ? 'text-red-600'
                                    : ''
                                }`}
                              >
                                {(item.difference || 0) > 0
                                  ? `+${item.difference}`
                                  : item.difference || 0}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                关闭
              </Button>
              {selectedApproval.status === 'pending' && (
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => handleReject(selectedApproval)}>
                    <X className="mr-2 h-4 w-4" />
                    拒绝
                  </Button>
                  <Button onClick={() => handleApprove(selectedApproval)}>
                    <Check className="mr-2 h-4 w-4" />
                    审核通过
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
