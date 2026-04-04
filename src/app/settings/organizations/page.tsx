'use client';

import { useEffect, useState, Fragment } from 'react';
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
import { toast } from 'sonner';

// 引入服务层
import { 
  Organization, 
  OrganizationFormData, 
  fetchOrganizations, 
  createOrganization, 
  updateOrganization, 
  deleteOrganization 
} from '@/services/organization-service';

const ORGANIZATION_TYPES = [
  { value: 'bureau', label: '公安局机关', level: 1 },
  { value: 'department', label: '公安处机关', level: 2 },
  { value: 'team', label: '所队', level: 3 },
];

interface OrganizationForm {
  code: string;
  name: string;
  type: string;
  parent_id: string;
  sort_order: string;
  is_active: boolean;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [flatOrganizations, setFlatOrganizations] = useState<Organization[]>([]);
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

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      // 使用服务层获取数据
      const savedData = await fetchOrganizations();
      setFlatOrganizations(savedData);
      
      // 构建树形结构
      const tree = buildOrganizationTree(savedData || []);
      setOrganizations(tree);
      
      // 默认展开顶级节点
      const topLevelIds = (savedData || [])
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

    flatList.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

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
    loadOrganizations();
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
        type: 'team',
        parent_id: '',
        sort_order: '0',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const getOrganizationById = (id: number): Organization | null => {
    return flatOrganizations.find(org => org.id === id) || null;
  };

  const handleSave = async () => {
    try {
      if (!form.code || !form.name || !form.type) {
        toast.error('请填写必填字段');
        return;
      }

      const selectedType = ORGANIZATION_TYPES.find(t => t.value === form.type);
      const level = selectedType?.level || 1;
      
      let path = null;
      if (form.parent_id) {
        const parentOrg = getOrganizationById(parseInt(form.parent_id));
        if (parentOrg) {
          path = parentOrg.path ? `${parentOrg.path}.${form.parent_id}` : form.parent_id;
        }
      }

      const formData: OrganizationFormData = {
        code: form.code,
        name: form.name,
        type: form.type,
        level: level,
        parent_id: form.parent_id ? parseInt(form.parent_id) : undefined,
        path: path,
        sort_order: form.sort_order ? parseInt(form.sort_order) : undefined,
        is_active: form.is_active,
      };

      if (editingOrg) {
        await updateOrganization(editingOrg.id, formData);
        toast.success('组织架构已更新');
      } else {
        await createOrganization(formData);
        toast.success('组织架构已创建');
      }

      setDialogOpen(false);
      setEditingOrg(null);
      loadOrganizations();
    } catch (error) {
      console.error('保存组织架构失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingOrg) return;

    try {
      await deleteOrganization(deletingOrg.id);
      setDeleteDialogOpen(false);
      setDeletingOrg(null);
      toast.success('组织架构已删除');
      loadOrganizations();
    } catch (error) {
      console.error('删除组织架构失败:', error);
      toast.error('删除失败，请重试');
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
    const flatten = (orgs: Organization[]): Organization[] => {
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
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-sky-100 text-sky-800';
      case 3: return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOrganizationRow = (org: Organization, level: number = 0) => {
    const hasChildren = org.children && org.children.length > 0;
    const isExpanded = expandedNodes.has(org.id);
    const indent = level * 24;

    return (
      <Fragment key={org.id}>
        <TableRow>
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
      </Fragment>
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
            管理公安局机关、公安处机关、所队等多级组织机构，上级机关可查看管理下级数据（已迁移至 Supabase）
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
                  onChange={(e) => setForm({ ...form, code: e.target.value})}
                  placeholder="例如：GAJ001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">组织名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value})}
                  placeholder="例如：市公安局"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">组织类型 *</Label>
                <Select
                  value={form.type || 'team'}
                  onValueChange={(value) => setForm({ ...form, type: value})}
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
                  value={form.parent_id || 'none'}
                  onValueChange={(value) => setForm({ ...form, parent_id: value === 'none' ? '' : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="无（顶级组织）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无（顶级组织）</SelectItem>
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
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 flex items-center">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked})}
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
