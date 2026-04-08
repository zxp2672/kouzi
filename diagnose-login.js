// 完整登录诊断
const baseUrl = 'https://www.001tf.com';

async function diagnoseLogin() {
  console.log('🔍 登录完整诊断...\n');

  // 测试1: 检查网站是否可访问
  console.log('📡 测试1: 检查网站访问');
  try {
    const homeResponse = await fetch(baseUrl);
    console.log(`✅ 网站可访问 - 状态码: ${homeResponse.status}`);
  } catch (error) {
    console.log(`❌ 网站无法访问: ${error.message}`);
    return;
  }
  console.log('');

  // 测试2: 测试登录API
  console.log('📡 测试2: 测试登录API');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: '123456'
      })
    });

    console.log(`状态码: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log(`✅ 登录API正常`);
      console.log(`成功: ${data.success}`);
      if (data.user) {
        console.log(`用户: ${data.user.username} (${data.user.name})`);
      }
    } else {
      const errorText = await loginResponse.text();
      console.log(`❌ 登录API失败`);
      console.log(`错误: ${errorText.substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`❌ 登录API请求失败: ${error.message}`);
  }
  console.log('');

  // 测试3: 测试用户API
  console.log('📡 测试3: 测试用户API');
  try {
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    console.log(`状态码: ${usersResponse.status}`);
    
    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`✅ 用户API正常 - 共 ${users.length} 个用户`);
      users.forEach(u => {
        console.log(`  - ${u.username} (${u.name}) - ID: ${u.id}`);
      });
    } else {
      const errorText = await usersResponse.text();
      console.log(`❌ 用户API失败: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`❌ 用户API请求失败: ${error.message}`);
  }
  console.log('');

  // 测试4: 测试系统配置API
  console.log('📡 测试4: 测试系统配置API');
  try {
    const configResponse = await fetch(`${baseUrl}/api/system-config`);
    console.log(`状态码: ${configResponse.status}`);
    
    if (configResponse.ok) {
      const data = await configResponse.json();
      console.log(`✅ 系统配置API正常`);
      console.log(`配置项: ${Object.keys(data.configs || {}).length} 个`);
    } else {
      console.log(`❌ 系统配置API失败`);
    }
  } catch (error) {
    console.log(`❌ 系统配置API请求失败: ${error.message}`);
  }
}

diagnoseLogin();
