'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { loginUser, initDefaultUsers } from '@/services/user-service';
import { fetchSystemConfigs, getSystemConfigSync } from '@/services/system-config-service';

const DEFAULT_CONFIG = {
  unit_name: 'XX市公安局',
  unit_logo_url: '',
  system_title: '库房管理系统',
  copyright_text: '© 2024 XX市公安局 版权所有',
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // 先用同步缓存，再异步从数据库加载
    const cached = getSystemConfigSync();
    setConfig(cached);
    
    fetchSystemConfigs().then(cfg => setConfig(cfg)).catch(console.error);
    
    // 初始化默认用户密码
    initDefaultUsers().catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 真实登录验证
      const user = await loginUser(formData.username, formData.password);
      
      if (user) {
        // 保存登录状态到 localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user.username);
        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          username: user.username,
          name: user.name,
          role_id: user.role_id,
          organization_id: user.organization_id,
          department: user.department,
          avatar_url: user.avatar_url || null,
          email: user.email || null,
          phone: user.phone || null,
        }));
        
        // 跳转到首页
        router.push('/');
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 顶部Logo和标题 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {config.unit_logo_url ? (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <img
                  src={config.unit_logo_url}
                  alt="Logo"
                  className="w-14 h-14 object-contain"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {config.system_title}
          </h1>
          <p className="text-gray-600 mt-2">{config.unit_name}</p>
        </div>

        {/* 登录卡片 */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">用户登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    className="pl-10"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? '登录中...' : '登 录'}
              </Button>
            </form>

            {/* 默认账号提示 */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
              <p className="font-medium text-blue-700 mb-1">默认账号：</p>
              <p>管理员：admin / admin123</p>
              <p>库管员：manager / 123456</p>
            </div>
          </CardContent>
        </Card>

        {/* 底部版权 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>{config.copyright_text}</p>
        </div>
      </div>
    </div>
  );
}
