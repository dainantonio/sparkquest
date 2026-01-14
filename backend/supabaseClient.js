// backend/supabaseClient.js
// Helper to connect to Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file!');
  console.error('Please ensure you created backend/.env with SUPABASE_URL and SUPABASE_ANON_KEY');
  // We don't exit process here to allow the server to start even if DB fails, 
  // but APIs will fail.
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

console.log('✅ Supabase client initialized');

module.exports = supabase;