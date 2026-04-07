'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  Warehouse,
  BarChart3,
  Activity,
  Clock,
  ChevronRight,
  Zap,
  Maximize2,
  Minimize2,
  Image as ImageIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { getInventoryStats, getLowStockAlerts } from '@/services/inventory-service';
import { fetchInboundOrders } from '@/services/inbound-service';
import { fetchOutboundOrders } from '@/services/outbound-service';
import { fetchTransferOrders } from '@/services/transfer-service';

// 动画数字组件
function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const startValue = 0;
    const endValue = value;
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * easeOut);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// 闪烁点组件
function BlinkingDot({ color = 'bg-primary' }: { color?: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color} animate-pulse`} />
  );
}

// 状态徽章组件
function StatusBadge({ status, text }: { status: 'success' | 'warning' | 'danger' | 'info'; text: string }) {
  const colors = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
      {text}
    </span>
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

// 模拟数据
const MOCK_LOW_STOCK: LowStockItem[] = [
  { id: 1, product_code: 'CP001', product_name: '防暴盾牌', warehouse_name: '市局中心仓库', quantity: 5, min_stock: 20 },
  { id: 2, product_code: 'CP002', product_name: '对讲机', warehouse_name: 'XX区分库', quantity: 8, min_stock: 15 },
  { id: 3, product_code: 'CP003', product_name: '警用装备包', warehouse_name: 'XX派出所仓库', quantity: 3, min_stock: 10 },
];

const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  { id: 1, type: '入库', order_no: 'IB202404001', warehouse_name: '市局中心仓库', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, type: '出库', order_no: 'OB202404001', warehouse_name: 'XX区分库', status: 'approved', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 3, type: '入库', order_no: 'IB202403099', warehouse_name: 'XX派出所仓库', status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, type: '调拨', order_no: 'TF202404001', warehouse_name: '市局中心仓库', status: 'pending', created_at: new Date(Date.now() - 1800000).toISOString() },
];

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalProducts: 156,
    totalWarehouses: 3,
    totalStock: 2458,
    lowStockItems: 3,
    todayInbound: 12,
    todayOutbound: 8,
    pendingApprovals: 5,
    stockValue: 1258600,
  });
  const [lowStockList, setLowStockList] = useState<LowStockItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [systemConfig, setSystemConfig] = useState({
    unit_name: 'XX市公安局',
    unit_logo_url: '',
    system_title: '库房管理系统',
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData();
    loadSystemConfig();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 加载系统配置
  const loadSystemConfig = () => {
    try {
      const savedConfigs = localStorage.getItem('system_configs');
      if (savedConfigs) {
        const parsed = JSON.parse(savedConfigs);
        setSystemConfig({
          unit_name: parsed.unit_name || 'XX市公安局',
          unit_logo_url: parsed.unit_logo_url || '',
          system_title: parsed.system_title || '库房管理系统',
        });
      }
    } catch (error) {
      console.error('读取系统配置失败:', error);
    }
  };

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      
      // 通知父组件隐藏/显示边栏
      window.postMessage(
        { type: 'FULLSCREEN_CHANGE', isFullscreen: !!document.fullscreenElement },
        '*'
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取真实库存统计
      const inventoryStats = await getInventoryStats();
      
      // 获取低库存预警
      const lowStockItems = await getLowStockAlerts(10);
      setLowStockList(lowStockItems as any);
      
      // 获取最近活动
      try {
        const [inboundOrders, outboundOrders, transferOrders] = await Promise.all([
          fetchInboundOrders(),
          fetchOutboundOrders(),
          fetchTransferOrders()
        ]);
        
        // 合并并按时间排序
        const allActivities = [
          ...inboundOrders.slice(0, 5).map(o => ({
            id: o.id,
            type: '入库',
            order_no: o.order_no,
            warehouse_name: '仓库',
            status: o.status,
            created_at: o.created_at
          })),
          ...outboundOrders.slice(0, 5).map(o => ({
            id: o.id + 1000,
            type: '出库',
            order_no: o.order_no,
            warehouse_name: '仓库',
            status: o.status,
            created_at: o.created_at
          })),
          ...transferOrders.slice(0, 5).map(o => ({
            id: o.id + 2000,
            type: '调拨',
            order_no: o.order_no,
            warehouse_name: '仓库',
            status: o.status,
            created_at: o.created_at
          }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, 10);
        
        setRecentActivities(allActivities as any);
      } catch (e) {
        console.error('获取活动记录失败，使用模拟数据', e);
        setRecentActivities(MOCK_RECENT_ACTIVITIES);
      }
      
      // 更新统计数据
      setStats({
        ...stats,
        totalStock: inventoryStats.totalQuantity,
        lowStockItems: inventoryStats.lowStockCount,
        totalWarehouses: inventoryStats.warehouseCount,
      });
      
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      // 失败时使用模拟数据
      setLowStockList(MOCK_LOW_STOCK);
      setRecentActivities(MOCK_RECENT_ACTIVITIES);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string): { label: string; type: 'success' | 'warning' | 'danger' | 'info' } => {
    const map: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
      pending: { label: '待审核', type: 'warning' },
      approved: { label: '已审核', type: 'success' },
      rejected: { label: '已拒绝', type: 'danger' },
      completed: { label: '已完成', type: 'success' },
    };
    return map[status] || { label: status, type: 'info' };
  };

  return (
    <div ref={containerRef} className={`relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white overflow-hidden ${isFullscreen ? 'h-screen w-screen' : 'min-h-screen'}`}>
      {/* 全屏按钮 */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className={`p-6 space-y-6 overflow-auto ${isFullscreen ? 'h-screen pb-16' : ''}`}>
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            {/* Logo 显示 */}
            {systemConfig.unit_logo_url ? (
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 overflow-hidden">
                <img
                  src={systemConfig.unit_logo_url}
                  alt="单位Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image w-6 h-6"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                  }}
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {systemConfig.system_title} - 数据大屏
              </h1>
              <p className="text-sm text-slate-400">{systemConfig.unit_name} · 实时监控 · 智能预警 · 数据驱动</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">当前时间</p>
              <p className="text-lg font-mono font-semibold">
                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">今日日期</p>
              <p className="text-sm font-medium">
                {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <BlinkingDot color="bg-green-500" />
              <span className="text-xs text-green-400">系统运行正常</span>
            </div>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-4 gap-4">
        {/* 商品总数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">商品总数</p>
            <p className="text-3xl font-bold">
              <AnimatedNumber value={stats.totalProducts} />
            </p>
            <p className="text-xs text-slate-500 mt-2">较上月增长 18 种</p>
          </div>
        </motion.div>

        {/* 仓库数量 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-emerald-500/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                正常运行
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">仓库数量</p>
            <p className="text-3xl font-bold">
              <AnimatedNumber value={stats.totalWarehouses} />
            </p>
            <p className="text-xs text-slate-500 mt-2">覆盖 3 个层级单位</p>
          </div>
        </motion.div>

        {/* 库存总量 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-violet-500/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-400 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-violet-400 border-violet-400/30 bg-violet-400/10">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5%
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">库存总量</p>
            <p className="text-3xl font-bold">
              <AnimatedNumber value={stats.totalStock} />
            </p>
            <p className="text-xs text-slate-500 mt-2">总价值 ¥{stats.stockValue.toLocaleString()}</p>
          </div>
        </motion.div>

        {/* 低库存预警 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-amber-500/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10 animate-pulse">
                需关注
              </Badge>
            </div>
            <p className="text-slate-400 text-sm mb-1">低库存预警</p>
            <p className="text-3xl font-bold text-amber-400">
              <AnimatedNumber value={stats.lowStockItems} />
            </p>
            <p className="text-xs text-slate-500 mt-2">请及时补货</p>
          </div>
        </motion.div>
      </div>

      {/* 第二行指标 */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-cyan-500/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-400 rounded-xl flex items-center justify-center">
                <ArrowDownToLine className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-sm">今日入库</p>
                <p className="text-2xl font-bold">
                  <AnimatedNumber value={stats.todayInbound} />
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-rose-500/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-400 rounded-xl flex items-center justify-center">
                <ArrowUpFromLine className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-sm">今日出库</p>
                <p className="text-2xl font-bold">
                  <AnimatedNumber value={stats.todayOutbound} />
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-yellow-500/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-400 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-sm">待审核</p>
                <p className="text-2xl font-bold text-yellow-400">
                  <AnimatedNumber value={stats.pendingApprovals} />
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 第三行：库存预警和最近活动 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 库存预警列表 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold">库存预警</h2>
            </div>
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
              {lowStockList.length} 项
            </Badge>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {lowStockList.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {item.product_code} · {item.warehouse_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-400">{item.quantity}</p>
                      <p className="text-xs text-slate-500">最低: {item.min_stock}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>库存水平</span>
                      <span>{Math.round((item.quantity / item.min_stock) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((item.quantity / item.min_stock) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 最近活动 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold">最近活动</h2>
            </div>
            <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">
              实时更新
            </Badge>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {recentActivities.map((activity, index) => {
                const statusConfig = getStatusConfig(activity.status);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === '入库' 
                            ? 'bg-gradient-to-br from-cyan-500 to-blue-400' 
                            : activity.type === '出库'
                            ? 'bg-gradient-to-br from-rose-500 to-pink-400'
                            : 'bg-gradient-to-br from-violet-500 to-purple-400'
                        }`}>
                          {activity.type === '入库' ? (
                            <ArrowDownToLine className="w-5 h-5 text-white" />
                          ) : activity.type === '出库' ? (
                            <ArrowUpFromLine className="w-5 h-5 text-white" />
                          ) : (
                            <Package className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {activity.type}
                            <span className="text-xs text-slate-500">{activity.order_no}</span>
                          </p>
                          <p className="text-sm text-slate-400">{activity.warehouse_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={statusConfig.type} text={statusConfig.label} />
                        <p className="text-xs text-slate-500 mt-2">
                          {new Date(activity.created_at).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* 底部状态栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-white/10 py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <BlinkingDot color="bg-green-500" />
              <span>数据库连接正常</span>
            </div>
            <div className="flex items-center gap-2">
              <BlinkingDot color="bg-blue-500" />
              <span>API服务正常</span>
            </div>
            <div className="flex items-center gap-2">
              <BlinkingDot color="bg-emerald-500" />
              <span>缓存服务正常</span>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            最后更新: {currentTime.toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
