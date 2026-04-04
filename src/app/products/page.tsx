'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Product, ProductFormData, fetchProducts, createProduct, updateProduct, deleteProduct } from '@/services/product-service';

interface ProductForm {
  code: string;
  name: string;
  category: string;
  unit: string;
  specification: string;
  barcode: string;
  purchase_price: string;
  selling_price: string;
  min_stock: string;
  max_stock: string;
  is_active: boolean;
}

const initialForm: ProductForm = {
  code: '',
  name: '',
  category: '',
  unit: '',
  specification: '',
  barcode: '',
  purchase_price: '',
  selling_price: '',
  min_stock: '',
  max_stock: '',
  is_active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        code: product.code,
        name: product.name,
        category: product.category || '',
        unit: product.unit,
        specification: product.specification || '',
        barcode: product.barcode || '',
        purchase_price: product.purchase_price?.toString() || '',
        selling_price: product.selling_price?.toString() || '',
        min_stock: product.min_stock?.toString() || '',
        max_stock: product.max_stock?.toString() || '',
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      alert('请填写商品编码和名称');
      return;
    }

    try {
      const productData: ProductFormData = {
        code: form.code,
        name: form.name,
        category: form.category || undefined,
        unit: form.unit,
        specification: form.specification || undefined,
        barcode: form.barcode || undefined,
        purchase_price: parseFloat(form.purchase_price) || undefined,
        selling_price: parseFloat(form.selling_price) || undefined,
        min_stock: parseInt(form.min_stock) || undefined,
        max_stock: parseInt(form.max_stock) || undefined,
        is_active: form.is_active,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      await loadProducts();
      handleCloseDialog();
    } catch (error) {
      console.error('保存商品失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!editingProduct) return;
    try {
      await deleteProduct(editingProduct.id);
      await loadProducts();
      setDeleteDialogOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('删除失败，请重试');
    }
  };

  const handleExport = () => {
    try {
      const data = products.map((product) => ({
        '商品编码': product.code,
        '商品名称': product.name,
        '类别': product.category || '-',
        '单位': product.unit,
        '规格': product.specification || '-',
        '条码': product.barcode || '-',
        '采购价格': product.purchase_price || 0,
        '销售价格': product.selling_price || 0,
        '最小库存': product.min_stock || 0,
        '最大库存': product.max_stock || 0,
        '启用状态': product.is_active ? '是' : '否',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '商品列表');
      XLSX.writeFile(workbook, '商品列表.xlsx');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // 简单处理导入数据
          alert('导入功能需要完整的数据映射，当前仅演示');
        } catch (error) {
          console.error('解析文件失败:', error);
          alert('文件格式不正确');
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请重试');
    }

    e.target.value = '';
  };

  const filteredProducts = products.filter((product) =>
    !searchQuery ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">商品管理</h1>
          <p className="text-muted-foreground mt-2">管理商品信息</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            id="import-file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            新建商品
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索商品编码或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 商品列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商品编码</TableHead>
              <TableHead>商品名称</TableHead>
              <TableHead>类别</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>采购价</TableHead>
              <TableHead>销售价</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>¥{product.purchase_price || 0}</TableCell>
                  <TableCell>¥{product.selling_price || 0}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProduct(product);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? '编辑商品' : '新建商品'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? '修改商品信息' : '填写商品信息'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">商品编码 *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="请输入商品编码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">商品名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入商品名称"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">类别</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="请输入类别"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">单位</Label>
                <Input
                  id="unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="请输入单位"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specification">规格</Label>
                <Input
                  id="specification"
                  value={form.specification}
                  onChange={(e) => setForm({ ...form, specification: e.target.value })}
                  placeholder="请输入规格"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">条码</Label>
                <Input
                  id="barcode"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="请输入条码"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">采购价格</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={form.purchase_price}
                  onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                  placeholder="请输入采购价格"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_price">销售价格</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  placeholder="请输入销售价格"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_stock">最小库存</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                  placeholder="请输入最小库存"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_stock">最大库存</Label>
                <Input
                  id="max_stock"
                  type="number"
                  value={form.max_stock}
                  onChange={(e) => setForm({ ...form, max_stock: e.target.value })}
                  placeholder="请输入最大库存"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="is_active">启用商品</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商品「{editingProduct?.name}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditingProduct(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
