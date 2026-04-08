// 自动导入数据库结构脚本
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: 21021,
  database: 'warehouse_db',
  user: 'zxp2672',
  password: 'Swj121648.',
  connectionTimeoutMillis: 30000,
});

async function importDatabase() {
  console.log('🚀 开始导入数据库结构...\n');
  
  try {
    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'database-setup.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 已读取 database-setup.sql 文件');
    console.log('📊 文件大小:', (sql.length / 1024).toFixed(2), 'KB\n');
    
    // 获取客户端
    const client = await pool.connect();
    console.log('✅ 数据库连接成功\n');
    console.log('📦 开始执行SQL文件...\n');
    
    try {
      // 直接执行整个SQL文件
      await client.query(sql);
      console.log('✅ SQL文件执行成功！\n');
    } catch (error) {
      console.log('⚠️  执行过程中有部分错误（会跳过继续）:', error.message);
    }
    
    client.release();
    
    // 验证导入结果
    console.log('🔍 验证导入结果...\n');
    
    const verifyClient = await pool.connect();
    
    // 查看所有表
    const tables = await verifyClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`📋 数据库中的表 (${tables.rows.length} 个):`);
    tables.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });
    
    // 检查关键表
    const criticalTables = ['users', 'products', 'warehouses', 'inbound_orders', 'outbound_orders'];
    console.log('\n🔑 关键表检查:');
    
    for (const table of criticalTables) {
      try {
        const result = await verifyClient.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ✅ ${table}: ${result.rows[0].count} 条记录`);
      } catch (error) {
        console.log(`  ❌ ${table}: 不存在或查询失败`);
      }
    }
    
    verifyClient.release();
    
    console.log('\n✅ 数据库导入完成！');
    
  } catch (error) {
    console.error('\n❌ 导入失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await pool.end();
  }
}

importDatabase();
