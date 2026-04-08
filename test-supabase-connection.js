// Supabase连接测试脚本
// 在浏览器控制台中运行此代码

async function testSupabase() {
  console.log('=== Supabase 连接测试 ===\n');
  
  // 检查环境变量
  console.log('1. 检查环境变量:');
  console.log('   URL:', process.env?.NEXT_PUBLIC_SUPABASE_URL || window?.location?.origin ? '✓ 已配置' : '✗ 未配置');
  console.log('   ANON_KEY:', process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ 已配置 (长度: ' + (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0) + ')' : '✗ 未配置');
  
  // 尝试获取credentials
  console.log('\n2. 尝试从应用获取credentials:');
  try {
    const { getSupabaseCredentials } = await import('./src/storage/database/supabase-client');
    const creds = getSupabaseCredentials();
    console.log('   URL:', creds.url);
    console.log('   Key长度:', creds.anonKey?.length || 0);
    console.log('   Key开头:', creds.anonKey?.substring(0, 20) + '...');
  } catch (error) {
    console.error('   获取失败:', error);
  }
  
  // 测试API连接
  console.log('\n3. 测试Supabase API连接:');
  try {
    const response = await fetch('https://rcyeqrjalfzczdyspbog.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4'
      }
    });
    
    if (response.ok) {
      console.log('   ✓ Supabase API连接成功');
      console.log('   响应状态:', response.status);
    } else {
      console.error('   ✗ Supabase API连接失败');
      console.error('   响应状态:', response.status);
      const text = await response.text();
      console.error('   响应内容:', text);
    }
  } catch (error) {
    console.error('   ✗ 连接错误:', error.message);
  }
  
  // 测试users表访问
  console.log('\n4. 测试users表访问:');
  try {
    const response = await fetch('https://rcyeqrjalfzczdyspbog.supabase.co/rest/v1/users?limit=1', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✓ users表访问成功');
      console.log('   用户数量:', data.length);
      if (data.length > 0) {
        console.log('   第一个用户:', data[0]);
      }
    } else {
      console.error('   ✗ users表访问失败');
      console.error('   响应状态:', response.status);
      const text = await response.text();
      console.error('   响应内容:', text);
    }
  } catch (error) {
    console.error('   ✗ 访问错误:', error.message);
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
testSupabase();
