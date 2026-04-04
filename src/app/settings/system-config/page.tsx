'use client';

import { useEffect, useState } from 'react';
import { Save, Upload, Image as ImageIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface SystemConfig {
  id: number;
  config_key: string;
  config_value: string | null;
  config_type: string;
  description: string | null;
  updated_at: string;
}

const DEFAULT_CONFIGS = [
  {
    key: 'unit_name',
    value: 'XX市公安局',
    type: 'string',
    description: '单位名称，显示在登录页和系统标题中',
  },
  {
    key: 'unit_logo_url',
    value: '',
    type: 'image',
    description: '单位Logo图片URL',
  },
  {
    key: 'system_title',
    value: '库房管理系统',
    type: 'string',
    description: '系统标题',
  },
  {
    key: 'copyright_text',
    value: '© 2024 XX市公安局 版权所有',
    type: 'string',
    description: '版权信息',
  },
];

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const client = getSupabaseClient();
      const { data, error } = await client
        .from('system_configs')
        .select('*');

      if (error) throw error;

      // 构建配置对象
      const configMap: Record<string, string> = {};
      
      // 先设置默认值
      DEFAULT_CONFIGS.forEach(config => {
        configMap[config.key] = config.value;
      });

      // 然后用数据库中的值覆盖
      if (data) {
        data.forEach((config: SystemConfig) => {
          if (config.config_value !== null) {
            configMap[config.config_key] = config.config_value;
          }
        });
      }

      setConfigs(configMap);
      setLogoPreview(configMap['unit_logo_url'] || null);
    } catch (error) {
      console.error('获取系统配置失败:', error);
      // 使用默认配置
      const defaultMap: Record<string, string> = {};
      DEFAULT_CONFIGS.forEach(config => {
        defaultMap[config.key] = config.value;
      });
      setConfigs(defaultMap);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const client = getSupabaseClient();

      // 逐个保存配置
      for (const key of Object.keys(configs)) {
        const { error } = await client
          .from('system_configs')
          .upsert({
            config_key: key,
            config_value: configs[key],
            config_type: DEFAULT_CONFIGS.find(c => c.key === key)?.type || 'string',
            description: DEFAULT_CONFIGS.find(c => c.key === key)?.description || '',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'config_key',
          });

        if (error) throw error;
      }

      alert('保存成功！');
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 这里只是预览，实际应该上传到对象存储
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogoPreview(dataUrl);
        setConfigs({ ...configs, unit_logo_url: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            系统配置
          </h2>
          <p className="text-muted-foreground mt-1">
            配置单位名称、Logo等系统信息
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? '保存中...' : '保存配置'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Logo 配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              单位Logo
            </CardTitle>
            <CardDescription>
              上传或设置单位Logo，将显示在登录页面和系统顶部
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo预览"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        上传Logo
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-url">或输入Logo图片URL</Label>
                  <Input
                    id="logo-url"
                    value={configs['unit_logo_url'] || ''}
                    onChange={(e) => {
                      setConfigs({ ...configs, unit_logo_url: e.target.value });
                      setLogoPreview(e.target.value || null);
                    }}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  建议尺寸：200x200像素，支持PNG、JPG格式
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 基本信息配置 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>
              配置单位名称和系统基本信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-name">单位名称 *</Label>
                <Input
                  id="unit-name"
                  value={configs['unit_name'] || ''}
                  onChange={(e) => setConfigs({ ...configs, unit_name: e.target.value })}
                  placeholder="例如：XX市公安局"
                />
                <p className="text-sm text-muted-foreground">
                  单位名称将显示在登录页和系统标题中
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-title">系统标题</Label>
                <Input
                  id="system-title"
                  value={configs['system_title'] || ''}
                  onChange={(e) => setConfigs({ ...configs, system_title: e.target.value })}
                  placeholder="例如：库房管理系统"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="copyright">版权信息</Label>
                <Textarea
                  id="copyright"
                  value={configs['copyright_text'] || ''}
                  onChange={(e) => setConfigs({ ...configs, copyright_text: e.target.value })}
                  placeholder="例如：© 2024 XX市公安局 版权所有"
                  rows={2}
                />
                <p className="text-sm text-muted-foreground">
                  显示在登录页和系统页脚
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 预览 */}
        <Card>
          <CardHeader>
            <CardTitle>预览效果</CardTitle>
            <CardDescription>
              配置效果预览（实际效果请访问登录页）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-gradient-to-br from-red-50 to-red-100">
              <div className="flex flex-col items-center text-center space-y-4">
                {logoPreview && (
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md">
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-red-800">
                    {configs['unit_name'] || 'XX市公安局'}
                  </h1>
                  <p className="text-lg text-red-700 mt-1">
                    {configs['system_title'] || '库房管理系统'}
                  </p>
                </div>
                <p className="text-sm text-red-600 mt-4">
                  {configs['copyright_text'] || '© 2024 XX市公安局 版权所有'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
