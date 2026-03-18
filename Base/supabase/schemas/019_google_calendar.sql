-- ============================================
-- 019: Google Calendar Integration
-- ============================================

-- Add Google Calendar fields to calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_event_id text;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_calendar_id text;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(google_event_id);
