-- ============================================
-- PostgreSQL Initialization Script
-- SilentTalk Database Setup
-- ============================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create schemas (if needed for future organization)
-- CREATE SCHEMA IF NOT EXISTS app;
-- CREATE SCHEMA IF NOT EXISTS audit;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE silentstalk_db TO silentstalk;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'SilentTalk database initialized successfully at %', NOW();
END $$;
