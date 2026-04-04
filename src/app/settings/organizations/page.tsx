'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, ChevronRight, ChevronDown } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface Organization {
  id: number;
  code: string;
  name: string;
  type: string;
  level: number;
  parent_id: number | null;
  path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  children?: Organization[];
}

interface OrganizationForm {
  code: string;
  name: string;
  type: string;
  parent_id: string;
  sort_order: string;
  is_active: boolean;
}

const ORGANIZATION_TYPES = [
  { value: 'bureau', label: '公安局机关', level: 1 },
  { value: 'department', label: '公安处机关', level: 2 },
  { value: 'team', label: '所队', level: 3 },
];

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<OrganizationForm>({
    code: '',
    name: '',
    type: '',
    parent_id: '',
    sort_order: '0',
    is_active: true,
  });

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('organizations')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // 构建树形结构
      const tree = buildOrganizationTree(data || []);
      setOrganizations(tree);
      
      // 默认展开顶级节点
      const topLevelIds = (data || [])
        .filter(org => org.parent_id === null)
        .map(org => org.id);
      setExpandedNodes(new Set(topLevelIds));
    } catch (error) {
      console.error('获取组织架构失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildOrganizationTree = (flatList: Organization[]): Organization[] => {
    const map = new Map<number, Organization>();
    const roots: Organization[] = [];

    // 首先创建所有节点
    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    // 构建树
    flatList.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parent_id === null) {
        roots.push(node);
      } else {
        const parent = map.get(item.parent_id);
        if (parent) {
          parent.children?.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleOpenDialog = (org?: Organization) => {
    if (org) {
      setEditingOrg(org);
      setForm({
        code: org.code,
        name: org.name,
        type: org.type,
        parent_id: org.parent_id?.toString() || '',
        sort_order: org.sort_order.toString(),
        is_active: org.is_active,
      });
    } else {
      setEditingOrg(null);
      setForm({
        code: '',
        name: '',
        type: '',
        parent_id: '',
        sort_order: '0',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.code || !form.name || !form.type) {
        alert('请填写必填字段');
        return;
      }

      const client = getSupabaseClient();
      
      const selectedType = ORGANIZATION_TYPES.find(t => t.value === form.type);
      const level = selectedType?.level || 1;
      
      // 计算路径
      let path = null;
      if (form.parent_id) {
        const parentOrg = await getOrganizationById(parseInt(form.parent_id));
        if (parentOrg) {
          path = parentOrg.path ? `${parentOrg.path}.${form.parent_id}` : form.parent_id;
        }
      }

      const orgData = {
        code: form.code,
        name: form.name,
        type: form.type,
        level: level,
        parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        path: path,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
      };

      if (editingOrg) {
        const { error } = await client
          .from('organizations')
          .update({ ...orgData, updated_at: new Date().toISOString() })
          .eq('id', editingOrg.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from('organizations')
          .insert(orgData);
        if (error) throw error;
      }

      setDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      console.error('保存组织失败:', error);
      alert('保存失败，请重试');
    }
  };

  const getOrganizationById = async (id: number): Promise<Organization | null> => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取组织信息失败:', error);
      return null;
    }
  };

  const handleDelete = async () => {
    if (!deletingOrg) return;

    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from('organizations')
        .delete()
        .eq('id', deletingOrg.id);
      if (error) throw error;

      setDeleteDialogOpen(false);
      setDeletingOrg(null);
      fetchOrganizations();
    } catch (error) {
      console.error('删除组织失败:', error);
      alert('删除失败，请重试');
    }
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const getAvailableParents = (currentOrg?: Organization | null): Organization[] => {
    // 扁平化组织列表
    const flatten = (orgs: Organization[]): any[] => {
      let result: Organization[] = [];
      orgs.forEach(org => {
        if (!currentOrg || org.id !== currentOrg.id) {
          result.push(org);
          if (org.children && org.children.length > 0) {
            result = result.concat(flatten(org.children).filter(
              (child: Organization) => !currentOrg || child.id !== currentOrg.id
            ));
          }
        }
      });
      return result;
    };
    return flatten(organizations);
  };

  const getOrganizationTypeLabel = (type: string) => {
    return ORGANIZATION_TYPES.find(t => t.value === type)?.label || type;
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-100 text-red-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOrganizationRow = (org: Organization, level: number = 0): any => {
    const hasChildren = org.children && org.children.length > 0;
    const isExpanded = expandedNodes.has(org.id);
    const indent = level * 24;

    return (
      <>
        <TableRow key={org.id}>
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingLeft: `${indent}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(org.id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {!hasChildren && <span className="w-6" />}
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{org.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-sm text-muted-foreground">{org.code}</code>
          </TableCell>
          <TableCell>
            <Badge className={getLevelColor(org.level)}>
              {getOrganizationTypeLabel(org.type)}
            </Badge>
          </TableCell>
          <TableCell className="text-muted-foreground">
            {org.sort_order}
          </TableCell>
          <TableCell>
            <Badge variant={org.is_active ? 'default' : 'secondary'}>
              {org.is_active ? '启用' : '禁用'}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenDialog(org)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDeletingOrg(org);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && org.children?.map(child => 
          renderOrganizationRow(child, level + 1)
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            组织架构管理
          </CardTitle>
          <CardDescription>
            管理公安局机关、公安处机关、所队等多级组织机构，上级机关可查看管理下级数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索组织名称或编码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增组织
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>组织名称</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>排序</TableHead>
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
                ) : organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      暂无组织数据
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map(org => renderOrganizationRow(org))
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
              {editingOrg ? '编辑组织' : '新增组织'}
            </DialogTitle>
            <DialogDescription>
              填写组织信息，支持三级架构：公安局机关 → 公安处机关 → 所队
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">组织编码 *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="例如：GAJ001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">组织名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：市公安局"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">组织类型 *</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择组织类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} (第{type.level}级)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">上级组织</Label>
                <Select
                  value={form.parent_id}
                  onValueChange={(value) => setForm({ ...form, parent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="无（顶级组织）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无（顶级组织）</SelectItem>
                    {getAvailableParents(editingOrg).map((org) => (
                      <SelectItem key={org.id} value={org.id.toString()}>
                        {org.name} ({getOrganizationTypeLabel(org.type)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">排序序号</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 flex items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label htmlFor="is_active">启用</Label>
                </div>
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
              确定要删除组织&quot;{deletingOrg?.name}&quot;吗？此操作不可恢复。
              {deletingOrg && deletingOrg.children?.length ? ' 注意：该组织下还有子组织，将一并删除！' : ''}
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
