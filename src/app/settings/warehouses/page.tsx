'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WarehouseForm {
  code: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  is_active: boolean;
}

const initialForm: WarehouseForm = {
  code: '',
  name: '',
  address: '',
  manager: '',
  phone: '',
  is_active: true,
};

export default function WarehouseManagement() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<WarehouseForm>(initialForm);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const client = getSupabaseClient();
      let query = client.from('warehouses').select('*').order('id', { ascending: false });

      if (searchQuery) {
        query = query.or(`code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('获取仓库列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarehouses();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setForm({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address || '',
        manager: warehouse.manager || '',
        phone: warehouse.phone || '',
        is_active: warehouse.is_active,
      });
    } else {
      setEditingWarehouse(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWarehouse(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      alert('请填写仓库编码和名称');
      return;
    }

    try {
      const client = getSupabaseClient();

      const warehouseData = {
        code: form.code,
        name: form.name,
        address: form.address || null,
        manager: form.manager || null,
        phone: form.phone || null,
        is_active: form.is_active,
      };

      let error;
      if (editingWarehouse) {
        const result = await client
          .from('warehouses')
          .update(warehouseData)
          .eq('id', editingWarehouse.id)
          .select();
        error = result.error;
      } else {
        const result = await client.from('warehouses').insert(warehouseData).select();
        error = result.error;
      }

      if (error) throw error;

      handleCloseDialog();
      fetchWarehouses();
    } catch (error) {
      console.error('保存仓库失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingWarehouse) return;

    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('warehouses')
        .delete()
        .eq('id', deletingWarehouse.id);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setDeletingWarehouse(null);
      fetchWarehouses();
    } catch (error) {
      console.error('删除仓库失败:', error);
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
          <h2 className="text-xl font-semibold">仓库管理</h2>
          <p className="text-muted-foreground mt-1">管理仓库信息</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新增仓库
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索仓库编码或名称..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 仓库列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>编码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>地址</TableHead>
              <TableHead>负责人</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.code}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {warehouse.name}
                    </div>
                  </TableCell>
                  <TableCell>{warehouse.address || '-'}</TableCell>
                  <TableCell>{warehouse.manager || '-'}</TableCell>
                  <TableCell>{warehouse.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                      {warehouse.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(warehouse.created_at).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(warehouse)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeletingWarehouse(warehouse);
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
            <DialogTitle>{editingWarehouse ? '编辑仓库' : '新增仓库'}</DialogTitle>
            <DialogDescription>
              {editingWarehouse ? '修改仓库信息' : '填写仓库基本信息'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">仓库编码 *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  disabled={!!editingWarehouse}
                  placeholder="例如：WH001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">仓库名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：主仓库"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">仓库地址</Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="请输入仓库详细地址"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager">负责人</Label>
                <Input
                  id="manager"
                  value={form.manager}
                  onChange={(e) => setForm({ ...form, manager: e.target.value })}
                  placeholder="请输入负责人姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="请输入联系电话"
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
              <Label htmlFor="is_active">启用仓库</Label>
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
              确定要删除仓库&quot;{deletingWarehouse?.name}&quot;吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
