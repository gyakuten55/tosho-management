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

async function checkVacationData() {
  try {
    console.log('🔍 配送センター外注チームのデータを調査中...\n');
    
    // 1. 配送センター外注のドライバーを確認
    console.log('1️⃣ 配送センター外注チームのドライバー確認...');
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('id, name, team, employee_id')
      .eq('team', '配送センター外注');
    
    if (driversError) {
      console.error('❌ ドライバー確認エラー:', driversError.message);
      return;
    }
    
    console.log(`👥 配送センター外注チーム: ${drivers.length}名`);
    drivers.forEach(driver => {
      console.log(`   - ${driver.name} (${driver.employee_id})`);
    });
    console.log();
    
    // 2. 休暇申請データを確認
    console.log('2️⃣ 配送センター外注チームの休暇申請確認...');
    const { data: vacations, error: vacationsError } = await supabase
      .from('vacation_requests')
      .select('id, driver_name, team, date, work_status')
      .eq('team', '配送センター外注')
      .order('date', { ascending: false })
      .limit(10);
    
    if (vacationsError) {
      console.error('❌ 休暇申請確認エラー:', vacationsError.message);
      return;
    }
    
    console.log(`📅 配送センター外注チームの休暇申請: ${vacations.length}件`);
    vacations.forEach(vacation => {
      console.log(`   - ${vacation.driver_name}: ${vacation.date} (${vacation.work_status})`);
    });
    console.log();
    
    // 3. 休暇設定を確認
    console.log('3️⃣ 休暇設定の確認...');
    const { data: settings, error: settingsError } = await supabase
      .from('vacation_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ 休暇設定確認エラー:', settingsError.message);
      return;
    }
    
    if (settings.length > 0) {
      const setting = settings[0];
      
      // team_monthly_weekday_limitsの確認
      console.log('📊 team_monthly_weekday_limits:');
      if (setting.team_monthly_weekday_limits) {
        const limits = setting.team_monthly_weekday_limits;
        if (limits['配送センター外注']) {
          console.log('   ✅ 配送センター外注の設定が存在');
          // 9月の設定を確認
          if (limits['配送センター外注'][9]) {
            console.log('   📅 9月の設定:');
            Object.entries(limits['配送センター外注'][9]).forEach(([weekday, limit]) => {
              const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
              console.log(`      ${dayNames[weekday]}曜日: ${limit}名`);
            });
          } else {
            console.log('   ⚠️ 9月の設定が見つかりません');
          }
        } else {
          console.log('   ❌ 配送センター外注の設定が見つかりません');
          console.log('   📝 利用可能なチーム:', Object.keys(limits));
        }
      } else {
        console.log('   ❌ team_monthly_weekday_limitsが見つかりません');
      }
      
      // max_drivers_off_per_dayの確認
      console.log('\n📊 max_drivers_off_per_day:');
      if (setting.max_drivers_off_per_day) {
        const maxDrivers = setting.max_drivers_off_per_day;
        if (maxDrivers['配送センター外注']) {
          console.log(`   ✅ 配送センター外注: ${maxDrivers['配送センター外注']}名`);
        } else {
          console.log('   ❌ 配送センター外注の設定が見つかりません');
          console.log('   📝 利用可能なチーム:', Object.keys(maxDrivers));
        }
      } else {
        console.log('   ❌ max_drivers_off_per_dayが見つかりません');
      }
      
      // specific_date_limitsの確認
      console.log('\n📊 specific_date_limits:');
      if (setting.specific_date_limits && Object.keys(setting.specific_date_limits).length > 0) {
        let found = false;
        Object.entries(setting.specific_date_limits).forEach(([date, limits]) => {
          if (limits['配送センター外注']) {
            console.log(`   ✅ ${date}: ${limits['配送センター外注']}名`);
            found = true;
          }
        });
        if (!found) {
          console.log('   ℹ️ 配送センター外注の特定日付設定は見つかりません');
        }
      } else {
        console.log('   ℹ️ 特定日付設定はありません');
      }
    } else {
      console.log('❌ 休暇設定が見つかりません');
    }
    
    console.log('\n🔍 調査完了！');
    
  } catch (error) {
    console.error('❌ 調査エラー:', error.message);
  }
}

// スクリプト実行
checkVacationData();