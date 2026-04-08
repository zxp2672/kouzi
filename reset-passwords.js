const { createHash } = require('crypto');
const { Pool } = require('pg');

function hashPassword(password) {
  return createHash('sha256').update(password + '_warehouse_salt_2024').digest('hex');
}

const pool = new Pool({
  host: 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: 21021,
  database: 'warehouse_db',
  user: 'zxp2672',
  password: 'Swj121648.',
});

async function resetAllPasswords() {
  try {
    console.log('🔧 重置所有用户密码...\n');

    const users = [
      { username: 'admin', password: '123456' },
      { username: 'manager', password: '123456' },
      { username: 'user1', password: '123456' }
    ];

    for (const user of users) {
      const hash = hashPassword(user.password);
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [hash, user.username]
      );
      console.log(`✅ ${user.username} 密码已设置为: ${user.password}`);
    }

    console.log('\n========================================');
    console.log('✅ 所有用户密码重置完成！');
    console.log('========================================\n');
    console.log('登录信息:');
    console.log('  admin / 123456');
    console.log('  manager / 123456');
    console.log('  user1 / 123456');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

resetAllPasswords();
