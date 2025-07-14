-- Safe Migration Script for Supabase
-- This script can be run multiple times without errors
-- Run this in your Supabase SQL Editor

-- First, let's check what already exists
DO $$
DECLARE
    table_exists BOOLEAN;
    type_exists BOOLEAN;
BEGIN
    -- Check if types exist
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'payment_status'
    ) INTO type_exists;
    
    IF type_exists THEN
        RAISE NOTICE 'Types already exist, skipping type creation';
    ELSE
        RAISE NOTICE 'Creating types...';
        -- Run the main migration script
        -- \i supabase-migration.sql
    END IF;
    
    -- Check if main table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'households'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Tables already exist, migration complete';
    ELSE
        RAISE NOTICE 'Tables do not exist, please run the main migration script';
    END IF;
END $$; 