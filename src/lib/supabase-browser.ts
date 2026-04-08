/**
 * Supabase客户端 - 浏览器端直接使用
 * 用于EdgeOne等不支持Node.js API路由的环境
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase配置
const SUPABASE_URL = 'https://rcyeqrjalfzczdyspbog.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4';

let supabaseInstance: SupabaseClient | null = null;

/**
 * 获取Supabase客户端单例
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('✅ Supabase客户端已初始化');
  }
  return supabaseInstance;
}

/**
 * 测试Supabase连接
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase连接失败:', error.message);
      return false;
    }
    
    console.log('✅ Supabase连接成功');
    return true;
  } catch (error) {
    console.error('❌ Supabase连接异常:', error);
    return false;
  }
}
