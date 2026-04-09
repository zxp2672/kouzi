import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { query } from '@/lib/postgres';

// 密码哈希函数
function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_warehouse_salt_2024').digest('hex');
}

// 验证密码
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 从PostgreSQL查询用户
    const result = await query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    if (user.password_hash) {
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }
    } else {
      // 如果没有密码哈希，使用默认密码验证
      if (password !== '123456') {
        return NextResponse.json(
          { error: '用户名或密码错误' },
          { status: 401 }
        );
      }
      // 首次登录后设置密码哈希
      const hash = hashPassword(password);
      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hash, user.id]
      );
    }

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('登录验证失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
