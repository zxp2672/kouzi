'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, FileCheck, Layers, ArrowRight, GripVertical, X, ChevronsUp, ChevronUp, ChevronDown, ChevronsDown } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ApprovalFlow,
  ApprovalStep,
  ApprovalFlowFormData,
  fetchApprovalFlows,
  createApprovalFlow,
  updateApprovalFlow,
  deleteApprovalFlow,
} from '@/services/approval-flow-service';
import { fetchRoles, Role } from '@/services/role-service';
import { fetchOrganizations, Organization } from '@/services/organization-service';

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

export default function ApprovalFlowsPage() {
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFlow, setDeletingFlow] = useState<ApprovalFlow | null>(null);
  
  // 角色和组织数据
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // 审核步骤编辑
  const [steps, setSteps] = useState<ApprovalStep[]>([]);

  const [form, setForm] = useState<ApprovalFlowForm>({
    code: '',
    name: '',
    type: '',
    organization: '',
    is_active: true,
  });

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const [savedFlows, roleData, orgData] = await Promise.all([
        fetchApprovalFlows(),
        fetchRoles().catch(() => []),
        fetchOrganizations().catch(() => []),
      ]);
      setFlows(savedFlows);
      setRoles(roleData.filter(r => r.is_active));
      setOrganizations(orgData.filter(o => o.is_active));
    } catch (error) {
      console.error('获取数据失败:', error);
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
      setSteps(flow.steps.length > 0 ? flow.steps : [
        { id: 1, name: '操作员提交', order: 1, required_role: '', description: '操作员创建单据' },
      ]);
    } else {
      setEditingFlow(null);
      setForm({
        code: '',
        name: '',
        type: '',
        organization: '',
        is_active: true,
      });
      setSteps([
        { id: Date.now(), name: '操作员提交', order: 1, required_role: '', description: '操作员创建单据' },
      ]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.code || !form.name || !form.type) {
        toast.error('请填写必填字段');
        return;
      }
      if (steps.length === 0) {
        toast.error('请至少添加一个审核节点');
        return;
      }
      // 校验每个节点都选择了角色
      for (let i = 0; i < steps.length; i++) {
        if (!steps[i].required_role) {
          toast.error(`请为第${i + 1}个节点选择审核角色`);
          return;
        }
      }

      const flowData: ApprovalFlowFormData = {
        code: form.code,
        name: form.name,
        type: form.type,
        organization: form.organization,
        steps: steps.map((s, idx) => ({ ...s, order: idx + 1 })),
        is_active: form.is_active,
      };

      if (editingFlow) {
        await updateApprovalFlow(editingFlow.id, flowData);
      } else {
        await createApprovalFlow(flowData);
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
      await deleteApprovalFlow(deletingFlow.id);

      setDeleteDialogOpen(false);
      setDeletingFlow(null);
      toast.success('审核流程已删除');
      fetchFlows();
    } catch (error) {
      console.error('删除审核流程失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 审核步骤管理函数
  const addStep = () => {
    const newStep: ApprovalStep = {
      id: Date.now(),
      name: `审核节点${steps.length + 1}`,
      order: steps.length + 1,
      required_role: '',
      description: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: number) => {
    if (steps.length <= 1) {
      toast.error('至少保留一个审核节点');
      return;
    }
    setSteps(steps.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const updateStep = (id: number, field: keyof ApprovalStep, value: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const moveStep = (index: number, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const newSteps = [...steps];
    if (direction === 'top' && index > 0) {
      const [item] = newSteps.splice(index, 1);
      newSteps.unshift(item);
    } else if (direction === 'bottom' && index < newSteps.length - 1) {
      const [item] = newSteps.splice(index, 1);
      newSteps.push(item);
    } else if (direction === 'up' && index > 0) {
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    } else if (direction === 'down' && index < newSteps.length - 1) {
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    }
    setSteps(newSteps.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  const getTypeLabel = (type: string) => {
    return ORDER_TYPES.find(t => t.value === type)?.label || type;
  };

  const getOrganizationLabel = (org: string) => {
    return organizations.find(o => o.id === parseInt(org))?.name || org;
  };

  const getRoleLabel = (role: string) => {
    return roles.find(r => r.code === role)?.name || role;
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
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={String(org.id)}>
                        {org.name}
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

            {/* 审核节点编辑器 */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">审核节点配置</Label>
                <Button size="sm" variant="outline" onClick={addStep}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  添加节点
                </Button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {steps.map((step, index) => (
                  <div key={step.id} className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Badge variant="secondary" className="text-xs shrink-0">第{index + 1}步</Badge>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                        placeholder="节点名称"
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'top')} disabled={index === 0}>
                          <ChevronsUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'up')} disabled={index === 0}>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(index, 'bottom')} disabled={index === steps.length - 1}>
                          <ChevronsDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 shrink-0" onClick={() => removeStep(step.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">审核角色 *</Label>
                        <Select
                          value={step.required_role}
                          onValueChange={(value) => updateStep(step.id, 'required_role', value)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(r => (
                              <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">节点说明</Label>
                        <Input
                          value={step.description}
                          onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                          placeholder="可选说明"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
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
