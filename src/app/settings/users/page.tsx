'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, User, Shield, Building2 } from 'lucide-react';
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
import { toast } from 'sonner';

// 引入服务层
import { 
  User as UserType, 
  UserFormData, 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '@/services/user-service';
import { Organization, fetchOrganizations } from '@/services/organization-service';
import { Role, fetchRoles } from '@/services/role-service';

interface UserForm {
  username: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  organization_id: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [form, setForm] = useState<UserForm>({
    username: '',
    name: '',
    email: '',
    phone: '',
    role_id: '',
    organization_id: '',
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [savedUsers, savedOrganizations, savedRoles] = await Promise.all([
        fetchUsers(),
        fetchOrganizations(),
        fetchRoles(),
      ]);
      
      setUsers(savedUsers);
      setOrganizations(savedOrganizations);
      setRoles(savedRoles);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (user?: UserType) => {
    if (user) {
      setEditingUser(user);
      setForm({
        username: user.username,
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        role_id: user.role_id?.toString() || '',
        organization_id: user.organization_id?.toString() || '',
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setForm({
        username: '',
        name: '',
        email: '',
        phone: '',
        role_id: '',
        organization_id: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.username || !form.name) {
        toast.error('请填写必填字段');
        return;
      }

      const formData: UserFormData = {
        username: form.username,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        role_id: form.role_id ? parseInt(form.role_id) : undefined,
        organization_id: form.organization_id ? parseInt(form.organization_id) : undefined,
        is_active: form.is_active,
      };

      if (editingUser) {
        await updateUser(editingUser.id, formData);
        toast.success('用户已更新');
      } else {
        await createUser(formData);
        toast.success('用户已创建');
      }

      setDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error('保存用户失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await deleteUser(deletingUser.id);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      toast.success('用户已删除');
      loadData();
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  const getOrganizationName = (orgId: number | null) => {
    if (!orgId) return '-';
    const org = organizations.find(o => o.id === orgId);
    return org?.name || '-';
  };

  const getRoleName = (roleId: number | null) => {
    if (!roleId) return '-';
    const role = roles.find(r => r.id === roleId);
    return role?.name || '-';
  };

  const getRoleColor = (roleId: number | null) => {
    if (!roleId) return 'bg-gray-100 text-gray-800';
    const role = roles.find(r => r.id === roleId);
    const roleName = role?.name || '';
    if (roleName.includes('管理员')) return 'bg-red-100 text-red-800';
    if (roleName.includes('部门')) return 'bg-blue-100 text-blue-800';
    if (roleName.includes('操作')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            用户管理
          </CardTitle>
          <CardDescription>
            管理系统用户，分配角色和组织权限（已迁移至 Supabase）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索用户名或姓名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增用户
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>所属组织</TableHead>
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
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role_id)}>
                          {getRoleName(user.role_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getOrganizationName(user.organization_id)}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingUser(user);
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? '编辑用户' : '新增用户'}
            </DialogTitle>
            <DialogDescription>
              填写用户信息，分配角色和组织
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value})}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value})}
                  placeholder="请输入姓名"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value})}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value})}
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={form.role_id || 'none'}
                  onValueChange={(value) => setForm({ ...form, role_id: value === 'none' ? '' : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">请选择</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">所属组织</Label>
                <Select
                  value={form.organization_id || 'none'}
                  onValueChange={(value) => setForm({ ...form, organization_id: value === 'none' ? '' : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择组织" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">请选择</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户&quot;{deletingUser?.name}&quot;吗？此操作不可恢复。
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
