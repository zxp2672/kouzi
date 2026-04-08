// 测试用户API
const baseUrl = 'https://www.001tf.com';

async function testUsersAPI() {
  console.log('🔍 测试用户API...\n');

  try {
    // 测试1: 获取用户列表
    console.log('📡 测试1: 获取用户列表');
    const response = await fetch(`${baseUrl}/api/users`);
    console.log('状态码:', response.status);
    
    if (response.ok) {
      const users = await response.json();
      console.log(`✅ 成功！共 ${users.length} 个用户`);
      users.forEach(u => {
        console.log(`  - ${u.username} (${u.name}) - ID: ${u.id}`);
      });
    } else {
      const error = await response.text();
      console.log('❌ 失败:', error.substring(0, 200));
    }

    console.log('');

    // 测试2: 创建测试用户
    console.log('📡 测试2: 创建测试用户');
    const createResponse = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_user_' + Date.now(),
        name: '测试用户',
        email: 'test@example.com',
        phone: '13800138000',
        role_id: 3,
        organization_id: null,
        department: '测试部门',
        password_hash: 'test123',
        is_active: true
      })
    });

    console.log('状态码:', createResponse.status);
    if (createResponse.ok) {
      const newUser = await createResponse.json();
      console.log('✅ 创建成功！', newUser.username);
    } else {
      const error = await createResponse.text();
      console.log('❌ 创建失败:', error.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testUsersAPI();
