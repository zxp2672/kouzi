'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Shield, CheckSquare } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Role {
  id: number;
  code: string;
  name: string;
  description: string;
  level: number;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

interface RoleForm {
  code: string;
  name: string;
  description: string;
  level: string;
  is_active: boolean;
  permissions: string[];
}

// 权限列表
const PERMISSIONS = [
  { value: 'product:view', label: '查看商品' },
  { value: 'product:edit', label: '编辑商品' },
  { value: 'inbound:view', label: '查看入库单' },
  { value: 'inbound:edit', label: '创建/编辑入库单' },
  { value: 'inbound:approve', label: '审核入库单' },
  { value: 'outbound:view', label: '查看出库单' },
  { value: 'outbound:edit', label: '创建/编辑出库单' },
  { value: 'outbound:approve', label: '审核出库单' },
  { value: 'stock:view', label: '查看库存' },
  { value: 'stock:count', label: '库存盘点' },
  { value: 'transfer:view', label: '查看调拨单' },
  { value: 'transfer:edit', label: '创建/编辑调拨单' },
  { value: 'transfer:approve', label: '审核调拨单' },
  { value: 'settings:view', label: '查看系统设置' },
  { value: 'settings:edit', label: '编辑系统设置' },
];

// 默认示例角色
const DEFAULT_ROLES: Role[] = [
  {
    id: 1,
    code: 'admin',
    name: '系统管理员',
    description: '拥有系统所有权限',
    level: 1,
    permissions: PERMISSIONS.map(p => p.value),
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'manager',
    name: '部门管理员',
    description: '管理本部门的业务和审核',
    level: 2,
    permissions: [
      'product:view', 'product:edit',
      'inbound:view', 'inbound:edit', 'inbound:approve',
      'outbound:view', 'outbound:edit', 'outbound:approve',
      'stock:view', 'stock:count',
      'transfer:view', 'transfer:edit', 'transfer:approve',
    ],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    code: 'operator',
    name: '操作员',
    description: '日常业务操作',
    level: 3,
    permissions: [
      'product:view',
      'inbound:view', 'inbound:edit',
      'outbound:view', 'outbound:edit',
      'stock:view',
      'transfer:view', 'transfer:edit',
    ],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'roles';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [nextId, setNextId] = useState(4);
  const [form, setForm] = useState<RoleForm>({
    code: '',
    name: '',
    description: '',
    level: '3',
    is_active: true,
    permissions: [],
  });

  const getRolesFromStorage = (): Role[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.roles || DEFAULT_ROLES;
      }
    } catch (error) {
      console.error('读取角色数据失败:', error);
    }
    return DEFAULT_ROLES;
  };

  const saveRolesToStorage = (roleList: Role[], newNextId?: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        roles: roleList,
        nextId: newNextId || nextId
      }));
    } catch (error) {
      console.error('保存角色数据失败:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      
      // 从 localStorage 读取数据
      const savedRoles = getRolesFromStorage();
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
      
      setRoles(savedRoles);
    } catch (error) {
      console.error('获取角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setForm({
        code: role.code,
        name: role.name,
        description: role.description,
        level: role.level.toString(),
        is_active: role.is_active,
        permissions: [...role.permissions],
      });
    } else {
      setEditingRole(null);
      setForm({
        code: '',
        name: '',
        description: '',
        level: '3',
        is_active: true,
        permissions: [],
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

      const roleList = getRolesFromStorage();
      
      if (editingRole) {
        // 编辑现有角色
        const updatedList = roleList.map(role => {
          if (role.id === editingRole.id) {
            return {
              ...role,
              code: form.code,
              name: form.name,
              description: form.description,
              level: parseInt(form.level),
              is_active: form.is_active,
              permissions: form.permissions,
            };
          }
          return role;
        });
        
        saveRolesToStorage(updatedList);
      } else {
        // 新增角色
        const newRole: Role = {
          id: nextId,
          code: form.code,
          name: form.name,
          description: form.description,
          level: parseInt(form.level),
          is_active: form.is_active,
          permissions: form.permissions,
          created_at: new Date().toISOString(),
        };
        
        const updatedList = [...roleList, newRole];
        saveRolesToStorage(updatedList, nextId + 1);
        setNextId(nextId + 1);
      }

      setDialogOpen(false);
      toast.success(editingRole ? '角色已更新' : '角色已创建');
      fetchRoles();
    } catch (error) {
      console.error('保存角色失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;

    try {
      const roleList = getRolesFromStorage();
      const updatedList = roleList.filter(role => role.id !== deletingRole.id);
      
      saveRolesToStorage(updatedList);

      setDeleteDialogOpen(false);
      setDeletingRole(null);
      toast.success('角色已删除');
      fetchRoles();
    } catch (error) {
      console.error('删除角色失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-sky-100 text-sky-800';
      case 3: return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return '一级';
      case 2: return '二级';
      case 3: return '三级';
      default: return '未知';
    }
  };

  const togglePermission = (permValue: string) => {
    setForm(prev => {
      if (prev.permissions.includes(permValue)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permValue) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permValue] };
      }
    });
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            角色权限管理
          </CardTitle>
          <CardDescription>
            管理系统角色和权限配置
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索角色名称或编码..."
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
                  <TableHead>角色编码</TableHead>
                  <TableHead>角色名称</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>权限数量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      暂无角色数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <code className="text-sm text-muted-foreground">{role.code}</code>
                      </TableCell>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(role.level)}>
                          {getLevelLabel(role.level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                          {role.permissions.length} 项
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.is_active ? 'default' : 'secondary'}>
                          {role.is_active ? '启用' : '禁用'}
                        </Badge>
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

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                <Label htmlFor="code">角色编码 *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value})}
                  placeholder="例如：admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">角色名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value})}
                  placeholder="例如：系统管理员"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value})}
                placeholder="描述此角色的用途"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>权限配置</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                {PERMISSIONS.map((perm) => (
                  <div key={perm.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${perm.value}`}
                      checked={form.permissions.includes(perm.value)}
                      onCheckedChange={() => togglePermission(perm.value)}
                    />
                    <Label htmlFor={`perm-${perm.value}`} className="text-sm cursor-pointer">
                      {perm.label}
                    </Label>
                  </div>
                ))}
              </div>
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
