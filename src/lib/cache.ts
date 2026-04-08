// 数据缓存管理
interface CacheItem {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class DataCache {
  private cache: Map<string, CacheItem> = new Map();
  
  // 获取缓存
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  // 设置缓存
  set(key: string, data: any, expiresIn: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }
  
  // 清除缓存
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  // 获取缓存统计
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cache = new DataCache();

// 缓存时间常量（毫秒）
export const CACHE_TTL = {
  SHORT: 30000,      // 30秒 - 频繁变化的数据
  MEDIUM: 60000,     // 1分钟 - 一般数据
  LONG: 300000,      // 5分钟 - 很少变化的数据
  VERY_LONG: 3600000 // 1小时 - 配置数据
};
