import { query } from '@/lib/postgres';

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
    const result = await query('SELECT config_key, config_value FROM system_configs');
    
    const configMap: SystemConfigMap = { ...DEFAULT_CONFIGS };
    for (const row of result.rows) {
      configMap[row.config_key] = row.config_value || DEFAULT_CONFIGS[row.config_key] || '';
    }

    // 同步到 localStorage 作为缓存
    try {
      localStorage.setItem('system_configs', JSON.stringify(configMap));
    } catch { /* ignore */ }

    return configMap;
  } catch (error) {
    console.warn('PostgreSQL 获取系统配置失败，使用 localStorage:', error);
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
    const now = new Date().toISOString();

    // 逐项 upsert
    for (const [key, value] of Object.entries(configs)) {
      await query(
        `INSERT INTO system_configs (config_key, config_value, updated_at) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (config_key) 
         DO UPDATE SET config_value = $2, updated_at = $3`,
        [key, value, now]
      );
    }

    return true;
  } catch (error) {
    console.error('PostgreSQL 保存系统配置失败:', error);
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
