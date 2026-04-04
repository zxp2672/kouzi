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

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  is_active: boolean;
  created_at: string;
}

interface UserForm {
  username: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  is_active: boolean;
}

// 默认角色
const ROLES = [
  { value: 'admin', label: '系统管理员' },
  { value: 'manager', label: '部门管理员' },
  { value: 'operator', label: '操作员' },
  { value: 'viewer', label: '查看者' },
];

// 默认组织
const ORGANIZATIONS = [
  { value: 'gaj', label: 'XX市公安局' },
  { value: 'gac', label: 'XX区公安处' },
  { value: 'pcs', label: 'XX派出所' },
];

// 默认示例用户
const DEFAULT_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    name: '系统管理员',
    email: 'admin@gaj.gov.cn',
    phone: '13800138000',
    role: 'admin',
    organization: 'gaj',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    username: 'zhangsan',
    name: '张三',
    email: 'zhangsan@gac.gov.cn',
    phone: '13800138001',
    role: 'manager',
    organization: 'gac',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    username: 'lisi',
    name: '李四',
    email: 'lisi@pcs.gov.cn',
    phone: '13800138002',
    role: 'operator',
    organization: 'pcs',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'users';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [nextId, setNextId] = useState(4);
  const [form, setForm] = useState<UserForm>({
    username: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    organization: '',
    is_active: true,
  });

  const getUsersFromStorage = (): User[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.users || DEFAULT_USERS;
      }
    } catch (error) {
      console.error('读取用户数据失败:', error);
    }
    return DEFAULT_USERS;
  };

  const saveUsersToStorage = (userList: User[], newNextId?: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        users: userList,
        nextId: newNextId || nextId
      }));
    } catch (error) {
      console.error('保存用户数据失败:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // 从 localStorage 读取数据
      const savedUsers = getUsersFromStorage();
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
      
      setUsers(savedUsers);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setForm({
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization,
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setForm({
        username: '',
        name: '',
        email: '',
        phone: '',
        role: '',
        organization: '',
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

      const userList = getUsersFromStorage();
      
      if (editingUser) {
        // 编辑现有用户
        const updatedList = userList.map(user => {
          if (user.id === editingUser.id) {
            return {
              ...user,
              ...form,
            };
          }
          return user;
        });
        
        saveUsersToStorage(updatedList);
      } else {
        // 新增用户
        const newUser: User = {
          id: nextId,
          ...form,
          created_at: new Date().toISOString(),
        };
        
        const updatedList = [...userList, newUser];
        saveUsersToStorage(updatedList, nextId + 1);
        setNextId(nextId + 1);
      }

      setDialogOpen(false);
      toast.success(editingUser ? '用户已更新' : '用户已创建');
      fetchUsers();
    } catch (error) {
      console.error('保存用户失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const userList = getUsersFromStorage();
      const updatedList = userList.filter(user => user.id !== deletingUser.id);
      
      saveUsersToStorage(updatedList);

      setDeleteDialogOpen(false);
      setDeletingUser(null);
      toast.success('用户已删除');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  const getOrganizationLabel = (org: string) => {
    return ORGANIZATIONS.find(o => o.value === org)?.label || org;
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            用户管理
          </CardTitle>
          <CardDescription>
            管理系统用户，分配角色和所属组织
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
                  <TableHead>角色</TableHead>
                  <TableHead>所属组织</TableHead>
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
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {getOrganizationLabel(user.organization)}
                        </div>
                      </TableCell>
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

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? '编辑用户' : '新增用户'}
            </DialogTitle>
            <DialogDescription>
              填写用户信息，设置角色和所属组织
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
                  placeholder="例如：admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value})}
                  placeholder="例如：张三"
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
                  placeholder="example@gaj.gov.cn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value})}
                  placeholder="13800138000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm({ ...form, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
