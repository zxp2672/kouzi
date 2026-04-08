-- 为users表添加avatar_url字段
-- 在Supabase SQL编辑器中执行此脚本

-- 添加avatar_url字段（如果不存在）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 添加注释
COMMENT ON COLUMN users.avatar_url IS '用户头像URL或Base64数据';

-- 验证字段是否添加成功
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'avatar_url';
