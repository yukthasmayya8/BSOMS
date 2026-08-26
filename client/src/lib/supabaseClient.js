import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://bthgiojjqnrvfzcduyui.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0aGdpb2pqcW5ydmZ6Y2R1eXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Nzg1NTcsImV4cCI6MjA5NzE1NDU1N30.2a8R2bY3Wk8uh2ANyQZgHwJYPUdLi1u1v5ZlDPbCKWc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
