-- Migration: Privacy and GDPR Compliance Tables
-- Version: 006
-- Description: Creates tables for data export, account deletion, privacy settings, and consent management

-- Export requests table
CREATE TABLE IF NOT EXISTS export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    download_url TEXT,
    expires_at TIMESTAMP,
    estimated_completion_time TIMESTAMP NOT NULL,
    error_message TEXT,
    file_size BIGINT
);

CREATE INDEX idx_export_requests_user_id ON export_requests(user_id);
CREATE INDEX idx_export_requests_status ON export_requests(status);
CREATE INDEX idx_export_requests_expires_at ON export_requests(expires_at) WHERE status = 'completed';

COMMENT ON TABLE export_requests IS 'Tracks user data export requests (GDPR Article 20)';
COMMENT ON COLUMN export_requests.format IS 'Export format: json or csv';
COMMENT ON COLUMN export_requests.status IS 'Processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN export_requests.expires_at IS 'Download link expiration (7 days after completion)';

-- Deletion requests table (Right to be Forgotten)
CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    scheduled_date TIMESTAMP NOT NULL,
    cancellation_deadline TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    cancelled_by VARCHAR(50),
    cancelled_reason TEXT
);

CREATE INDEX idx_deletion_requests_user_id ON deletion_requests(user_id);
CREATE INDEX idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX idx_deletion_requests_scheduled_date ON deletion_requests(scheduled_date) WHERE status = 'pending';

COMMENT ON TABLE deletion_requests IS 'Tracks account deletion requests (GDPR Article 17)';
COMMENT ON COLUMN deletion_requests.scheduled_date IS 'Date when account will be deleted (30 days after request)';
COMMENT ON COLUMN deletion_requests.cancellation_deadline IS 'Last date user can cancel deletion (29 days after request)';
COMMENT ON COLUMN deletion_requests.cancelled_by IS 'Who cancelled: user or system';

-- Privacy settings table
CREATE TABLE IF NOT EXISTS privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    profile_visibility VARCHAR(20) NOT NULL DEFAULT 'friends' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    show_online_status BOOLEAN NOT NULL DEFAULT TRUE,
    allow_friend_requests BOOLEAN NOT NULL DEFAULT TRUE,
    allow_messages VARCHAR(20) NOT NULL DEFAULT 'friends' CHECK (allow_messages IN ('everyone', 'friends', 'none')),
    data_sharing BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
    analytics_tracking BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_privacy_settings_updated_at ON privacy_settings(updated_at);

COMMENT ON TABLE privacy_settings IS 'User privacy preferences and settings';
COMMENT ON COLUMN privacy_settings.profile_visibility IS 'Who can see user profile: public, friends, or private';
COMMENT ON COLUMN privacy_settings.allow_messages IS 'Who can send messages: everyone, friends, or none';
COMMENT ON COLUMN privacy_settings.data_sharing IS 'Allow sharing anonymized data with partners';
COMMENT ON COLUMN privacy_settings.marketing_emails IS 'Consent to receive marketing emails';
COMMENT ON COLUMN privacy_settings.analytics_tracking IS 'Consent to analytics tracking';

-- Consents table (GDPR consent tracking)
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    withdrawn_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    version VARCHAR(10),
    UNIQUE(user_id, consent_type)
);

CREATE INDEX idx_consents_user_id ON consents(user_id);
CREATE INDEX idx_consents_type ON consents(consent_type);
CREATE INDEX idx_consents_granted_at ON consents(granted_at);

COMMENT ON TABLE consents IS 'Records of user consents for GDPR compliance';
COMMENT ON COLUMN consents.consent_type IS 'Type of consent: cookies, analytics, marketing, data_sharing, etc.';
COMMENT ON COLUMN consents.granted IS 'Whether consent was granted or withdrawn';
COMMENT ON COLUMN consents.granted_at IS 'Timestamp when consent was given or changed';
COMMENT ON COLUMN consents.ip_address IS 'IP address at time of consent (for proof)';
COMMENT ON COLUMN consents.user_agent IS 'User agent string at time of consent (for proof)';
COMMENT ON COLUMN consents.version IS 'Version of privacy policy/terms accepted';

-- Activity logs table (for security and audit)
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    details JSONB
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- Partition activity_logs by month for better performance
-- CREATE TABLE activity_logs_y2025m11 PARTITION OF activity_logs
-- FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

COMMENT ON TABLE activity_logs IS 'User activity logs for security and audit (90-day retention)';
COMMENT ON COLUMN activity_logs.action IS 'Action performed: login, logout, data_export, settings_change, etc.';
COMMENT ON COLUMN activity_logs.details IS 'Additional context as JSON';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for privacy_settings updated_at
CREATE TRIGGER update_privacy_settings_updated_at
    BEFORE UPDATE ON privacy_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
        VALUES (NEW.user_id, 'consent_granted', 'consent', NEW.id::TEXT,
                jsonb_build_object('consent_type', NEW.consent_type, 'granted', NEW.granted));
    ELSIF TG_OP = 'UPDATE' AND OLD.granted != NEW.granted THEN
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details)
        VALUES (NEW.user_id, 'consent_changed', 'consent', NEW.id::TEXT,
                jsonb_build_object('consent_type', NEW.consent_type, 'old_value', OLD.granted, 'new_value', NEW.granted));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to log consent changes
CREATE TRIGGER log_consent_change_trigger
    AFTER INSERT OR UPDATE ON consents
    FOR EACH ROW
    EXECUTE FUNCTION log_consent_change();

-- Insert default privacy settings for existing users
INSERT INTO privacy_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM privacy_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON export_requests TO silenttalk_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON deletion_requests TO silenttalk_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON privacy_settings TO silenttalk_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON consents TO silenttalk_app;
GRANT SELECT, INSERT ON activity_logs TO silenttalk_app;

-- Migration metadata
INSERT INTO schema_migrations (version, description, applied_at)
VALUES (6, 'Privacy and GDPR compliance tables', NOW())
ON CONFLICT (version) DO NOTHING;
