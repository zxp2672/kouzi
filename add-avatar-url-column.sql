-- 为users表添加avatar_url字段
-- 在Supabase SQL编辑器中执行此脚本
-- 只需执行下面这一条语句即可

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
