#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  }
}

loadEnvFile();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addTestVacation() {
  try {
    console.log('🔄 配送センター外注チームのテスト休暇データを追加中...\n');
    
    // 配送センター外注のドライバー情報を取得
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, employee_id')
      .eq('team', '配送センター外注');
    
    if (driversError) {
      console.error('❌ ドライバー取得エラー:', driversError.message);
      return;
    }
    
    if (drivers.length === 0) {
      console.log('❌ 配送センター外注チームのドライバーが見つかりません');
      return;
    }
    
    console.log(`👥 対象ドライバー: ${drivers.length}名`);
    drivers.forEach(driver => {
      console.log(`   - ${driver.name} (ID: ${driver.id})`);
    });
    console.log();
    
    // テスト用休暇申請データを作成
    const testVacations = [
      {
        driver_id: drivers[0].id,
        driver_name: drivers[0].name,
        team: '配送センター外注',
        employee_id: drivers[0].employee_id,
        date: '2025-09-09',
        work_status: 'day_off',
        is_off: true,
        type: 'day_off',
        reason: '',
        status: 'approved',
        request_date: new Date().toISOString(),
        is_external_driver: true
      }
    ];
    
    // 2人目のドライバーがいる場合
    if (drivers.length > 1) {
      testVacations.push({
        driver_id: drivers[1].id,
        driver_name: drivers[1].name,
        team: '配送センター外注',
        employee_id: drivers[1].employee_id,
        date: '2025-09-10',
        work_status: 'day_off',
        is_off: true,
        type: 'day_off',
        reason: '',
        status: 'approved',
        request_date: new Date().toISOString(),
        is_external_driver: true
      });
    }
    
    // 休暇申請データを挿入
    const { data: insertedVacations, error: insertError } = await supabase
      .from('vacation_requests')
      .insert(testVacations)
      .select();
    
    if (insertError) {
      console.error('❌ 休暇申請追加エラー:', insertError.message);
      return;
    }
    
    console.log(`✅ テスト休暇申請を追加しました: ${insertedVacations.length}件`);
    insertedVacations.forEach(vacation => {
      console.log(`   - ${vacation.driver_name}: ${vacation.date} (${vacation.work_status})`);
    });
    
    console.log('\n🎉 テストデータの追加が完了しました！');
    console.log('💡 休暇カレンダーで「センター外注」の表記を確認してください。');
    
  } catch (error) {
    console.error('❌ テストデータ追加エラー:', error.message);
  }
}

// スクリプト実行
addTestVacation();