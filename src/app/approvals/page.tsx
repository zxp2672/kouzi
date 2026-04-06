'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface ApprovalItem {
  id: number;
  type: 'inbound' | 'outbound' | 'stock_count' | 'transfer';
  order_no: string;
  warehouse_name: string;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  status: string;
  created_by: string;
  created_at: string;
  remark?: string;
  supplier?: string;
  customer?: string;
  items?: Array<{
    id?: number;
    product_id: number;
    product_code?: string;
    product_name?: string;
    quantity: number;
    price?: string;
    batch_no?: string;
  }>;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/approvals');
      const data = await response.json();
      
      if (activeTab === 'pending') {
        setApprovals(data.filter((item: ApprovalItem) => item.status === 'pending'));
      } else {
        setApprovals(data.filter((item: ApprovalItem) => item.status !== 'pending'));
      }
    } catch (error) {
      console.error('获取审核列表失败:', error);
      // 如果 API 失败，使用 localStorage 作为降级方案
      const saved = localStorage.getItem('approvals');
      if (saved) {
        const items = JSON.parse(saved);
        if (activeTab === 'pending') {
          setApprovals(items.filter((item: ApprovalItem) => item.status === 'pending'));
        } else {
          setApprovals(items.filter((item: ApprovalItem) => item.status !== 'pending'));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleViewDetail = async (item: ApprovalItem) => {
    try {
      const response = await fetch(`/api/approvals/${item.id}?type=${item.type}`);
      const detail = await response.json();
      setSelectedApproval({ ...item, items: detail.items || [] });
    } catch (error) {
      console.error('获取详情失败:', error);
      setSelectedApproval({ ...item, items: [] });
    }
    setDetailDialogOpen(true);
  };

  const handleApprove = async (item: ApprovalItem) => {
    try {
      const response = await fetch(`/api/approvals/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: item.type,
          status: 'approved',
          approved_by: '系统管理员',
        }),
      });

      if (response.ok) {
        alert('审核通过成功！');
        fetchApprovals();
      } else {
        const error = await response.json();
        throw new Error(error.error || '审核失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      // 如果 API 失败，使用 localStorage 作为降级方案
      try {
        const saved = localStorage.getItem('approvals');
        const items = saved ? JSON.parse(saved) : [];
        const updatedItems = items.map((i: ApprovalItem) => {
          if (i.id === item.id && i.type === item.type) {
            return { ...i, status: 'approved' };
          }
          return i;
        });
        localStorage.setItem('approvals', JSON.stringify(updatedItems));
        alert('审核通过成功（已保存到本地）！');
        fetchApprovals();
      } catch (localStorageError) {
        alert('审核失败，请重试');
      }
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    try {
      const response = await fetch(`/api/approvals/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: item.type,
          status: 'rejected',
          approved_by: '系统管理员',
        }),
      });

      if (response.ok) {
        alert('审核拒绝成功！');
        fetchApprovals();
      } else {
        const error = await response.json();
        throw new Error(error.error || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      // 如果 API 失败，使用 localStorage 作为降级方案
      try {
        const saved = localStorage.getItem('approvals');
        const items = saved ? JSON.parse(saved) : [];
        const updatedItems = items.map((i: ApprovalItem) => {
          if (i.id === item.id && i.type === item.type) {
            return { ...i, status: 'rejected' };
          }
          return i;
        });
        localStorage.setItem('approvals', JSON.stringify(updatedItems));
        alert('审核拒绝成功（已保存到本地）！');
        fetchApprovals();
      } catch (localStorageError) {
        alert('操作失败，请重试');
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound': return <ArrowDownToLine className="h-4 w-4 text-green-500" />;
      case 'outbound': return <ArrowUpFromLine className="h-4 w-4 text-blue-500" />;
      case 'stock_count': return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
      case 'transfer': return <ArrowLeftRight className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = { inbound: '入库', outbound: '出库', stock_count: '盘点', transfer: '调拨' };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '待审核', variant: 'secondary' },
      approved: { label: '已审核', variant: 'default' },
      completed: { label: '已完成', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const filteredApprovals = approvals.filter(item =>
    item.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.created_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">审核管理</h1>
          <p className="text-muted-foreground">
            管理入库、出库、盘点和调拨单据的审核流程
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">待审核</TabsTrigger>
          <TabsTrigger value="approved">已审核</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索单据号、仓库或创建人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>单据号</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredApprovals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      暂无待审核单据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApprovals.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.order_no}</TableCell>
                      <TableCell>
                        {item.type === 'transfer' ? (
                          <div>
                            <div>{item.from_warehouse_name}</div>
                            <div className="text-xs text-muted-foreground">→ {item.to_warehouse_name}</div>
                          </div>
                        ) : (
                          item.warehouse_name
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(item)}>
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(item)}>
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                            通过
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleReject(item)}>
                            <X className="h-4 w-4 mr-1 text-red-500" />
                            拒绝
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="搜索单据号、仓库或创建人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>单据号</TableHead>
                  <TableHead>仓库</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredApprovals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      暂无已审核单据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApprovals.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          {getTypeLabel(item.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.order_no}</TableCell>
                      <TableCell>
                        {item.type === 'transfer' ? (
                          <div>
                            <div>{item.from_warehouse_name}</div>
                            <div className="text-xs text-muted-foreground">→ {item.to_warehouse_name}</div>
                          </div>
                        ) : (
                          item.warehouse_name
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.created_by}</TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(item)}>
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {detailDialogOpen && selectedApproval && (
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>审核详情</DialogTitle>
              <DialogDescription>
                {`${getTypeLabel(selectedApproval.type)}单 - ${selectedApproval.order_no}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">类型</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeIcon(selectedApproval.type)}
                    {getTypeLabel(selectedApproval.type)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <div className="mt-1">{getStatusBadge(selectedApproval.status)}</div>
                </div>
              </div>
              {selectedApproval.supplier && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">供应商</label>
                  <p className="mt-1">{selectedApproval.supplier}</p>
                </div>
              )}
              {selectedApproval.customer && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">客户</label>
                  <p className="mt-1">{selectedApproval.customer}</p>
                </div>
              )}
              {selectedApproval.remark && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">备注</label>
                  <p className="mt-1">{selectedApproval.remark}</p>
                </div>
              )}
              {selectedApproval.items && selectedApproval.items.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">商品明细</label>
                  <div className="mt-2 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>商品编码</TableHead>
                          <TableHead>商品名称</TableHead>
                          <TableHead className="text-right">数量</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedApproval.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_code || '-'}</TableCell>
                            <TableCell>{item.product_name || '-'}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              {selectedApproval.status === 'pending' && (
                <>
                  <Button variant="outline" onClick={() => { handleReject(selectedApproval); setDetailDialogOpen(false); }}>
                    <X className="mr-2 h-4 w-4" />
                    拒绝
                  </Button>
                  <Button onClick={() => { handleApprove(selectedApproval); setDetailDialogOpen(false); }}>
                    <Check className="mr-2 h-4 w-4" />
                    通过
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
