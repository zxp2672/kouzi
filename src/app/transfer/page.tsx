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

// Mock数据
const mockWarehouses: Warehouse[] = [
  { id: 1, code: 'WH001', name: '主仓库' },
  { id: 2, code: 'WH002', name: '分仓库' },
];

const mockProducts: Product[] = [
  { id: 1, code: 'PRD001', name: '对讲机', unit: '台' },
  { id: 2, code: 'PRD002', name: '警棍', unit: '根' },
  { id: 3, code: 'PRD003', name: '防刺服', unit: '件' },
];

const mockTransferOrders: TransferOrder[] = [
  {
    id: 1,
    order_no: 'TR202401001',
    from_warehouse_id: 1,
    from_warehouse_name: '主仓库',
    to_warehouse_id: 2,
    to_warehouse_name: '分仓库',
    status: 'approved',
    remark: '调拨物资',
    created_by: '张三',
    created_at: '2024-01-14T09:00:00Z',
    approved_at: '2024-01-14T10:30:00Z',
    approved_by: '李四',
    items: [
      { product_id: 1, product_code: 'PRD001', product_name: '对讲机', quantity: 10, remark: '' },
      { product_id: 2, product_code: 'PRD002', product_name: '警棍', quantity: 20, remark: '' },
    ],
  },
  {
    id: 2,
    order_no: 'TR202401002',
    from_warehouse_id: 2,
    from_warehouse_name: '分仓库',
    to_warehouse_id: 1,
    to_warehouse_name: '主仓库',
    status: 'pending',
    remark: '退回物资',
    created_by: '王五',
    created_at: '2024-01-16T14:20:00Z',
    items: [
      { product_id: 3, product_code: 'PRD003', product_name: '防刺服', quantity: 5, remark: '' },
    ],
  },
];

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
    fetchOrders();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const savedOrders = localStorage.getItem('transfer_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        setOrders(mockTransferOrders);
        localStorage.setItem('transfer_orders', JSON.stringify(mockTransferOrders));
      }
    } catch (error) {
      console.error('获取调拨单列表失败:', error);
      setOrders(mockTransferOrders);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const savedWarehouses = localStorage.getItem('warehouses');
      if (savedWarehouses) {
        setWarehouses(JSON.parse(savedWarehouses));
      } else {
        setWarehouses(mockWarehouses);
        localStorage.setItem('warehouses', JSON.stringify(mockWarehouses));
      }
    } catch (error) {
      console.error('获取仓库列表失败:', error);
      setWarehouses(mockWarehouses);
    }
  };

  const fetchProducts = async () => {
    try {
      const savedProducts = localStorage.getItem('products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        setProducts(mockProducts);
        localStorage.setItem('products', JSON.stringify(mockProducts));
      }
    } catch (error) {
      console.error('获取商品列表失败:', error);
      setProducts(mockProducts);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDialog = () => {
    const newOrderNo = `TR${Date.now()}`;
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
      const fromWh = warehouses.find((w) => w.id === parseInt(fromWarehouse));
      const toWh = warehouses.find((w) => w.id === parseInt(toWarehouse));
      
      const newOrder: TransferOrder = {
        id: Date.now(),
        order_no: orderNo,
        from_warehouse_id: parseInt(fromWarehouse),
        from_warehouse_name: fromWh?.name || '',
        to_warehouse_id: parseInt(toWarehouse),
        to_warehouse_name: toWh?.name || '',
        status: 'pending',
        remark: remark || '',
        created_by: '系统用户',
        created_at: new Date().toISOString(),
        items: items,
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('transfer_orders', JSON.stringify(updatedOrders));

      handleCloseDialog();
    } catch (error) {
      console.error('保存调拨单失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleApprove = async (order: TransferOrder) => {
    try {
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: '系统用户',
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      localStorage.setItem('transfer_orders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('审核调拨单失败:', error);
      alert('审核失败，请重试');
    }
  };

  const handleReject = async (order: TransferOrder) => {
    try {
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            status: 'rejected',
            approved_by: '系统用户',
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      localStorage.setItem('transfer_orders', JSON.stringify(updatedOrders));
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
