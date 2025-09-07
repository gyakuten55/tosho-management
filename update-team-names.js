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

async function updateTeamNames() {
  try {
    console.log('🔄 チーム名「外部ドライバー」を「配送センター外注」に更新中...\n');
    
    // 1. ドライバーテーブルの更新前確認
    console.log('1️⃣ ドライバーテーブルの更新...');
    const { data: driversBeforeUpdate, error: driversCheckError } = await supabase
      .from('drivers')
      .select('id, name, team')
      .eq('team', '外部ドライバー');
    
    if (driversCheckError) {
      console.error('❌ ドライバーテーブル確認エラー:', driversCheckError.message);
      return;
    }
    
    console.log(`📊 「外部ドライバー」チームのドライバー: ${driversBeforeUpdate.length}名`);
    if (driversBeforeUpdate.length > 0) {
      console.log('👥 対象ドライバー:');
      driversBeforeUpdate.forEach(driver => {
        console.log(`   - ${driver.name} (ID: ${driver.id})`);
      });
    }
    
    // ドライバーテーブルの更新
    const { data: updatedDrivers, error: driversUpdateError } = await supabase
      .from('drivers')
      .update({ team: '配送センター外注' })
      .eq('team', '外部ドライバー')
      .select('id, name, team');
    
    if (driversUpdateError) {
      console.error('❌ ドライバーテーブル更新エラー:', driversUpdateError.message);
      return;
    }
    
    console.log(`✅ ドライバーテーブル更新完了: ${updatedDrivers.length}名のチーム名を変更\n`);
    
    // 2. 休暇申請テーブルの更新
    console.log('2️⃣ 休暇申請テーブルの更新...');
    const { data: vacationsBefore, error: vacationsCheckError } = await supabase
      .from('vacation_requests')
      .select('id, team')
      .eq('team', '外部ドライバー')
      .limit(5); // サンプル表示のため5件まで
    
    if (vacationsCheckError) {
      console.error('❌ 休暇申請テーブル確認エラー:', vacationsCheckError.message);
      return;
    }
    
    console.log(`📊 「外部ドライバー」チームの休暇申請レコード: ${vacationsBefore.length}件以上`);
    
    // 休暇申請テーブルの更新
    const { data: updatedVacations, error: vacationsUpdateError } = await supabase
      .from('vacation_requests')
      .update({ team: '配送センター外注' })
      .eq('team', '外部ドライバー')
      .select('id');
    
    if (vacationsUpdateError) {
      console.error('❌ 休暇申請テーブル更新エラー:', vacationsUpdateError.message);
      return;
    }
    
    console.log(`✅ 休暇申請テーブル更新完了: ${updatedVacations.length}件のチーム名を変更\n`);
    
    // 3. 休暇設定テーブルの確認と更新
    console.log('3️⃣ 休暇設定テーブルの更新...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('vacation_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('❌ 休暇設定テーブル確認エラー:', settingsError.message);
      return;
    }
    
    if (settingsData.length > 0) {
      let settingsUpdated = false;
      
      for (const setting of settingsData) {
        let updatedSetting = { ...setting };
        let hasChanges = false;
        
        // teamMonthlyWeekdayLimitsの更新
        if (updatedSetting.team_monthly_weekday_limits && 
            typeof updatedSetting.team_monthly_weekday_limits === 'object') {
          const limits = updatedSetting.team_monthly_weekday_limits;
          if (limits['外部ドライバー']) {
            limits['配送センター外注'] = limits['外部ドライバー'];
            delete limits['外部ドライバー'];
            updatedSetting.team_monthly_weekday_limits = limits;
            hasChanges = true;
            console.log('📝 team_monthly_weekday_limits内の「外部ドライバー」を「配送センター外注」に変更');
          }
        }
        
        // maxDriversOffPerDayの更新
        if (updatedSetting.max_drivers_off_per_day && 
            typeof updatedSetting.max_drivers_off_per_day === 'object') {
          const maxDrivers = updatedSetting.max_drivers_off_per_day;
          if (maxDrivers['外部ドライバー']) {
            maxDrivers['配送センター外注'] = maxDrivers['外部ドライバー'];
            delete maxDrivers['外部ドライバー'];
            updatedSetting.max_drivers_off_per_day = maxDrivers;
            hasChanges = true;
            console.log('📝 max_drivers_off_per_day内の「外部ドライバー」を「配送センター外注」に変更');
          }
        }
        
        // specificDateLimitsの更新
        if (updatedSetting.specific_date_limits && 
            typeof updatedSetting.specific_date_limits === 'object') {
          const dateLimit = updatedSetting.specific_date_limits;
          Object.keys(dateLimit).forEach(date => {
            if (dateLimit[date]['外部ドライバー']) {
              dateLimit[date]['配送センター外注'] = dateLimit[date]['外部ドライバー'];
              delete dateLimit[date]['外部ドライバー'];
              hasChanges = true;
            }
          });
          if (hasChanges) {
            updatedSetting.specific_date_limits = dateLimit;
            console.log('📝 specific_date_limits内の「外部ドライバー」を「配送センター外注」に変更');
          }
        }
        
        // 変更があった場合のみ更新
        if (hasChanges) {
          const { error: updateError } = await supabase
            .from('vacation_settings')
            .update(updatedSetting)
            .eq('id', setting.id);
          
          if (updateError) {
            console.error('❌ 休暇設定更新エラー:', updateError.message);
            return;
          }
          
          settingsUpdated = true;
        }
      }
      
      if (settingsUpdated) {
        console.log('✅ 休暇設定テーブル更新完了\n');
      } else {
        console.log('ℹ️ 休暇設定テーブルに「外部ドライバー」の設定は見つかりませんでした\n');
      }
    } else {
      console.log('ℹ️ 休暇設定テーブルにレコードが見つかりませんでした\n');
    }
    
    // 4. 更新後の確認
    console.log('4️⃣ 更新結果の確認...');
    
    // ドライバーテーブルの確認
    const { data: driversAfter, error: driversAfterError } = await supabase
      .from('drivers')
      .select('id, name, team')
      .eq('team', '配送センター外注');
    
    if (!driversAfterError && driversAfter) {
      console.log(`✅ 現在の「配送センター外注」チームのドライバー: ${driversAfter.length}名`);
    }
    
    // 外部ドライバーが残っていないか確認
    const { data: remainingDrivers, error: remainingError } = await supabase
      .from('drivers')
      .select('id, name, team')
      .eq('team', '外部ドライバー');
    
    if (!remainingError && remainingDrivers) {
      if (remainingDrivers.length > 0) {
        console.log(`⚠️ 「外部ドライバー」チームが残っています: ${remainingDrivers.length}名`);
      } else {
        console.log('✅ 「外部ドライバー」チームのドライバーは全て変更されました');
      }
    }
    
    console.log('\n🎉 チーム名の更新が完了しました！');
    
  } catch (error) {
    console.error('❌ 更新処理エラー:', error.message);
  }
}

// スクリプト実行
updateTeamNames();