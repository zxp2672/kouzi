'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Check, X, ClipboardCheck } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Warehouse {
  id: number;
  code: string;
  name: string;
}

interface StockCountItem {
  product_id: number;
  product_code: string;
  product_name: string;
  system_quantity: number;
  actual_quantity: string;
  difference: number;
  remark: string;
}

interface StockCountOrder {
  id: number;
  order_no: string;
  warehouse_id: number;
  warehouse_name: string;
  status: string;
  count_date: string;
  remark: string;
  created_by: string;
  created_at: string;
}

export default function StockCountPage() {
  const [orders, setOrders] = useState<StockCountOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<StockCountItem[]>([]);
  const [editingOrder, setEditingOrder] = useState<StockCountOrder | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const client = getSupabaseClient();
      let query = client
        .from('stock_counts')
        .select('*, warehouses(*)')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`order_no.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(
        data?.map((order: {
          id: number;
          order_no: string;
          warehouse_id: number;
          warehouses?: { name: string };
          status: string;
          count_date: string;
          remark: string;
          created_by: string;
          created_at: string;
        }) => ({
          ...order,
          warehouse_name: order.warehouses?.name || '',
        })) || []
      );
    } catch (error) {
      console.error('获取盘点单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('warehouses')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('获取仓库列表失败:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      // setProducts(data || []);
    } catch (error) {
      console.error('获取商品列表失败:', error);
    }
  };

  const fetchInventory = async (warehouseId: string) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('inventory')
        .select('*, products(*)')
        .eq('warehouse_id', parseInt(warehouseId));

      if (error) throw error;

      const inventoryItems = data?.map((item: any) => ({
        product_id: item.product_id,
        product_code: item.products?.code || '',
        product_name: item.products?.name || '',
        quantity: item.quantity || 0,
      })) || [];

      // setInventory(inventoryItems);

      // 初始化盘点明细
      setItems(
        inventoryItems.map((item) => ({
          product_id: item.product_id,
          product_code: item.product_code,
          product_name: item.product_name,
          system_quantity: item.quantity,
          actual_quantity: item.quantity.toString(),
          difference: 0,
          remark: '',
        }))
      );
    } catch (error) {
      console.error('获取库存信息失败:', error);
    }
  };

  const fetchStockCountItems = async (orderId: number) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('stock_count_items')
        .select('*, products(*)')
        .eq('order_id', orderId);

      if (error) throw error;

      return data?.map((item: any) => ({
        product_id: item.product_id,
        product_code: item.products?.code || '',
        product_name: item.products?.name || '',
        system_quantity: item.system_quantity,
        actual_quantity: item.actual_quantity.toString(),
        difference: item.difference || 0,
        remark: item.remark || '',
      })) || [];
    } catch (error) {
      console.error('获取盘点明细失败:', error);
      return [];
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleWarehouseChange = (value: string) => {
    setSelectedWarehouse(value);
    if (value && !editingOrder) {
      fetchInventory(value);
    }
  };

  const handleActualQuantityChange = (index: number, value: string) => {
    const newItems = [...items];
    const actualQuantity = parseInt(value) || 0;
    newItems[index].actual_quantity = value;
    newItems[index].difference = actualQuantity - newItems[index].system_quantity;
    setItems(newItems);
  };

  const handleRemarkChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].remark = value;
    setItems(newItems);
  };

  const handleOpenDialog = async (order?: StockCountOrder) => {
    if (order) {
      setEditingOrder(order);
      setOrderNo(order.order_no);
      setSelectedWarehouse(order.warehouse_id.toString());
      setCountDate(order.count_date.split('T')[0]);
      setRemark(order.remark || '');
      const countItems = await fetchStockCountItems(order.id);
      setItems(countItems);
    } else {
      const newOrderNo = `SC${Date.now()}`;
      setOrderNo(newOrderNo);
      setSelectedWarehouse('');
      setCountDate(new Date().toISOString().split('T')[0]);
      setRemark('');
      setItems([]);
      // setInventory([]);
      setEditingOrder(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setItems([]);
    // setInventory([]);
    setEditingOrder(null);
  };

  const handleSaveDraft = async () => {
    if (!selectedWarehouse) {
      alert('请选择仓库');
      return;
    }

    try {
      const client = getSupabaseClient();

      if (editingOrder) {
        // 更新盘点单
        const { error: orderError } = await client
          .from('stock_counts')
          .update({
            remark: remark || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingOrder.id);

        if (orderError) throw orderError;

        // 删除旧明细
        await client.from('stock_count_items').delete().eq('order_id', editingOrder.id);
      } else {
        // 创建盘点单
        const { data: orderData, error: orderError } = await client
          .from('stock_counts')
          .insert({
            order_no: orderNo,
            warehouse_id: parseInt(selectedWarehouse),
            status: 'draft',
            count_date: countDate,
            remark: remark || null,
            created_by: '系统用户',
          })
          .select()
          .single();

        if (orderError) throw orderError;
        setEditingOrder(orderData);
      }

      // 创建盘点单明细
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          order_id: editingOrder?.id || 0,
          product_id: item.product_id,
          system_quantity: item.system_quantity,
          actual_quantity: parseInt(item.actual_quantity) || 0,
          difference: parseInt(item.actual_quantity) || 0 - item.system_quantity,
          remark: item.remark || null,
        }));

        const { error: itemsError } = await client
          .from('stock_count_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      handleCloseDialog();
      fetchOrders();
    } catch (error) {
      console.error('保存盘点单失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleSubmit = async () => {
    if (!editingOrder) {
      await handleSaveDraft();
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('stock_counts')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingOrder!.id);

      if (error) throw error;

      handleCloseDialog();
      fetchOrders();
    } catch (error) {
      console.error('提交盘点单失败:', error);
      alert('提交失败，请重试');
    }
  };

  const handleApprove = async (order: StockCountOrder) => {
    try {
      const client = getSupabaseClient();

      // 获取盘点单明细
      const { data: itemsData, error: itemsError } = await client
        .from('stock_count_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      // 更新库存
      for (const item of itemsData || []) {
        const { data: existingInventory } = await client
          .from('inventory')
          .select('*')
          .eq('warehouse_id', order.warehouse_id)
          .eq('product_id', item.product_id)
          .maybeSingle();

        if (existingInventory) {
          await client
            .from('inventory')
            .update({
              quantity: item.actual_quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInventory.id);
        }
      }

      // 更新盘点单状态
      const { error } = await client
        .from('stock_counts')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: '系统用户',
        })
        .eq('id', order.id);

      if (error) throw error;

      fetchOrders();
    } catch (error) {
      console.error('审核盘点单失败:', error);
      alert('审核失败，请重试');
    }
  };

  const handleReject = async (order: StockCountOrder) => {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('stock_counts')
        .update({
          status: 'rejected',
          approved_by: '系统用户',
        })
        .eq('id', order.id);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('拒绝盘点单失败:', error);
      alert('操作失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      draft: { label: '草稿', variant: 'outline' },
      pending: { label: '待审核', variant: 'secondary' },
      approved: { label: '已审核', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
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
          <h1 className="text-3xl font-bold tracking-tight">库存盘点</h1>
          <p className="text-muted-foreground mt-2">管理库存盘点业务</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新建盘点单
        </Button>
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

      {/* 盘点单列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>单号</TableHead>
              <TableHead>仓库</TableHead>
              <TableHead>盘点日期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_no}</TableCell>
                  <TableCell>{order.warehouse_name}</TableCell>
                  <TableCell>{new Date(order.count_date).toLocaleDateString('zh-CN')}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.created_by}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(order)}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {order.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(order)}
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(order)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 新建/编辑盘点单对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? '编辑盘点单' : '新建盘点单'}</DialogTitle>
            <DialogDescription>
              {editingOrder ? '修改盘点信息' : '填写盘点单信息'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNo">单号</Label>
                <Input id="orderNo" value={orderNo} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">仓库 *</Label>
                <Select
                  value={selectedWarehouse}
                  onValueChange={handleWarehouseChange}
                  disabled={!!editingOrder}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择仓库" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id.toString()}>
                        {wh.code} - {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="countDate">盘点日期</Label>
                <Input
                  id="countDate"
                  type="date"
                  value={countDate}
                  onChange={(e) => setCountDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            {/* 盘点明细 */}
            {selectedWarehouse && items.length > 0 && (
              <div className="space-y-2">
                <Label>盘点明细</Label>
                <div className="rounded-md border max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>商品编码</TableHead>
                        <TableHead>商品名称</TableHead>
                        <TableHead className="text-right">系统库存</TableHead>
                        <TableHead className="text-right">实盘数量</TableHead>
                        <TableHead className="text-right">差异</TableHead>
                        <TableHead>备注</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.product_id}>
                          <TableCell>{item.product_code}</TableCell>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.system_quantity}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={item.actual_quantity}
                              onChange={(e) => handleActualQuantityChange(index, e.target.value)}
                              disabled={editingOrder?.status !== 'draft'}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              item.difference > 0
                                ? 'text-green-600'
                                : item.difference < 0
                                ? 'text-red-600'
                                : ''
                            }`}
                          >
                            {item.difference > 0 ? `+${item.difference}` : item.difference}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.remark}
                              onChange={(e) => handleRemarkChange(index, e.target.value)}
                              disabled={editingOrder?.status !== 'draft'}
                              placeholder="备注"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <div className="flex gap-2">
              {(!editingOrder || editingOrder.status === 'draft') && (
                <Button variant="outline" onClick={handleSaveDraft}>
                  保存草稿
                </Button>
              )}
              {(!editingOrder || editingOrder.status === 'draft') && (
                <Button onClick={handleSubmit}>
                  提交审核
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
