'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Shield, Key, CheckSquare, Square } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// 引入服务层
import { 
  Role, 
  RoleFormData, 
  fetchRoles, 
  createRole, 
  updateRole, 
  deleteRole 
} from '@/services/role-service';

const PERMISSION_GROUPS = [
  {
    key: 'product',
    label: '商品管理',
    permissions: [
      { key: 'product.view', label: '查看商品' },
      { key: 'product.create', label: '新增商品' },
      { key: 'product.edit', label: '编辑商品' },
      { key: 'product.delete', label: '删除商品' },
    ]
  },
  {
    key: 'warehouse',
    label: '仓库管理',
    permissions: [
      { key: 'warehouse.view', label: '查看仓库' },
      { key: 'warehouse.create', label: '新增仓库' },
      { key: 'warehouse.edit', label: '编辑仓库' },
      { key: 'warehouse.delete', label: '删除仓库' },
    ]
  },
  {
    key: 'inbound',
    label: '入库管理',
    permissions: [
      { key: 'inbound.view', label: '查看入库单' },
      { key: 'inbound.create', label: '创建入库单' },
      { key: 'inbound.edit', label: '编辑入库单' },
      { key: 'inbound.delete', label: '删除入库单' },
      { key: 'inbound.approve', label: '审批入库单' },
    ]
  },
  {
    key: 'outbound',
    label: '出库管理',
    permissions: [
      { key: 'outbound.view', label: '查看出库单' },
      { key: 'outbound.create', label: '创建出库单' },
      { key: 'outbound.edit', label: '编辑出库单' },
      { key: 'outbound.delete', label: '删除出库单' },
      { key: 'outbound.approve', label: '审批出库单' },
    ]
  },
  {
    key: 'stock',
    label: '库存管理',
    permissions: [
      { key: 'stock.view', label: '查看库存' },
      { key: 'stock.count', label: '库存盘点' },
      { key: 'stock.transfer', label: '库存调拨' },
    ]
  },
  {
    key: 'system',
    label: '系统设置',
    permissions: [
      { key: 'system.view', label: '查看设置' },
      { key: 'system.edit', label: '修改设置' },
      { key: 'system.user', label: '用户管理' },
      { key: 'system.role', label: '角色管理' },
    ]
  },
];

interface RoleForm {
  name: string;
  description: string;
  permissions: string[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>({
    name: '',
    description: '',
    permissions: [],
  });

  const loadRoles = async () => {
    try {
      setLoading(true);
      const savedRoles = await fetchRoles();
      setRoles(savedRoles);
    } catch (error) {
      console.error('获取角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setForm({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
      });
    } else {
      setEditingRole(null);
      setForm({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.name) {
        toast.error('请填写角色名称');
        return;
      }

      const formData: RoleFormData = {
        name: form.name,
        description: form.description || undefined,
        permissions: form.permissions,
      };

      if (editingRole) {
        await updateRole(editingRole.id, formData);
        toast.success('角色已更新');
      } else {
        await createRole(formData);
        toast.success('角色已创建');
      }

      setDialogOpen(false);
      setEditingRole(null);
      loadRoles();
    } catch (error) {
      console.error('保存角色失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;

    try {
      await deleteRole(deletingRole.id);
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      toast.success('角色已删除');
      loadRoles();
    } catch (error) {
      console.error('删除角色失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  const togglePermission = (permission: string) => {
    const newPermissions = form.permissions.includes(permission)
      ? form.permissions.filter(p => p !== permission)
      : [...form.permissions, permission];
    setForm({ ...form, permissions: newPermissions });
  };

  const toggleGroupPermissions = (groupPermissions: string[]) => {
    const hasAll = groupPermissions.every(p => form.permissions.includes(p));
    let newPermissions: string[];
    
    if (hasAll) {
      newPermissions = form.permissions.filter(p => !groupPermissions.includes(p));
    } else {
      newPermissions = [...new Set([...form.permissions, ...groupPermissions])];
    }
    
    setForm({ ...form, permissions: newPermissions });
  };

  const getPermissionCount = (role: Role) => {
    return role.permissions?.length || 0;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            角色管理
          </CardTitle>
          <CardDescription>
            管理系统角色和权限配置（已迁移至 Supabase）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索角色名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增角色
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>权限数量</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      暂无角色数据
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getPermissionCount(role)} 个权限
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(role.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingRole(role);
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? '编辑角色' : '新增角色'}
            </DialogTitle>
            <DialogDescription>
              配置角色信息和权限
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">角色名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value})}
                  placeholder="请输入角色名称"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value})}
                placeholder="请输入角色描述"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>权限配置</Label>
              </div>
              <ScrollArea className="h-80 rounded-md border p-4">
                <div className="space-y-6">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupPermissions = group.permissions.map(p => p.key);
                    const hasAll = groupPermissions.every(p => form.permissions.includes(p));
                    const hasSome = groupPermissions.some(p => form.permissions.includes(p));
                    
                    return (
                      <div key={group.key} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleGroupPermissions(groupPermissions)}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            {hasAll ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : hasSome ? (
                              <div className="h-4 w-4 border-2 border-primary rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-primary rounded-sm" />
                              </div>
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                            <span className="font-medium">{group.label}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-6">
                          {group.permissions.map((permission) => (
                            <div key={permission.key} className="flex items-center gap-2">
                              <Checkbox
                                id={permission.key}
                                checked={form.permissions.includes(permission.key)}
                                onCheckedChange={() => togglePermission(permission.key)}
                              />
                              <Label
                                htmlFor={permission.key}
                                className="text-sm cursor-pointer"
                              >
                                {permission.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除角色&quot;{deletingRole?.name}&quot;吗？此操作不可恢复。
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
