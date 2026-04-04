'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Workflow } from 'lucide-react';
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
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface ApprovalFlow {
  id: number;
  code: string;
  name: string;
  module: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const modules = [
  { value: 'inbound', label: '入库管理' },
  { value: 'outbound', label: '出库管理' },
  { value: 'stock_count', label: '库存盘点' },
  { value: 'transfer', label: '库存调拨' },
];

export default function ApprovalFlowManagement() {
  const [flows, setFlows] = useState<ApprovalFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟数据
    setFlows([
      {
        id: 1,
        code: 'INBOUND_FLOW',
        name: '入库审核流程',
        module: 'inbound',
        description: '入库单需要主管审核后生效',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        code: 'OUTBOUND_FLOW',
        name: '出库审核流程',
        module: 'outbound',
        description: '出库单需要经理审核后生效',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, []);

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
          <h2 className="text-xl font-semibold">审核流程管理</h2>
          <p className="text-muted-foreground mt-1">配置业务单据的多级审核流程</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增流程
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索流程编码或名称..."
            className="pl-9"
          />
        </div>
      </div>

      {/* 流程列表 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>编码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>模块</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.map((flow) => (
              <TableRow key={flow.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-muted-foreground" />
                    {flow.code}
                  </div>
                </TableCell>
                <TableCell>{flow.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {modules.find(m => m.value === flow.module)?.label || flow.module}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {flow.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={flow.is_active ? 'default' : 'secondary'}>
                    {flow.is_active ? '启用' : '禁用'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(flow.created_at).toLocaleDateString('zh-CN')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          审核流程功能开发中，支持配置多级审核节点、指定审核角色等功能即将上线
        </p>
      </div>
    </div>
  );
}
