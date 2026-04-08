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
    // 尝试从API获取用户列表
    const response = await fetch('/api/users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.warn('API获取用户失败，尝试直接调用Supabase');
      // 如果API失败，尝试直接调用user-service
      const { loginUser } = await import('./user-service');
      const user = await loginUser(username, password);
      
      if (user) {
        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role_id: user.role_id,
            organization_id: user.organization_id,
            department: user.department,
            avatar_url: user.avatar_url,
            email: user.email,
            phone: user.phone,
            is_active: user.is_active
          }
        };
      } else {
        return { success: false, error: '用户名或密码错误' };
      }
    }

    const users = await response.json();
    
    // 查找用户
    const user = users.find((u: any) => u.username === username && u.is_active);
    
    if (!user) {
      return { success: false, error: '用户名或密码错误' };
    }

    // 验证密码
    if (user.password_hash) {
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return { success: false, error: '用户名或密码错误' };
      }
    } else {
      // 没有密码哈希，使用默认密码
      if (password !== '123456') {
        return { success: false, error: '用户名或密码错误' };
      }
    }

    // 登录成功，返回用户信息
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role_id: user.role_id,
        organization_id: user.organization_id,
        department: user.department,
        avatar_url: user.avatar_url,
        email: user.email,
        phone: user.phone,
        is_active: user.is_active
      }
    };
  } catch (error) {
    console.error('登录失败:', error);
    return { success: false, error: '登录失败，请重试' };
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
