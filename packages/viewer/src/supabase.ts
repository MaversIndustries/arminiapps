import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://oltqzvjyqlcnwkmnlufp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHF6dmp5cWxjbndrbW5sdWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzk4MzQsImV4cCI6MjA5Njg1NTgzNH0.pRS7UB0b2AxhZvaugrc4luzWzpOOjWzcKaoTXDBLz2U';

export const supabase = createClient(supabaseUrl, supabaseKey);
