import { getSupabase } from '@/lib/supabase-browser';

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

/**
 * 获取所有系统配置
 */
export async function fetchSystemConfigs(): Promise<SystemConfigMap> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('system_configs')
      .select('config_key, config_value');

    if (error) {
      console.error('获取系统配置失败:', error.message);
      return getConfigsFromLocalStorage();
    }

    // 转换为键值对
    const configMap: SystemConfigMap = { ...DEFAULT_CONFIGS };
    if (data) {
      for (const row of data) {
        configMap[row.config_key] = row.config_value || '';
      }
    }

    // 同步到 localStorage
    try {
      localStorage.setItem('system_configs', JSON.stringify(configMap));
    } catch { /* ignore */ }

    return configMap;
  } catch (error) {
    console.warn('获取系统配置异常，使用 localStorage:', error);
    return getConfigsFromLocalStorage();
  }
}

/**
 * 保存系统配置
 */
export async function saveSystemConfigs(configs: SystemConfigMap): Promise<boolean> {
  // 始终同步到 localStorage（作为缓存和降级方案）
  try {
    localStorage.setItem('system_configs', JSON.stringify(configs));
  } catch { /* ignore */ }

  try {
    const response = await fetch('/api/system-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configs)
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('保存系统配置失败:', error);
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
