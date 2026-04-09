import { Pool, PoolConfig } from 'pg';

let pool: any = null;

function getPool() {
  if (!pool) {
    // 数据库连接配置（默认使用本地PostgreSQL）
    const poolConfig: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'warehouse',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    pool = new Pool(poolConfig);

    pool.on('connect', () => {
      console.log('✅ PostgreSQL数据库连接成功');
    });

    pool.on('error', (err: Error) => {
      console.error('❌ PostgreSQL数据库连接错误:', err);
    });
  }
  return pool;
}

// 查询辅助函数
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log(`SQL查询: ${duration}ms`, { text: text.substring(0, 100), rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('SQL查询错误:', { text: text.substring(0, 100), error });
    throw error;
  }
}

export async function getClient() {
  return await getPool().connect();
}

export async function closePool() {
  if (pool) {
    await pool.end();
  }
}

export { getPool as pool };
export default getPool;
