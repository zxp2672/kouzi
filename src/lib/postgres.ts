import { Pool, PoolConfig } from 'pg';

// 数据库连接配置
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'cd-postgres-gu24c63s.sql.tencentcdb.com',
  port: parseInt(process.env.DB_PORT || '21021'),
  database: process.env.DB_NAME || 'warehouse_db',
  user: process.env.DB_USER || 'zxp2672',
  password: process.env.DB_PASSWORD || 'Swj121648.',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('✅ PostgreSQL数据库连接成功');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL数据库连接错误:', err);
});

// 查询辅助函数
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`SQL查询: ${duration}ms`, { text: text.substring(0, 100), rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('SQL查询错误:', { text: text.substring(0, 100), error });
    throw error;
  }
}

export async function getClient() {
  return await pool.connect();
}

export async function closePool() {
  await pool.end();
}

export { pool };
export default pool;
