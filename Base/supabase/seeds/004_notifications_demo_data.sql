-- ============================================
-- Notifications Seed Data
-- Run AFTER 006_notifications.sql schema + 001_crm_demo_data.sql
-- ============================================

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
BEGIN
  -- Get org + user
  SELECT om.org_id, om.user_id INTO v_org_id, v_user_id
  FROM public.organization_members om
  WHERE om.role = 'OWNER'
  ORDER BY om.created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Sign up first.';
  END IF;

  -- Mix of UNREAD and READ, various source types, staggered timestamps
  INSERT INTO public.notifications (org_id, user_id, title, body, link, icon, status, source_type, source_id, created_at) VALUES
  -- Unread notifications (recent)
  (v_org_id, v_user_id, 'New deal moved to Proposal',
   'Meridian Booking System advanced to Proposal stage',
   '/dashboard/crm/deals', 'Handshake', 'UNREAD', 'deal', null,
   now() - interval '5 minutes'),

  (v_org_id, v_user_id, 'Task assigned to you',
   'Homepage wireframes — Website Redesign board',
   '/dashboard/tasks', 'CheckSquare', 'UNREAD', 'task', null,
   now() - interval '22 minutes'),

  (v_org_id, v_user_id, 'Invoice #INV-0042 paid',
   'Pulse Health paid $12,400.00',
   '/dashboard/invoicing', 'FileText', 'UNREAD', 'invoice', null,
   now() - interval '1 hour'),

  (v_org_id, v_user_id, 'New contact added',
   'Maya Chen (maya@pulsehealth.io) was created',
   '/dashboard/crm/contacts', 'User', 'UNREAD', 'contact', null,
   now() - interval '2 hours'),

  (v_org_id, v_user_id, 'Task overdue: API integration',
   'Due date was yesterday — Operations board',
   '/dashboard/tasks', 'CheckSquare', 'UNREAD', 'task', null,
   now() - interval '3 hours'),

  -- Read notifications (older)
  (v_org_id, v_user_id, 'Company updated',
   'Meridian Studios address was updated',
   '/dashboard/crm/companies', 'Building2', 'READ', 'company', null,
   now() - interval '6 hours'),

  (v_org_id, v_user_id, 'Deal won: Pulse Patient Dashboard',
   'Closed at $48,000 — congratulations!',
   '/dashboard/crm/deals', 'Handshake', 'READ', 'deal', null,
   now() - interval '1 day'),

  (v_org_id, v_user_id, 'Invoice #INV-0039 sent',
   'Sent to sarah@meridianstudios.com',
   '/dashboard/invoicing', 'FileText', 'READ', 'invoice', null,
   now() - interval '2 days'),

  (v_org_id, v_user_id, 'Task completed: Brand guidelines',
   'Marked as done in Website Redesign',
   '/dashboard/tasks', 'CheckSquare', 'READ', 'task', null,
   now() - interval '3 days'),

  (v_org_id, v_user_id, 'New contact from referral',
   'James Park (james@novacorp.io) was added',
   '/dashboard/crm/contacts', 'User', 'READ', 'contact', null,
   now() - interval '5 days');

  RAISE NOTICE 'Inserted 10 notifications (5 unread, 5 read) for user %', v_user_id;
END $$;
