'use client';

import { useState, useEffect, useCallback } from 'react';

interface TodoStats {
  total: number;
  inbound: number;
  outbound: number;
  stockCount: number;
  transfer: number;
}

export function useApprovalTodo() {
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    inbound: 0,
    outbound: 0,
    stockCount: 0,
    transfer: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchTodoStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // 从 localStorage 获取实际的待审核数据
      let inboundCount = 0;
      let outboundCount = 0;
      let stockCountCount = 0;
      let transferCount = 0;

      try {
        // 获取入库单待审核数量
        const inboundOrders = localStorage.getItem('inbound_orders');
        if (inboundOrders) {
          const orders = JSON.parse(inboundOrders);
          inboundCount = orders.filter((o: any) => o.status === 'pending').length;
        }
      } catch (e) {
        console.error('获取入库单统计失败:', e);
      }

      try {
        // 获取出库单待审核数量
        const outboundOrders = localStorage.getItem('outbound_orders');
        if (outboundOrders) {
          const orders = JSON.parse(outboundOrders);
          outboundCount = orders.filter((o: any) => o.status === 'pending').length;
        }
      } catch (e) {
        console.error('获取出库单统计失败:', e);
      }

      try {
        // 获取盘点单待审核数量
        const stockCounts = localStorage.getItem('stock_counts');
        if (stockCounts) {
          const counts = JSON.parse(stockCounts);
          stockCountCount = counts.filter((c: any) => c.status === 'pending').length;
        }
      } catch (e) {
        console.error('获取盘点单统计失败:', e);
      }

      try {
        // 获取调拨单待审核数量
        const transferOrders = localStorage.getItem('transfer_orders');
        if (transferOrders) {
          const orders = JSON.parse(transferOrders);
          transferCount = orders.filter((o: any) => o.status === 'pending').length;
        }
      } catch (e) {
        console.error('获取调拨单统计失败:', e);
      }

      const total = inboundCount + outboundCount + stockCountCount + transferCount;

      setStats({
        total,
        inbound: inboundCount,
        outbound: outboundCount,
        stockCount: stockCountCount,
        transfer: transferCount,
      });
    } catch (error) {
      console.error('获取审核待办统计失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodoStats();
    
    // 监听 storage 变化，实现跨页面同步
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inbound_orders' || 
          e.key === 'outbound_orders' || 
          e.key === 'stock_counts' || 
          e.key === 'transfer_orders' ||
          e.key === 'approvals') {
        fetchTodoStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查更新（每 5 秒）
    const interval = setInterval(fetchTodoStats, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [fetchTodoStats]);

  return {
    stats,
    loading,
    refresh: fetchTodoStats,
  };
}
