-- Supabase Migration for Harmony System
-- This file contains all the SQL to create the database schema for the Harmony System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types with IF NOT EXISTS to prevent errors
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'partial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('bank_transfer', 'cash', 'check', 'digital');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bill_category AS ENUM ('electricity', 'water', 'gas', 'internet', 'trash', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chore_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chore_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE chore_category AS ENUM ('cleaning', 'maintenance', 'shopping', 'cooking', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sensor_type AS ENUM ('motion', 'door', 'trash', 'dishwasher', 'washer', 'dryer', 'temperature', 'humidity');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('motion_detected', 'door_opened', 'trash_emptied', 'appliance_completed', 'threshold_exceeded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nudge_type AS ENUM ('chore_reminder', 'bill_due', 'rent_due', 'sensor_triggered', 'conflict_warning');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE nudge_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('rent_due', 'bill_due', 'chore_assigned', 'chore_completed', 'conflict_detected', 'nudge_received');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Households table
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    members TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rent Payments table
CREATE TABLE IF NOT EXISTS rent_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status payment_status DEFAULT 'pending',
    method payment_method,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bills table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status payment_status DEFAULT 'pending',
    category bill_category NOT NULL,
    paid_by VARCHAR(255),
    split_between TEXT[] NOT NULL DEFAULT '{}',
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Chores table
CREATE TABLE IF NOT EXISTS chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(255),
    assigned_by VARCHAR(255),
    due_date DATE,
    completed_date DATE,
    status chore_status DEFAULT 'pending',
    priority chore_priority DEFAULT 'medium',
    category chore_category DEFAULT 'other',
    points INTEGER DEFAULT 10,
    recurring JSONB, -- {frequency: 'daily'|'weekly'|'monthly', interval: number}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Chore Completions table
CREATE TABLE IF NOT EXISTS chore_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chore_id UUID NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_by VARCHAR(255),
    points_earned INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Sensors table
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type sensor_type NOT NULL,
    location VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_reading JSONB, -- {value: any, timestamp: string}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Sensor Events table
CREATE TABLE IF NOT EXISTS sensor_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    event_type event_type NOT NULL,
    value JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Nudges table
CREATE TABLE IF NOT EXISTS nudges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type nudge_type NOT NULL,
    priority nudge_priority DEFAULT 'medium',
    target_users TEXT[] NOT NULL DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    sentiment sentiment_type,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Household Settings table
CREATE TABLE IF NOT EXISTS household_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE UNIQUE,
    rent_reminders JSONB DEFAULT '{"enabled": true, "daysBeforeDue": 3}',
    bill_reminders JSONB DEFAULT '{"enabled": true, "daysBeforeDue": 3}',
    chore_reminders JSONB DEFAULT '{"enabled": true, "frequency": "daily"}',
    sensor_nudges JSONB DEFAULT '{"enabled": true, "types": ["motion", "door", "trash"]}',
    conflict_coaching JSONB DEFAULT '{"enabled": true, "autoTrigger": true, "sentimentThreshold": "medium"}',
    notifications JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Conflict Analyses table
CREATE TABLE IF NOT EXISTS conflict_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    trigger_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    analysis JSONB NOT NULL, -- {sentiment: string, severity: string, topics: string[], suggestions: string[]}
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Conflict Coach Sessions table
CREATE TABLE IF NOT EXISTS conflict_coach_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    participants TEXT[] NOT NULL DEFAULT '{}',
    topic VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    messages JSONB DEFAULT '[]', -- Array of {role: string, content: string, timestamp: string}
    suggestions TEXT[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_rent_payments_household_id ON rent_payments(household_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_user_id ON rent_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_status ON rent_payments(status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_due_date ON rent_payments(due_date);

CREATE INDEX IF NOT EXISTS idx_bills_household_id ON bills(household_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

CREATE INDEX IF NOT EXISTS idx_chores_household_id ON chores(household_id);
CREATE INDEX IF NOT EXISTS idx_chores_assigned_to ON chores(assigned_to);
CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);
CREATE INDEX IF NOT EXISTS idx_chores_due_date ON chores(due_date);

CREATE INDEX IF NOT EXISTS idx_chore_completions_chore_id ON chore_completions(chore_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_user_id ON chore_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_chore_completions_completed_at ON chore_completions(completed_at);

CREATE INDEX IF NOT EXISTS idx_sensors_household_id ON sensors(household_id);
CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
CREATE INDEX IF NOT EXISTS idx_sensors_is_active ON sensors(is_active);

CREATE INDEX IF NOT EXISTS idx_sensor_events_sensor_id ON sensor_events(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_events_timestamp ON sensor_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_events_event_type ON sensor_events(event_type);

CREATE INDEX IF NOT EXISTS idx_nudges_household_id ON nudges(household_id);
CREATE INDEX IF NOT EXISTS idx_nudges_target_users ON nudges USING GIN(target_users);
CREATE INDEX IF NOT EXISTS idx_nudges_is_read ON nudges(is_read);
CREATE INDEX IF NOT EXISTS idx_nudges_type ON nudges(type);

CREATE INDEX IF NOT EXISTS idx_chat_messages_household_id ON chat_messages(household_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_household_id ON notifications(household_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_conflict_analyses_household_id ON conflict_analyses(household_id);
CREATE INDEX IF NOT EXISTS idx_conflict_analyses_created_at ON conflict_analyses(created_at);

CREATE INDEX IF NOT EXISTS idx_conflict_coach_sessions_household_id ON conflict_coach_sessions(household_id);
CREATE INDEX IF NOT EXISTS idx_conflict_coach_sessions_participants ON conflict_coach_sessions USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_conflict_coach_sessions_status ON conflict_coach_sessions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to tables that need them (with IF NOT EXISTS)
DO $$ BEGIN
    CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_rent_payments_updated_at BEFORE UPDATE ON rent_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_chores_updated_at BEFORE UPDATE ON chores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_nudges_updated_at BEFORE UPDATE ON nudges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_household_settings_updated_at BEFORE UPDATE ON household_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable Row Level Security (RLS)
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
ALTER TABLE conflict_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_coach_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these based on your auth system)
-- For now, we'll create policies that allow all operations for authenticated users
-- You should replace these with proper policies based on your authentication system

-- Households policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage households" ON households
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Rent payments policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage rent payments" ON rent_payments
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Bills policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage bills" ON bills
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Chores policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage chores" ON chores
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Chore completions policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage chore completions" ON chore_completions
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sensors policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage sensors" ON sensors
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Sensor events policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage sensor events" ON sensor_events
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Nudges policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage nudges" ON nudges
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Chat messages policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage chat messages" ON chat_messages
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notifications policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage notifications" ON notifications
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Household settings policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage household settings" ON household_settings
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Conflict analyses policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage conflict analyses" ON conflict_analyses
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Conflict coach sessions policies
DO $$ BEGIN
    CREATE POLICY "Allow authenticated users to manage conflict coach sessions" ON conflict_coach_sessions
        FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_household_stats(household_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'rent', json_build_object(
            'totalDue', COALESCE(SUM(amount), 0),
            'totalPaid', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
            'overdueAmount', COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0)
        ),
        'bills', json_build_object(
            'totalDue', COALESCE(SUM(amount), 0),
            'totalPaid', COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0),
            'overdueCount', COUNT(CASE WHEN status = 'overdue' THEN 1 END)
        ),
        'chores', json_build_object(
            'pendingCount', COUNT(CASE WHEN status = 'pending' THEN 1 END),
            'completedThisWeek', COUNT(CASE WHEN status = 'completed' AND completed_date >= NOW() - INTERVAL '7 days' THEN 1 END),
            'totalPoints', COALESCE(SUM(points), 0)
        )
    ) INTO result
    FROM (
        SELECT 'rent' as type, amount, status, NULL as completed_date, NULL as points
        FROM rent_payments 
        WHERE household_id = household_uuid
        UNION ALL
        SELECT 'bill' as type, amount, status, NULL as completed_date, NULL as points
        FROM bills 
        WHERE household_id = household_uuid
        UNION ALL
        SELECT 'chore' as type, NULL as amount, status, completed_date, points
        FROM chores 
        WHERE household_id = household_uuid
    ) combined_data;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 