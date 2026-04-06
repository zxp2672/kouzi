import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function getSupabaseCredentials(): SupabaseCredentials {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_COZE_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_COZE_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;

  // 如果没有设置环境变量，返回占位值而不是报错
  // 这样可以避免页面崩溃
  if (!url || !anonKey) {
    console.warn('Supabase environment variables not set, using mock credentials');
    return {
      url: 'https://mock.supabase.co',
      anonKey: 'mock-key'
    };
  }

  return { url, anonKey };
}

function getSupabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}

// 创建一个模拟的 Supabase 客户端，避免在没有配置时报错
function createMockClient(): SupabaseClient {
  // 创建一个最小化的 mock 客户端
  const mockClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          limit: () => ({ data: null, error: null }),
          order: () => ({ data: null, error: null }),
          single: () => ({ data: null, error: null }),
          data: null,
          error: null,
          count: 0
        }),
        match: () => ({ data: null, error: null }),
        data: null,
        error: null,
        count: 0
      }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
      upsert: () => ({ data: null, error: null }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: () => ({ data: null, error: null }),
        createSignedUrl: () => ({ data: null, error: null })
      })
    }
  } as unknown as SupabaseClient;

  return mockClient;
}

function getSupabaseClient(token?: string): SupabaseClient {
  try {
    const { url, anonKey } = getSupabaseCredentials();

    // 如果是 mock 的 URL，返回 mock 客户端
    if (url === 'https://mock.supabase.co') {
      console.warn('Using mock Supabase client - database features will be limited');
      return createMockClient();
    }

    let key: string;
    if (token) {
      key = anonKey;
    } else {
      const serviceRoleKey = getSupabaseServiceRoleKey();
      key = serviceRoleKey ?? anonKey;
    }

    if (token) {
      return createClient(url, key, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        db: {
          timeout: 60000,
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return createClient(url, key, {
      db: {
        timeout: 60000,
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.warn('Failed to create Supabase client, using mock client:', error);
    return createMockClient();
  }
}

// 为了兼容性，保留 loadEnv 存在但不做任何事
function loadEnv(): void {
  // 在客户端不需要加载环境变量
}

export { loadEnv, getSupabaseCredentials, getSupabaseServiceRoleKey, getSupabaseClient };
