-- Quick Development Setup: Disable RLS on all tables
-- ⚠️ WARNING: This disables all security policies. Only use for development!

-- Disable RLS on all tables
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE chores DISABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensors DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE nudges DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE rent_schedules DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'households',
    'rent_payments', 
    'bills',
    'chores',
    'chore_completions',
    'sensors',
    'sensor_events',
    'nudges',
    'chat_messages',
    'notifications',
    'household_settings',
    'rent_schedules'
  ); 