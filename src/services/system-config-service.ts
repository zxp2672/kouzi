import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

export interface SystemConfigMap {
  unit_name: string;
  unit_logo_url: string;
  system_title: string;
  copyright_text: string;
  [key: string]: string;
}

const DEFAULT_CONFIGS: SystemConfigMap = {
  unit_name: 'XX市公安局',
  unit_logo_url: '',
  system_title: '库房管理系统',
  copyright_text: '© 2024 XX市公安局 版权所有',
};

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const { url } = getSupabaseCredentials();
    return url !== 'https://mock.supabase.co';
  } catch {
    return false;
  }
}

/**
 * 获取所有系统配置
 */
export async function fetchSystemConfigs(): Promise<SystemConfigMap> {
  const hasSupabase = await isSupabaseAvailable();

  if (!hasSupabase) {
    return getConfigsFromLocalStorage();
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('system_configs')
      .select('config_key, config_value');

    if (error || !data || data.length === 0) {
      console.warn('Supabase 获取系统配置失败，降级 localStorage:', error);
      return getConfigsFromLocalStorage();
    }

    const configMap: SystemConfigMap = { ...DEFAULT_CONFIGS };
    for (const row of data) {
      configMap[row.config_key] = row.config_value || DEFAULT_CONFIGS[row.config_key] || '';
    }

    // 同步到 localStorage 作为缓存
    try {
      localStorage.setItem('system_configs', JSON.stringify(configMap));
    } catch { /* ignore */ }

    return configMap;
  } catch (error) {
    console.warn('Supabase 不可用，使用 localStorage:', error);
    return getConfigsFromLocalStorage();
  }
}

/**
 * 保存系统配置
 */
export async function saveSystemConfigs(configs: SystemConfigMap): Promise<boolean> {
  const hasSupabase = await isSupabaseAvailable();

  // 始终同步到 localStorage（作为缓存和降级方案）
  try {
    localStorage.setItem('system_configs', JSON.stringify(configs));
  } catch { /* ignore */ }

  if (!hasSupabase) {
    return true;
  }

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    // 逐项 upsert
    for (const [key, value] of Object.entries(configs)) {
      const { error } = await client
        .from('system_configs')
        .upsert(
          {
            config_key: key,
            config_value: value,
            updated_at: now,
          },
          { onConflict: 'config_key' }
        );

      if (error) {
        console.warn(`保存配置 ${key} 失败:`, error);
      }
    }

    return true;
  } catch (error) {
    console.error('Supabase 保存系统配置失败:', error);
    return true; // localStorage 已保存，返回成功
  }
}

/**
 * 获取系统配置（同步版本，用于不支持 async 的地方）
 * 优先从 localStorage 缓存读取
 */
export function getSystemConfigSync(): SystemConfigMap {
  return getConfigsFromLocalStorage();
}

function getConfigsFromLocalStorage(): SystemConfigMap {
  try {
    const saved = localStorage.getItem('system_configs');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        unit_name: parsed.unit_name || DEFAULT_CONFIGS.unit_name,
        unit_logo_url: parsed.unit_logo_url || DEFAULT_CONFIGS.unit_logo_url,
        system_title: parsed.system_title || DEFAULT_CONFIGS.system_title,
        copyright_text: parsed.copyright_text || DEFAULT_CONFIGS.copyright_text,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIGS };
}
