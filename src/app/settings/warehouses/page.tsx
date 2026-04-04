'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Warehouse, MapPin, Building2 } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
  organization: string;
  manager: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface WarehouseForm {
  code: string;
  name: string;
  location: string;
  organization: string;
  manager: string;
  description: string;
  is_active: boolean;
}

// 组织列表
const ORGANIZATIONS = [
  { value: 'gaj', label: 'XX市公安局' },
  { value: 'gac', label: 'XX区公安处' },
  { value: 'pcs', label: 'XX派出所' },
];

// 默认示例仓库
const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 1,
    code: 'WH001',
    name: '市局中心仓库',
    location: 'XX市XX区XX路1号',
    organization: 'gaj',
    manager: '张三',
    description: '市局中心库房，存储主要物资',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'WH002',
    name: 'XX区分库',
    location: 'XX区XX路2号',
    organization: 'gac',
    manager: '李四',
    description: 'XX区公安处分库房',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    code: 'WH003',
    name: 'XX派出所仓库',
    location: 'XX派出所院内',
    organization: 'pcs',
    manager: '王五',
    description: 'XX派出所自用仓库',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'warehouses';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);
  const [nextId, setNextId] = useState(4);
  const [form, setForm] = useState<WarehouseForm>({
    code: '',
    name: '',
    location: '',
    organization: '',
    manager: '',
    description: '',
    is_active: true,
  });

  const getWarehousesFromStorage = (): Warehouse[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.warehouses || DEFAULT_WAREHOUSES;
      }
    } catch (error) {
      console.error('读取仓库数据失败:', error);
    }
    return DEFAULT_WAREHOUSES;
  };

  const saveWarehousesToStorage = (warehouseList: Warehouse[], newNextId?: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        warehouses: warehouseList,
        nextId: newNextId || nextId
      }));
    } catch (error) {
      console.error('保存仓库数据失败:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      
      // 从 localStorage 读取数据
      const savedWarehouses = getWarehousesFromStorage();
      const savedNextId = localStorage.getItem(STORAGE_KEY);
      if (savedNextId) {
        try {
          const parsed = JSON.parse(savedNextId);
          if (parsed.nextId) {
            setNextId(parsed.nextId);
          }
        } catch (e) {
          // 忽略
        }
      }
      
      setWarehouses(savedWarehouses);
    } catch (error) {
      console.error('获取仓库列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setForm({
        code: warehouse.code,
        name: warehouse.name,
        location: warehouse.location,
        organization: warehouse.organization,
        manager: warehouse.manager,
        description: warehouse.description,
        is_active: warehouse.is_active,
      });
    } else {
      setEditingWarehouse(null);
      setForm({
        code: '',
        name: '',
        location: '',
        organization: '',
        manager: '',
        description: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.code || !form.name) {
        toast.error('请填写必填字段');
        return;
      }

      const warehouseList = getWarehousesFromStorage();
      
      if (editingWarehouse) {
        // 编辑现有仓库
        const updatedList = warehouseList.map(wh => {
          if (wh.id === editingWarehouse.id) {
            return {
              ...wh,
              ...form,
            };
          }
          return wh;
        });
        
        saveWarehousesToStorage(updatedList);
      } else {
        // 新增仓库
        const newWarehouse: Warehouse = {
          id: nextId,
          ...form,
          created_at: new Date().toISOString(),
        };
        
        const updatedList = [...warehouseList, newWarehouse];
        saveWarehousesToStorage(updatedList, nextId + 1);
        setNextId(nextId + 1);
      }

      setDialogOpen(false);
      toast.success(editingWarehouse ? '仓库已更新' : '仓库已创建');
      fetchWarehouses();
    } catch (error) {
      console.error('保存仓库失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingWarehouse) return;

    try {
      const warehouseList = getWarehousesFromStorage();
      const updatedList = warehouseList.filter(wh => wh.id !== deletingWarehouse.id);
      
      saveWarehousesToStorage(updatedList);

      setDeleteDialogOpen(false);
      setDeletingWarehouse(null);
      toast.success('仓库已删除');
      fetchWarehouses();
    } catch (error) {
      console.error('删除仓库失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  const getOrganizationLabel = (org: string) => {
    return ORGANIZATIONS.find(o => o.value === org)?.label || org;
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
            管理各组织机构的仓库信息
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
                  <TableHead>所属组织</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>管理员</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {getOrganizationLabel(wh.organization)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {wh.location}
                        </div>
                      </TableCell>
                      <TableCell>{wh.manager}</TableCell>
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
                              setDeletingWarehouse(wh);
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
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value})}
                placeholder="详细地址"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organization">所属组织</Label>
                <Select
                  value={form.organization}
                  onValueChange={(value) => setForm({ ...form, organization: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择组织" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATIONS.map((org) => (
                      <SelectItem key={org.value} value={org.value}>
                        {org.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">管理员</Label>
                <Input
                  id="manager"
                  value={form.manager}
                  onChange={(e) => setForm({ ...form, manager: e.target.value})}
                  placeholder="负责人姓名"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value})}
                placeholder="仓库描述"
                rows={2}
              />
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
              确定要删除仓库&quot;{deletingWarehouse?.name}&quot;吗？此操作不可恢复。
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
