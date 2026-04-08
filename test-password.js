const { createHash } = require('crypto');
const { Pool } = require('pg');

// 密码哈希函数
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

async function testPassword() {
  try {
    console.log('🔍 测试密码哈希...\n');

    // 测试常用密码的哈希
    const testPasswords = ['123456', 'admin123', 'admin', 'password'];
    
    console.log('📊 密码哈希测试:');
    for (const pwd of testPasswords) {
      const hash = hashPassword(pwd);
      console.log(`  ${pwd} => ${hash.substring(0, 20)}...`);
    }
    console.log('');

    // 查询数据库中的用户密码
    console.log('📡 查询数据库中的用户密码哈希:');
    const result = await pool.query('SELECT id, username, name, password_hash FROM users ORDER BY id');
    
    for (const user of result.rows) {
      console.log(`\n用户: ${user.username} (${user.name})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  密码哈希: ${user.password_hash ? user.password_hash.substring(0, 30) + '...' : '无'}`);
      
      // 测试常见密码
      if (user.password_hash) {
        for (const pwd of testPasswords) {
          const hash = hashPassword(pwd);
          if (hash === user.password_hash) {
            console.log(`  ✅ 密码匹配: ${pwd}`);
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('🔧 重置admin密码为 123456');
    console.log('========================================\n');

    const newHash = hashPassword('123456');
    await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [newHash, 'admin']);
    
    console.log('✅ admin密码已重置为: 123456');
    console.log(`   新哈希: ${newHash}`);

    // 验证
    const verifyResult = await pool.query('SELECT password_hash FROM users WHERE username = $1', ['admin']);
    const storedHash = verifyResult.rows[0].password_hash;
    
    if (storedHash === newHash) {
      console.log('✅ 验证成功！密码已正确保存');
    } else {
      console.log('❌ 验证失败！密码保存有问题');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

testPassword();
