const { Pool } = require('pg');

console.log('🔍 测试腾讯云PostgreSQL数据库连接...\n');

const pool = new Pool({
  host: 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: 21021,
  database: 'warehouse_db',
  user: 'zxp2672',
  password: 'Swj121648.',
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    // 测试1：基本连接
    console.log('📡 测试1：基本连接...');
    const connectResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ 连接成功！');
    console.log('   服务器时间:', connectResult.rows[0].current_time);
    console.log('');

    // 测试2：查询用户表
    console.log('📡 测试2：查询用户数据...');
    const usersResult = await pool.query('SELECT id, username, name, role_id FROM users ORDER BY id');
    console.log(`✅ 查询成功！共 ${usersResult.rows.length} 个用户`);
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.name}) - Role ID: ${user.role_id}`);
    });
    console.log('');

    // 测试3：查询产品表
    console.log('📡 测试3：查询产品数据...');
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`✅ 产品数量: ${productsResult.rows[0].count}`);
    console.log('');

    // 测试4：查询入库单
    console.log('📡 测试4：查询入库单...');
    const inboundResult = await pool.query('SELECT COUNT(*) as count FROM inbound_orders');
    console.log(`✅ 入库单数量: ${inboundResult.rows[0].count}`);
    console.log('');

    // 测试5：查询出库单
    console.log('📡 测试5：查询出库单...');
    const outboundResult = await pool.query('SELECT COUNT(*) as count FROM outbound_orders');
    console.log(`✅ 出库单数量: ${outboundResult.rows[0].count}`);
    console.log('');

    // 测试6：查询系统配置
    console.log('📡 测试6：查询系统配置...');
    const configsResult = await pool.query('SELECT config_key, config_value FROM system_configs');
    console.log('✅ 系统配置:');
    configsResult.rows.forEach(config => {
      console.log(`   - ${config.config_key}: ${config.config_value}`);
    });
    console.log('');

    // 测试7：测试登录API的查询
    console.log('📡 测试7：测试登录查询（admin用户）...');
    const loginResult = await pool.query(
      'SELECT id, username, name, role_id, is_active FROM users WHERE username = $1 AND is_active = true',
      ['admin']
    );
    if (loginResult.rows.length > 0) {
      const user = loginResult.rows[0];
      console.log('✅ 找到admin用户:');
      console.log(`   ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   姓名: ${user.name}`);
      console.log(`   角色ID: ${user.role_id}`);
      console.log(`   状态: ${user.is_active ? '激活' : '未激活'}`);
    } else {
      console.log('❌ 未找到admin用户');
    }
    console.log('');

    console.log('========================================');
    console.log('🎉 所有测试通过！数据库连接正常！');
    console.log('========================================');
    console.log('');
    console.log('📊 数据库统计:');
    const tables = ['users', 'products', 'warehouses', 'inbound_orders', 'outbound_orders', 'stock_counts', 'transfer_orders', 'roles', 'system_configs'];
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table}: ${result.rows[0].count} 条`);
    }

  } catch (error) {
    console.error('\n❌ 连接测试失败！');
    console.error('错误信息:', error.message);
    console.error('错误代码:', error.code);
    console.error('');
    console.log('🔧 可能的原因:');
    console.log('   1. 数据库地址或端口错误');
    console.log('   2. 用户名或密码错误');
    console.log('   3. 数据库不存在');
    console.log('   4. 网络不通（检查防火墙/安全组）');
    console.log('   5. 腾讯云数据库白名单未配置');
  } finally {
    await pool.end();
  }
}

testConnection();
