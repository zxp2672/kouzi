'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Check, X } from 'lucide-react';
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

interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface InventoryItem {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  available_quantity: number;
}

interface OutboundItem {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  price: string;
}

interface OutboundOrder {
  id: number;
  order_no: string;
  warehouse_id: number;
  warehouse_name: string;
  customer: string;
  type: string;
  status: string;
  remark: string;
  created_by: string;
  created_at: string;
}

export default function OutboundPage() {
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [customer, setCustomer] = useState('');
  const [outboundType, setOutboundType] = useState('sales');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<OutboundItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const client = getSupabaseClient();
      let query = client
        .from('outbound_orders')
        .select('*, warehouses(*)')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`order_no.ilike.%${searchQuery}%,customer.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(
        data?.map((order: {
          id: number;
          order_no: string;
          warehouse_id: number;
          warehouses?: { name: string };
          customer: string;
          type: string;
          status: string;
          remark: string;
          created_by: string;
          created_at: string;
        }) => ({
          ...order,
          warehouse_name: order.warehouses?.name || '',
        })) || []
      );
    } catch (error) {
      console.error('获取出库单列表失败:', error);
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
      setProducts(data || []);
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

      setInventory(
        data?.map((item: any) => ({
          product_id: item.product_id,
          product_code: item.products?.code || '',
          product_name: item.products?.name || '',
          quantity: item.quantity || 0,
          available_quantity: (item.quantity || 0) - (item.locked_quantity || 0),
        })) || []
      );
    } catch (error) {
      console.error('获取库存信息失败:', error);
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
    setItems([]);
    if (value) {
      fetchInventory(value);
    }
  };

  const handleOpenDialog = () => {
    const newOrderNo = `OUT${Date.now()}`;
    setOrderNo(newOrderNo);
    setSelectedWarehouse('');
    setCustomer('');
    setOutboundType('sales');
    setRemark('');
    setItems([]);
    setInventory([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setItems([]);
    setInventory([]);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !itemQuantity) {
      alert('请选择商品并输入数量');
      return;
    }

    const inventoryItem = inventory.find((i) => i.product_id === parseInt(selectedProduct));
    if (!inventoryItem) {
      alert('该商品在当前仓库无库存');
      return;
    }

    const quantity = parseInt(itemQuantity);
    if (quantity > inventoryItem.available_quantity) {
      alert(`库存不足，可用库存: ${inventoryItem.available_quantity}`);
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProduct));
    if (!product) return;

    const newItem: OutboundItem = {
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      quantity,
      price: itemPrice,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setItemQuantity('');
    setItemPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedWarehouse || items.length === 0) {
      alert('请选择仓库并添加出库商品');
      return;
    }

    try {
      const client = getSupabaseClient();

      // 创建出库单
      const { data: orderData, error: orderError } = await client
        .from('outbound_orders')
        .insert({
          order_no: orderNo,
          warehouse_id: parseInt(selectedWarehouse),
          customer: customer || null,
          type: outboundType,
          status: 'pending',
          remark: remark || null,
          created_by: '系统用户',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 创建出库单明细
      const itemsToInsert = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price ? parseFloat(item.price) : null,
      }));

      const { error: itemsError } = await client
        .from('outbound_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      handleCloseDialog();
      fetchOrders();
    } catch (error) {
      console.error('保存出库单失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleApprove = async (order: OutboundOrder) => {
    try {
      const client = getSupabaseClient();

      // 获取出库单明细
      const { data: itemsData, error: itemsError } = await client
        .from('outbound_items')
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

        if (!existingInventory) {
          throw new Error('库存记录不存在');
        }

        if (existingInventory.quantity < item.quantity) {
          throw new Error('库存不足');
        }

        await client
          .from('inventory')
          .update({
            quantity: existingInventory.quantity - item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingInventory.id);
      }

      // 更新出库单状态
      const { error } = await client
        .from('outbound_orders')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: '系统用户',
        })
        .eq('id', order.id);

      if (error) throw error;

      fetchOrders();
    } catch (error) {
      console.error('审核出库单失败:', error);
      alert('审核失败，请重试');
    }
  };

  const handleReject = async (order: OutboundOrder) => {
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('outbound_orders')
        .update({
          status: 'rejected',
          approved_by: '系统用户',
        })
        .eq('id', order.id);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('拒绝出库单失败:', error);
      alert('操作失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: '待审核', variant: 'secondary' },
      approved: { label: '已审核', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      sales: '销售出库',
      return: '退货出库',
      transfer: '调拨出库',
      other: '其他出库',
    };
    return typeMap[type] || type;
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
          <h1 className="text-3xl font-bold tracking-tight">出库管理</h1>
          <p className="text-muted-foreground mt-2">管理商品出库业务</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新建出库单
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索单号或客户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 出库单列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>单号</TableHead>
              <TableHead>仓库</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_no}</TableCell>
                  <TableCell>{order.warehouse_name}</TableCell>
                  <TableCell>{order.customer || '-'}</TableCell>
                  <TableCell>{getTypeLabel(order.type)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.created_by}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'pending' && (
                      <div className="flex justify-end gap-2">
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
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 新建出库单对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建出库单</DialogTitle>
            <DialogDescription>填写出库单信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNo">单号</Label>
                <Input id="orderNo" value={orderNo} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">仓库 *</Label>
                <Select value={selectedWarehouse} onValueChange={handleWarehouseChange}>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">客户</Label>
                <Input
                  id="customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">出库类型</Label>
                <Select value={outboundType} onValueChange={setOutboundType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">销售出库</SelectItem>
                    <SelectItem value="return">退货出库</SelectItem>
                    <SelectItem value="transfer">调拨出库</SelectItem>
                    <SelectItem value="other">其他出库</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* 出库商品 */}
            {selectedWarehouse && (
              <div className="space-y-2">
                <Label>出库商品</Label>
                <div className="rounded-md border p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>商品</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择商品" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((item) => (
                            <SelectItem key={item.product_id} value={item.product_id.toString()}>
                              {item.product_code} - {item.product_name} (可用: {item.available_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>数量</Label>
                      <Input
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>单价</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    添加商品
                  </Button>
                </div>
              </div>
            )}

            {/* 商品列表 */}
            {items.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品编码</TableHead>
                      <TableHead>商品名称</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>单价</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_code}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>¥{item.price || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={items.length === 0}>
              保存并提交审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
