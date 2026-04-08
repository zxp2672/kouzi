const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: 21021,
  database: 'warehouse_db',
  user: 'zxp2672',
  password: 'Swj121648.',
});

async function createUsers() {
  const client = await pool.connect();
  await client.query(fs.readFileSync('insert-default-users.sql', 'utf8'));
  const users = await client.query('SELECT id, username, name FROM users');
  console.log('✅ 用户创建成功！');
  users.rows.forEach(u => console.log(`  ${u.id}. ${u.username} - ${u.name}`));
  client.release();
  await pool.end();
}

createUsers();
