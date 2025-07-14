# Supabase Row Level Security (RLS) Setup Guide

This guide will help you resolve the RLS policy violation errors you're encountering with the Harmony System.

## 🔧 Quick Fix Options

### Option 1: Use Service Role Key (Recommended for Development)

1. **Get your Service Role Key**:
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "service_role" key (NOT the anon key)

2. **Add to your environment variables**:
   Create or update your `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

The service role key bypasses RLS policies and allows the database setup to work properly.

### Option 2: Disable RLS for Development (Quick Fix)

If you want to disable RLS temporarily for development:

1. **Go to your Supabase dashboard**
2. **Navigate to Authentication → Policies**
3. **For each table, disable RLS**:
   - Click on the table name
   - Toggle "Enable RLS" to OFF
   - Click "Save"

**⚠️ Warning**: This disables all security policies. Only use for development.

### Option 3: Create Proper RLS Policies (Production Ready)

For production, you should create proper RLS policies. Here are the SQL commands:

```sql
-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chore_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Households: Users can read/write households they're members of
CREATE POLICY "Users can manage their households" ON households
  FOR ALL USING (auth.uid()::text = ANY(members));

-- Rent payments: Users can manage payments for their households
CREATE POLICY "Users can manage rent payments" ON rent_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = rent_payments.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );

-- Bills: Users can manage bills for their households
CREATE POLICY "Users can manage bills" ON bills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = bills.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );

-- Chores: Users can manage chores for their households
CREATE POLICY "Users can manage chores" ON chores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = chores.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );

-- Chore completions: Users can manage completions for their households
CREATE POLICY "Users can manage chore completions" ON chore_completions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chores c
      JOIN households h ON c.household_id = h.id
      WHERE c.id = chore_completions.chore_id 
      AND auth.uid()::text = ANY(h.members)
    )
  );

-- Sensors: Users can manage sensors for their households
CREATE POLICY "Users can manage sensors" ON sensors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = sensors.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );

-- Sensor events: Users can manage events for their households
CREATE POLICY "Users can manage sensor events" ON sensor_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sensors s
      JOIN households h ON s.household_id = h.id
      WHERE s.id = sensor_events.sensor_id 
      AND auth.uid()::text = ANY(h.members)
    )
  );

-- Nudges: Users can manage nudges for their households
CREATE POLICY "Users can manage nudges" ON nudges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = nudges.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );

-- Chat messages: Users can manage messages for their households
CREATE POLICY "Users can manage chat messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = chat_messages.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );

-- Notifications: Users can manage their own notifications
CREATE POLICY "Users can manage their notifications" ON notifications
  FOR ALL USING (auth.uid()::text = user_id);

-- Household settings: Users can manage settings for their households
CREATE POLICY "Users can manage household settings" ON household_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = household_settings.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );

-- Rent schedules: Users can manage schedules for their households
CREATE POLICY "Users can manage rent schedules" ON rent_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM households 
      WHERE id = rent_schedules.household_id 
      AND auth.uid()::text = ANY(members)
    )
  );
```

## 🔍 Troubleshooting

### Error: "new row violates row-level security policy"

This error occurs when:
1. RLS is enabled but no policies allow the operation
2. The user is not authenticated
3. The user doesn't have permission for the specific operation

**Solutions**:
1. Use the service role key for setup operations
2. Ensure the user is authenticated before database operations
3. Create appropriate RLS policies
4. Temporarily disable RLS for development

### Error: "Missing Supabase environment variables"

Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Error: "401 Unauthorized"

This means the API key is invalid or missing. Check:
1. Your environment variables are loaded correctly
2. The API keys are correct
3. You're using the right key for the right operation

## 🚀 Recommended Setup for Development

1. **Use the service role key** for database setup operations
2. **Keep RLS enabled** but use the admin client for setup
3. **Test with proper authentication** for user-facing features
4. **Create proper policies** before production deployment

## 🔒 Production Considerations

For production:
1. **Never expose the service role key** to the client
2. **Use proper RLS policies** for all tables
3. **Implement proper authentication** with Clerk
4. **Test all operations** with authenticated users
5. **Monitor access patterns** and adjust policies as needed

## 📝 Next Steps

1. Add the service role key to your environment variables
2. Restart your development server
3. Test the database setup functionality
4. Verify that the Harmony System works correctly
5. Consider implementing proper RLS policies for production

The service role key approach is the quickest solution for development while maintaining security for production use. 