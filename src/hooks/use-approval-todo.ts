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
      
      // 返回模拟数据 - 演示用
      // 实际项目中应该从 localStorage 或 API 获取
      const mockStats = {
        total: 5,
        inbound: 2,
        outbound: 1,
        stockCount: 1,
        transfer: 1,
      };

      setStats(mockStats);
    } catch (error) {
      console.error('获取审核待办统计失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodoStats();
  }, [fetchTodoStats]);

  return {
    stats,
    loading,
    refresh: fetchTodoStats,
  };
}
