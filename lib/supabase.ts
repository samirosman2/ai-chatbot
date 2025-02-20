import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aotyisatkzbwgjjudgcs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdHlpc2F0a3pid2dqanVkZ2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MzAyMDMsImV4cCI6MjA1NTIwNjIwM30.YtHgtDHIKELHtMQBirO1iLD5YGJ9FPW1Ce6A01926JQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)