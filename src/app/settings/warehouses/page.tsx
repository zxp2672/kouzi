'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Warehouse, MapPin, Building2, Phone } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Warehouse as WarehouseType, WarehouseFormData, fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '@/services/warehouse-service';
import { fetchOrganizations, Organization } from '@/services/organization-service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WarehouseForm {
  code: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  organization_id: string;
  is_active: boolean;
}

const initialForm: WarehouseForm = {
  code: '',
  name: '',
  address: '',
  manager: '',
  phone: '',
  organization_id: '',
  is_active: true,
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [form, setForm] = useState<WarehouseForm>(initialForm);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const [data, orgs] = await Promise.all([
        fetchWarehouses(),
        fetchOrganizations().catch(() => []),
      ]);
      setWarehouses(data);
      setOrganizations(orgs);
    } catch (error) {
      console.error('获取仓库列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWarehouses();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDialog = (warehouse?: WarehouseType) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setForm({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address || '',
        manager: warehouse.manager || '',
        phone: warehouse.phone || '',
        organization_id: warehouse.organization_id ? String(warehouse.organization_id) : '',
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
    try {
      if (!form.code || !form.name) {
        alert('请填写必填字段');
        return;
      }

      const warehouseData: WarehouseFormData = {
        code: form.code,
        name: form.name,
        address: form.address || undefined,
        manager: form.manager || undefined,
        phone: form.phone || undefined,
        organization_id: form.organization_id ? parseInt(form.organization_id) : null,
        is_active: form.is_active,
      };

      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, warehouseData);
      } else {
        await createWarehouse(warehouseData);
      }

      await loadWarehouses();
      handleCloseDialog();
    } catch (error) {
      console.error('保存仓库失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!editingWarehouse) return;
    try {
      await deleteWarehouse(editingWarehouse.id);
      await loadWarehouses();
      setDeleteDialogOpen(false);
      setEditingWarehouse(null);
    } catch (error) {
      console.error('删除仓库失败:', error);
      alert('删除失败，请重试');
    }
  };

  const filteredWarehouses = warehouses.filter(wh => 
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-6 w-6" />
            仓库管理
          </CardTitle>
          <CardDescription>
            管理仓库信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索仓库名称或编码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增仓库
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>仓库编码</TableHead>
                  <TableHead>仓库名称</TableHead>
                  <TableHead>所属单位</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      暂无仓库数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWarehouses.map((wh) => (
                    <TableRow key={wh.id}>
                      <TableCell>
                        <code className="text-sm text-muted-foreground">{wh.code}</code>
                      </TableCell>
                      <TableCell className="font-medium">{wh.name}</TableCell>
                      <TableCell>
                        {(() => {
                          const org = organizations.find(o => o.id === wh.organization_id);
                          return org ? (
                            <Badge variant="outline">{org.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {wh.address || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{wh.manager || '-'}</TableCell>
                      <TableCell>
                        {wh.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {wh.phone}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={wh.is_active ? 'default' : 'secondary'}>
                          {wh.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(wh)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingWarehouse(wh);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? '编辑仓库' : '新增仓库'}
            </DialogTitle>
            <DialogDescription>
              填写仓库基本信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">仓库编码 *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value})}
                  placeholder="例如：WH001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">仓库名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value})}
                  placeholder="例如：中心仓库"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization_id">所属单位</Label>
              <Select
                value={form.organization_id}
                onValueChange={(value) => setForm({ ...form, organization_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择所属单位" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value})}
                placeholder="详细地址"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manager">负责人</Label>
                <Input
                  id="manager"
                  value={form.manager}
                  onChange={(e) => setForm({ ...form, manager: e.target.value})}
                  placeholder="负责人姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value})}
                  placeholder="联系电话"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked})}
              />
              <Label htmlFor="is_active">启用</Label>
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
              确定要删除仓库&quot;{editingWarehouse?.name}&quot;吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditingWarehouse(null)}>
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
