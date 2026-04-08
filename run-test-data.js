const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: 21021,
  database: 'warehouse_db',
  user: 'zxp2672',
  password: 'Swj121648.',
});

async function main() {
  try {
    await pool.query(fs.readFileSync('add-test-data.sql', 'utf8'));
    console.log('✅ 测试数据插入成功！\n');
    
    const tables = [
      'users', 'products', 'warehouses', 'organizations', 'roles',
      'inbound_orders', 'outbound_orders', 'stock_counts', 'transfer_orders',
      'inventory', 'system_configs'
    ];
    
    console.log('📊 数据库完整统计:');
    for (const t of tables) {
      const r = await pool.query('SELECT COUNT(*) FROM ' + t);
      console.log('  ✓ ' + t + ': ' + r.rows[0].count + ' 条');
    }
    
    console.log('\n✅ 所有测试数据已就绪！');
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

main();
