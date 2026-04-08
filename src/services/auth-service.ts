/**
 * 认证服务 - 生产环境版本
 * 负责用户登录、会话管理
 * 支持Supabase和API降级
 */

export interface User {
  id: number;
  username: string;
  name: string;
  role_id: number | null;
  organization_id: number | null;
  department: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

// 密码哈希（客户端）
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_warehouse_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// 登录验证
export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    // 直接调用登录API（服务端处理密码哈希，避免HTTP下crypto.subtle不可用）
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || '用户名或密码错误'
      };
    }

    const data = await response.json();
    
    if (data.user) {
      return {
        success: true,
        user: data.user
      };
    }

    return {
      success: false,
      error: data.error || '用户名或密码错误'
    };
  } catch (error) {
    console.error('登录失败:', error);
    return { success: false, error: '网络连接失败，请检查网络' };
  }
}

// 保存登录状态
export function saveSession(user: User): void {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('username', user.username);
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// 清除登录状态
export function clearSession(): void {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('currentUser');
}

// 获取当前用户
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  return localStorage.getItem('isLoggedIn') === 'true';
}
