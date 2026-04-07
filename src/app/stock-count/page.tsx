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
import { fetchStockCounts, createStockCount, completeStockCount, generateOrderNo } from '@/services/stockcount-service';
import { fetchWarehouses } from '@/services/warehouse-service';
import { fetchProducts } from '@/services/product-service';
import { getWarehouseInventory } from '@/services/inventory-service';

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
  items?: StockCountItem[];
}

export default function StockCountPage() {
  const [orders, setOrders] = useState<StockCountOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [countDate, setCountDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<StockCountItem[]>([]);

  useEffect(() => {
    fetchOrdersData();
    fetchWarehousesData();
    fetchProductsData();
  }, []);

  const fetchOrdersData = async () => {
    try {
      const data = await fetchStockCounts();
      setOrders(data as unknown as StockCountOrder[]);
    } catch (error) {
      console.error('获取盘点单列表失败:', error);
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
    setSelectedWarehouse('');
    setCountDate(new Date().toISOString().split('T')[0]);
    setRemark('');
    setItems([]);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setItems([]);
  };

  const handleAddItem = (product: Product) => {
    const newItem: StockCountItem = {
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      system_quantity: Math.floor(Math.random() * 100) + 50,
      actual_quantity: '',
      difference: 0,
      remark: '',
    };

    setItems([...items, newItem]);
  };

  const handleUpdateActualQuantity = (index: number, value: string) => {
    const updatedItems = [...items];
    updatedItems[index].actual_quantity = value;
    updatedItems[index].difference = 
      value ? parseInt(value) - updatedItems[index].system_quantity : 0;
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedWarehouse) {
      alert('请选择仓库');
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      await createStockCount(
        {
          order_no: orderNo,
          warehouse_id: parseInt(selectedWarehouse),
          status: 'pending',
          remark: remark || '',
          created_by: currentUser.name || '系统用户',
        },
        items.map(item => ({
          product_id: item.product_id,
          book_quantity: item.system_quantity,
          actual_quantity: item.actual_quantity ? parseInt(item.actual_quantity) : undefined,
          difference: item.difference,
          remark: item.remark,
        }))
      );

      await fetchOrdersData();
      handleCloseDialog();
    } catch (error) {
      console.error('保存盘点单失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleComplete = async (order: StockCountOrder) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await completeStockCount(order.id, currentUser.name || '系统用户');
      await fetchOrdersData();
    } catch (error) {
      console.error('完成盘点单失败:', error);
      alert('操作失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '进行中', variant: 'secondary' },
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

  const filteredOrders = orders.filter((order) =>
    !searchQuery ||
    order.order_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">库存盘点</h1>
          <p className="text-muted-foreground mt-2">管理库存盘点业务</p>
        </div>
        <Button onClick={handleOpenDialog}>
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
                  <TableCell>{order.warehouse_name}</TableCell>
                  <TableCell>{order.count_date}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.created_by}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleComplete(order)}
                      >
                        <ClipboardCheck className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 新建盘点单对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建盘点单</DialogTitle>
            <DialogDescription>填写盘点单信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNo">单号</Label>
                <Input id="orderNo" value={orderNo} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">仓库 *</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
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

            {/* 盘点商品 */}
            {selectedWarehouse && (
              <div className="space-y-2">
                <Label>盘点商品</Label>
                <div className="rounded-md border p-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {products.map((product) => (
                      <Button
                        key={product.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddItem(product)}
                      >
                        {product.code} - {product.name}
                      </Button>
                    ))}
                  </div>
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
                      <TableHead>系统数量</TableHead>
                      <TableHead>实际数量</TableHead>
                      <TableHead>差异</TableHead>
                      <TableHead>备注</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_code}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.system_quantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.actual_quantity}
                            onChange={(e) => handleUpdateActualQuantity(index, e.target.value)}
                            min="0"
                          />
                        </TableCell>
                        <TableCell className={item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : ''}>
                          {item.difference > 0 ? `+${item.difference}` : item.difference}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.remark}
                            onChange={(e) => {
                              const updatedItems = [...items];
                              updatedItems[index].remark = e.target.value;
                              setItems(updatedItems);
                            }}
                          />
                        </TableCell>
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
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
