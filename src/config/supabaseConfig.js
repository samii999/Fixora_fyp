// src/config/supabase.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xbyeahxbamhxiwffbila.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhieWVhaHhiYW1oeGl3ZmZiaWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTA2MDQsImV4cCI6MjA2MTkyNjYwNH0.8SaCxPWWLmZKMtC3X1j8GQi9v9NcwibPfRfMImqHPc8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
