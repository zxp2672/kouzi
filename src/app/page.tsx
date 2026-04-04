'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  description?: string;
}

function StatCard({ title, value, icon, trend, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface LowStockItem {
  id: number;
  product_code: string;
  product_name: string;
  warehouse_name: string;
  quantity: number;
  min_stock: number;
}

interface RecentActivity {
  id: number;
  type: string;
  order_no: string;
  warehouse_name: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    totalStock: 0,
    lowStockItems: 0,
  });
  const [lowStockList, setLowStockList] = useState<LowStockItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const client = getSupabaseClient();

      // 获取统计数据
      const [
        productsCount,
        warehousesCount,
        inventoryTotal,
        lowStockItems
      ] = await Promise.all([
        client.from('products').select('*', { count: 'exact', head: true }),
        client.from('warehouses').select('*', { count: 'exact', head: true }),
        client.from('inventory').select('quantity'),
        client
          .from('inventory')
          .select('*, products(*), warehouses(*)')
          .lt('quantity', 'products.min_stock')
          .limit(5)
      ]);

      // 计算总库存
      const totalStock = inventoryTotal.data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      setStats({
        totalProducts: productsCount.count || 0,
        totalWarehouses: warehousesCount.count || 0,
        totalStock,
        lowStockItems: lowStockItems.data?.length || 0,
      });

      setLowStockList(
        lowStockItems.data?.map((item: {
          id: number;
          products?: { code: string; name: string; min_stock: number };
          warehouses?: { name: string };
          quantity: number;
        }) => ({
          id: item.id,
          product_code: item.products?.code || '',
          product_name: item.products?.name || '',
          warehouse_name: item.warehouses?.name || '',
          quantity: item.quantity || 0,
          min_stock: item.products?.min_stock || 0,
        })) || []
      );

      // 获取最近活动（入库和出库单）
      const { data: inboundOrders } = await client
        .from('inbound_orders')
        .select('*, warehouses(*)')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: outboundOrders } = await client
        .from('outbound_orders')
        .select('*, warehouses(*)')
        .order('created_at', { ascending: false })
        .limit(3);

      const activities = [
        ...(inboundOrders || []).map((order: {
          id: number;
          order_no: string;
          warehouses?: { name: string };
          status: string;
          created_at: string;
        }) => ({
          ...order,
          type: '入库',
          warehouse_name: order.warehouses?.name || '',
        })),
        ...(outboundOrders || []).map((order: {
          id: number;
          order_no: string;
          warehouses?: { name: string };
          status: string;
          created_at: string;
        }) => ({
          ...order,
          type: '出库',
          warehouse_name: order.warehouses?.name || '',
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

      setRecentActivities(activities);
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '待审核', variant: 'secondary' },
      approved: { label: '已审核', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
      draft: { label: '草稿', variant: 'outline' },
      completed: { label: '已完成', variant: 'default' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">库存看板</h1>
        <p className="text-muted-foreground mt-2">实时监控库存状况和业务动态</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="商品总数"
          value={stats.totalProducts}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="仓库数量"
          value={stats.totalWarehouses}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="库存总量"
          value={stats.totalStock.toLocaleString()}
          icon={<ArrowDownToLine className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="低库存预警"
          value={stats.lowStockItems}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          description="商品数量低于最低库存"
        />
      </div>

      {/* 库存预警和最近活动 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 低库存预警 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              库存预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无库存预警
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.product_code} · {item.warehouse_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-600">
                        库存: {item.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        最低: {item.min_stock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无最近活动
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium flex items-center gap-2">
                        {activity.type === '入库' ? (
                          <ArrowDownToLine className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4 text-red-500" />
                        )}
                        {activity.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.order_no} · {activity.warehouse_name}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(activity.status)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
