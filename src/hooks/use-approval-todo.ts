'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
      const client = getSupabaseClient();

      // 并行查询所有待审核的单据
      const [
        inboundCount,
        outboundCount,
        stockCountCount,
        transferCount,
      ] = await Promise.all([
        client
          .from('inbound_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        client
          .from('outbound_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        client
          .from('stock_counts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        client
          .from('transfer_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      const inbound = inboundCount.count || 0;
      const outbound = outboundCount.count || 0;
      const stockCount = stockCountCount.count || 0;
      const transfer = transferCount.count || 0;
      const total = inbound + outbound + stockCount + transfer;

      setStats({
        total,
        inbound,
        outbound,
        stockCount,
        transfer,
      });
    } catch (error) {
      console.error('获取审核待办统计失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodoStats();
    
    // 每30秒刷新一次
    const interval = setInterval(fetchTodoStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchTodoStats]);

  return {
    stats,
    loading,
    refresh: fetchTodoStats,
  };
}
