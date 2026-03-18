-- ============================================
-- 017: Email Threads & Inbound
-- ============================================

-- Add EMAIL_RECEIVED to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'EMAIL_RECEIVED';

-- Add threading/direction columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'OUTBOUND';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS resend_email_id text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS in_reply_to text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_id_header text;

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_id_header ON messages(message_id_header);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
