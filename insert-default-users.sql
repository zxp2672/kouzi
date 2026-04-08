-- 创建初始用户
INSERT INTO users (username, name, email, phone, role_id, department, is_active) VALUES
('admin', '系统管理员', 'admin@example.com', '13800138000', 1, '公安局机关', true),
('manager', '库房管理员', 'manager@example.com', '13800138001', 2, '公安处机关', true),
('user1', '普通用户', 'user1@example.com', '13800138002', 3, '派出所A', true)
ON CONFLICT (username) DO NOTHING;
