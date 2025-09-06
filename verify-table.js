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

async function verifyTable() {
  try {
    console.log('🔍 Verifying temporary_assignments table...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('temporary_assignments')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist') || error.code === 'PGRST106') {
        console.log('❌ temporary_assignments table does not exist');
        console.log('📋 Please create it using the Supabase Dashboard');
        console.log('🌐 SQL Editor: https://xniocmtnfkaxvzfzrnna.supabase.co/project/xniocmtnfkaxvzfzrnna/sql');
      } else {
        console.log('⚠️  Error querying table:', error.message);
      }
      return false;
    }

    console.log('✅ temporary_assignments table exists and is accessible!');
    console.log('📊 Current record count:', data.length);
    return true;
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

verifyTable();