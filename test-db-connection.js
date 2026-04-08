// 测试腾讯云数据库连接
const { Pool } = require('pg');

const pool = new Pool({
  host: 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: 21021,
  database: 'warehouse_db',
  user: 'zxp2672',
  password: 'Swj121648.',
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  console.log('正在测试数据库连接...\n');
  
  try {
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 测试查询
    const result = await client.query('SELECT NOW()');
    console.log('✅ 数据库查询成功！');
    console.log('当前时间:', result.rows[0].now, '\n');
    
    // 查看所有表
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 数据库中的表:');
    tables.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    
    console.log(`\n总共 ${tables.rows.length} 个表\n`);
    
    // 测试用户表
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log('👥 用户数量:', userCount.rows[0].count);
    
    // 测试产品表
    const productCount = await client.query('SELECT COUNT(*) FROM products');
    console.log('📦 产品数量:', productCount.rows[0].count);
    
    client.release();
    console.log('\n✅ 所有测试通过！数据库连接正常！');
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
