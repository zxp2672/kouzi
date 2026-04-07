'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, Download, FileSpreadsheet, FileDown } from 'lucide-react';
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
import { InventoryItem, getProductInventory } from '@/services/inventory-service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProductCategory, ProductUnit, fetchCategories, fetchUnits } from '@/services/category-service';

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
  const [inventoryMap, setInventoryMap] = useState<Record<number, InventoryItem[]>>({});
  const [categoryList, setCategoryList] = useState<ProductCategory[]>([]);
  const [unitList, setUnitList] = useState<ProductUnit[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [data, cats, uts] = await Promise.all([
        fetchProducts(),
        fetchCategories().catch(() => []),
        fetchUnits().catch(() => []),
      ]);
      setProducts(data);
      setCategoryList(cats.filter(c => c.is_active));
      setUnitList(uts.filter(u => u.is_active));
      // 并行获取每个商品的库存分布
      const inventoryResults = await Promise.all(
        data.map(p => getProductInventory(p.id).catch(() => []))
      );
      const map: Record<number, InventoryItem[]> = {};
      data.forEach((p, i) => { map[p.id] = inventoryResults[i]; });
      setInventoryMap(map);
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

  // 模板列头定义
  const TEMPLATE_HEADERS = ['商品编码', '商品名称', '类别', '单位', '规格', '条码', '采购价格', '销售价格', '最小库存', '最大库存', '启用状态'];

  // 导入结果状态
  const [importResult, setImportResult] = useState<{ success: number; failed: number; skipped: number; errors: string[] } | null>(null);
  const [importResultOpen, setImportResultOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // 下载导入模板
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 主数据 sheet - 带示例行
      const sampleRows = [
        { '商品编码': 'PRD001', '商品名称': '对讲机', '类别': '通讯设备', '单位': '台', '规格': '数字对讲机', '条码': '6901234567890', '采购价格': 200, '销售价格': 300, '最小库存': 10, '最大库存': 200, '启用状态': '是' },
        { '商品编码': 'PRD002', '商品名称': '警棍', '类别': '防暴器材', '单位': '根', '规格': '伸缩警棍', '条码': '', '采购价格': 30, '销售价格': 50, '最小库存': 50, '最大库存': 500, '启用状态': '是' },
      ];
      const ws1 = XLSX.utils.json_to_sheet(sampleRows);
      // 设置列宽
      ws1['!cols'] = [
        { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 16 },
        { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, ws1, '商品数据');

      // 类别参考 sheet
      const catRows = categoryList.length > 0
        ? categoryList.map(c => ({ '可用类别': c.name }))
        : [{ '可用类别': '（请先在系统设置中添加类别）' }];
      const ws2 = XLSX.utils.json_to_sheet(catRows);
      ws2['!cols'] = [{ wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws2, '类别参考');

      // 单位参考 sheet
      const unitRows = unitList.length > 0
        ? unitList.map(u => ({ '可用单位': u.name }))
        : [{ '可用单位': '（请先在系统设置中添加单位）' }];
      const ws3 = XLSX.utils.json_to_sheet(unitRows);
      ws3['!cols'] = [{ wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws3, '单位参考');

      // 填写说明 sheet
      const helpRows = [
        { '字段': '商品编码', '是否必填': '是', '说明': '唯一标识，不可重复' },
        { '字段': '商品名称', '是否必填': '是', '说明': '商品名称' },
        { '字段': '类别', '是否必填': '否', '说明': '请参考"类别参考"sheet中的可用类别' },
        { '字段': '单位', '是否必填': '是', '说明': '请参考"单位参考"sheet中的可用单位' },
        { '字段': '规格', '是否必填': '否', '说明': '商品规格型号' },
        { '字段': '条码', '是否必填': '否', '说明': '商品条码/条形码' },
        { '字段': '采购价格', '是否必填': '否', '说明': '数字，支持两位小数' },
        { '字段': '销售价格', '是否必填': '否', '说明': '数字，支持两位小数' },
        { '字段': '最小库存', '是否必填': '否', '说明': '整数，低于此值触发预警' },
        { '字段': '最大库存', '是否必填': '否', '说明': '整数' },
        { '字段': '启用状态', '是否必填': '否', '说明': '填"是"或"否"，默认"是"' },
      ];
      const ws4 = XLSX.utils.json_to_sheet(helpRows);
      ws4['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, ws4, '填写说明');

      XLSX.writeFile(wb, '商品导入模板.xlsx');
    } catch (error) {
      console.error('下载模板失败:', error);
      alert('下载模板失败，请重试');
    }
  };

  const handleExport = () => {
    try {
      const data = products.map((product) => ({
        '商品编码': product.code,
        '商品名称': product.name,
        '类别': product.category || '',
        '单位': product.unit,
        '规格': product.specification || '',
        '条码': product.barcode || '',
        '采购价格': product.purchase_price ? parseFloat(product.purchase_price) : '',
        '销售价格': product.selling_price ? parseFloat(product.selling_price) : '',
        '最小库存': product.min_stock ?? '',
        '最大库存': product.max_stock ?? '',
        '启用状态': product.is_active ? '是' : '否',
      }));

      if (data.length === 0) {
        // 导出空模板头
        data.push(Object.fromEntries(TEMPLATE_HEADERS.map(h => [h, ''])) as any);
      }

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 16 },
        { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '商品列表');
      XLSX.writeFile(wb, `商品列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        // 优先找"商品数据" sheet，否则用第一个sheet
        const sheetName = workbook.SheetNames.includes('商品数据') ? '商品数据' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        if (jsonData.length === 0) {
          alert('导入文件中没有数据');
          setImporting(false);
          return;
        }

        // 获取已有编码用于去重
        const existingCodes = new Set(products.map(p => p.code.trim().toUpperCase()));
        const validCategories = new Set(categoryList.map(c => c.name));
        const validUnits = new Set(unitList.map(u => u.name));

        let success = 0;
        let failed = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNum = i + 2; // Excel行号（含表头）
          const code = String(row['商品编码'] || '').trim();
          const name = String(row['商品名称'] || '').trim();

          // 必填校验
          if (!code) {
            errors.push(`第${rowNum}行: 缺少商品编码，已跳过`);
            skipped++;
            continue;
          }
          if (!name) {
            errors.push(`第${rowNum}行: 缺少商品名称，已跳过`);
            skipped++;
            continue;
          }

          // 编码重复校验
          if (existingCodes.has(code.toUpperCase())) {
            errors.push(`第${rowNum}行: 编码"${code}"已存在，已跳过`);
            skipped++;
            continue;
          }

          const category = String(row['类别'] || '').trim();
          const unit = String(row['单位'] || '').trim();

          // 单位校验提示（不阻止导入）
          if (unit && validUnits.size > 0 && !validUnits.has(unit)) {
            errors.push(`第${rowNum}行: 单位"${unit}"不在预设列表中，但已导入`);
          }
          if (category && validCategories.size > 0 && !validCategories.has(category)) {
            errors.push(`第${rowNum}行: 类别"${category}"不在预设列表中，但已导入`);
          }

          const activeStr = String(row['启用状态'] || '是').trim();

          try {
            const productData: ProductFormData = {
              code,
              name,
              category: category || undefined,
              unit: unit || '个',
              specification: String(row['规格'] || '').trim() || undefined,
              barcode: String(row['条码'] || '').trim() || undefined,
              purchase_price: parseFloat(String(row['采购价格'] || '')) || undefined,
              selling_price: parseFloat(String(row['销售价格'] || '')) || undefined,
              min_stock: parseInt(String(row['最小库存'] || '')) || undefined,
              max_stock: parseInt(String(row['最大库存'] || '')) || undefined,
              is_active: activeStr !== '否',
            };
            await createProduct(productData);
            existingCodes.add(code.toUpperCase()); // 防止同批次重复
            success++;
          } catch (err) {
            errors.push(`第${rowNum}行: 创建失败 - ${err instanceof Error ? err.message : '未知错误'}`);
            failed++;
          }
        }

        setImportResult({ success, failed, skipped, errors });
        setImportResultOpen(true);
        if (success > 0) {
          await loadProducts();
        }
      } catch (error) {
        console.error('解析文件失败:', error);
        alert('文件格式不正确，请使用标准模板');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
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
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            下载模板
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? '导入中...' : '导入'}
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
              <TableHead>库存数量</TableHead>
              <TableHead>所在仓库</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
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
                    {(() => {
                      const items = inventoryMap[product.id] || [];
                      const total = items.reduce((sum, i) => sum + i.quantity, 0);
                      return total > 0 ? (
                        <span className="font-medium">{total}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const items = inventoryMap[product.id] || [];
                      if (items.length === 0) return <span className="text-muted-foreground">-</span>;
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {items.slice(0, 2).map((inv) => (
                                  <Badge key={inv.id} variant="outline" className="text-xs whitespace-nowrap">
                                    {inv.warehouse?.name || '未知仓库'}({inv.quantity})
                                  </Badge>
                                ))}
                                {items.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{items.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="space-y-1">
                                {items.map((inv) => (
                                  <div key={inv.id} className="flex justify-between gap-4 text-xs">
                                    <span>{inv.warehouse?.name || '未知仓库'}</span>
                                    <span className="font-medium">{inv.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                  </TableCell>
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
                <Select
                  value={form.category || '_none'}
                  onValueChange={(value) => setForm({ ...form, category: value === '_none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">不选择</SelectItem>
                    {categoryList.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">单位</Label>
                <Select
                  value={form.unit || '_none'}
                  onValueChange={(value) => setForm({ ...form, unit: value === '_none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">不选择</SelectItem>
                    {unitList.map(u => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
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

      {/* 导入结果对话框 */}
      <Dialog open={importResultOpen} onOpenChange={setImportResultOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>导入结果</DialogTitle>
            <DialogDescription>商品数据导入完成</DialogDescription>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                  <div className="text-xs text-muted-foreground mt-1">成功导入</div>
                </div>
                <div className="rounded-lg border bg-yellow-50 dark:bg-yellow-950 p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                  <div className="text-xs text-muted-foreground mt-1">跳过</div>
                </div>
                <div className="rounded-lg border bg-red-50 dark:bg-red-950 p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                  <div className="text-xs text-muted-foreground mt-1">失败</div>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">详细信息：</Label>
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3 space-y-1">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground">{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setImportResultOpen(false)}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
