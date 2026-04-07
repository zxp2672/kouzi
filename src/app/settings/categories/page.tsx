'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tags, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  ProductCategory, ProductUnit,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchUnits, createUnit, updateUnit, deleteUnit,
} from '@/services/category-service';

type EditMode = 'category' | 'unit';

interface ItemForm {
  name: string;
  sort_order: string;
  is_active: boolean;
}

const initialForm: ItemForm = { name: '', sort_order: '', is_active: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('category');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemForm>(initialForm);

  // 删除确认
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ mode: EditMode; id: number; name: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, uts] = await Promise.all([fetchCategories(), fetchUnits()]);
      setCategories(cats);
      setUnits(uts);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenDialog = (mode: EditMode, item?: ProductCategory | ProductUnit) => {
    setEditMode(mode);
    if (item) {
      setEditingId(item.id);
      setForm({ name: item.name, sort_order: String(item.sort_order), is_active: item.is_active });
    } else {
      setEditingId(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('请填写名称');
      return;
    }
    try {
      const data = {
        name: form.name.trim(),
        sort_order: parseInt(form.sort_order) || undefined,
        is_active: form.is_active,
      };
      if (editMode === 'category') {
        if (editingId) {
          await updateCategory(editingId, data);
        } else {
          await createCategory(data);
        }
      } else {
        if (editingId) {
          await updateUnit(editingId, data);
        } else {
          await createUnit(data);
        }
      }
      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.mode === 'category') {
        await deleteCategory(deleteTarget.id);
      } else {
        await deleteUnit(deleteTarget.id);
      }
      await loadData();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-6 w-6" />
            商品类别与单位管理
          </CardTitle>
          <CardDescription>
            自定义商品类别和计量单位，在新建商品时可直接选择
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 商品类别 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  商品类别
                </CardTitle>
                <CardDescription className="mt-1">管理商品分类</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenDialog('category')}>
                <Plus className="mr-1.5 h-4 w-4" />
                新增
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead className="w-20 text-center">排序</TableHead>
                    <TableHead className="w-20 text-center">状态</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">加载中...</TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">暂无类别，点击新增添加</TableCell>
                    </TableRow>
                  ) : (
                    categories.map(cat => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{cat.sort_order}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={cat.is_active ? 'default' : 'secondary'} className="text-xs">
                            {cat.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog('category', cat)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setDeleteTarget({ mode: 'category', id: cat.id, name: cat.name });
                              setDeleteDialogOpen(true);
                            }}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 计量单位 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  计量单位
                </CardTitle>
                <CardDescription className="mt-1">管理商品计量单位</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenDialog('unit')}>
                <Plus className="mr-1.5 h-4 w-4" />
                新增
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead className="w-20 text-center">排序</TableHead>
                    <TableHead className="w-20 text-center">状态</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">加载中...</TableCell>
                    </TableRow>
                  ) : units.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">暂无单位，点击新增添加</TableCell>
                    </TableRow>
                  ) : (
                    units.map(unit => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">{unit.name}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{unit.sort_order}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={unit.is_active ? 'default' : 'secondary'} className="text-xs">
                            {unit.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog('unit', unit)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setDeleteTarget({ mode: 'unit', id: unit.id, name: unit.name });
                              setDeleteDialogOpen(true);
                            }}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? '编辑' : '新增'}{editMode === 'category' ? '商品类别' : '计量单位'}
            </DialogTitle>
            <DialogDescription>
              {editMode === 'category' ? '设置商品分类名称' : '设置计量单位名称'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">名称 *</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={editMode === 'category' ? '例如：通讯设备' : '例如：台'}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-sort">排序号</Label>
              <Input
                id="item-sort"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                placeholder="数字越小越靠前"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="item-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
              <Label htmlFor="item-active">启用</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>取消</Button>
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
              确定要删除{deleteTarget?.mode === 'category' ? '类别' : '单位'}&quot;{deleteTarget?.name}&quot;吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
