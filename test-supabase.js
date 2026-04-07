// 测试 Supabase 连接
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 测试 Supabase 连接...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '已配置 ✓' : '未配置 ✗');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：环境变量未配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // 测试 1: 查询 warehouses 表
    console.log('📊 测试 1: 查询仓库表...');
    const { data: warehouses, error: whError } = await supabase
      .from('warehouses')
      .select('*')
      .limit(5);

    if (whError) {
      console.error('❌ 查询仓库表失败:', whError.message);
    } else {
      console.log('✅ 仓库表查询成功');
      console.log(`   找到 ${warehouses?.length || 0} 条记录`);
      if (warehouses && warehouses.length > 0) {
        console.log('   示例数据:', JSON.stringify(warehouses[0], null, 2));
      }
    }

    // 测试 2: 查询 products 表
    console.log('\n📦 测试 2: 查询产品表...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (prodError) {
      console.error('❌ 查询产品表失败:', prodError.message);
    } else {
      console.log('✅ 产品表查询成功');
      console.log(`   找到 ${products?.length || 0} 条记录`);
    }

    // 测试 3: 查询 inbound_orders 表
    console.log('\n📥 测试 3: 查询入库单表...');
    const { data: inbounds, error: inError } = await supabase
      .from('inbound_orders')
      .select('*')
      .limit(5);

    if (inError) {
      console.error('❌ 查询入库单表失败:', inError.message);
    } else {
      console.log('✅ 入库单表查询成功');
      console.log(`   找到 ${inbounds?.length || 0} 条记录`);
    }

    // 测试 4: 查询 outbound_orders 表
    console.log('\n📤 测试 4: 查询出库单表...');
    const { data: outbounds, error: outError } = await supabase
      .from('outbound_orders')
      .select('*')
      .limit(5);

    if (outError) {
      console.error('❌ 查询出库单表失败:', outError.message);
    } else {
      console.log('✅ 出库单表查询成功');
      console.log(`   找到 ${outbounds?.length || 0} 条记录`);
    }

    // 测试 5: 尝试插入测试数据
    console.log('\n✏️ 测试 5: 插入测试数据...');
    const testWarehouse = {
      code: 'TEST001',
      name: '测试仓库',
      address: '测试地址',
      manager: '测试管理员',
      phone: '13800138000'
    };

    const { data: inserted, error: insertError } = await supabase
      .from('warehouses')
      .insert(testWarehouse)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 插入测试数据失败:', insertError.message);
      console.log('   提示：可能是权限问题或表结构问题');
    } else {
      console.log('✅ 插入测试数据成功');
      console.log('   插入的仓库 ID:', inserted.id);

      // 清理测试数据
      console.log('\n🗑️ 清理测试数据...');
      const { error: deleteError } = await supabase
        .from('warehouses')
        .delete()
        .eq('id', inserted.id);

      if (deleteError) {
        console.error('❌ 删除测试数据失败:', deleteError.message);
      } else {
        console.log('✅ 测试数据已清理');
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Supabase 连接测试完成！');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.error(error);
  }
}

testConnection();
