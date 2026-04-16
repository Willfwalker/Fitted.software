-- =====================================================================
-- Fitted Agency — FULL DEMO SEED
-- =====================================================================
-- Single runnable script. Paste into the Supabase SQL editor after
-- all schemas (001–020) + migrations have been applied AND a user
-- has signed up (so organization_members has at least one OWNER).
--
-- Covers: CRM · Invoices · Tasks · Calendar · Notifications · Files
-- · Messaging · Forms · Chat · Time Tracking · Client Portals · Automations
--
-- Idempotent-ish: wipes prior demo rows for the target org before
-- re-inserting, so you can re-run this safely.
-- =====================================================================

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;

  c_meridian uuid;
  c_oak uuid;
  c_pulse uuid;
  c_vertex uuid;
  c_harbor uuid;

  ct_sarah uuid;
  ct_james uuid;
  ct_maya uuid;
  ct_david uuid;
  ct_elena uuid;
  ct_marcus uuid;
  ct_rachel uuid;
  ct_tom uuid;

  d_harbor_storefront uuid;
  d_tom_saas uuid;
  d_oak_platform uuid;
  d_meridian_booking uuid;
  d_pulse_dashboard uuid;
  d_vertex_tracker uuid;
  d_meridian_portal uuid;
  d_harbor_analytics uuid;

  inv1 uuid;
  inv2 uuid;
  inv3 uuid;
  inv4 uuid;
  inv5 uuid;
  inv6 uuid;
  inv7 uuid;
  inv8 uuid;
  inv9 uuid;
  inv10 uuid;
  inv_num text;

  b_pulse uuid;
  b_meridian uuid;
  col_pulse_todo uuid;
  col_pulse_progress uuid;
  col_pulse_review uuid;
  col_pulse_done uuid;
  col_mer_todo uuid;
  col_mer_progress uuid;
  col_mer_review uuid;
  col_mer_done uuid;

  lbl_design uuid;
  lbl_dev uuid;
  lbl_content uuid;
  lbl_bug uuid;
  lbl_urgent uuid;
  lbl_ops uuid;

  t_appt uuid;
  t_auth uuid;
  t_records uuid;
  t_ci uuid;
  t_discovery uuid;
  t_stripe uuid;
  t_calendar_sync uuid;

  e_kickoff uuid;
  e_discovery uuid;
  e_demo_vertex uuid;

  f_proposal uuid;
  f_contract uuid;
  f_mockups uuid;
  f_logo uuid;
  f_hipaa uuid;

  form_contact uuid;
  form_intake uuid;

  tpl_welcome uuid;
  tpl_followup uuid;
  tpl_invoice uuid;

  auto_welcome uuid;
  auto_invoice_paid uuid;
  auto_stale uuid;

  portal_vertex uuid;
  portal_pulse uuid;
BEGIN
  -- --------------------------------------------------------------
  -- Locate org + owner
  -- --------------------------------------------------------------
  SELECT om.org_id, om.user_id INTO v_org_id, v_user_id
  FROM public.organization_members om
  WHERE om.role = 'OWNER'
  ORDER BY om.created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Sign up first, then re-run this seed.';
  END IF;

  RAISE NOTICE 'Seeding demo data for org % (owner user %)', v_org_id, v_user_id;

  -- --------------------------------------------------------------
  -- Wipe prior seed rows so the script is re-runnable.
  -- Order matters: leaf tables first.
  -- --------------------------------------------------------------
  DELETE FROM public.automation_logs   WHERE org_id = v_org_id;
  DELETE FROM public.automations       WHERE org_id = v_org_id;
  DELETE FROM public.client_portals    WHERE org_id = v_org_id;
  DELETE FROM public.time_entries      WHERE org_id = v_org_id;
  DELETE FROM public.chat_messages     WHERE org_id = v_org_id;
  DELETE FROM public.form_submissions  WHERE org_id = v_org_id;
  DELETE FROM public.forms             WHERE org_id = v_org_id;
  DELETE FROM public.messages          WHERE org_id = v_org_id;
  DELETE FROM public.message_templates WHERE org_id = v_org_id;
  DELETE FROM public.entity_files      WHERE org_id = v_org_id;
  DELETE FROM public.files             WHERE org_id = v_org_id;
  DELETE FROM public.notifications     WHERE org_id = v_org_id;
  DELETE FROM public.calendar_events   WHERE org_id = v_org_id;
  DELETE FROM public.task_labels       WHERE task_id IN (SELECT id FROM public.tasks WHERE org_id = v_org_id);
  DELETE FROM public.tasks             WHERE org_id = v_org_id;
  DELETE FROM public.board_columns     WHERE board_id IN (SELECT id FROM public.boards WHERE org_id = v_org_id);
  DELETE FROM public.boards            WHERE org_id = v_org_id;
  DELETE FROM public.labels            WHERE org_id = v_org_id;
  DELETE FROM public.recurring_invoices WHERE org_id = v_org_id;
  DELETE FROM public.invoices          WHERE org_id = v_org_id;
  DELETE FROM public.activities        WHERE org_id = v_org_id;
  DELETE FROM public.deals             WHERE org_id = v_org_id;
  DELETE FROM public.contacts          WHERE org_id = v_org_id;
  DELETE FROM public.companies         WHERE org_id = v_org_id;

  -- =====================================================================
  -- 1. CRM — Companies
  -- =====================================================================
  INSERT INTO public.companies (id, org_id, name, domain, industry, phone, email, address, notes, created_by) VALUES
    (gen_random_uuid(), v_org_id, 'Meridian Studios',     'meridianstudios.com',   'Media & Entertainment', '(415) 555-0142', 'hello@meridianstudios.com',      '450 Market St, San Francisco, CA 94105', 'Full-service creative studio. Rebuild of client portal + booking.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Oak & Stone Properties','oakandstone.co',        'Real Estate',           '(512) 555-0188', 'info@oakandstone.co',             '200 Congress Ave, Austin, TX 78701',     'Boutique real estate firm. Listing platform + agent CRM.',         v_user_id),
    (gen_random_uuid(), v_org_id, 'Pulse Health',         'pulsehealth.io',        'Healthcare Tech',       '(646) 555-0231', 'partnerships@pulsehealth.io',     '88 Pine St, New York, NY 10005',         'Series A digital health. Patient dashboard + scheduling.',         v_user_id),
    (gen_random_uuid(), v_org_id, 'Vertex Capital',       'vertexcap.com',         'Finance',               '(312) 555-0167', 'deals@vertexcap.com',             '333 N Michigan Ave, Chicago, IL 60601',  'VC portfolio tracking dashboard. High budget.',                    v_user_id),
    (gen_random_uuid(), v_org_id, 'Harbor Collective',    'harborcollective.com',  'E-Commerce',            '(503) 555-0199', 'team@harborcollective.com',       '1221 SW 4th Ave, Portland, OR 97204',    'DTC brand collective. Unified storefront.',                        v_user_id);

  SELECT id INTO c_meridian FROM public.companies WHERE org_id = v_org_id AND name = 'Meridian Studios';
  SELECT id INTO c_oak      FROM public.companies WHERE org_id = v_org_id AND name = 'Oak & Stone Properties';
  SELECT id INTO c_pulse    FROM public.companies WHERE org_id = v_org_id AND name = 'Pulse Health';
  SELECT id INTO c_vertex   FROM public.companies WHERE org_id = v_org_id AND name = 'Vertex Capital';
  SELECT id INTO c_harbor   FROM public.companies WHERE org_id = v_org_id AND name = 'Harbor Collective';

  -- =====================================================================
  -- 2. CRM — Contacts
  -- =====================================================================
  INSERT INTO public.contacts (id, org_id, first_name, last_name, email, phone, title, company_id, notes, created_by) VALUES
    (gen_random_uuid(), v_org_id, 'Sarah',   'Chen',      'sarah@meridianstudios.com',   '(415) 555-0143', 'Creative Director',   c_meridian, 'Primary DM. Prefers Slack.',                                  v_user_id),
    (gen_random_uuid(), v_org_id, 'James',   'Mitchell',  'james@oakandstone.co',        '(512) 555-0189', 'Managing Partner',    c_oak,      'Met at Austin Tech Week.',                                    v_user_id),
    (gen_random_uuid(), v_org_id, 'Maya',    'Rodriguez', 'maya@pulsehealth.io',         '(646) 555-0232', 'CTO',                 c_pulse,    'Technical buyer. Wants architecture docs.',                   v_user_id),
    (gen_random_uuid(), v_org_id, 'David',   'Park',      'david@vertexcap.com',         '(312) 555-0168', 'Partner',             c_vertex,   'Budget holder. Needs board-ready reporting.',                 v_user_id),
    (gen_random_uuid(), v_org_id, 'Elena',   'Vasquez',   'elena@harborcollective.com',  '(503) 555-0200', 'Head of Digital',     c_harbor,   'Referred by James.',                                          v_user_id),
    (gen_random_uuid(), v_org_id, 'Marcus',  'Webb',      'marcus@pulsehealth.io',       '(646) 555-0233', 'Head of Product',     c_pulse,    'Owns patient experience roadmap.',                            v_user_id),
    (gen_random_uuid(), v_org_id, 'Rachel',  'Kim',       'rachel@meridianstudios.com',  '(415) 555-0144', 'VP Operations',       c_meridian, 'Handles contracts and billing.',                              v_user_id),
    (gen_random_uuid(), v_org_id, 'Tom',     'Bradley',   'tom.bradley@gmail.com',       '(206) 555-0177', 'Founder',             NULL,       'Freelance consultant. Early-stage idea.',                     v_user_id);

  SELECT id INTO ct_sarah  FROM public.contacts WHERE org_id = v_org_id AND email = 'sarah@meridianstudios.com';
  SELECT id INTO ct_james  FROM public.contacts WHERE org_id = v_org_id AND email = 'james@oakandstone.co';
  SELECT id INTO ct_maya   FROM public.contacts WHERE org_id = v_org_id AND email = 'maya@pulsehealth.io';
  SELECT id INTO ct_david  FROM public.contacts WHERE org_id = v_org_id AND email = 'david@vertexcap.com';
  SELECT id INTO ct_elena  FROM public.contacts WHERE org_id = v_org_id AND email = 'elena@harborcollective.com';
  SELECT id INTO ct_marcus FROM public.contacts WHERE org_id = v_org_id AND email = 'marcus@pulsehealth.io';
  SELECT id INTO ct_rachel FROM public.contacts WHERE org_id = v_org_id AND email = 'rachel@meridianstudios.com';
  SELECT id INTO ct_tom    FROM public.contacts WHERE org_id = v_org_id AND email = 'tom.bradley@gmail.com';

  -- =====================================================================
  -- 3. CRM — Deals (one per pipeline stage + won/lost)
  -- =====================================================================
  INSERT INTO public.deals (id, org_id, title, value, stage, priority, contact_id, company_id, expected_close_date, position, notes, created_by) VALUES
    (gen_random_uuid(), v_org_id, 'Harbor Storefront Rebuild',      45000,  'LEAD',        'MEDIUM', ct_elena,  c_harbor,  CURRENT_DATE + 30, 0, 'Unify 3 brand storefronts into one platform.',               v_user_id),
    (gen_random_uuid(), v_org_id, 'Tom Bradley SaaS MVP',           18000,  'LEAD',        'LOW',    ct_tom,    NULL,      CURRENT_DATE + 45, 1, 'Early-stage. Needs discovery session.',                      v_user_id),
    (gen_random_uuid(), v_org_id, 'Oak & Stone Property Platform',  72000,  'QUALIFIED',   'HIGH',   ct_james,  c_oak,     CURRENT_DATE + 14, 0, 'Budget approved. Send proposal this week.',                  v_user_id),
    (gen_random_uuid(), v_org_id, 'Meridian Booking System',        35000,  'QUALIFIED',   'MEDIUM', ct_sarah,  c_meridian,CURRENT_DATE + 25, 1, 'Rachel reviewing contract terms.',                           v_user_id),
    (gen_random_uuid(), v_org_id, 'Pulse Patient Dashboard',        95000,  'PROPOSAL',    'HIGH',   ct_maya,   c_pulse,   CURRENT_DATE + 5,  0, 'Proposal sent. Awaiting architecture review.',               v_user_id),
    (gen_random_uuid(), v_org_id, 'Vertex Portfolio Tracker',       120000, 'NEGOTIATION', 'HIGH',   ct_david,  c_vertex,  CURRENT_DATE + 3,  0, 'Final pricing discussion. Phase 2 mobile add-on pending.',   v_user_id),
    (gen_random_uuid(), v_org_id, 'Meridian Client Portal v1',      28000,  'WON',         'MEDIUM', ct_rachel, c_meridian,NULL,              0, 'Completed last month. Led to booking system deal.',          v_user_id),
    (gen_random_uuid(), v_org_id, 'Harbor Analytics Dashboard',     30000,  'LOST',        'LOW',    ct_elena,  c_harbor,  NULL,              0, 'Lost to in-house team. Elena came back for storefront.',     v_user_id),
    -- Historical WON deals spread across the last 6 months for the revenue chart
    (gen_random_uuid(), v_org_id, 'Pulse Marketing Site Refresh',   16500,  'WON',         'LOW',    ct_marcus, c_pulse,   NULL,              0, 'Two-week site refresh before the dashboard build.',          v_user_id),
    (gen_random_uuid(), v_org_id, 'Vertex Internal Reporting Tool', 42000,  'WON',         'MEDIUM', ct_david,  c_vertex,  NULL,              0, 'Internal LP reporting tool — opened the door to the big deal.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Oak & Stone Brand Site',         22000,  'WON',         'LOW',    ct_james,  c_oak,     NULL,              0, 'Brand marketing site — precursor to the listing platform.',  v_user_id),
    (gen_random_uuid(), v_org_id, 'Harbor Shopify Theme',           12500,  'WON',         'LOW',    ct_elena,  c_harbor,  NULL,              0, 'Custom Shopify theme for one of Harbor''s brands.',          v_user_id),
    (gen_random_uuid(), v_org_id, 'Meridian Studio Landing Page',   8500,   'WON',         'LOW',    ct_sarah,  c_meridian,NULL,              0, 'Quick-turn landing page for an agency marketing push.',      v_user_id);

  -- Spread closed_at across the last ~6 months so the revenue chart tells a story
  UPDATE public.deals SET closed_at = now() - interval '160 days' WHERE org_id = v_org_id AND title = 'Meridian Studio Landing Page';
  UPDATE public.deals SET closed_at = now() - interval '130 days' WHERE org_id = v_org_id AND title = 'Harbor Shopify Theme';
  UPDATE public.deals SET closed_at = now() - interval '95 days'  WHERE org_id = v_org_id AND title = 'Oak & Stone Brand Site';
  UPDATE public.deals SET closed_at = now() - interval '65 days'  WHERE org_id = v_org_id AND title = 'Vertex Internal Reporting Tool';
  UPDATE public.deals SET closed_at = now() - interval '35 days'  WHERE org_id = v_org_id AND title = 'Pulse Marketing Site Refresh';
  UPDATE public.deals SET closed_at = now() - interval '12 days'  WHERE org_id = v_org_id AND title = 'Meridian Client Portal v1';
  UPDATE public.deals SET closed_at = now() - interval '25 days'  WHERE org_id = v_org_id AND stage = 'LOST';

  SELECT id INTO d_harbor_storefront  FROM public.deals WHERE org_id = v_org_id AND title = 'Harbor Storefront Rebuild';
  SELECT id INTO d_tom_saas           FROM public.deals WHERE org_id = v_org_id AND title = 'Tom Bradley SaaS MVP';
  SELECT id INTO d_oak_platform       FROM public.deals WHERE org_id = v_org_id AND title = 'Oak & Stone Property Platform';
  SELECT id INTO d_meridian_booking   FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Booking System';
  SELECT id INTO d_pulse_dashboard    FROM public.deals WHERE org_id = v_org_id AND title = 'Pulse Patient Dashboard';
  SELECT id INTO d_vertex_tracker     FROM public.deals WHERE org_id = v_org_id AND title = 'Vertex Portfolio Tracker';
  SELECT id INTO d_meridian_portal    FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Client Portal v1';
  SELECT id INTO d_harbor_analytics   FROM public.deals WHERE org_id = v_org_id AND title = 'Harbor Analytics Dashboard';

  -- =====================================================================
  -- 4. Activities (pipeline history)
  -- =====================================================================
  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, content, metadata, created_by, created_at) VALUES
    -- Vertex pipeline history
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'DEAL_CREATED',        'Created deal "Vertex Portfolio Tracker"', NULL, '{"value": 120000, "stage": "LEAD"}', v_user_id, now() - interval '18 days'),
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'MEETING',             'Discovery call with David',                'Discussed portfolio tracking. Real-time market data, LP reporting, deal flow.', NULL, v_user_id, now() - interval '16 days'),
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'DEAL_STAGE_CHANGED',  'LEAD → QUALIFIED',                         NULL, '{"from":"LEAD","to":"QUALIFIED"}', v_user_id, now() - interval '14 days'),
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'EMAIL',               'Sent proposal document',                   'SOW + pricing. $120K across 3 phases.', NULL, v_user_id, now() - interval '10 days'),
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'DEAL_STAGE_CHANGED',  'QUALIFIED → PROPOSAL',                     NULL, '{"from":"QUALIFIED","to":"PROPOSAL"}', v_user_id, now() - interval '10 days'),
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'CALL',                'Pricing negotiation call',                 'David wants bundle discount. Partners meeting Thursday.', NULL, v_user_id, now() - interval '5 days'),
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'DEAL_STAGE_CHANGED',  'PROPOSAL → NEGOTIATION',                   NULL, '{"from":"PROPOSAL","to":"NEGOTIATION"}', v_user_id, now() - interval '5 days'),
    -- Pulse
    (v_org_id, ct_maya, d_pulse_dashboard, c_pulse, 'DEAL_CREATED',          'Created deal "Pulse Patient Dashboard"',   NULL, '{"value": 95000}', v_user_id, now() - interval '22 days'),
    (v_org_id, ct_maya, d_pulse_dashboard, c_pulse, 'MEETING',               'Technical deep-dive with Maya + Marcus',  'React+Django → migrate to Next.js. HIPAA critical.', NULL, v_user_id, now() - interval '20 days'),
    (v_org_id, ct_marcus, d_pulse_dashboard, c_pulse, 'NOTE',                'UX requirements from Marcus',             'Figma mockups: scheduling, meds, provider messaging, records.', NULL, v_user_id, now() - interval '15 days'),
    (v_org_id, ct_maya, d_pulse_dashboard, c_pulse, 'EMAIL',                 'Sent architecture proposal',              'Next.js + Supabase w/ RLS for HIPAA.', NULL, v_user_id, now() - interval '8 days'),
    (v_org_id, ct_maya, d_pulse_dashboard, c_pulse, 'DEAL_STAGE_CHANGED',    'QUALIFIED → PROPOSAL',                    NULL, '{"from":"QUALIFIED","to":"PROPOSAL"}', v_user_id, now() - interval '8 days'),
    -- Oak
    (v_org_id, ct_james, d_oak_platform, c_oak, 'DEAL_CREATED', 'Created deal "Oak & Stone Property Platform"', NULL, '{"value":72000}', v_user_id, now() - interval '14 days'),
    (v_org_id, ct_james, d_oak_platform, c_oak, 'MEETING', 'Intro at Austin Tech Week', 'Map search, virtual tours, agent CRM.', NULL, v_user_id, now() - interval '14 days'),
    (v_org_id, ct_james, d_oak_platform, c_oak, 'CALL', 'Budget confirmed', '$70–80K range. Launch end of Q2. 150 listings to migrate.', NULL, v_user_id, now() - interval '9 days'),
    (v_org_id, ct_james, d_oak_platform, c_oak, 'DEAL_STAGE_CHANGED', 'LEAD → QUALIFIED', NULL, '{"from":"LEAD","to":"QUALIFIED"}', v_user_id, now() - interval '7 days'),
    -- Contact/company creations
    (v_org_id, NULL,     NULL, c_meridian, 'COMPANY_CREATED', 'Created company Meridian Studios',      NULL, NULL, v_user_id, now() - interval '65 days'),
    (v_org_id, NULL,     NULL, c_pulse,    'COMPANY_CREATED', 'Created company Pulse Health',          NULL, NULL, v_user_id, now() - interval '22 days'),
    (v_org_id, NULL,     NULL, c_vertex,   'COMPANY_CREATED', 'Created company Vertex Capital',        NULL, NULL, v_user_id, now() - interval '18 days'),
    (v_org_id, NULL,     NULL, c_oak,      'COMPANY_CREATED', 'Created company Oak & Stone Properties',NULL, NULL, v_user_id, now() - interval '14 days'),
    (v_org_id, NULL,     NULL, c_harbor,   'COMPANY_CREATED', 'Created company Harbor Collective',     NULL, NULL, v_user_id, now() - interval '4 days');

  -- =====================================================================
  -- 5. Invoices
  -- =====================================================================
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, paid_at, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_meridian_portal, ct_rachel, c_meridian, 'PAID',
    '[{"description":"Discovery & Strategy","quantity":1,"rate":3500,"amount":3500},
      {"description":"UI/UX — Client Portal","quantity":40,"rate":175,"amount":7000},
      {"description":"Frontend (Next.js)","quantity":60,"rate":185,"amount":11100},
      {"description":"Backend API + Auth","quantity":24,"rate":185,"amount":4440},
      {"description":"QA + Bug Fixes","quantity":12,"rate":150,"amount":1800}]'::jsonb,
    27840, 0, 0, 27840,
    (CURRENT_DATE - 45)::date, (CURRENT_DATE - 15)::date, now() - interval '14 days',
    'NET_30', 'USD', 'Final invoice — Meridian Client Portal v1.', v_user_id, now() - interval '45 days')
  RETURNING id INTO inv1;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_vertex_tracker, ct_david, c_vertex, 'SENT',
    '[{"description":"Phase 1 Core Dashboard — 50% Deposit","quantity":1,"rate":27500,"amount":27500},
      {"description":"Project Setup + DevOps","quantity":1,"rate":4500,"amount":4500}]'::jsonb,
    32000, 32000, (CURRENT_DATE - 4)::date, (CURRENT_DATE + 26)::date,
    'NET_30', 'USD', 'Vertex Phase 1 deposit. Remaining 50% due upon delivery.', v_user_id, now() - interval '4 days')
  RETURNING id INTO inv2;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_pulse_dashboard, ct_maya, c_pulse, 'SENT',
    '[{"description":"HIPAA Compliance Assessment","quantity":1,"rate":5000,"amount":5000},
      {"description":"Technical Architecture","quantity":20,"rate":200,"amount":4000},
      {"description":"UX Research","quantity":16,"rate":175,"amount":2800}]'::jsonb,
    11800, 11800, (CURRENT_DATE - 7)::date, (CURRENT_DATE + 8)::date,
    'NET_15', 'USD', 'Pulse discovery phase.', v_user_id, now() - interval '7 days')
  RETURNING id INTO inv3;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total, issue_date, due_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_oak_platform, ct_james, c_oak, 'DRAFT',
    '[{"description":"Property Platform Design Phase","quantity":60,"rate":175,"amount":10500},
      {"description":"Map Integration (Mapbox)","quantity":32,"rate":195,"amount":6240},
      {"description":"Virtual Tour System","quantity":20,"rate":185,"amount":3700},
      {"description":"Agent CRM Module","quantity":40,"rate":185,"amount":7400},
      {"description":"Data Migration (150 listings)","quantity":1,"rate":3500,"amount":3500}]'::jsonb,
    31340, 8.25, 2326.99, 'percentage', 10, 3134, 30532.99,
    CURRENT_DATE, (CURRENT_DATE + 30)::date, 'NET_30', 'USD',
    'Oak & Stone Phase 1 estimate. 10% early-sign + TX sales tax.', v_user_id, now() - interval '1 day')
  RETURNING id INTO inv4;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_meridian_booking, ct_sarah, c_meridian, 'DRAFT',
    '[{"description":"Monthly Dev Retainer (40 hrs)","quantity":40,"rate":175,"amount":7000},
      {"description":"Project Manager","quantity":1,"rate":2500,"amount":2500},
      {"description":"Hosting + Infra","quantity":1,"rate":350,"amount":350}]'::jsonb,
    9850, 9850, CURRENT_DATE, (CURRENT_DATE + 15)::date, 'NET_15', 'USD',
    'Meridian monthly retainer. Recurring thereafter.', v_user_id, now())
  RETURNING id INTO inv5;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, NULL, ct_elena, c_harbor, 'OVERDUE',
    '[{"description":"E-Commerce Consultation (3h)","quantity":3,"rate":250,"amount":750},
      {"description":"Competitive Audit Report","quantity":1,"rate":1500,"amount":1500}]'::jsonb,
    2250, 2250, (CURRENT_DATE - 22)::date, (CURRENT_DATE - 7)::date, 'NET_15', 'USD',
    'Harbor consultation.', v_user_id, now() - interval '22 days')
  RETURNING id INTO inv6;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, discount_type, discount_value, discount_amount, total, issue_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_vertex_tracker, ct_david, c_vertex, 'DRAFT',
    '[{"description":"React Native App — Portfolio","quantity":80,"rate":195,"amount":15600},
      {"description":"Push Notifications + RT Data","quantity":32,"rate":200,"amount":6400},
      {"description":"App Store Submission","quantity":24,"rate":175,"amount":4200}]'::jsonb,
    26200, 'percentage', 10, 2620, 23580, CURRENT_DATE, 'NET_30', 'USD',
    'Vertex Phase 2 — mobile companion.', v_user_id, now())
  RETURNING id INTO inv7;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_pulse_dashboard, ct_maya, c_pulse, 'DRAFT',
    '[{"description":"Patient Dashboard — Frontend","quantity":120,"rate":185,"amount":22200},
      {"description":"Backend API (Supabase)","quantity":80,"rate":195,"amount":15600},
      {"description":"HIPAA Auth + Encryption","quantity":40,"rate":225,"amount":9000},
      {"description":"Appointment Scheduling","quantity":48,"rate":185,"amount":8880},
      {"description":"Provider Messaging","quantity":36,"rate":185,"amount":6660},
      {"description":"Health Records Viewer","quantity":32,"rate":195,"amount":6240},
      {"description":"Security Audit + Pen Test","quantity":40,"rate":200,"amount":8000}]'::jsonb,
    76580, 76580, CURRENT_DATE, (CURRENT_DATE + 45)::date, 'NET_45', 'USD',
    'Pulse full project estimate (excludes discovery).', v_user_id, now())
  RETURNING id INTO inv8;

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, paid_at, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_meridian_portal, ct_rachel, c_meridian, 'PAID',
    '[{"description":"Post-Launch Support (20h)","quantity":20,"rate":150,"amount":3000},
      {"description":"Bulk Upload Feature","quantity":12,"rate":175,"amount":2100}]'::jsonb,
    5100, 5100, (CURRENT_DATE - 70)::date, (CURRENT_DATE - 55)::date, now() - interval '58 days',
    'NET_15', 'USD', 'Meridian post-launch support.', v_user_id, now() - interval '70 days')
  RETURNING id INTO inv9;

  -- Additional historical PAID invoices (one per prior month) so the
  -- payments view shows activity across the last ~6 months, not just April.
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (org_id, invoice_number, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, paid_at, payment_terms, currency, notes, created_by, created_at)
  VALUES (v_org_id, inv_num, ct_sarah, c_meridian, 'PAID',
    '[{"description":"Meridian Studio Landing Page","quantity":1,"rate":8500,"amount":8500}]'::jsonb,
    8500, 8500, (CURRENT_DATE - 170)::date, (CURRENT_DATE - 155)::date, now() - interval '158 days',
    'NET_15', 'USD', 'Landing page project — paid Nov.', v_user_id, now() - interval '170 days');

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (org_id, invoice_number, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, paid_at, payment_terms, currency, notes, created_by, created_at)
  VALUES (v_org_id, inv_num, ct_elena, c_harbor, 'PAID',
    '[{"description":"Harbor Shopify Theme — fixed fee","quantity":1,"rate":12500,"amount":12500}]'::jsonb,
    12500, 12500, (CURRENT_DATE - 140)::date, (CURRENT_DATE - 125)::date, now() - interval '128 days',
    'NET_15', 'USD', 'Shopify theme build — paid Dec.', v_user_id, now() - interval '140 days');

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (org_id, invoice_number, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, paid_at, payment_terms, currency, notes, created_by, created_at)
  VALUES (v_org_id, inv_num, ct_james, c_oak, 'PAID',
    '[{"description":"Oak & Stone Brand Site","quantity":1,"rate":22000,"amount":22000}]'::jsonb,
    22000, 22000, (CURRENT_DATE - 105)::date, (CURRENT_DATE - 90)::date, now() - interval '92 days',
    'NET_15', 'USD', 'Brand site — paid Jan.', v_user_id, now() - interval '105 days');

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (org_id, invoice_number, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, paid_at, payment_terms, currency, notes, created_by, created_at)
  VALUES (v_org_id, inv_num, ct_david, c_vertex, 'PAID',
    '[{"description":"Vertex Internal Reporting Tool","quantity":1,"rate":42000,"amount":42000}]'::jsonb,
    42000, 42000, (CURRENT_DATE - 80)::date, (CURRENT_DATE - 65)::date, now() - interval '62 days',
    'NET_15', 'USD', 'LP reporting tool — paid Feb.', v_user_id, now() - interval '80 days');

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (org_id, invoice_number, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, paid_at, payment_terms, currency, notes, created_by, created_at)
  VALUES (v_org_id, inv_num, ct_marcus, c_pulse, 'PAID',
    '[{"description":"Pulse Marketing Site Refresh","quantity":1,"rate":16500,"amount":16500}]'::jsonb,
    16500, 16500, (CURRENT_DATE - 50)::date, (CURRENT_DATE - 35)::date, now() - interval '33 days',
    'NET_15', 'USD', 'Site refresh — paid Mar.', v_user_id, now() - interval '50 days');

  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, total, issue_date, due_date, payment_terms, currency, notes, created_by, created_at)
  VALUES (gen_random_uuid(), v_org_id, inv_num, d_vertex_tracker, ct_david, c_vertex, 'CANCELLED',
    '[{"description":"Phase 1 — 50% Deposit","quantity":1,"rate":27500,"amount":27500}]'::jsonb,
    27500, 27500, (CURRENT_DATE - 6)::date, (CURRENT_DATE + 24)::date, 'NET_30', 'USD',
    'CANCELLED — duplicate of earlier deposit invoice.', v_user_id, now() - interval '6 days')
  RETURNING id INTO inv10;

  -- Recurring retainer
  INSERT INTO public.recurring_invoices (org_id, source_invoice_id, frequency, next_run_date, runs_count, max_runs, status, created_by)
  VALUES (v_org_id, inv5, 'MONTHLY', (CURRENT_DATE + 30)::date, 0, 12, 'ACTIVE', v_user_id);

  -- Invoice activities
  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, metadata, created_by, created_at) VALUES
    (v_org_id, ct_rachel, d_meridian_portal, c_meridian, 'INVOICE_CREATED',        'Created invoice',     jsonb_build_object('invoice_id', inv1, 'total', 27840),  v_user_id, now() - interval '45 days'),
    (v_org_id, ct_rachel, d_meridian_portal, c_meridian, 'INVOICE_STATUS_CHANGED', 'Invoice marked PAID', jsonb_build_object('invoice_id', inv1, 'to', 'PAID'),    v_user_id, now() - interval '18 days'),
    (v_org_id, ct_david,  d_vertex_tracker,  c_vertex,   'INVOICE_CREATED',        'Created invoice',     jsonb_build_object('invoice_id', inv2, 'total', 32000),  v_user_id, now() - interval '4 days'),
    (v_org_id, ct_maya,   d_pulse_dashboard, c_pulse,    'INVOICE_CREATED',        'Created invoice',     jsonb_build_object('invoice_id', inv3, 'total', 11800),  v_user_id, now() - interval '7 days'),
    (v_org_id, ct_elena,  NULL,              c_harbor,   'INVOICE_STATUS_CHANGED', 'Invoice OVERDUE',     jsonb_build_object('invoice_id', inv6, 'to', 'OVERDUE'), v_user_id, now() - interval '7 days');

  -- =====================================================================
  -- 6. Tasks — Labels, Boards, Columns, Tasks
  -- =====================================================================
  INSERT INTO public.labels (id, org_id, name, color) VALUES
    (gen_random_uuid(), v_org_id, 'Design',      '#A478E8'),
    (gen_random_uuid(), v_org_id, 'Development', '#5B8DEF'),
    (gen_random_uuid(), v_org_id, 'Content',     '#5EC69A'),
    (gen_random_uuid(), v_org_id, 'Bug',         '#EF5B5B'),
    (gen_random_uuid(), v_org_id, 'Urgent',      '#E8A84C'),
    (gen_random_uuid(), v_org_id, 'Operations',  '#8A817A');

  SELECT id INTO lbl_design  FROM public.labels WHERE org_id = v_org_id AND name = 'Design';
  SELECT id INTO lbl_dev     FROM public.labels WHERE org_id = v_org_id AND name = 'Development';
  SELECT id INTO lbl_content FROM public.labels WHERE org_id = v_org_id AND name = 'Content';
  SELECT id INTO lbl_bug     FROM public.labels WHERE org_id = v_org_id AND name = 'Bug';
  SELECT id INTO lbl_urgent  FROM public.labels WHERE org_id = v_org_id AND name = 'Urgent';
  SELECT id INTO lbl_ops     FROM public.labels WHERE org_id = v_org_id AND name = 'Operations';

  -- Board 1: Pulse
  INSERT INTO public.boards (id, org_id, name, description, created_by)
  VALUES (gen_random_uuid(), v_org_id, 'Pulse Patient Dashboard', 'Sprint board for Pulse Health. $95K, Q2 launch.', v_user_id)
  RETURNING id INTO b_pulse;

  INSERT INTO public.board_columns (id, board_id, name, position, color, wip_limit) VALUES
    (gen_random_uuid(), b_pulse, 'To Do',       0, '#8A817A', NULL),
    (gen_random_uuid(), b_pulse, 'In Progress', 1, '#5B8DEF', 4),
    (gen_random_uuid(), b_pulse, 'In Review',   2, '#E8A84C', 3),
    (gen_random_uuid(), b_pulse, 'Done',        3, '#5EC69A', NULL);

  SELECT id INTO col_pulse_todo     FROM public.board_columns WHERE board_id = b_pulse AND name = 'To Do';
  SELECT id INTO col_pulse_progress FROM public.board_columns WHERE board_id = b_pulse AND name = 'In Progress';
  SELECT id INTO col_pulse_review   FROM public.board_columns WHERE board_id = b_pulse AND name = 'In Review';
  SELECT id INTO col_pulse_done     FROM public.board_columns WHERE board_id = b_pulse AND name = 'Done';

  INSERT INTO public.tasks (id, org_id, board_id, column_id, title, description, priority, status, due_date, assigned_to, contact_id, company_id, deal_id, position, created_by) VALUES
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_todo,     'Build medication tracking module', 'Meds list, reminders, refill flow. Pharmacy API.', 'HIGH',    'TODO',         CURRENT_DATE + 10, v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 0, v_user_id),
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_todo,     'Design provider messaging UI',     'Secure messaging, HIPAA compliant.',                'MEDIUM',  'TODO',         CURRENT_DATE + 14, v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 1, v_user_id),
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_todo,     'HIPAA-compliant file storage',     'Supabase Storage + encryption. Need BAA signed.',   'HIGH',    'TODO',         CURRENT_DATE + 7,  v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 2, v_user_id),
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_progress, 'Build appointment scheduling',     'Calendar view, availability, confirmations.',       'HIGH',    'IN_PROGRESS',  CURRENT_DATE + 5,  v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 0, v_user_id),
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_progress, 'Patient auth + onboarding',        'Supabase Auth + multi-step onboarding.',            'URGENT',  'IN_PROGRESS',  CURRENT_DATE + 3,  v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 1, v_user_id),
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_review,   'Health records viewer',            'Read-only viewer + PDF export.',                    'MEDIUM',  'IN_REVIEW',    CURRENT_DATE + 2,  v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 0, v_user_id),
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_done,     'Set up project repo + CI/CD',      'Next.js + Supabase + Vercel + GHA.',                'MEDIUM',  'DONE',         CURRENT_DATE - 5,  v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 0, v_user_id),
    (gen_random_uuid(), v_org_id, b_pulse, col_pulse_done,     'Database schema design',           'patients, appointments, providers, meds, records.', 'HIGH',    'DONE',         CURRENT_DATE - 3,  v_user_id, ct_maya, c_pulse, d_pulse_dashboard, 1, v_user_id);

  SELECT id INTO t_appt    FROM public.tasks WHERE org_id = v_org_id AND title = 'Build appointment scheduling';
  SELECT id INTO t_auth    FROM public.tasks WHERE org_id = v_org_id AND title = 'Patient auth + onboarding';
  SELECT id INTO t_records FROM public.tasks WHERE org_id = v_org_id AND title = 'Health records viewer';
  SELECT id INTO t_ci      FROM public.tasks WHERE org_id = v_org_id AND title = 'Set up project repo + CI/CD';

  -- Board 2: Meridian
  INSERT INTO public.boards (id, org_id, name, description, created_by)
  VALUES (gen_random_uuid(), v_org_id, 'Meridian Booking System', 'Discovery + design phase.', v_user_id)
  RETURNING id INTO b_meridian;

  INSERT INTO public.board_columns (id, board_id, name, position, color) VALUES
    (gen_random_uuid(), b_meridian, 'To Do',       0, '#8A817A'),
    (gen_random_uuid(), b_meridian, 'In Progress', 1, '#5B8DEF'),
    (gen_random_uuid(), b_meridian, 'In Review',   2, '#E8A84C'),
    (gen_random_uuid(), b_meridian, 'Done',        3, '#5EC69A');

  SELECT id INTO col_mer_todo     FROM public.board_columns WHERE board_id = b_meridian AND name = 'To Do';
  SELECT id INTO col_mer_progress FROM public.board_columns WHERE board_id = b_meridian AND name = 'In Progress';
  SELECT id INTO col_mer_review   FROM public.board_columns WHERE board_id = b_meridian AND name = 'In Review';
  SELECT id INTO col_mer_done     FROM public.board_columns WHERE board_id = b_meridian AND name = 'Done';

  INSERT INTO public.tasks (id, org_id, board_id, column_id, title, description, priority, status, due_date, assigned_to, contact_id, company_id, deal_id, position, created_by) VALUES
    (gen_random_uuid(), v_org_id, b_meridian, col_mer_todo,     'Stripe integration for payments', 'Stripe Connect for studio sessions.', 'HIGH',   'TODO',        CURRENT_DATE + 18, v_user_id, ct_sarah, c_meridian, d_meridian_booking, 0, v_user_id),
    (gen_random_uuid(), v_org_id, b_meridian, col_mer_todo,     'Build equipment rental flow',     'Catalog + availability calendar.',    'MEDIUM', 'TODO',        CURRENT_DATE + 25, v_user_id, ct_sarah, c_meridian, d_meridian_booking, 1, v_user_id),
    (gen_random_uuid(), v_org_id, b_meridian, col_mer_progress, 'Google Calendar sync',            'Two-way sync via Google Calendar API.','HIGH',   'IN_PROGRESS', CURRENT_DATE + 8,  v_user_id, ct_sarah, c_meridian, d_meridian_booking, 0, v_user_id),
    (gen_random_uuid(), v_org_id, b_meridian, col_mer_done,     'Discovery session with Sarah',    'Mapped booking types + rate cards.',  'MEDIUM', 'DONE',        CURRENT_DATE - 4,  v_user_id, ct_sarah, c_meridian, d_meridian_booking, 0, v_user_id);

  SELECT id INTO t_stripe        FROM public.tasks WHERE org_id = v_org_id AND title = 'Stripe integration for payments';
  SELECT id INTO t_calendar_sync FROM public.tasks WHERE org_id = v_org_id AND title = 'Google Calendar sync';
  SELECT id INTO t_discovery     FROM public.tasks WHERE org_id = v_org_id AND title = 'Discovery session with Sarah';

  -- Task labels (sample)
  INSERT INTO public.task_labels (task_id, label_id)
  SELECT t.id, lbl_dev FROM public.tasks t WHERE t.org_id = v_org_id AND t.title IN (
    'Build medication tracking module','HIPAA-compliant file storage','Build appointment scheduling',
    'Patient auth + onboarding','Health records viewer','Set up project repo + CI/CD',
    'Database schema design','Stripe integration for payments','Build equipment rental flow','Google Calendar sync'
  );
  INSERT INTO public.task_labels (task_id, label_id)
  SELECT t.id, lbl_design FROM public.tasks t WHERE t.org_id = v_org_id AND t.title IN (
    'Design provider messaging UI','Build appointment scheduling'
  );
  INSERT INTO public.task_labels (task_id, label_id)
  SELECT t.id, lbl_urgent FROM public.tasks t WHERE t.org_id = v_org_id AND t.title IN (
    'HIPAA-compliant file storage','Patient auth + onboarding'
  );
  INSERT INTO public.task_labels (task_id, label_id) VALUES (t_discovery, lbl_ops);

  -- =====================================================================
  -- 7. Calendar Events
  -- =====================================================================
  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by)
  VALUES (gen_random_uuid(), v_org_id, 'Pulse Health — Kickoff Call', 'Project kickoff. Review scope + timeline.', 'Zoom',
    (CURRENT_DATE - 12) + time '10:00', (CURRENT_DATE - 12) + time '11:00', false, 'COMPLETED', '#5B8DEF',
    ct_maya, c_pulse, d_pulse_dashboard, v_user_id, v_user_id)
  RETURNING id INTO e_kickoff;

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by)
  VALUES (gen_random_uuid(), v_org_id, 'Meridian — Discovery Session', 'Deep-dive into booking requirements.', '450 Market St, SF',
    (CURRENT_DATE - 8) + time '14:00', (CURRENT_DATE - 8) + time '16:00', false, 'COMPLETED', '#D4734E',
    ct_sarah, c_meridian, d_meridian_booking, v_user_id, v_user_id)
  RETURNING id INTO e_discovery;

  INSERT INTO public.calendar_events (id, org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by)
  VALUES (gen_random_uuid(), v_org_id, 'Vertex Capital — Portfolio Demo', 'Dashboard prototype demo to David.', 'Zoom',
    (CURRENT_DATE - 5) + time '15:00', (CURRENT_DATE - 5) + time '16:00', false, 'COMPLETED', '#A78BFA',
    ct_david, c_vertex, d_vertex_tracker, v_user_id, v_user_id)
  RETURNING id INTO e_demo_vertex;

  INSERT INTO public.calendar_events (org_id, title, description, location, start_at, end_at, all_day, status, color, contact_id, company_id, deal_id, assigned_to, created_by) VALUES
    (v_org_id, 'Oak & Stone — Wireframe Review',  'Review listing wireframes with James.', 'Google Meet',      (CURRENT_DATE - 3) + time '11:00', (CURRENT_DATE - 3) + time '11:30', false, 'NO_SHOW',   '#8A817A', ct_james,  c_oak,      NULL,              v_user_id, v_user_id),
    (v_org_id, 'Pulse — Sprint Review',           'Demo scheduling + auth.',                'Zoom',             CURRENT_DATE + time '10:00',       CURRENT_DATE + time '11:00',       false, 'SCHEDULED', '#5B8DEF', ct_maya,   c_pulse,    d_pulse_dashboard, v_user_id, v_user_id),
    (v_org_id, 'Team Standup',                    'Weekly internal.',                       'Office',           CURRENT_DATE + time '09:00',       CURRENT_DATE + time '09:30',       false, 'SCHEDULED', '#5EC69A', NULL,      NULL,       NULL,              v_user_id, v_user_id),
    (v_org_id, 'Meridian — Design Review',        'Booking UI with Marcus.',                'Figma + Zoom',     (CURRENT_DATE + 1) + time '14:00', (CURRENT_DATE + 1) + time '15:30', false, 'SCHEDULED', '#D4734E', ct_marcus, c_meridian, d_meridian_booking, v_user_id, v_user_id),
    (v_org_id, 'Harbor — Storefront Scoping',     'Unify 3 DTC brands.',                    'Zoom',             (CURRENT_DATE + 2) + time '11:00', (CURRENT_DATE + 2) + time '12:00', false, 'SCHEDULED', '#E8A84C', ct_elena,  c_harbor,   NULL,              v_user_id, v_user_id),
    (v_org_id, 'Oak & Stone — Reschedule',        'Rescheduled wireframe review.',          'Google Meet',      (CURRENT_DATE + 5) + time '11:00', (CURRENT_DATE + 5) + time '12:00', false, 'SCHEDULED', '#8A817A', ct_james,  c_oak,      NULL,              v_user_id, v_user_id),
    (v_org_id, 'Pulse — HIPAA Compliance Review', 'BAA + encryption config review.',        'Zoom',             (CURRENT_DATE + 6) + time '13:00', (CURRENT_DATE + 6) + time '14:00', false, 'SCHEDULED', '#5B8DEF', ct_maya,   c_pulse,    d_pulse_dashboard, v_user_id, v_user_id),
    (v_org_id, 'Pulse Dashboard — Beta Launch',   'Target beta release.',                    NULL,              CURRENT_DATE + 14,                 CURRENT_DATE + 14,                 true,  'SCHEDULED', '#EF5B5B', ct_maya,   c_pulse,    d_pulse_dashboard, v_user_id, v_user_id),
    (v_org_id, 'Meridian — Contract Renewal',     'Retainer renewal w/ Q3 increase.',        NULL,              CURRENT_DATE + 21,                 CURRENT_DATE + 21,                 true,  'SCHEDULED', '#D4734E', ct_sarah,  c_meridian, d_meridian_booking, v_user_id, v_user_id);

  -- Event activities
  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, metadata, created_by, created_at) VALUES
    (v_org_id, ct_maya,  d_pulse_dashboard, c_pulse,    'EVENT_CREATED',   'Created event "Pulse Kickoff"',       jsonb_build_object('event_id', e_kickoff),     v_user_id, now() - interval '14 days'),
    (v_org_id, ct_maya,  d_pulse_dashboard, c_pulse,    'EVENT_COMPLETED', 'Completed Pulse Kickoff',             jsonb_build_object('event_id', e_kickoff),     v_user_id, now() - interval '12 days'),
    (v_org_id, ct_sarah, d_meridian_booking,c_meridian, 'EVENT_COMPLETED', 'Completed Meridian Discovery',        jsonb_build_object('event_id', e_discovery),   v_user_id, now() - interval '8 days'),
    (v_org_id, ct_david, d_vertex_tracker,  c_vertex,   'EVENT_COMPLETED', 'Completed Vertex Portfolio Demo',     jsonb_build_object('event_id', e_demo_vertex), v_user_id, now() - interval '5 days');

  -- =====================================================================
  -- 8. Files (metadata rows; actual binaries live in Supabase Storage)
  -- =====================================================================
  INSERT INTO public.files (id, org_id, name, original_name, mime_type, size_bytes, storage_path, folder, created_by) VALUES
    (gen_random_uuid(), v_org_id, 'vertex-proposal-v3.pdf',    'Vertex Proposal v3.pdf',    'application/pdf',                                           482312, v_org_id::text || '/proposals/vertex-proposal-v3.pdf',    '/proposals', v_user_id),
    (gen_random_uuid(), v_org_id, 'meridian-msa-signed.pdf',   'Meridian MSA (Signed).pdf', 'application/pdf',                                           312847, v_org_id::text || '/contracts/meridian-msa-signed.pdf',   '/contracts', v_user_id),
    (gen_random_uuid(), v_org_id, 'pulse-mockups-v2.fig',      'Pulse Mockups v2.fig',      'application/octet-stream',                                  9812234, v_org_id::text || '/design/pulse-mockups-v2.fig',         '/design',    v_user_id),
    (gen_random_uuid(), v_org_id, 'fitted-agency-logo.svg',    'logo.svg',                  'image/svg+xml',                                             14320,  v_org_id::text || '/brand/fitted-agency-logo.svg',        '/brand',     v_user_id),
    (gen_random_uuid(), v_org_id, 'hipaa-assessment.docx',     'HIPAA Assessment.docx',     'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 284912, v_org_id::text || '/compliance/hipaa-assessment.docx','/compliance',v_user_id);

  SELECT id INTO f_proposal FROM public.files WHERE org_id = v_org_id AND name = 'vertex-proposal-v3.pdf';
  SELECT id INTO f_contract FROM public.files WHERE org_id = v_org_id AND name = 'meridian-msa-signed.pdf';
  SELECT id INTO f_mockups  FROM public.files WHERE org_id = v_org_id AND name = 'pulse-mockups-v2.fig';
  SELECT id INTO f_logo     FROM public.files WHERE org_id = v_org_id AND name = 'fitted-agency-logo.svg';
  SELECT id INTO f_hipaa    FROM public.files WHERE org_id = v_org_id AND name = 'hipaa-assessment.docx';

  INSERT INTO public.entity_files (file_id, entity_type, entity_id, org_id, created_by) VALUES
    (f_proposal, 'deal',    d_vertex_tracker,  v_org_id, v_user_id),
    (f_contract, 'company', c_meridian,        v_org_id, v_user_id),
    (f_mockups,  'deal',    d_pulse_dashboard, v_org_id, v_user_id),
    (f_hipaa,    'deal',    d_pulse_dashboard, v_org_id, v_user_id),
    (f_hipaa,    'invoice', inv3,              v_org_id, v_user_id);

  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, metadata, created_by, created_at) VALUES
    (v_org_id, ct_david, d_vertex_tracker, c_vertex, 'FILE_UPLOADED', 'Uploaded Vertex proposal', jsonb_build_object('file_id', f_proposal), v_user_id, now() - interval '10 days'),
    (v_org_id, ct_maya, d_pulse_dashboard, c_pulse, 'FILE_UPLOADED', 'Uploaded HIPAA assessment', jsonb_build_object('file_id', f_hipaa), v_user_id, now() - interval '7 days');

  -- =====================================================================
  -- 9. Messaging — Templates + Messages
  -- =====================================================================
  INSERT INTO public.message_templates (id, org_id, name, subject, body, channel, variables, created_by) VALUES
    (gen_random_uuid(), v_org_id, 'Welcome — New Client',     'Welcome to Fitted Agency, {{first_name}}',       E'Hi {{first_name}},\n\nWelcome aboard! We are excited to partner with {{company}} on your project.\n\n— Fitted Agency', 'EMAIL', '["first_name","company"]', v_user_id),
    (gen_random_uuid(), v_org_id, 'Follow-up — Proposal',     'Following up on your proposal',                  E'Hi {{first_name}},\n\nJust checking in on the proposal we sent for {{deal_title}}. Happy to hop on a quick call if helpful.\n\nThanks!', 'EMAIL', '["first_name","deal_title"]', v_user_id),
    (gen_random_uuid(), v_org_id, 'Invoice Reminder',         'Friendly reminder — Invoice {{invoice_number}}', E'Hi {{first_name}},\n\nJust a friendly nudge — invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.\n\nLet us know if you have any questions.', 'EMAIL', '["first_name","invoice_number","amount","due_date"]', v_user_id);

  SELECT id INTO tpl_welcome  FROM public.message_templates WHERE org_id = v_org_id AND name = 'Welcome — New Client';
  SELECT id INTO tpl_followup FROM public.message_templates WHERE org_id = v_org_id AND name = 'Follow-up — Proposal';
  SELECT id INTO tpl_invoice  FROM public.message_templates WHERE org_id = v_org_id AND name = 'Invoice Reminder';

  INSERT INTO public.messages (org_id, channel, status, subject, body, recipient_email, recipient_name, contact_id, company_id, deal_id, template_id, sent_at, created_by, created_at) VALUES
    (v_org_id, 'EMAIL', 'DELIVERED', 'Welcome to Fitted Agency, Rachel', E'Hi Rachel,\n\nWelcome aboard! We are excited to work on the Meridian client portal.\n\n— Fitted Agency', 'rachel@meridianstudios.com', 'Rachel Kim', ct_rachel, c_meridian, d_meridian_portal, tpl_welcome, now() - interval '60 days', v_user_id, now() - interval '60 days'),
    (v_org_id, 'EMAIL', 'DELIVERED', 'Following up on your proposal',    E'Hi David,\n\nJust checking in on the proposal for the Vertex Portfolio Tracker.',                           'david@vertexcap.com',         'David Park',  ct_david,  c_vertex,   d_vertex_tracker,   tpl_followup, now() - interval '6 days',  v_user_id, now() - interval '6 days'),
    (v_org_id, 'EMAIL', 'SENT',      'Friendly reminder — INV-0006',     E'Hi Elena,\n\nJust a friendly nudge on INV-0006 ($2,250).',                                                'elena@harborcollective.com',  'Elena Vasquez',ct_elena, c_harbor,   NULL,               tpl_invoice,  now() - interval '2 days',  v_user_id, now() - interval '2 days'),
    (v_org_id, 'EMAIL', 'FAILED',    'Architecture proposal — Pulse',    E'Hi Maya, attached is the Next.js + Supabase architecture doc.',                                          'maya@pulsehealth.io',         'Maya Rodriguez',ct_maya, c_pulse,    d_pulse_dashboard,  NULL,          NULL,                        v_user_id, now() - interval '1 day'),
    (v_org_id, 'EMAIL', 'DRAFT',     'Phase 2 mobile app — Vertex',      E'Draft — include mobile companion scope.',                                                                NULL,                          NULL,            ct_david,  c_vertex,   d_vertex_tracker,   NULL,          NULL,                        v_user_id, now() - interval '2 hours');

  -- =====================================================================
  -- 10. Forms + Submissions
  -- =====================================================================
  INSERT INTO public.forms (id, org_id, name, description, slug, status, fields, settings, submission_count, created_by) VALUES
    (gen_random_uuid(), v_org_id, 'Contact Form', 'Public contact form on the marketing site.', 'contact', 'ACTIVE',
     '[{"id":"name","type":"TEXT","label":"Full Name","required":true},
       {"id":"email","type":"EMAIL","label":"Email","required":true},
       {"id":"company","type":"TEXT","label":"Company","required":false},
       {"id":"message","type":"TEXTAREA","label":"Tell us about your project","required":true}]'::jsonb,
     '{"confirmation":"Thanks — we will be in touch within 24 hours.","notifyEmails":["admin@glide.study"],"autoCreateContact":true}'::jsonb,
     2, v_user_id),
    (gen_random_uuid(), v_org_id, 'Project Intake', 'Deep intake questionnaire sent to qualified leads.', 'intake', 'ACTIVE',
     '[{"id":"name","type":"TEXT","label":"Name","required":true},
       {"id":"email","type":"EMAIL","label":"Work email","required":true},
       {"id":"budget","type":"SELECT","label":"Budget range","options":["<25K","25–50K","50–100K","100K+"],"required":true},
       {"id":"timeline","type":"SELECT","label":"Timeline","options":["<1 month","1–3 months","3–6 months","6+ months"],"required":true},
       {"id":"services","type":"MULTI_SELECT","label":"Services needed","options":["Design","Development","Strategy","Ongoing retainer"],"required":true},
       {"id":"details","type":"TEXTAREA","label":"Project details","required":false}]'::jsonb,
     '{"confirmation":"Thanks — we will review and respond in 2 business days."}'::jsonb,
     1, v_user_id);

  SELECT id INTO form_contact FROM public.forms WHERE org_id = v_org_id AND slug = 'contact';
  SELECT id INTO form_intake  FROM public.forms WHERE org_id = v_org_id AND slug = 'intake';

  INSERT INTO public.form_submissions (org_id, form_id, data, contact_id, company_id, source_ip, user_agent, created_at) VALUES
    (v_org_id, form_contact, '{"name":"Elena Vasquez","email":"elena@harborcollective.com","company":"Harbor Collective","message":"Looking to unify 3 Shopify stores into a custom storefront."}'::jsonb, ct_elena, c_harbor, '71.204.12.88',  'Mozilla/5.0 (Macintosh)',  now() - interval '3 days'),
    (v_org_id, form_contact, '{"name":"Tom Bradley","email":"tom.bradley@gmail.com","message":"Early-stage SaaS idea — need help defining MVP."}'::jsonb,                                                   ct_tom,   NULL,     '98.12.44.201',  'Mozilla/5.0 (iPhone)',     now() - interval '2 days'),
    (v_org_id, form_intake,  '{"name":"Maya Rodriguez","email":"maya@pulsehealth.io","budget":"50–100K","timeline":"3–6 months","services":["Design","Development","Strategy"],"details":"HIPAA-compliant patient dashboard."}'::jsonb, ct_maya, c_pulse, '172.58.9.14',   'Mozilla/5.0 (Windows)',    now() - interval '23 days');

  -- Keep submission_count honest even though the trigger just bumped it
  UPDATE public.forms SET submission_count = (SELECT count(*) FROM public.form_submissions WHERE form_id = public.forms.id)
  WHERE org_id = v_org_id;

  -- =====================================================================
  -- 11. Chat (AI feature-request history)
  -- =====================================================================
  INSERT INTO public.chat_messages (org_id, created_by, role, content, job_id, job_status, job_detail, created_at) VALUES
    (v_org_id, v_user_id, 'user',      'Can you add a dark-mode toggle to the dashboard header?',                                                            NULL,         NULL,        NULL,                                    now() - interval '4 days'),
    (v_org_id, v_user_id, 'assistant', 'On it — I will add a toggle in DashboardNav that persists to localStorage and respects prefers-color-scheme.',       'job_dark_1', 'complete',  '{"files_changed":3,"pr":"#42"}'::jsonb, now() - interval '4 days' + interval '2 minutes'),
    (v_org_id, v_user_id, 'status',    'Merged PR #42. Dark-mode toggle live.',                                                                              'job_dark_1', 'complete',  NULL,                                    now() - interval '3 days'),
    (v_org_id, v_user_id, 'user',      'Add an export-to-CSV button to the Contacts table.',                                                                  NULL,         NULL,        NULL,                                    now() - interval '1 day'),
    (v_org_id, v_user_id, 'assistant', 'Working on it — adding a server action that streams the current filter/search view as CSV.',                         'job_csv_1',  'running',   '{"step":"writing server action"}'::jsonb, now() - interval '1 day' + interval '3 minutes'),
    (v_org_id, v_user_id, 'user',      'Please replace the default landing hero with a terminal-style animated copy block.',                                  NULL,         NULL,        NULL,                                    now() - interval '2 hours'),
    (v_org_id, v_user_id, 'assistant', 'Let me sketch a plan before touching the hero — want it fully typed out or cycled through a few taglines?',          'job_hero_1', 'pending',   NULL,                                    now() - interval '2 hours' + interval '30 seconds');

  -- =====================================================================
  -- 12. Time Tracking
  -- =====================================================================
  INSERT INTO public.time_entries (org_id, task_id, deal_id, contact_id, company_id, user_id, description, duration_minutes, date, billable, rate, invoice_id, created_by, created_at) VALUES
    (v_org_id, t_ci,        d_pulse_dashboard, ct_maya,  c_pulse,    v_user_id, 'Repo scaffolding + CI pipeline',    180, CURRENT_DATE - 14, true, 150, inv3, v_user_id, now() - interval '14 days'),
    (v_org_id, t_ci,        d_pulse_dashboard, ct_maya,  c_pulse,    v_user_id, 'GitHub Actions typecheck + lint',    90, CURRENT_DATE - 13, true, 150, inv3, v_user_id, now() - interval '13 days'),
    (v_org_id, t_appt,      d_pulse_dashboard, ct_maya,  c_pulse,    v_user_id, 'Appointment scheduling — data model', 240, CURRENT_DATE - 6, true, 185, NULL, v_user_id, now() - interval '6 days'),
    (v_org_id, t_appt,      d_pulse_dashboard, ct_maya,  c_pulse,    v_user_id, 'Calendar view component',            300, CURRENT_DATE - 4, true, 185, NULL, v_user_id, now() - interval '4 days'),
    (v_org_id, t_auth,      d_pulse_dashboard, ct_maya,  c_pulse,    v_user_id, 'Magic-link auth wiring',             165, CURRENT_DATE - 3, true, 185, NULL, v_user_id, now() - interval '3 days'),
    (v_org_id, t_auth,      d_pulse_dashboard, ct_maya,  c_pulse,    v_user_id, 'Onboarding flow steps',              210, CURRENT_DATE - 1, true, 185, NULL, v_user_id, now() - interval '1 day'),
    (v_org_id, t_records,   d_pulse_dashboard, ct_maya,  c_pulse,    v_user_id, 'Records viewer + PDF export',        270, CURRENT_DATE - 5, true, 185, NULL, v_user_id, now() - interval '5 days'),
    (v_org_id, t_calendar_sync, d_meridian_booking, ct_sarah, c_meridian, v_user_id, 'Google Calendar OAuth flow',    195, CURRENT_DATE - 2, true, 175, NULL, v_user_id, now() - interval '2 days'),
    (v_org_id, t_discovery, d_meridian_booking, ct_sarah, c_meridian, v_user_id, 'Discovery prep + recap notes',       60, CURRENT_DATE - 8, false, 0,  NULL, v_user_id, now() - interval '8 days'),
    (v_org_id, NULL,        d_vertex_tracker,  ct_david, c_vertex,   v_user_id, 'Proposal writing + pricing',        150, CURRENT_DATE - 10, true, 200, NULL, v_user_id, now() - interval '10 days');

  INSERT INTO public.activities (org_id, deal_id, contact_id, company_id, type, title, metadata, created_by, created_at) VALUES
    (v_org_id, d_pulse_dashboard, ct_maya, c_pulse, 'TIME_LOGGED', 'Logged 4h on appointment scheduling', '{"minutes":240}', v_user_id, now() - interval '6 days'),
    (v_org_id, d_pulse_dashboard, ct_maya, c_pulse, 'TIME_LOGGED', 'Logged 2.75h on auth + onboarding',   '{"minutes":165}', v_user_id, now() - interval '3 days');

  -- =====================================================================
  -- 13. Client Portals
  -- =====================================================================
  INSERT INTO public.client_portals (id, org_id, contact_id, company_id, enabled, permissions, created_by) VALUES
    (gen_random_uuid(), v_org_id, ct_david, c_vertex, true, '{"invoices": true, "projects": true, "files": true, "forms": false}', v_user_id),
    (gen_random_uuid(), v_org_id, ct_maya,  c_pulse,  true, '{"invoices": true, "projects": true, "files": true, "forms": true}',  v_user_id),
    (gen_random_uuid(), v_org_id, ct_rachel,c_meridian,true,'{"invoices": true, "projects": true, "files": true, "forms": true}', v_user_id),
    (gen_random_uuid(), v_org_id, ct_elena, c_harbor, false,'{"invoices": true, "projects": false,"files": false,"forms": false}', v_user_id);

  SELECT id INTO portal_vertex FROM public.client_portals WHERE org_id = v_org_id AND contact_id = ct_david;
  SELECT id INTO portal_pulse  FROM public.client_portals WHERE org_id = v_org_id AND contact_id = ct_maya;

  -- =====================================================================
  -- 14. Automations
  -- =====================================================================
  INSERT INTO public.automations (id, org_id, name, description, trigger_type, trigger_config, action_type, action_config, enabled, last_run_at, run_count, created_by) VALUES
    (gen_random_uuid(), v_org_id, 'Welcome new contacts',        'Send a welcome email when a contact is created.',              'contact.created',        '{}'::jsonb,                                                                   'send_email',     jsonb_build_object('template_id', tpl_welcome, 'to_field', 'email'), true,  now() - interval '2 days',  14, v_user_id),
    (gen_random_uuid(), v_org_id, 'Invoice paid → notify team',  'Post a notification and mark the deal for celebration.',       'invoice.status_changed', '{"to":"PAID"}'::jsonb,                                                        'create_notification', jsonb_build_object('title','Invoice paid','icon','FileText'),   true,  now() - interval '18 days', 2,  v_user_id),
    (gen_random_uuid(), v_org_id, 'Stale deal reminder',         'Ping the owner when a deal has no activity for 7+ days.',      'deal.stale',             '{"days":7}'::jsonb,                                                           'create_task',    jsonb_build_object('title','Follow up on stale deal','priority','MEDIUM'), true,  now() - interval '1 day',   5,  v_user_id),
    (gen_random_uuid(), v_org_id, 'Form submission → CRM',       'Create a contact + lead deal when the intake form submits.',   'form.submitted',         jsonb_build_object('form_id', form_intake)::jsonb,                             'create_deal',    jsonb_build_object('stage','LEAD','priority','MEDIUM'),                    true,  now() - interval '23 days', 1,  v_user_id),
    (gen_random_uuid(), v_org_id, 'Overdue invoice → email',     'Auto-remind clients with unpaid invoices past due.',           'invoice.overdue',        '{"days_overdue":3}'::jsonb,                                                   'send_email',     jsonb_build_object('template_id', tpl_invoice),                            false, NULL,                       0,  v_user_id);

  SELECT id INTO auto_welcome      FROM public.automations WHERE org_id = v_org_id AND name = 'Welcome new contacts';
  SELECT id INTO auto_invoice_paid FROM public.automations WHERE org_id = v_org_id AND name = 'Invoice paid → notify team';
  SELECT id INTO auto_stale        FROM public.automations WHERE org_id = v_org_id AND name = 'Stale deal reminder';

  INSERT INTO public.automation_logs (automation_id, org_id, trigger_data, action_result, status, created_at) VALUES
    (auto_welcome,      v_org_id, jsonb_build_object('contact_id', ct_sarah),            jsonb_build_object('message_id','delivered'),     'SUCCESS', now() - interval '65 days'),
    (auto_welcome,      v_org_id, jsonb_build_object('contact_id', ct_maya),             jsonb_build_object('message_id','delivered'),     'SUCCESS', now() - interval '22 days'),
    (auto_welcome,      v_org_id, jsonb_build_object('contact_id', ct_david),            jsonb_build_object('message_id','delivered'),     'SUCCESS', now() - interval '18 days'),
    (auto_invoice_paid, v_org_id, jsonb_build_object('invoice_id', inv1),                jsonb_build_object('notification','sent'),        'SUCCESS', now() - interval '18 days'),
    (auto_invoice_paid, v_org_id, jsonb_build_object('invoice_id', inv9),                jsonb_build_object('notification','sent'),        'SUCCESS', now() - interval '20 days'),
    (auto_stale,        v_org_id, jsonb_build_object('deal_id',    d_tom_saas),          jsonb_build_object('task_id','created'),          'SUCCESS', now() - interval '1 day'),
    (auto_stale,        v_org_id, jsonb_build_object('deal_id',    d_harbor_storefront), NULL,                                             'FAILED',  now() - interval '12 hours');

  -- =====================================================================
  -- 15. Notifications
  -- =====================================================================
  INSERT INTO public.notifications (org_id, user_id, title, body, link, icon, status, source_type, source_id, created_at) VALUES
    (v_org_id, v_user_id, 'Vertex deal moved to Negotiation', 'Vertex Portfolio Tracker is now in Negotiation',              '/crm/deals',    'Handshake',   'UNREAD', 'deal',    d_vertex_tracker,   now() - interval '5 minutes'),
    (v_org_id, v_user_id, 'Task assigned: HIPAA file storage', 'Urgent — BAA required before start',                         '/tasks',        'CheckSquare', 'UNREAD', 'task',    NULL,               now() - interval '22 minutes'),
    (v_org_id, v_user_id, 'Invoice INV-0001 paid',            'Meridian paid $27,840',                                        '/invoicing',    'FileText',    'UNREAD', 'invoice', inv1,               now() - interval '1 hour'),
    (v_org_id, v_user_id, 'New contact from intake form',     'Maya Rodriguez (Pulse Health) submitted the intake form',     '/crm/contacts', 'User',        'UNREAD', 'contact', ct_maya,            now() - interval '2 hours'),
    (v_org_id, v_user_id, 'Invoice INV-0006 overdue',         'Harbor Collective — 7 days overdue',                           '/invoicing',    'AlertCircle', 'UNREAD', 'invoice', inv6,               now() - interval '3 hours'),
    (v_org_id, v_user_id, 'Automation failed: Stale reminder','Harbor Storefront Rebuild — action_result null',              '/settings',     'Zap',         'UNREAD', 'automation', auto_stale,      now() - interval '12 hours'),
    (v_org_id, v_user_id, 'Form submitted: Contact',          'Elena Vasquez left a new message',                             '/forms',        'Inbox',       'READ',   'form',    form_contact,       now() - interval '3 days'),
    (v_org_id, v_user_id, 'Deal won: Meridian Client Portal', 'Closed at $28,000 — nice work!',                               '/crm/deals',    'Trophy',      'READ',   'deal',    d_meridian_portal,  now() - interval '12 days'),
    (v_org_id, v_user_id, 'New file uploaded',                'HIPAA Assessment added to Pulse Patient Dashboard',            '/files',        'File',        'READ',   'file',    f_hipaa,            now() - interval '7 days'),
    (v_org_id, v_user_id, 'Meeting completed: Vertex Demo',   'Marked "Vertex Capital — Portfolio Demo" as completed',        '/calendar',    'Calendar',    'READ',   'event',   e_demo_vertex,      now() - interval '5 days');

  -- =====================================================================
  -- Done
  -- =====================================================================
  RAISE NOTICE '✓ Demo seed complete for org %', v_org_id;
  RAISE NOTICE '  CRM: 5 companies · 8 contacts · 8 deals · 20 activities';
  RAISE NOTICE '  Invoices: 10 (2 PAID, 2 SENT, 4 DRAFT, 1 OVERDUE, 1 CANCELLED) + 1 recurring';
  RAISE NOTICE '  Tasks: 2 boards · 8 columns · 12 tasks · 6 labels';
  RAISE NOTICE '  Calendar: 12 events · Files: 5 · Forms: 2 + 3 submissions';
  RAISE NOTICE '  Messages: 5 + 3 templates · Chat: 7 · Time entries: 10';
  RAISE NOTICE '  Client portals: 4 · Automations: 5 + 7 logs · Notifications: 10';
END $$;
