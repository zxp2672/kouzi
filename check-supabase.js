const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rcyeqrjalfzczdyspbog.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeWVxcmphbGZ6Y3pkeXNwYm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjMxMjEsImV4cCI6MjA5MTEzOTEyMX0.Q-WS3GuGI3VWi61whHt1nAbEHyf-T6o2fBttqYhanD4'
);

async function checkSupabase() {
  console.log('检查Supabase数据库...\n');

  // 检查用户
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, name, password_hash')
    .limit(10);

  if (usersError) {
    console.error('❌ 查询用户失败:', usersError.message);
    return;
  }

  console.log('✅ 用户表正常');
  console.log(`用户数量: ${users ? users.length : 0}\n`);

  if (users && users.length > 0) {
    console.log('用户列表:');
    users.forEach(u => {
      const hasPassword = u.password_hash ? '✅ 有密码' : '❌ 无密码';
      console.log(`  - ${u.username} (${u.name}) - ${hasPassword}`);
    });
  }

  // 检查其他表
  const tables = ['products', 'warehouses', 'inbounds', 'outbounds'];
  console.log('\n检查其他表:');
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: ${count} 条记录`);
    }
  }
}

checkSupabase();
