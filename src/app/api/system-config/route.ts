import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const result = await query('SELECT config_key, config_value FROM system_configs');
    
    const configMap: Record<string, string> = {};
    for (const row of result.rows) {
      configMap[row.config_key] = row.config_value || '';
    }

    return NextResponse.json({
      success: true,
      configs: configMap
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return NextResponse.json(
      { error: '获取配置失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const configs = await request.json();
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

    return NextResponse.json({
      success: true,
      message: '配置已保存'
    });
  } catch (error) {
    console.error('保存系统配置失败:', error);
    return NextResponse.json(
      { error: '保存配置失败' },
      { status: 500 }
    );
  }
}
