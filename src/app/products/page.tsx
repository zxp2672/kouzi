'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  specification: string;
  barcode: string;
  purchase_price: number;
  selling_price: number;
  min_stock: number;
  max_stock: number;
  is_active: boolean;
}

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
  min_stock: '0',
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
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const client = getSupabaseClient();
      let query = client.from('products').select('*').order('id', { ascending: false });

      if (searchQuery) {
        query = query.or(`code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('获取商品列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
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
        min_stock: product.min_stock?.toString() || '0',
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
    try {
      const client = getSupabaseClient();

      const productData = {
        code: form.code,
        name: form.name,
        category: form.category || null,
        unit: form.unit,
        specification: form.specification || null,
        barcode: form.barcode || null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
        min_stock: parseInt(form.min_stock) || 0,
        max_stock: form.max_stock ? parseInt(form.max_stock) : null,
        is_active: form.is_active,
      };

      let error;
      if (editingProduct) {
        const result = await client
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select();
        error = result.error;
      } else {
        const result = await client.from('products').insert(productData).select();
        error = result.error;
      }

      if (error) throw error;

      handleCloseDialog();
      fetchProducts();
    } catch (error) {
      console.error('保存商品失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('删除商品失败:', error);
      alert('删除失败，请重试');
    }
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
          <h1 className="text-3xl font-bold tracking-tight">商品管理</h1>
          <p className="text-muted-foreground mt-2">管理所有商品信息</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新增商品
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索商品编码或名称..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 商品列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>编码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>规格</TableHead>
              <TableHead>条形码</TableHead>
              <TableHead>采购价</TableHead>
              <TableHead>销售价</TableHead>
              <TableHead>最低库存</TableHead>
              <TableHead>最高库存</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>{product.specification || '-'}</TableCell>
                  <TableCell>{product.barcode || '-'}</TableCell>
                  <TableCell>¥{product.purchase_price || '-'}</TableCell>
                  <TableCell>¥{product.selling_price || '-'}</TableCell>
                  <TableCell>{product.min_stock}</TableCell>
                  <TableCell>{product.max_stock || '-'}</TableCell>
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
                          setDeletingProduct(product);
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

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? '编辑商品' : '新增商品'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? '修改商品信息' : '填写商品基本信息'}
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
                  disabled={!!editingProduct}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">商品名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">单位 *</Label>
                <Select value={form.unit} onValueChange={(value) => setForm({ ...form, unit: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="个">个</SelectItem>
                    <SelectItem value="件">件</SelectItem>
                    <SelectItem value="箱">箱</SelectItem>
                    <SelectItem value="台">台</SelectItem>
                    <SelectItem value="套">套</SelectItem>
                    <SelectItem value="包">包</SelectItem>
                    <SelectItem value="瓶">瓶</SelectItem>
                    <SelectItem value="千克">千克</SelectItem>
                    <SelectItem value="克">克</SelectItem>
                    <SelectItem value="升">升</SelectItem>
                    <SelectItem value="毫升">毫升</SelectItem>
                    <SelectItem value="米">米</SelectItem>
                    <SelectItem value="卷">卷</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specification">规格</Label>
                <Input
                  id="specification"
                  value={form.specification}
                  onChange={(e) => setForm({ ...form, specification: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">条形码</Label>
                <Input
                  id="barcode"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">采购价</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={form.purchase_price}
                  onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_price">销售价</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_stock">最低库存</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_stock">最高库存</Label>
                <Input
                  id="max_stock"
                  type="number"
                  value={form.max_stock}
                  onChange={(e) => setForm({ ...form, max_stock: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active">启用商品</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商品&quot;{deletingProduct?.name}&quot;吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
