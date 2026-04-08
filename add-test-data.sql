-- 插入组织机构测试数据
INSERT INTO organizations (code, name, parent_id, level) 
SELECT code, name, CASE WHEN parent_id IS NULL THEN NULL ELSE (SELECT id FROM organizations WHERE code = parent_id) END, level FROM (VALUES
('GAJ001', 'XX市公安局', NULL::varchar, 1),
('GAC001', 'XX区公安处', 'GAJ001', 2),
('TJ001', '特警支队', 'GAJ001', 2),
('JJ001', '交警支队', 'GAJ001', 2),
('XJ001', '巡警支队', 'GAJ001', 2),
('PCS001', '城东派出所', 'GAC001', 3),
('PCS002', '城西派出所', 'GAC001', 3),
('PCS003', '城南派出所', 'GAC001', 3)
) AS t(code, name, parent_id, level)
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE code = t.code);

-- 插入库存数据
INSERT INTO inventory (warehouse_id, product_id, quantity, updated_at) 
SELECT * FROM (VALUES
(1, 1, 150, NOW()),
(1, 2, 80, NOW()),
(1, 3, 120, NOW()),
(1, 4, 200, NOW()),
(1, 5, 90, NOW()),
(1, 6, 110, NOW()),
(2, 1, 50, NOW()),
(2, 2, 30, NOW()),
(2, 3, 40, NOW()),
(3, 4, 60, NOW()),
(3, 5, 25, NOW())
) AS t(wid, pid, qty, updated)
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE warehouse_id = t.wid AND product_id = t.pid)
ON CONFLICT (warehouse_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();

-- 插入系统配置数据
INSERT INTO system_configs (config_key, config_value, config_type, description, updated_at) VALUES
('unit_name', 'XX市公安局', 'string', '单位名称', NOW()),
('unit_logo_url', '', 'string', '单位Logo', NOW()),
('system_title', '警用物资库房管理系统', 'string', '系统标题', NOW()),
('copyright_text', '© 2024 XX市公安局 版权所有', 'string', '版权信息', NOW())
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = NOW();
