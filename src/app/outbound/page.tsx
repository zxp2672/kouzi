'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Check, X, Eye } from 'lucide-react';
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
import { PrintPdfExport, DocumentPrintLayout } from '@/components/print-pdf-export';
import { useApprovalTodo } from '@/hooks/use-approval-todo';
import { generateOrderNo } from '@/services/outbound-service';
import { decreaseInventory, checkStockAvailability } from '@/services/inventory-service';

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
  items?: OutboundItem[];
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

const mockInventory: InventoryItem[] = [
  { product_id: 1, product_code: 'PRD001', product_name: '对讲机', quantity: 150, available_quantity: 150 },
  { product_id: 2, product_code: 'PRD002', product_name: '警棍', quantity: 300, available_quantity: 300 },
  { product_id: 3, product_code: 'PRD003', product_name: '防刺服', quantity: 80, available_quantity: 80 },
];

const mockOutboundOrders: OutboundOrder[] = [
  {
    id: 1,
    order_no: 'OUT202401001',
    warehouse_id: 1,
    warehouse_name: '主仓库',
    customer: '派出所A',
    type: 'sales',
    status: 'approved',
    remark: '日常领用',
    created_by: '张三',
    created_at: '2024-01-14T09:00:00Z',
    approved_at: '2024-01-14T10:30:00Z',
    approved_by: '李四',
    items: [
      { product_id: 1, product_code: 'PRD001', product_name: '对讲机', quantity: 10, price: '300' },
      { product_id: 2, product_code: 'PRD002', product_name: '警棍', quantity: 20, price: '50' },
    ],
  },
  {
    id: 2,
    order_no: 'OUT202401002',
    warehouse_id: 1,
    warehouse_name: '主仓库',
    customer: '派出所B',
    type: 'sales',
    status: 'pending',
    remark: '应急物资',
    created_by: '王五',
    created_at: '2024-01-16T14:20:00Z',
    items: [
      { product_id: 3, product_code: 'PRD003', product_name: '防刺服', quantity: 15, price: '200' },
    ],
  },
];

export default function OutboundPage() {
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);
  const [orderNo, setOrderNo] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [customer, setCustomer] = useState('');
  const [outboundType, setOutboundType] = useState('sales');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<OutboundItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  
  // 使用审核待办 hook
  const { refresh: refreshApprovalTodo } = useApprovalTodo();

  useEffect(() => {
    fetchOrders();
    fetchWarehouses();
    fetchProducts();
    fetchInventory('1');
  }, []);

  const fetchOrders = async () => {
    try {
      const savedOrders = localStorage.getItem('outbound_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        setOrders(mockOutboundOrders);
        localStorage.setItem('outbound_orders', JSON.stringify(mockOutboundOrders));
      }
    } catch (error) {
      console.error('获取出库单列表失败:', error);
      setOrders(mockOutboundOrders);
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

  const fetchInventory = async (warehouseId: string) => {
    try {
      setInventory(mockInventory);
    } catch (error) {
      console.error('获取库存信息失败:', error);
      setInventory(mockInventory);
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
    const newOrderNo = generateOrderNo();
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
      const warehouse = warehouses.find((w) => w.id === parseInt(selectedWarehouse));
      
      const newOrder: OutboundOrder = {
        id: Date.now(),
        order_no: orderNo,
        warehouse_id: parseInt(selectedWarehouse),
        warehouse_name: warehouse?.name || '',
        customer: customer || '',
        type: outboundType,
        status: 'pending',
        remark: remark || '',
        created_by: '系统用户',
        created_at: new Date().toISOString(),
        items: items,
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('outbound_orders', JSON.stringify(updatedOrders));

      handleCloseDialog();
    } catch (error) {
      console.error('保存出库单失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleApprove = async (order: OutboundOrder) => {
    try {
      // 检查库存是否充足
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const { available, currentStock } = await checkStockAvailability(
            order.warehouse_id,
            item.product_id,
            item.quantity
          );
          
          if (!available) {
            alert(`库存不足：${item.product_name} 当前库存 ${currentStock}，需要 ${item.quantity}`);
            return;
          }
        }
      }

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
      localStorage.setItem('outbound_orders', JSON.stringify(updatedOrders));
      
      // 审核通过后，自动扣减库存
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const success = await decreaseInventory(
            order.warehouse_id,
            item.product_id,
            item.quantity
          );
          
          if (!success) {
            console.error(`扣减库存失败：${item.product_name}`);
          }
        }
        console.log('✅ 库存已扣减');
      }
      
      // 刷新审核待办提醒
      refreshApprovalTodo();
      
      alert('审核成功，库存已扣减');
    } catch (error) {
      console.error('审核出库单失败:', error);
      alert('审核失败，请重试');
    }
  };

  const handleReject = async (order: OutboundOrder) => {
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
      localStorage.setItem('outbound_orders', JSON.stringify(updatedOrders));
      
      // 刷新审核待办提醒
      refreshApprovalTodo();
    } catch (error) {
      console.error('拒绝出库单失败:', error);
      alert('操作失败，请重试');
    }
  };

  const handleViewDetail = (order: OutboundOrder) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
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

  const filteredOrders = orders.filter((order) =>
    !searchQuery ||
    order.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.customer && order.customer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      {/* 详情查看对话框 */}
      {selectedOrder && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>出库单详情</DialogTitle>
              <DialogDescription>单号：{selectedOrder.order_no}</DialogDescription>
            </DialogHeader>
            
            <PrintPdfExport title={`出库单-${selectedOrder.order_no}`}>
              <DocumentPrintLayout
                title="出库单"
                subtitle={`单号：${selectedOrder.order_no}`}
                meta={{
                  '仓库': selectedOrder.warehouse_name,
                  '客户': selectedOrder.customer || '-',
                  '类型': getTypeLabel(selectedOrder.type),
                  '状态': selectedOrder.status === 'pending' ? '待审核' : selectedOrder.status === 'approved' ? '已审核' : '已拒绝',
                  '创建人': selectedOrder.created_by,
                  '创建时间': new Date(selectedOrder.created_at).toLocaleString('zh-CN'),
                }}
              >
                <div className="space-y-6">
                  {selectedOrder.remark && (
                    <div>
                      <h4 className="font-medium mb-2">备注</h4>
                      <p className="text-muted-foreground">{selectedOrder.remark}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-4">商品明细</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>商品编码</TableHead>
                            <TableHead>商品名称</TableHead>
                            <TableHead>数量</TableHead>
                            <TableHead>单价</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items?.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.product_code}</TableCell>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>¥{item.price || '-'}</TableCell>
                            </TableRow>
                          )) || (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                暂无商品明细
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {(selectedOrder.approved_at || selectedOrder.status === 'rejected') && (
                    <div>
                      <h4 className="font-medium mb-4">审核记录</h4>
                      <div className="rounded-md border p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-500">审核结果：</span>
                            <span className={`text-sm font-medium ${selectedOrder.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                              {selectedOrder.status === 'approved' ? '通过' : '拒绝'}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">审核人：</span>
                            <span className="text-sm font-medium">{selectedOrder.approved_by || '-'}</span>
                          </div>
                          {selectedOrder.approved_at && (
                            <div className="col-span-2">
                              <span className="text-sm text-gray-500">审核时间：</span>
                              <span className="text-sm font-medium">
                                {new Date(selectedOrder.approved_at).toLocaleString('zh-CN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DocumentPrintLayout>
            </PrintPdfExport>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
