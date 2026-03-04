-- ============================================
-- Calendar Seed Data for Fitted Software
-- Run AFTER 008_scheduling.sql schema + 001_crm_demo_data.sql
-- ============================================

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  -- CRM references
  c_meridian uuid;
  c_pulse uuid;
  c_vertex uuid;
  c_oak uuid;
  c_harbor uuid;
  ct_sarah uuid;
  ct_maya uuid;
  ct_david uuid;
  ct_elena uuid;
  ct_marcus uuid;
  ct_james uuid;
  d_pulse uuid;
  d_meridian uuid;
  d_vertex uuid;
  -- Events
  e1 uuid; e2 uuid; e3 uuid; e4 uuid; e5 uuid;
  e6 uuid; e7 uuid; e8 uuid; e9 uuid; e10 uuid;
  e11 uuid; e12 uuid;
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

  -- Fetch CRM references
  SELECT id INTO c_meridian FROM public.companies WHERE org_id = v_org_id AND name = 'Meridian Studios';
  SELECT id INTO c_pulse FROM public.companies WHERE org_id = v_org_id AND name = 'Pulse Health';
  SELECT id INTO c_vertex FROM public.companies WHERE org_id = v_org_id AND name = 'Vertex Capital';
  SELECT id INTO c_oak FROM public.companies WHERE org_id = v_org_id AND name = 'Oak & Stone Properties';
  SELECT id INTO c_harbor FROM public.companies WHERE org_id = v_org_id AND name = 'Harbor Collective';
  SELECT id INTO ct_sarah FROM public.contacts WHERE org_id = v_org_id AND email = 'sarah@meridianstudios.com';
  SELECT id INTO ct_maya FROM public.contacts WHERE org_id = v_org_id AND email = 'maya@pulsehealth.io';
  SELECT id INTO ct_david FROM public.contacts WHERE org_id = v_org_id AND email = 'david@vertexcap.com';
  SELECT id INTO ct_elena FROM public.contacts WHERE org_id = v_org_id AND email = 'elena@harborcollective.com';
  SELECT id INTO ct_marcus FROM public.contacts WHERE org_id = v_org_id AND email = 'marcus@meridianstudios.com';
  SELECT id INTO ct_james FROM public.contacts WHERE org_id = v_org_id AND email = 'james@oakandstone.co';
  SELECT id INTO d_pulse FROM public.deals WHERE org_id = v_org_id AND title = 'Pulse Patient Dashboard';
  SELECT id INTO d_meridian FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Booking System';
  SELECT id INTO d_vertex FROM public.deals WHERE org_id = v_org_id AND title = 'Vertex Portfolio Dashboard';

  -- ========== CALENDAR EVENTS ==========

  -- PAST EVENTS (completed)

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Pulse Health — Kickoff Call',
     'Project kickoff for the patient dashboard build. Review scope, timeline, and deliverables. Maya will walk us through their existing patient flow.',
     'Zoom',
     (current_date - interval '12 days') + time '10:00',
     (current_date - interval '12 days') + time '11:00',
     false, 'COMPLETED', '#5B8DEF',
     ct_maya, c_pulse, d_pulse, v_user_id, v_user_id,
     now() - interval '14 days');

  SELECT id INTO e1 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Pulse Health — Kickoff Call';

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Meridian Studios — Discovery Session',
     'Deep-dive into booking system requirements. Sarah to share rate cards, studio layouts, and current workflow pain points.',
     '450 Market St, San Francisco',
     (current_date - interval '8 days') + time '14:00',
     (current_date - interval '8 days') + time '16:00',
     false, 'COMPLETED', '#D4734E',
     ct_sarah, c_meridian, d_meridian, v_user_id, v_user_id,
     now() - interval '10 days');

  SELECT id INTO e2 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Meridian Studios — Discovery Session';

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Vertex Capital — Portfolio Demo',
     'Presented the dashboard prototype to David. He loved the real-time fund performance charts. Requested API integration with Bloomberg.',
     'Zoom',
     (current_date - interval '5 days') + time '15:00',
     (current_date - interval '5 days') + time '16:00',
     false, 'COMPLETED', '#A78BFA',
     ct_david, c_vertex, d_vertex, v_user_id, v_user_id,
     now() - interval '7 days');

  SELECT id INTO e3 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Vertex Capital — Portfolio Demo';

  -- NO-SHOW

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Oak & Stone — Property Listing Review',
     'James was supposed to review the listing page wireframes. Rescheduled to next week.',
     'Google Meet',
     (current_date - interval '3 days') + time '11:00',
     (current_date - interval '3 days') + time '11:30',
     false, 'NO_SHOW', '#8A817A',
     ct_james, c_oak, NULL, v_user_id, v_user_id,
     now() - interval '5 days');

  SELECT id INTO e4 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Oak & Stone — Property Listing Review';

  -- THIS WEEK — upcoming events

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Pulse Health — Sprint Review',
     'Demo appointment scheduling flow and patient auth onboarding to Maya. Get sign-off before moving to medication tracking.',
     'Zoom',
     current_date + time '10:00',
     current_date + time '11:00',
     false, 'SCHEDULED', '#5B8DEF',
     ct_maya, c_pulse, d_pulse, v_user_id, v_user_id,
     now() - interval '3 days');

  SELECT id INTO e5 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Pulse Health — Sprint Review';

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Team Standup',
     'Weekly internal standup. Review project priorities, blockers, and capacity for the week.',
     'Office',
     current_date + time '09:00',
     current_date + time '09:30',
     false, 'SCHEDULED', '#5EC69A',
     NULL, NULL, NULL, v_user_id, v_user_id,
     now() - interval '7 days');

  SELECT id INTO e6 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Team Standup';

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Meridian — Design Review with Marcus',
     'Review booking UI mockups with Marcus. Focus on studio selection flow and calendar date picker.',
     'Figma + Zoom',
     (current_date + interval '1 day') + time '14:00',
     (current_date + interval '1 day') + time '15:30',
     false, 'SCHEDULED', '#D4734E',
     ct_marcus, c_meridian, d_meridian, v_user_id, v_user_id,
     now() - interval '2 days');

  SELECT id INTO e7 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Meridian — Design Review with Marcus';

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Harbor Collective — Storefront Scoping',
     'Elena wants to discuss unifying their three DTC brands under one storefront. Explore headless commerce options.',
     'Zoom',
     (current_date + interval '2 days') + time '11:00',
     (current_date + interval '2 days') + time '12:00',
     false, 'SCHEDULED', '#E8A84C',
     ct_elena, c_harbor, NULL, v_user_id, v_user_id,
     now() - interval '1 day');

  SELECT id INTO e8 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Harbor Collective — Storefront Scoping';

  -- NEXT WEEK

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Oak & Stone — Wireframe Review (Rescheduled)',
     'Rescheduled from last week. Review property listing wireframes and search filter UX with James.',
     'Google Meet',
     (current_date + interval '5 days') + time '11:00',
     (current_date + interval '5 days') + time '12:00',
     false, 'SCHEDULED', '#8A817A',
     ct_james, c_oak, NULL, v_user_id, v_user_id,
     now());

  SELECT id INTO e9 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Oak & Stone — Wireframe Review (Rescheduled)';

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Pulse Health — HIPAA Compliance Review',
     'Review Supabase Storage encryption config and BAA status with Maya before implementing file storage.',
     'Zoom',
     (current_date + interval '6 days') + time '13:00',
     (current_date + interval '6 days') + time '14:00',
     false, 'SCHEDULED', '#5B8DEF',
     ct_maya, c_pulse, d_pulse, v_user_id, v_user_id,
     now());

  SELECT id INTO e10 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Pulse Health — HIPAA Compliance Review';

  -- ALL-DAY EVENTS

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Pulse Dashboard — Beta Launch',
     'Target date for Pulse patient dashboard beta release. All critical features should be code-complete.',
     NULL,
     current_date + interval '14 days',
     current_date + interval '14 days',
     true, 'SCHEDULED', '#EF5B5B',
     ct_maya, c_pulse, d_pulse, v_user_id, v_user_id,
     now() - interval '10 days');

  SELECT id INTO e11 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Pulse Dashboard — Beta Launch';

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by, created_at) VALUES
    (gen_random_uuid(), v_org_id,
     'Meridian — Contract Renewal',
     'Meridian Studios retainer agreement renewal. Sarah confirmed budget increase for Q3.',
     NULL,
     current_date + interval '21 days',
     current_date + interval '21 days',
     true, 'SCHEDULED', '#D4734E',
     ct_sarah, c_meridian, d_meridian, v_user_id, v_user_id,
     now() - interval '5 days');

  SELECT id INTO e12 FROM public.calendar_events WHERE org_id = v_org_id AND title = 'Meridian — Contract Renewal';

  -- ========== ACTIVITIES ==========

  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, metadata, created_by, created_at) VALUES
    (v_org_id, ct_maya, d_pulse, c_pulse, 'EVENT_CREATED', 'Created event "Pulse Health — Kickoff Call"', jsonb_build_object('event_id', e1), v_user_id, now() - interval '14 days'),
    (v_org_id, ct_maya, d_pulse, c_pulse, 'EVENT_COMPLETED', 'Completed event "Pulse Health — Kickoff Call"', jsonb_build_object('event_id', e1), v_user_id, now() - interval '12 days'),
    (v_org_id, ct_sarah, d_meridian, c_meridian, 'EVENT_CREATED', 'Created event "Meridian Studios — Discovery Session"', jsonb_build_object('event_id', e2), v_user_id, now() - interval '10 days'),
    (v_org_id, ct_sarah, d_meridian, c_meridian, 'EVENT_COMPLETED', 'Completed event "Meridian Studios — Discovery Session"', jsonb_build_object('event_id', e2), v_user_id, now() - interval '8 days'),
    (v_org_id, ct_david, d_vertex, c_vertex, 'EVENT_COMPLETED', 'Completed event "Vertex Capital — Portfolio Demo"', jsonb_build_object('event_id', e3), v_user_id, now() - interval '5 days'),
    (v_org_id, ct_maya, d_pulse, c_pulse, 'EVENT_CREATED', 'Created event "Pulse Health — Sprint Review"', jsonb_build_object('event_id', e5), v_user_id, now() - interval '3 days'),
    (v_org_id, ct_marcus, d_meridian, c_meridian, 'EVENT_CREATED', 'Created event "Meridian — Design Review with Marcus"', jsonb_build_object('event_id', e7), v_user_id, now() - interval '2 days'),
    (v_org_id, ct_elena, NULL, c_harbor, 'EVENT_CREATED', 'Created event "Harbor Collective — Storefront Scoping"', jsonb_build_object('event_id', e8), v_user_id, now() - interval '1 day');

  RAISE NOTICE 'Calendar seed complete: 12 events (3 completed, 1 no-show, 6 scheduled this/next week, 2 all-day milestones), 8 activities';
END $$;
