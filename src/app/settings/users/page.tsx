'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, User, Building2, Shield } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Role {
  id: number;
  code: string;
  name: string;
  level: number;
}

interface Warehouse {
  id: number;
  code: string;
  name: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  role_id: number | null;
  role_name: string;
  department: string;
  is_active: boolean;
  warehouses: number[];
  created_at: string;
}

interface UserForm {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  department: string;
  is_active: boolean;
  warehouses: number[];
}

const initialForm: UserForm = {
  username: '',
  password: '',
  name: '',
  email: '',
  phone: '',
  role_id: '',
  department: '',
  is_active: true,
  warehouses: [],
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const client = getSupabaseClient();
      
      // 获取角色列表
      const { data: rolesData } = await client
        .from('roles')
        .select('*')
        .eq('is_active', true);
      
      // 获取仓库列表
      const { data: warehousesData } = await client
        .from('warehouses')
        .select('*')
        .eq('is_active', true);

      // 获取用户列表
      let query = client.from('users').select('*, roles(*)').order('id', { ascending: false });

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      const { data: usersData } = await query;

      setRoles(rolesData || []);
      setWarehouses(warehousesData || []);
      setUsers(
        usersData?.map((user: any) => ({
          ...user,
          role_name: user.roles?.name || '未分配',
          warehouses: [],
        })) || []
      );
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setForm({
        username: user.username,
        password: '',
        name: user.name,
        email: user.email || '',
        phone: user.phone || '',
        role_id: user.role_id?.toString() || '',
        department: user.department || '',
        is_active: user.is_active,
        warehouses: user.warehouses || [],
      });
    } else {
      setEditingUser(null);
      setForm(initialForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.username || !form.name || (!editingUser && !form.password)) {
      alert('请填写必填项');
      return;
    }

    try {
      const client = getSupabaseClient();

      const userData: any = {
        username: form.username,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        role_id: form.role_id ? parseInt(form.role_id) : null,
        department: form.department || null,
        is_active: form.is_active,
      };

      if (!editingUser) {
        userData.password = form.password;
      } else if (form.password) {
        userData.password = form.password;
      }

      let error;
      if (editingUser) {
        const result = await client
          .from('users')
          .update(userData)
          .eq('id', editingUser.id)
          .select();
        error = result.error;
      } else {
        const result = await client.from('users').insert(userData).select();
        error = result.error;
      }

      if (error) throw error;

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('保存用户失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('users')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchData();
    } catch (error) {
      console.error('删除用户失败:', error);
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
          <h2 className="text-xl font-semibold">用户管理</h2>
          <p className="text-muted-foreground mt-1">管理系统用户和权限</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新增用户
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索用户名或姓名..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 用户列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>电话</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {user.username}
                    </div>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {user.role_name}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.department || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('zh-CN')}
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
            <DialogTitle>{editingUser ? '编辑用户' : '新增用户'}</DialogTitle>
            <DialogDescription>
              {editingUser ? '修改用户信息' : '填写用户基本信息'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editingUser}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? '新密码（留空不修改）' : '密码 *'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? '留空不修改密码' : '请输入密码'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select value={form.role_id} onValueChange={(value) => setForm({ ...form, role_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name} (级别: {role.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="请输入电话"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="请输入部门"
              />
            </div>
            <div className="space-y-2">
              <Label>可访问仓库</Label>
              <div className="grid grid-cols-2 gap-2">
                {warehouses.map((wh) => (
                  <div key={wh.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`warehouse-${wh.id}`}
                      checked={form.warehouses.includes(wh.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setForm({ ...form, warehouses: [...form.warehouses, wh.id] });
                        } else {
                          setForm({ ...form, warehouses: form.warehouses.filter(id => id !== wh.id) });
                        }
                      }}
                    />
                    <Label htmlFor={`warehouse-${wh.id}`} className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {wh.name}
                    </Label>
                  </div>
                ))}
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
              <Label htmlFor="is_active">启用用户</Label>
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
              确定要删除用户&quot;{deletingUser?.name}&quot;吗？此操作不可恢复。
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
