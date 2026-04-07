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
import { fetchTransferOrders, createTransferOrder, approveTransferOrder, generateOrderNo } from '@/services/transfer-service';
import { fetchWarehouses } from '@/services/warehouse-service';
import { fetchProducts } from '@/services/product-service';

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

interface TransferItem {
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  remark: string;
}

interface TransferOrder {
  id: number;
  order_no: string;
  from_warehouse_id: number;
  from_warehouse_name: string;
  to_warehouse_id: number;
  to_warehouse_name: string;
  status: string;
  remark: string;
  created_by: string;
  created_at: string;
  items?: TransferItem[];
  approved_at?: string;
  approved_by?: string;
}

export default function TransferPage() {
  const [orders, setOrders] = useState<TransferOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemRemark, setItemRemark] = useState('');

  useEffect(() => {
    fetchOrdersData();
    fetchWarehousesData();
    fetchProductsData();
  }, []);

  const fetchOrdersData = async () => {
    try {
      const data = await fetchTransferOrders();
      setOrders(data as unknown as TransferOrder[]);
    } catch (error) {
      console.error('获取调拨单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehousesData = async () => {
    try {
      const data = await fetchWarehouses();
      setWarehouses(data.map(w => ({ id: w.id, code: w.code, name: w.name })));
    } catch (error) {
      console.error('获取仓库列表失败:', error);
    }
  };

  const fetchProductsData = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data.map(p => ({ id: p.id, code: p.code, name: p.name, unit: p.unit })));
    } catch (error) {
      console.error('获取商品列表失败:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrdersData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDialog = () => {
    const newOrderNo = generateOrderNo();
    setOrderNo(newOrderNo);
    setFromWarehouse('');
    setToWarehouse('');
    setRemark('');
    setItems([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setItems([]);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !itemQuantity) {
      alert('请选择商品并输入数量');
      return;
    }

    const product = products.find((p) => p.id === parseInt(selectedProduct));
    if (!product) return;

    const newItem: TransferItem = {
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      quantity: parseInt(itemQuantity),
      remark: itemRemark,
    };

    setItems([...items, newItem]);
    setSelectedProduct('');
    setItemQuantity('');
    setItemRemark('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!fromWarehouse || !toWarehouse || items.length === 0) {
      alert('请选择调出/调入仓库并添加商品');
      return;
    }

    if (fromWarehouse === toWarehouse) {
      alert('调出和调入仓库不能相同');
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      await createTransferOrder(
        {
          order_no: orderNo,
          from_warehouse_id: parseInt(fromWarehouse),
          to_warehouse_id: parseInt(toWarehouse),
          status: 'pending',
          remark: remark || '',
          created_by: currentUser.name || '系统用户',
        },
        items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          remark: item.remark,
        }))
      );

      await fetchOrdersData();
      handleCloseDialog();
    } catch (error) {
      console.error('保存调拨单失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleApprove = async (order: TransferOrder) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await approveTransferOrder(order.id, currentUser.name || '系统用户', 'approved');
      await fetchOrdersData();
    } catch (error) {
      console.error('审核调拨单失败:', error);
      alert('审核失败，请重试');
    }
  };

  const handleReject = async (order: TransferOrder) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await approveTransferOrder(order.id, currentUser.name || '系统用户', 'rejected');
      await fetchOrdersData();
    } catch (error) {
      console.error('拒绝调拨单失败:', error);
      alert('操作失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
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

  const filteredOrders = orders.filter((order) =>
    !searchQuery ||
    order.order_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">商品调拨</h1>
          <p className="text-muted-foreground mt-2">管理仓库间商品调拨</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新建调拨单
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

      {/* 调拨单列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>单号</TableHead>
              <TableHead>调出仓库</TableHead>
              <TableHead>调入仓库</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建人</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_no}</TableCell>
                  <TableCell>{order.from_warehouse_name}</TableCell>
                  <TableCell>{order.to_warehouse_name}</TableCell>
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

      {/* 新建调拨单对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建调拨单</DialogTitle>
            <DialogDescription>填写调拨单信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNo">单号</Label>
                <Input id="orderNo" value={orderNo} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromWarehouse">调出仓库 *</Label>
                <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
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
                <Label htmlFor="toWarehouse">调入仓库 *</Label>
                <Select value={toWarehouse} onValueChange={setToWarehouse}>
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
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            {/* 调拨商品 */}
            {fromWarehouse && toWarehouse && (
              <div className="space-y-2">
                <Label>调拨商品</Label>
                <div className="rounded-md border p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>商品</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择商品" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.code} - {product.name}
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
                      <Label>备注</Label>
                      <Input
                        value={itemRemark}
                        onChange={(e) => setItemRemark(e.target.value)}
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
                      <TableHead>备注</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_code}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.remark || '-'}</TableCell>
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
