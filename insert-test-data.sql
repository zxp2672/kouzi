-- ==========================================
-- 警用物资库房管理系统 - 测试数据
-- ==========================================

-- 1. 插入警用物资分类和产品
-- 防护装备类
INSERT INTO products (code, name, category, specification, unit, min_stock, max_stock) VALUES
('ZF001', '防刺服', '防护装备', 'GA68-2019标准，重量≤4.5kg', '件', 50, 200),
('ZF002', '防弹衣', '防护装备', 'GA141-2010标准，防54式手枪弹', '件', 30, 150),
('ZF003', '防弹头盔', '防护装备', 'GA293-2012标准，三级防护', '顶', 50, 200),
('ZF004', '防割手套', '防护装备', '5级防割，耐磨防滑', '双', 100, 500),
('ZF005', '警用盾牌', '防护装备', 'PC材质，防暴盾牌，透明PC面板', '面', 30, 100),
('ZF006', '防暴头盔', '防护装备', '带面罩，抗冲击', '顶', 50, 200),

-- 警械装备类
('JX001', '催泪喷射器', '警械装备', '350ml，有效距离≥3米', '支', 100, 500),
('JX002', '伸缩警棍', '警械装备', 'GA886-2010标准，三节伸缩', '根', 100, 500),
('JX003', '手铐', '警械装备', 'GA171-2010标准，不锈钢材质', '副', 100, 500),
('JX004', '约束带', '警械装备', '尼龙材质，长度≥1.5米', '条', 50, 200),
('JX005', '强光手电', '警械装备', '1000流明，带爆闪功能', '支', 100, 500),
('JX006', '警用制式刀具', '警械装备', '多功能，带刀鞘', '把', 50, 200),

-- 通信设备类
('TX001', '对讲机', '通信设备', '数字集群，400-470MHz', '台', 50, 200),
('TX002', '执法记录仪', '通信设备', '1080P，红外夜视，32G存储', '台', 100, 300),
('TX003', '移动警务终端', '通信设备', 'Android系统，支持公安专网', '台', 50, 150),
('TX004', '车载电台', '通信设备', '25W功率，数字模拟双模', '台', 20, 80),

-- 警戒救援类
('JJ001', '警戒带', '警戒救援', '涤纶材质，红白相间，50米/卷', '卷', 200, 1000),
('JJ002', '警戒桩', '警戒救援', '不锈钢材质，高80cm', '根', 100, 500),
('JJ003', '破拆工具组', '警戒救援', '液压扩张器、剪切器等', '套', 10, 50),
('JJ004', '急救箱', '警戒救援', '含止血带、纱布、消毒液等', '个', 50, 200),
('JJ005', '灭火器', '警戒救援', '4kg干粉灭火器', '具', 100, 500),

-- 被服装具类
('BF001', '警服（春秋）', '被服装具', '常服，藏蓝色，多尺码', '套', 200, 800),
('BF002', '警服（夏装）', '被服装具', '短袖衬衫，藏蓝色，多尺码', '套', 200, 800),
('BF003', '警用皮鞋', '被服装具', '黑色，防滑耐磨，多尺码', '双', 200, 800),
('BF004', '警用腰带', '被服装具', '多功能外腰带，黑色', '条', 200, 800),
('BF005', '警帽', '被服装具', '大檐帽，藏蓝色，多尺码', '顶', 200, 800);

-- 2. 插入入库单数据
-- 入库单1 - 防护装备入库
INSERT INTO inbound_orders (order_no, warehouse_id, supplier, status, remark, created_by, created_at) VALUES
('IN20240101001', 1, '北京华安防护设备有限公司', 'completed', '2024年第一批防护装备采购入库', '张三', '2024-01-05 10:30:00');

INSERT INTO inbound_items (order_id, product_id, quantity, price, batch_no, production_date) VALUES
(1, 1, 100, 850.00, 'ZC20240101', '2023-12-01'),
(1, 2, 50, 2200.00, 'ZC20240101', '2023-12-01'),
(1, 3, 80, 680.00, 'ZC20240101', '2023-12-01'),
(1, 6, 100, 450.00, 'ZC20240101', '2023-12-15');

-- 入库单2 - 警械装备入库
INSERT INTO inbound_orders (order_no, warehouse_id, supplier, status, remark, created_by, created_at) VALUES
('IN20240115002', 1, '江苏警用器材制造有限公司', 'completed', '警械装备补充采购', '张三', '2024-01-15 14:20:00');

INSERT INTO inbound_items (order_id, product_id, quantity, price, batch_no, production_date) VALUES
(2, 7, 200, 180.00, 'JX20240115', '2024-01-05'),
(2, 8, 150, 320.00, 'JX20240115', '2024-01-05'),
(2, 9, 200, 95.00, 'JX20240115', '2024-01-08'),
(2, 11, 200, 150.00, 'JX20240115', '2024-01-05');

-- 入库单3 - 通信设备入库
INSERT INTO inbound_orders (order_no, warehouse_id, supplier, status, remark, created_by, created_at) VALUES
('IN20240201003', 1, '海能达通信股份有限公司', 'completed', '数字对讲机采购', '李四', '2024-02-01 09:15:00');

INSERT INTO inbound_items (order_id, product_id, quantity, price, batch_no, production_date) VALUES
(3, 13, 100, 3500.00, 'TX20240201', '2024-01-20'),
(3, 14, 80, 2800.00, 'TX20240201', '2024-01-20'),
(3, 15, 50, 4500.00, 'TX20240201', '2024-01-25');

-- 入库单4 - 2月份入库
INSERT INTO inbound_orders (order_no, warehouse_id, supplier, status, remark, created_by, created_at) VALUES
('IN20240215004', 2, '深圳警星科技有限公司', 'completed', '执法记录仪采购', '王五', '2024-02-15 11:00:00');

INSERT INTO inbound_items (order_id, product_id, quantity, price, batch_no, production_date) VALUES
(4, 14, 100, 2750.00, 'FZJ2024021', '2024-02-01'),
(4, 21, 100, 45.00, 'FZJ2024021', '2024-02-05'),
(4, 25, 300, 280.00, 'FZJ2024021', '2024-02-01');

-- 3. 插入出库单数据
-- 出库单1 - 派出所领用
INSERT INTO outbound_orders (order_no, warehouse_id, customer, outbound_type, status, remark, created_by, created_at) VALUES
('OUT20240120001', 1, '城关派出所', '领用', 'completed', '一线民警装备配备', '张三', '2024-01-20 10:00:00');

INSERT INTO outbound_items (order_id, product_id, quantity, price) VALUES
(1, 1, 30, 850.00),
(1, 2, 20, 2200.00),
(1, 3, 30, 680.00),
(1, 8, 30, 320.00),
(1, 11, 30, 150.00);

-- 出库单2 - 特警队领用
INSERT INTO outbound_orders (order_no, warehouse_id, customer, outbound_type, status, remark, created_by, created_at) VALUES
('OUT20240125002', 1, '特警支队', '领用', 'completed', '特警装备配备', '张三', '2024-01-25 14:30:00');

INSERT INTO outbound_items (order_id, product_id, quantity, price) VALUES
(2, 2, 50, 2200.00),
(2, 3, 50, 680.00),
(2, 5, 30, 580.00),
(2, 7, 50, 180.00),
(2, 9, 50, 95.00);

-- 出库单3 - 交警队领用
INSERT INTO outbound_orders (order_no, warehouse_id, customer, outbound_type, status, remark, created_by, created_at) VALUES
('OUT20240205003', 1, '交警大队', '领用', 'completed', '交警执勤装备', '李四', '2024-02-05 09:30:00');

INSERT INTO outbound_items (order_id, product_id, quantity, price) VALUES
(3, 11, 50, 150.00),
(3, 13, 20, 3500.00),
(3, 14, 20, 2800.00),
(3, 21, 50, 45.00),
(3, 22, 50, 120.00);

-- 出库单4 - 巡警队领用
INSERT INTO outbound_orders (order_no, warehouse_id, customer, outbound_type, status, remark, created_by, created_at) VALUES
('OUT20240220004', 2, '巡特警大队', '领用', 'completed', '巡逻装备配备', '王五', '2024-02-20 15:00:00');

INSERT INTO outbound_items (order_id, product_id, quantity, price) VALUES
(4, 1, 40, 850.00),
(4, 6, 40, 450.00),
(4, 14, 30, 2800.00),
(4, 25, 50, 280.00);

-- 4. 插入调拨单数据
-- 调拨单1 - 主仓库调拨到分仓库
INSERT INTO transfer_orders (order_no, from_warehouse_id, to_warehouse_id, status, remark, created_by, created_at) VALUES
('TR20240118001', 1, 2, 'completed', '调拨防护装备到分仓库A', '张三', '2024-01-18 10:00:00');

INSERT INTO transfer_items (order_id, product_id, quantity) VALUES
(1, 1, 50),
(1, 2, 30),
(1, 3, 40),
(1, 6, 30);

-- 调拨单2 - 分仓库调拨
INSERT INTO transfer_orders (order_no, from_warehouse_id, to_warehouse_id, status, remark, created_by, created_at) VALUES
('TR20240210002', 2, 3, 'completed', '调拨通信设备到分仓库B', '李四', '2024-02-10 14:00:00');

INSERT INTO transfer_items (order_id, product_id, quantity) VALUES
(2, 13, 30),
(2, 14, 30),
(2, 11, 50);

-- 调拨单3 - 最近调拨
INSERT INTO transfer_orders (order_no, from_warehouse_id, to_warehouse_id, status, remark, created_by, created_at) VALUES
('TR20240301003', 1, 2, 'in_transit', '紧急调拨警械装备', '张三', '2024-03-01 09:00:00');

INSERT INTO transfer_items (order_id, product_id, quantity) VALUES
(3, 7, 100),
(3, 8, 80),
(3, 9, 100);

-- 5. 插入库存数据（根据出入库计算后的库存）
INSERT INTO inventory (warehouse_id, product_id, quantity) VALUES
-- 主仓库库存
(1, 1, 70),   -- 防刺服
(1, 2, 30),   -- 防弹衣
(1, 3, 50),   -- 防弹头盔
(1, 4, 100),  -- 防割手套
(1, 5, 30),   -- 警用盾牌
(1, 6, 70),   -- 防暴头盔
(1, 7, 150),  -- 催泪喷射器
(1, 8, 120),  -- 伸缩警棍
(1, 9, 150),  -- 手铐
(1, 10, 50),  -- 约束带
(1, 11, 120), -- 强光手电
(1, 12, 50),  -- 警用制式刀具
(1, 13, 80),  -- 对讲机
(1, 14, 60),  -- 执法记录仪
(1, 15, 50),  -- 移动警务终端
(1, 21, 50),  -- 警戒带
(1, 22, 50),  -- 警戒桩
(1, 25, 250), -- 警服（春秋）

-- 分仓库A库存
(2, 1, 50),
(2, 2, 30),
(2, 3, 40),
(2, 6, 30),
(2, 13, 30),
(2, 14, 30),
(2, 11, 50),
(2, 16, 100), -- 灭火器
(2, 25, 100),

-- 分仓库B库存
(3, 7, 50),
(3, 8, 50),
(3, 9, 50),
(3, 21, 150),
(3, 25, 150);

-- 6. 插入盘点单数据
INSERT INTO stock_counts (order_no, warehouse_id, status, remark, created_by, created_at) VALUES
('SC20240131001', 1, 'completed', '1月份库存盘点', '张三', '2024-01-31 16:00:00');

INSERT INTO stock_count_items (order_id, product_id, book_quantity, actual_quantity, difference) VALUES
(1, 1, 120, 118, -2),
(1, 2, 80, 80, 0),
(1, 3, 130, 132, 2),
(1, 7, 350, 348, -2),
(1, 13, 180, 180, 0);

-- 7月份盘点
INSERT INTO stock_counts (order_no, warehouse_id, status, remark, created_by, created_at) VALUES
('SC20240228002', 1, 'completed', '2月份库存盘点', '李四', '2024-02-28 16:00:00');

INSERT INTO stock_count_items (order_id, product_id, book_quantity, actual_quantity, difference) VALUES
(2, 1, 70, 70, 0),
(2, 2, 30, 29, -1),
(2, 11, 120, 120, 0),
(2, 14, 60, 58, -2);
