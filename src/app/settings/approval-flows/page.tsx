'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, FileCheck, Layers, ArrowRight } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface ApprovalStep {
  id: number;
  name: string;
  order: number;
  required_role: string;
  description: string;
}

interface ApprovalFlow {
  id: number;
  code: string;
  name: string;
  type: string;
  organization: string;
  steps: ApprovalStep[];
  is_active: boolean;
  created_at: string;
}

interface ApprovalFlowForm {
  code: string;
  name: string;
  type: string;
  organization: string;
  is_active: boolean;
}

// 单据类型
const ORDER_TYPES = [
  { value: 'inbound', label: '入库单' },
  { value: 'outbound', label: '出库单' },
  { value: 'stock_count', label: '盘点单' },
  { value: 'transfer', label: '调拨单' },
];

// 组织列表
const ORGANIZATIONS = [
  { value: 'gaj', label: 'XX市公安局' },
  { value: 'gac', label: 'XX区公安处' },
  { value: 'pcs', label: 'XX派出所' },
];

// 角色列表
const ROLES = [
  { value: 'admin', label: '系统管理员' },
  { value: 'manager', label: '部门管理员' },
  { value: 'operator', label: '操作员' },
];

// 默认示例审核流程
const DEFAULT_FLOWS: ApprovalFlow[] = [
  {
    id: 1,
    code: 'FLOW-IN-001',
    name: '市局入库审核流程',
    type: 'inbound',
    organization: 'gaj',
    is_active: true,
    steps: [
      { id: 1, name: '操作员提交', order: 1, required_role: 'operator', description: '操作员创建入库单' },
      { id: 2, name: '部门管理员审核', order: 2, required_role: 'manager', description: '部门管理员审核' },
      { id: 3, name: '系统管理员审批', order: 3, required_role: 'admin', description: '系统管理员最终审批' },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: 'FLOW-OUT-001',
    name: '出库审核流程',
    type: 'outbound',
    organization: 'gac',
    is_active: true,
    steps: [
      { id: 1, name: '操作员提交', order: 1, required_role: 'operator', description: '操作员创建出库单' },
      { id: 2, name: '部门管理员审核', order: 2, required_role: 'manager', description: '部门管理员审核' },
    ],
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'approval_flows';

export default function ApprovalFlowsPage() {
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFlow, setDeletingFlow] = useState<ApprovalFlow | null>(null);
  const [nextId, setNextId] = useState(3);
  const [form, setForm] = useState<ApprovalFlowForm>({
    code: '',
    name: '',
    type: '',
    organization: '',
    is_active: true,
  });

  const getFlowsFromStorage = (): ApprovalFlow[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.flows || DEFAULT_FLOWS;
      }
    } catch (error) {
      console.error('读取审核流程数据失败:', error);
    }
    return DEFAULT_FLOWS;
  };

  const saveFlowsToStorage = (flowList: ApprovalFlow[], newNextId?: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        flows: flowList,
        nextId: newNextId || nextId
      }));
    } catch (error) {
      console.error('保存审核流程数据失败:', error);
    }
  };

  const fetchFlows = async () => {
    try {
      setLoading(true);
      
      // 从 localStorage 读取数据
      const savedFlows = getFlowsFromStorage();
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
      
      setFlows(savedFlows);
    } catch (error) {
      console.error('获取审核流程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleOpenDialog = (flow?: ApprovalFlow) => {
    if (flow) {
      setEditingFlow(flow);
      setForm({
        code: flow.code,
        name: flow.name,
        type: flow.type,
        organization: flow.organization,
        is_active: flow.is_active,
      });
    } else {
      setEditingFlow(null);
      setForm({
        code: '',
        name: '',
        type: '',
        organization: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.code || !form.name || !form.type) {
        toast.error('请填写必填字段');
        return;
      }

      const flowList = getFlowsFromStorage();
      
      if (editingFlow) {
        // 编辑现有流程
        const updatedList = flowList.map(flow => {
          if (flow.id === editingFlow.id) {
            return {
              ...flow,
              code: form.code,
              name: form.name,
              type: form.type,
              organization: form.organization,
              is_active: form.is_active,
            };
          }
          return flow;
        });
        
        saveFlowsToStorage(updatedList);
      } else {
        // 新增流程 - 使用默认步骤
        const defaultSteps: ApprovalStep[] = [
          { id: 1, name: '操作员提交', order: 1, required_role: 'operator', description: '操作员创建单据' },
          { id: 2, name: '管理员审核', order: 2, required_role: 'manager', description: '管理员审核' },
        ];
        
        const newFlow: ApprovalFlow = {
          id: nextId,
          code: form.code,
          name: form.name,
          type: form.type,
          organization: form.organization,
          is_active: form.is_active,
          steps: defaultSteps,
          created_at: new Date().toISOString(),
        };
        
        const updatedList = [...flowList, newFlow];
        saveFlowsToStorage(updatedList, nextId + 1);
        setNextId(nextId + 1);
      }

      setDialogOpen(false);
      toast.success(editingFlow ? '审核流程已更新' : '审核流程已创建');
      fetchFlows();
    } catch (error) {
      console.error('保存审核流程失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  const handleDelete = async () => {
    if (!deletingFlow) return;

    try {
      const flowList = getFlowsFromStorage();
      const updatedList = flowList.filter(flow => flow.id !== deletingFlow.id);
      
      saveFlowsToStorage(updatedList);

      setDeleteDialogOpen(false);
      setDeletingFlow(null);
      toast.success('审核流程已删除');
      fetchFlows();
    } catch (error) {
      console.error('删除审核流程失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  const getTypeLabel = (type: string) => {
    return ORDER_TYPES.find(t => t.value === type)?.label || type;
  };

  const getOrganizationLabel = (org: string) => {
    return ORGANIZATIONS.find(o => o.value === org)?.label || org;
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  const filteredFlows = flows.filter(flow => 
    flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flow.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            审核流程配置
          </CardTitle>
          <CardDescription>
            配置各类单据的多级审核流程
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索流程名称或编码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              新增流程
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>流程编码</TableHead>
                  <TableHead>流程名称</TableHead>
                  <TableHead>单据类型</TableHead>
                  <TableHead>所属组织</TableHead>
                  <TableHead>审核级数</TableHead>
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
                ) : filteredFlows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      暂无审核流程数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFlows.map((flow) => (
                    <TableRow key={flow.id}>
                      <TableCell>
                        <code className="text-sm text-muted-foreground">{flow.code}</code>
                      </TableCell>
                      <TableCell className="font-medium">{flow.name}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {getTypeLabel(flow.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getOrganizationLabel(flow.organization)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Layers className="h-4 w-4 text-blue-600" />
                          {flow.steps.length} 级
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                          {flow.is_active ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(flow)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingFlow(flow);
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

          {/* 流程详情展示 */}
          {filteredFlows.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">流程详情预览</h3>
              {filteredFlows.slice(0, 2).map((flow) => (
                <Card key={flow.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{flow.name}</CardTitle>
                    <CardDescription>
                      {getTypeLabel(flow.type)} · {getOrganizationLabel(flow.organization)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {flow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2 shrink-0">
                          <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                            <div className="font-medium">{step.name}</div>
                            <div className="text-xs text-blue-600">
                              {getRoleLabel(step.required_role)}
                            </div>
                          </div>
                          {index < flow.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFlow ? '编辑审核流程' : '新增审核流程'}
            </DialogTitle>
            <DialogDescription>
              配置审核流程基本信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">流程编码 *</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value})}
                  placeholder="例如：FLOW-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">流程名称 *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value})}
                  placeholder="例如：入库审核流程"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">单据类型 *</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择单据类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
              确定要删除审核流程&quot;{deletingFlow?.name}&quot;吗？此操作不可恢复。
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
