
'use client';

import { useEffect, useState } from 'react';
import { Search, Check, X, Eye, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, ArrowLeftRight } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface AuditItem {
  id: number;
  type: 'inbound' | 'outbound' | 'stock_count' | 'transfer';
  order_no: string;
  warehouse_name: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_by: string;
  created_at: string;
  remark?: string;
  supplier?: string;
  customer?: string;
  items?: any[];
}

function getAuditItems(): AuditItem[] {
  try {
    const saved = localStorage.getItem('auditItems');
    if (saved) {
      return JSON.parse(saved);
    }
    const defaultItems = [
      { id: 1, type: 'inbound', order_no: 'IN202401002', warehouse_name: '主仓库', status: 'pending', supplier: '劳保用品厂', remark: '补充库存', created_by: '王五', created_at: '2024-01-16T09:15:00Z' },
      { id: 2, type: 'outbound', order_no: 'OUT202401002', warehouse_name: '主仓库', status: 'pending', customer: '派出所B', remark: '应急物资', created_by: '王五', created_at: '2024-01-16T14:20:00Z' },
      { id: 3, type: 'transfer', order_no: 'TR202401002', from_warehouse_name: '分仓库', to_warehouse_name: '主仓库', warehouse_name: '分仓库', status: 'pending', remark: '退回物资', created_by: '王五', created_at: '2024-01-16T14:20:00Z' },
      { id: 4, type: 'inbound', order_no: 'IN202401001', warehouse_name: '主仓库', status: 'approved', supplier: '安防设备有限公司', remark: '常规采购', created_by: '张三', created_at: '2024-01-15T10:30:00Z' },
      { id: 5, type: 'outbound', order_no: 'OUT202401001', warehouse_name: '主仓库', status: 'approved', customer: '派出所A', remark: '日常领用', created_by: '张三', created_at: '2024-01-14T09:00:00Z' },
    ];
    localStorage.setItem('auditItems', JSON.stringify(defaultItems));
    return defaultItems;
  } catch {
    return [];
  }
}

function saveAuditItems(items: AuditItem[]) {
  try {
    localStorage.setItem('auditItems', JSON.stringify(items));
  } catch {
    console.error('Failed to save');
  }
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionComment, setActionComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() =&gt; {
    fetchApprovals();
  }, [activeTab]);

  const fetchApprovals = () =&gt; {
    setLoading(true);
    try {
      const items = getAuditItems();
      if (activeTab === 'pending') {
        setApprovals(items.filter(item =&gt; item.status === 'pending'));
      } else {
        setApprovals(items.filter(item =&gt; item.status !== 'pending'));
      }
    } catch (error) {
      console.error('获取审核列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (item: AuditItem) =&gt; {
    setSelectedApproval(item);
    setDetailDialogOpen(true);
  };

  const handleApproveClick = (item: AuditItem) =&gt; {
    setSelectedApproval(item);
    setActionType('approve');
    setActionComment('');
    setActionDialogOpen(true);
  };

  const handleRejectClick = (item: AuditItem) =&gt; {
    setSelectedApproval(item);
    setActionType('reject');
    setActionComment('');
    setActionDialogOpen(true);
  };

  const handleConfirmAction = () =&gt; {
    if (!selectedApproval || !actionType) return;
    
    setProcessing(true);
    try {
      const items = getAuditItems();
      const updatedItems = items.map(item =&gt; {
        if (item.id === selectedApproval.id) {
          return {
            ...item,
            status: actionType === 'approve' ? 'approved' : 'rejected',
            remark: actionComment || item.remark,
          };
        }
        return item;
      });
      saveAuditItems(updatedItems);
      
      alert(actionType === 'approve' ? '审核通过成功！' : '审核拒绝成功！');
      setActionDialogOpen(false);
      setSelectedApproval(null);
      setActionType(null);
      setActionComment('');
      fetchApprovals();
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const getTypeIcon = (type: string) =&gt; {
    switch (type) {
      case 'inbound':
        return &lt;ArrowDownToLine className="h-4 w-4 text-green-500" /&gt;;
      case 'outbound':
        return &lt;ArrowUpFromLine className="h-4 w-4 text-blue-500" /&gt;;
      case 'stock_count':
        return &lt;ClipboardCheck className="h-4 w-4 text-purple-500" /&gt;;
      case 'transfer':
        return &lt;ArrowLeftRight className="h-4 w-4 text-orange-500" /&gt;;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) =&gt; {
    const typeMap: Record&lt;string, string&gt; = {
      inbound: '入库',
      outbound: '出库',
      stock_count: '盘点',
      transfer: '调拨',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) =&gt; {
    const statusMap: Record&lt;string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }&gt; = {
      pending: { label: '待审核', variant: 'secondary' },
      approved: { label: '已通过', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
      completed: { label: '已完成', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return &lt;Badge variant={config.variant}&gt;{config.label}&lt;/Badge&gt;;
  };

  const formatDate = (dateString: string) =&gt; {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const filteredApprovals = approvals.filter(item =&gt;
    item.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.created_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    &lt;div className="space-y-6"&gt;
      &lt;div className="flex items-center justify-between"&gt;
        &lt;div&gt;
          &lt;h1 className="text-3xl font-bold tracking-tight"&gt;审核管理&lt;/h1&gt;
          &lt;p className="text-muted-foreground"&gt;
            管理入库、出库、盘点和调拨单据的审核流程
          &lt;/p&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}&gt;
        &lt;TabsList&gt;
          &lt;TabsTrigger value="pending"&gt;待审核&lt;/TabsTrigger&gt;
          &lt;TabsTrigger value="approved"&gt;已审核&lt;/TabsTrigger&gt;
        &lt;/TabsList&gt;

        &lt;TabsContent value="pending" className="space-y-4"&gt;
          &lt;div className="flex items-center gap-2"&gt;
            &lt;Input
              placeholder="搜索单据号、仓库或创建人..."
              value={searchQuery}
              onChange={(e) =&gt; setSearchQuery(e.target.value)}
              className="max-w-sm"
            /&gt;
            &lt;Search className="h-4 w-4 text-muted-foreground" /&gt;
          &lt;/div&gt;

          &lt;div className="rounded-lg border"&gt;
            &lt;Table&gt;
              &lt;TableHeader&gt;
                &lt;TableRow&gt;
                  &lt;TableHead&gt;类型&lt;/TableHead&gt;
                  &lt;TableHead&gt;单据号&lt;/TableHead&gt;
                  &lt;TableHead&gt;仓库&lt;/TableHead&gt;
                  &lt;TableHead&gt;状态&lt;/TableHead&gt;
                  &lt;TableHead&gt;创建人&lt;/TableHead&gt;
                  &lt;TableHead&gt;创建时间&lt;/TableHead&gt;
                  &lt;TableHead className="text-right"&gt;操作&lt;/TableHead&gt;
                &lt;/TableRow&gt;
              &lt;/TableHeader&gt;
              &lt;TableBody&gt;
                {loading ? (
                  &lt;TableRow&gt;
                    &lt;TableCell colSpan={7} className="text-center py-10"&gt;
                      加载中...
                    &lt;/TableCell&gt;
                  &lt;/TableRow&gt;
                ) : filteredApprovals.length === 0 ? (
                  &lt;TableRow&gt;
                    &lt;TableCell colSpan={7} className="text-center py-10 text-muted-foreground"&gt;
                      暂无待审核单据
                    &lt;/TableCell&gt;
                  &lt;/TableRow&gt;
                ) : (
                  filteredApprovals.map((item) =&gt; (
                    &lt;TableRow key={item.id}&gt;
                      &lt;TableCell&gt;
                        &lt;div className="flex items-center gap-2"&gt;
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        &lt;/div&gt;
                      &lt;/TableCell&gt;
                      &lt;TableCell className="font-medium"&gt;{item.order_no}&lt;/TableCell&gt;
                      &lt;TableCell&gt;
                        {item.type === 'transfer' ? (
                          &lt;div&gt;
                            &lt;div&gt;{item.from_warehouse_name}&lt;/div&gt;
                            &lt;div className="text-xs text-muted-foreground"&gt;→ {item.to_warehouse_name}&lt;/div&gt;
                          &lt;/div&gt;
                        ) : (
                          item.warehouse_name
                        )}
                      &lt;/TableCell&gt;
                      &lt;TableCell&gt;{getStatusBadge(item.status)}&lt;/TableCell&gt;
                      &lt;TableCell&gt;{item.created_by}&lt;/TableCell&gt;
                      &lt;TableCell&gt;{formatDate(item.created_at)}&lt;/TableCell&gt;
                      &lt;TableCell className="text-right"&gt;
                        &lt;div className="flex items-center justify-end gap-2"&gt;
                          &lt;Button variant="ghost" size="sm" onClick={() =&gt; handleViewDetail(item)}&gt;
                            &lt;Eye className="h-4 w-4 mr-1" /&gt;
                            查看
                          &lt;/Button&gt;
                          &lt;Button variant="ghost" size="sm" onClick={() =&gt; handleApproveClick(item)}&gt;
                            &lt;Check className="h-4 w-4 mr-1 text-green-500" /&gt;
                            通过
                          &lt;/Button&gt;
                          &lt;Button variant="ghost" size="sm" onClick={() =&gt; handleRejectClick(item)}&gt;
                            &lt;X className="h-4 w-4 mr-1 text-red-500" /&gt;
                            拒绝
                          &lt;/Button&gt;
                        &lt;/div&gt;
                      &lt;/TableCell&gt;
                    &lt;/TableRow&gt;
                  ))
                )}
              &lt;/TableBody&gt;
            &lt;/Table&gt;
          &lt;/div&gt;
        &lt;/TabsContent&gt;

        &lt;TabsContent value="approved" className="space-y-4"&gt;
          &lt;div className="flex items-center gap-2"&gt;
            &lt;Input
              placeholder="搜索单据号、仓库或创建人..."
              value={searchQuery}
              onChange={(e) =&gt; setSearchQuery(e.target.value)}
              className="max-w-sm"
            /&gt;
            &lt;Search className="h-4 w-4 text-muted-foreground" /&gt;
          &lt;/div&gt;

          &lt;div className="rounded-lg border"&gt;
            &lt;Table&gt;
              &lt;TableHeader&gt;
                &lt;TableRow&gt;
                  &lt;TableHead&gt;类型&lt;/TableHead&gt;
                  &lt;TableHead&gt;单据号&lt;/TableHead&gt;
                  &lt;TableHead&gt;仓库&lt;/TableHead&gt;
                  &lt;TableHead&gt;状态&lt;/TableHead&gt;
                  &lt;TableHead&gt;创建人&lt;/TableHead&gt;
                  &lt;TableHead&gt;创建时间&lt;/TableHead&gt;
                  &lt;TableHead className="text-right"&gt;操作&lt;/TableHead&gt;
                &lt;/TableRow&gt;
              &lt;/TableHeader&gt;
              &lt;TableBody&gt;
                {loading ? (
                  &lt;TableRow&gt;
                    &lt;TableCell colSpan={7} className="text-center py-10"&gt;
                      加载中...
                    &lt;/TableCell&gt;
                  &lt;/TableRow&gt;
                ) : filteredApprovals.length === 0 ? (
                  &lt;TableRow&gt;
                    &lt;TableCell colSpan={7} className="text-center py-10 text-muted-foreground"&gt;
                      暂无已审核单据
                    &lt;/TableCell&gt;
                  &lt;/TableRow&gt;
                ) : (
                  filteredApprovals.map((item) =&gt; (
                    &lt;TableRow key={item.id}&gt;
                      &lt;TableCell&gt;
                        &lt;div className="flex items-center gap-2"&gt;
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        &lt;/div&gt;
                      &lt;/TableCell&gt;
                      &lt;TableCell className="font-medium"&gt;{item.order_no}&lt;/TableCell&gt;
                      &lt;TableCell&gt;
                        {item.type === 'transfer' ? (
                          &lt;div&gt;
                            &lt;div&gt;{item.from_warehouse_name}&lt;/div&gt;
                            &lt;div className="text-xs text-muted-foreground"&gt;→ {item.to_warehouse_name}&lt;/div&gt;
                          &lt;/div&gt;
                        ) : (
                          item.warehouse_name
                        )}
                      &lt;/TableCell&gt;
                      &lt;TableCell&gt;{getStatusBadge(item.status)}&lt;/TableCell&gt;
                      &lt;TableCell&gt;{item.created_by}&lt;/TableCell&gt;
                      &lt;TableCell&gt;{formatDate(item.created_at)}&lt;/TableCell&gt;
                      &lt;TableCell className="text-right"&gt;
                        &lt;Button variant="ghost" size="sm" onClick={() =&gt; handleViewDetail(item)}&gt;
                          &lt;Eye className="h-4 w-4 mr-1" /&gt;
                          查看
                        &lt;/Button&gt;
                      &lt;/TableCell&gt;
                    &lt;/TableRow&gt;
                  ))
                )}
              &lt;/TableBody&gt;
            &lt;/Table&gt;
          &lt;/div&gt;
        &lt;/TabsContent&gt;
      &lt;/Tabs&gt;

      {/* 详情对话框 */}
      &lt;Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}&gt;
        &lt;DialogContent className="max-w-2xl"&gt;
          &lt;DialogHeader&gt;
            &lt;DialogTitle&gt;审核详情&lt;/DialogTitle&gt;
            &lt;DialogDescription&gt;
              {selectedApproval &amp;&amp; `${getTypeLabel(selectedApproval.type)}单 - ${selectedApproval.order_no}`}
            &lt;/DialogDescription&gt;
          &lt;/DialogHeader&gt;
          {selectedApproval &amp;&amp; (
            &lt;div className="space-y-4"&gt;
              &lt;div className="grid grid-cols-2 gap-4"&gt;
                &lt;div&gt;
                  &lt;label className="text-sm font-medium text-muted-foreground"&gt;类型&lt;/label&gt;
                  &lt;div className="flex items-center gap-2 mt-1"&gt;
                    {getTypeIcon(selectedApproval.type)}
                    {getTypeLabel(selectedApproval.type)}
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;label className="text-sm font-medium text-muted-foreground"&gt;状态&lt;/label&gt;
                  &lt;div className="mt-1"&gt;{getStatusBadge(selectedApproval.status)}&lt;/div&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;label className="text-sm font-medium text-muted-foreground"&gt;仓库&lt;/label&gt;
                  &lt;div className="mt-1"&gt;
                    {selectedApproval.type === 'transfer' ? (
                      &lt;div&gt;
                        &lt;div&gt;{selectedApproval.from_warehouse_name}&lt;/div&gt;
                        &lt;div className="text-xs text-muted-foreground"&gt;→ {selectedApproval.to_warehouse_name}&lt;/div&gt;
                      &lt;/div&gt;
                    ) : (
                      selectedApproval.warehouse_name
                    )}
                  &lt;/div&gt;
                &lt;/div&gt;
                &lt;div&gt;
                  &lt;label className="text-sm font-medium text-muted-foreground"&gt;创建人&lt;/label&gt;
                  &lt;div className="mt-1"&gt;{selectedApproval.created_by}&lt;/div&gt;
                &lt;/div&gt;
              &lt;/div&gt;
              {selectedApproval.remark &amp;&amp; (
                &lt;div&gt;
                  &lt;label className="text-sm font-medium text-muted-foreground"&gt;备注&lt;/label&gt;
                  &lt;div className="mt-1 text-sm"&gt;{selectedApproval.remark}&lt;/div&gt;
                &lt;/div&gt;
              )}
            &lt;/div&gt;
          )}
          &lt;DialogFooter&gt;
            &lt;Button onClick={() =&gt; setDetailDialogOpen(false)}&gt;关闭&lt;/Button&gt;
          &lt;/DialogFooter&gt;
        &lt;/DialogContent&gt;
      &lt;/Dialog&gt;

      {/* 审核操作对话框 */}
      &lt;Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}&gt;
        &lt;DialogContent&gt;
          &lt;DialogHeader&gt;
            &lt;DialogTitle&gt;
              {actionType === 'approve' ? '审核通过' : '审核拒绝'}
            &lt;/DialogTitle&gt;
            &lt;DialogDescription&gt;
              {selectedApproval &amp;&amp; `${getTypeLabel(selectedApproval.type)}单 - ${selectedApproval.order_no}`}
            &lt;/DialogDescription&gt;
          &lt;/DialogHeader&gt;
          &lt;div className="space-y-4"&gt;
            &lt;div&gt;
              &lt;label className="text-sm font-medium text-muted-foreground"&gt;审核意见（可选）&lt;/label&gt;
              &lt;Textarea
                placeholder="请输入审核意见..."
                value={actionComment}
                onChange={(e) =&gt; setActionComment(e.target.value)}
                className="mt-1"
              /&gt;
            &lt;/div&gt;
          &lt;/div&gt;
          &lt;DialogFooter&gt;
            &lt;Button variant="ghost" onClick={() =&gt; setActionDialogOpen(false)} disabled={processing}&gt;
              取消
            &lt;/Button&gt;
            &lt;Button 
              onClick={handleConfirmAction} 
              disabled={processing}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            &gt;
              {processing ? '处理中...' : (actionType === 'approve' ? '确认通过' : '确认拒绝')}
            &lt;/Button&gt;
          &lt;/DialogFooter&gt;
        &lt;/DialogContent&gt;
      &lt;/Dialog&gt;
    &lt;/div&gt;
  );
}
