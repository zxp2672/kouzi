'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchInboundOrders } from '@/services/inbound-service';
import { fetchOutboundOrders } from '@/services/outbound-service';
import { fetchStockCounts } from '@/services/stockcount-service';
import { fetchTransferOrders } from '@/services/transfer-service';

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
      
      // 从数据库获取实际的待审核数据
      let inboundCount = 0;
      let outboundCount = 0;
      let stockCountCount = 0;
      let transferCount = 0;

      try {
        // 获取入库单待审核数量
        const inboundOrders = await fetchInboundOrders();
        inboundCount = inboundOrders.filter(o => o.status === 'pending').length;
      } catch (e) {
        console.error('获取入库单统计失败:', e);
      }

      try {
        // 获取出库单待审核数量
        const outboundOrders = await fetchOutboundOrders();
        outboundCount = outboundOrders.filter(o => o.status === 'pending').length;
      } catch (e) {
        console.error('获取出库单统计失败:', e);
      }

      try {
        // 获取盘点单待审核数量
        const stockCounts = await fetchStockCounts();
        stockCountCount = stockCounts.filter(c => c.status === 'pending').length;
      } catch (e) {
        console.error('获取盘点单统计失败:', e);
      }

      try {
        // 获取调拨单待审核数量
        const transferOrders = await fetchTransferOrders();
        transferCount = transferOrders.filter(o => o.status === 'pending').length;
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
    
    // 监听 storage 变化（localStorage 模式）
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
    
    // 定期检查更新（每 5 秒）- 同时支持数据库和 localStorage
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
