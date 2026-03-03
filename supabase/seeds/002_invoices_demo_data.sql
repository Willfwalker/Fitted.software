-- ============================================
-- Invoice Seed Data for Fitted Software
-- Run in Supabase SQL Editor AFTER 001_crm_demo_data.sql
-- ============================================

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  -- Companies
  c_meridian uuid;
  c_oak uuid;
  c_pulse uuid;
  c_vertex uuid;
  c_harbor uuid;
  -- Contacts
  ct_sarah uuid;
  ct_james uuid;
  ct_maya uuid;
  ct_david uuid;
  ct_elena uuid;
  ct_rachel uuid;
  -- Deals
  d3 uuid; d4 uuid; d5 uuid; d6 uuid; d7 uuid;
  -- Invoices
  inv1 uuid; inv2 uuid; inv3 uuid; inv4 uuid; inv5 uuid;
  inv6 uuid; inv7 uuid; inv8 uuid; inv9 uuid; inv10 uuid;
  -- Invoice numbers
  inv_num text;
BEGIN
  -- Get the org owned by the first OWNER
  SELECT om.org_id, om.user_id INTO v_org_id, v_user_id
  FROM public.organization_members om
  WHERE om.role = 'OWNER'
  ORDER BY om.created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Run 001_crm_demo_data.sql first.';
  END IF;

  -- Fetch company IDs
  SELECT id INTO c_meridian FROM public.companies WHERE org_id = v_org_id AND name = 'Meridian Studios';
  SELECT id INTO c_oak FROM public.companies WHERE org_id = v_org_id AND name = 'Oak & Stone Properties';
  SELECT id INTO c_pulse FROM public.companies WHERE org_id = v_org_id AND name = 'Pulse Health';
  SELECT id INTO c_vertex FROM public.companies WHERE org_id = v_org_id AND name = 'Vertex Capital';
  SELECT id INTO c_harbor FROM public.companies WHERE org_id = v_org_id AND name = 'Harbor Collective';

  -- Fetch contact IDs
  SELECT id INTO ct_sarah FROM public.contacts WHERE org_id = v_org_id AND email = 'sarah@meridianstudios.com';
  SELECT id INTO ct_james FROM public.contacts WHERE org_id = v_org_id AND email = 'james@oakandstone.co';
  SELECT id INTO ct_maya FROM public.contacts WHERE org_id = v_org_id AND email = 'maya@pulsehealth.io';
  SELECT id INTO ct_david FROM public.contacts WHERE org_id = v_org_id AND email = 'david@vertexcap.com';
  SELECT id INTO ct_elena FROM public.contacts WHERE org_id = v_org_id AND email = 'elena@harborcollective.com';
  SELECT id INTO ct_rachel FROM public.contacts WHERE org_id = v_org_id AND email = 'rachel@meridianstudios.com';

  -- Fetch deal IDs
  SELECT id INTO d3 FROM public.deals WHERE org_id = v_org_id AND title = 'Oak & Stone Property Platform';
  SELECT id INTO d4 FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Booking System';
  SELECT id INTO d5 FROM public.deals WHERE org_id = v_org_id AND title = 'Pulse Patient Dashboard';
  SELECT id INTO d6 FROM public.deals WHERE org_id = v_org_id AND title = 'Vertex Portfolio Tracker';
  SELECT id INTO d7 FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Client Portal v1';

  -- ========== INVOICES ==========

  -- 1. Meridian Client Portal — PAID (completed project)
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, paid_at, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d7, ct_rachel, c_meridian, 'PAID',
    '[
      {"description": "Discovery & Strategy Workshop", "quantity": 1, "rate": 3500, "amount": 3500},
      {"description": "UI/UX Design — Client Portal", "quantity": 40, "rate": 175, "amount": 7000},
      {"description": "Frontend Development (Next.js)", "quantity": 60, "rate": 185, "amount": 11100},
      {"description": "Backend API & Auth Integration", "quantity": 24, "rate": 185, "amount": 4440},
      {"description": "QA Testing & Bug Fixes", "quantity": 12, "rate": 150, "amount": 1800}
    ]'::jsonb,
    27840, 0, 0, 27840,
    (CURRENT_DATE - interval '45 days')::date,
    (CURRENT_DATE - interval '15 days')::date,
    now() - interval '18 days',
    NULL, 0, 0, 'NET_30', 'USD',
    'Final invoice for Meridian Client Portal v1. Project delivered ahead of schedule.',
    v_user_id, now() - interval '45 days'
  )
  RETURNING id INTO inv1;

  -- 2. Vertex Portfolio Tracker — Phase 1 deposit — SENT
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d6, ct_david, c_vertex, 'SENT',
    '[
      {"description": "Phase 1 — Core Dashboard: 50% Deposit", "quantity": 1, "rate": 27500, "amount": 27500},
      {"description": "Project Setup & DevOps Configuration", "quantity": 1, "rate": 4500, "amount": 4500}
    ]'::jsonb,
    32000, 0, 0, 32000,
    (CURRENT_DATE - interval '4 days')::date,
    (CURRENT_DATE + interval '26 days')::date,
    NULL, 0, 0, 'NET_30', 'USD',
    'Deposit invoice for Vertex Portfolio Tracker Phase 1. Remaining 50% due upon delivery.',
    v_user_id, now() - interval '4 days'
  )
  RETURNING id INTO inv2;

  -- 3. Pulse Patient Dashboard — Discovery phase — SENT
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d5, ct_maya, c_pulse, 'SENT',
    '[
      {"description": "HIPAA Compliance Assessment", "quantity": 1, "rate": 5000, "amount": 5000},
      {"description": "Technical Architecture & Planning", "quantity": 20, "rate": 200, "amount": 4000},
      {"description": "UX Research & Patient Journey Mapping", "quantity": 16, "rate": 175, "amount": 2800}
    ]'::jsonb,
    11800, 0, 0, 11800,
    (CURRENT_DATE - interval '7 days')::date,
    (CURRENT_DATE + interval '8 days')::date,
    NULL, 0, 0, 'NET_15', 'USD',
    'Discovery phase for Pulse Patient Dashboard. Includes HIPAA compliance review and architecture planning.',
    v_user_id, now() - interval '7 days'
  )
  RETURNING id INTO inv3;

  -- 4. Oak & Stone — Proposal/scope invoice — DRAFT
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d3, ct_james, c_oak, 'DRAFT',
    '[
      {"description": "Property Listing Platform — Design Phase", "quantity": 60, "rate": 175, "amount": 10500},
      {"description": "Map Integration & Search (Mapbox)", "quantity": 32, "rate": 195, "amount": 6240},
      {"description": "Virtual Tour System Integration", "quantity": 20, "rate": 185, "amount": 3700},
      {"description": "Agent CRM Module", "quantity": 40, "rate": 185, "amount": 7400},
      {"description": "Data Migration (150+ listings)", "quantity": 1, "rate": 3500, "amount": 3500}
    ]'::jsonb,
    31340, 8.25, 2585.55, 33925.55,
    CURRENT_DATE::date,
    (CURRENT_DATE + interval '30 days')::date,
    'percentage', 10, 3148.50, 'NET_30', 'USD',
    'Phase 1 estimate for Oak & Stone property platform. 10% early-sign discount applied. Tax: Texas state sales tax.',
    v_user_id, now() - interval '1 day'
  )
  RETURNING id INTO inv4;

  -- Recalculate #4 properly: subtotal=31340, discount=3134 (10%), taxable=28206, tax=2326.995, total=30532.995
  UPDATE public.invoices SET
    discount_amount = 3134,
    tax_amount = 2326.99,
    total = 30532.99
  WHERE id = inv4;

  -- 5. Meridian Booking System — Retainer setup — DRAFT
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d4, ct_sarah, c_meridian, 'DRAFT',
    '[
      {"description": "Monthly Development Retainer (40 hrs)", "quantity": 40, "rate": 175, "amount": 7000},
      {"description": "Dedicated Project Manager", "quantity": 1, "rate": 2500, "amount": 2500},
      {"description": "Hosting & Infrastructure (monthly)", "quantity": 1, "rate": 350, "amount": 350}
    ]'::jsonb,
    9850, 0, 0, 9850,
    CURRENT_DATE::date,
    (CURRENT_DATE + interval '15 days')::date,
    NULL, 0, 0, 'NET_15', 'USD',
    'Monthly retainer for Meridian Booking System development. First month — recurring thereafter.',
    v_user_id, now()
  )
  RETURNING id INTO inv5;

  -- 6. Harbor Collective — Consultation invoice — OVERDUE
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, NULL, ct_elena, c_harbor, 'OVERDUE',
    '[
      {"description": "E-Commerce Platform Consultation (3 hrs)", "quantity": 3, "rate": 250, "amount": 750},
      {"description": "Competitive Audit & Recommendations Report", "quantity": 1, "rate": 1500, "amount": 1500}
    ]'::jsonb,
    2250, 0, 0, 2250,
    (CURRENT_DATE - interval '22 days')::date,
    (CURRENT_DATE - interval '7 days')::date,
    NULL, 0, 0, 'NET_15', 'USD',
    'Consultation for Harbor storefront consolidation. Separate from the rebuild project.',
    v_user_id, now() - interval '22 days'
  )
  RETURNING id INTO inv6;

  -- 7. Vertex — Phase 2 mobile app quote — DRAFT
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d6, ct_david, c_vertex, 'DRAFT',
    '[
      {"description": "React Native Mobile App — Portfolio View", "quantity": 80, "rate": 195, "amount": 15600},
      {"description": "Push Notifications & Real-time Data", "quantity": 32, "rate": 200, "amount": 6400},
      {"description": "App Store Submission & QA", "quantity": 24, "rate": 175, "amount": 4200}
    ]'::jsonb,
    26200, 0, 0, 26200,
    CURRENT_DATE::date,
    NULL,
    'percentage', 10, 2620, 'NET_30', 'USD',
    'Phase 2 quote — mobile companion app for Vertex Portfolio Tracker. 10% bundle discount applied.',
    v_user_id, now()
  )
  RETURNING id INTO inv7;

  -- Apply discount to total
  UPDATE public.invoices SET total = 23580 WHERE id = inv7;

  -- 8. Pulse — Full project estimate — DRAFT (large invoice)
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d5, ct_maya, c_pulse, 'DRAFT',
    '[
      {"description": "Patient Dashboard — Frontend (Next.js)", "quantity": 120, "rate": 185, "amount": 22200},
      {"description": "Backend API & Database (Supabase)", "quantity": 80, "rate": 195, "amount": 15600},
      {"description": "HIPAA-Compliant Auth & Encryption", "quantity": 40, "rate": 225, "amount": 9000},
      {"description": "Appointment Scheduling Module", "quantity": 48, "rate": 185, "amount": 8880},
      {"description": "Provider Messaging System", "quantity": 36, "rate": 185, "amount": 6660},
      {"description": "Health Records Viewer", "quantity": 32, "rate": 195, "amount": 6240},
      {"description": "QA, Security Audit & Penetration Testing", "quantity": 40, "rate": 200, "amount": 8000}
    ]'::jsonb,
    76580, 0, 0, 76580,
    CURRENT_DATE::date,
    (CURRENT_DATE + interval '45 days')::date,
    NULL, 0, 0, 'NET_45', 'USD',
    'Full project estimate for Pulse Patient Dashboard. Excludes Discovery phase (invoiced separately as INV-0003).',
    v_user_id, now()
  )
  RETURNING id INTO inv8;

  -- 9. Meridian — Previous month retainer — PAID
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, paid_at, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d7, ct_rachel, c_meridian, 'PAID',
    '[
      {"description": "Post-Launch Support & Maintenance (20 hrs)", "quantity": 20, "rate": 150, "amount": 3000},
      {"description": "Feature Enhancement: Bulk Upload", "quantity": 12, "rate": 175, "amount": 2100}
    ]'::jsonb,
    5100, 0, 0, 5100,
    (CURRENT_DATE - interval '32 days')::date,
    (CURRENT_DATE - interval '17 days')::date,
    now() - interval '20 days',
    NULL, 0, 0, 'NET_15', 'USD',
    'Post-launch support for Meridian Client Portal. Includes bulk upload feature requested by Rachel.',
    v_user_id, now() - interval '32 days'
  )
  RETURNING id INTO inv9;

  -- 10. Cancelled invoice — was a duplicate
  SELECT public.next_invoice_number(v_org_id) INTO inv_num;
  INSERT INTO public.invoices (id, org_id, invoice_number, deal_id, contact_id, company_id, status, items, subtotal, tax_rate, tax_amount, total, issue_date, due_date, discount_type, discount_value, discount_amount, payment_terms, currency, notes, created_by, created_at)
  VALUES (
    gen_random_uuid(), v_org_id, inv_num, d6, ct_david, c_vertex, 'CANCELLED',
    '[
      {"description": "Phase 1 — Core Dashboard: 50% Deposit", "quantity": 1, "rate": 27500, "amount": 27500}
    ]'::jsonb,
    27500, 0, 0, 27500,
    (CURRENT_DATE - interval '6 days')::date,
    (CURRENT_DATE + interval '24 days')::date,
    NULL, 0, 0, 'NET_30', 'USD',
    'CANCELLED — duplicate of INV-0002. Accidentally created before adding DevOps line item.',
    v_user_id, now() - interval '6 days'
  )
  RETURNING id INTO inv10;

  -- ========== INVOICE ACTIVITIES ==========

  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, content, metadata, created_by, created_at)
  VALUES
    -- Invoice 1 — Meridian portal (PAID)
    (v_org_id, ct_rachel, d7, c_meridian, 'INVOICE_CREATED', 'Created invoice INV-0001', NULL,
     ('{"invoice_id": "' || inv1 || '", "total": 27840}')::jsonb, v_user_id, now() - interval '45 days'),
    (v_org_id, ct_rachel, d7, c_meridian, 'INVOICE_STATUS_CHANGED', 'Invoice INV-0001 marked as SENT', NULL,
     ('{"invoice_id": "' || inv1 || '", "from": "DRAFT", "to": "SENT"}')::jsonb, v_user_id, now() - interval '44 days'),
    (v_org_id, ct_rachel, d7, c_meridian, 'INVOICE_STATUS_CHANGED', 'Invoice INV-0001 marked as PAID', NULL,
     ('{"invoice_id": "' || inv1 || '", "from": "SENT", "to": "PAID"}')::jsonb, v_user_id, now() - interval '18 days'),

    -- Invoice 2 — Vertex deposit (SENT)
    (v_org_id, ct_david, d6, c_vertex, 'INVOICE_CREATED', 'Created invoice INV-0002', NULL,
     ('{"invoice_id": "' || inv2 || '", "total": 32000}')::jsonb, v_user_id, now() - interval '4 days'),
    (v_org_id, ct_david, d6, c_vertex, 'INVOICE_STATUS_CHANGED', 'Invoice INV-0002 sent to david@vertexcap.com', NULL,
     ('{"invoice_id": "' || inv2 || '", "from": "DRAFT", "to": "SENT"}')::jsonb, v_user_id, now() - interval '4 days'),

    -- Invoice 3 — Pulse discovery (SENT)
    (v_org_id, ct_maya, d5, c_pulse, 'INVOICE_CREATED', 'Created invoice INV-0003', NULL,
     ('{"invoice_id": "' || inv3 || '", "total": 11800}')::jsonb, v_user_id, now() - interval '7 days'),
    (v_org_id, ct_maya, d5, c_pulse, 'INVOICE_STATUS_CHANGED', 'Invoice INV-0003 sent to maya@pulsehealth.io', NULL,
     ('{"invoice_id": "' || inv3 || '", "from": "DRAFT", "to": "SENT"}')::jsonb, v_user_id, now() - interval '7 days'),

    -- Invoice 4 — Oak & Stone (DRAFT)
    (v_org_id, ct_james, d3, c_oak, 'INVOICE_CREATED', 'Created invoice INV-0004', NULL,
     ('{"invoice_id": "' || inv4 || '", "total": 30532.99}')::jsonb, v_user_id, now() - interval '1 day'),

    -- Invoice 5 — Meridian retainer (DRAFT)
    (v_org_id, ct_sarah, d4, c_meridian, 'INVOICE_CREATED', 'Created invoice INV-0005', NULL,
     ('{"invoice_id": "' || inv5 || '", "total": 9850}')::jsonb, v_user_id, now()),

    -- Invoice 6 — Harbor consultation (OVERDUE)
    (v_org_id, ct_elena, NULL, c_harbor, 'INVOICE_CREATED', 'Created invoice INV-0006', NULL,
     ('{"invoice_id": "' || inv6 || '", "total": 2250}')::jsonb, v_user_id, now() - interval '22 days'),
    (v_org_id, ct_elena, NULL, c_harbor, 'INVOICE_STATUS_CHANGED', 'Invoice INV-0006 marked as OVERDUE', NULL,
     ('{"invoice_id": "' || inv6 || '", "from": "SENT", "to": "OVERDUE"}')::jsonb, v_user_id, now() - interval '7 days'),

    -- Invoice 9 — Meridian support (PAID)
    (v_org_id, ct_rachel, d7, c_meridian, 'INVOICE_CREATED', 'Created invoice INV-0009', NULL,
     ('{"invoice_id": "' || inv9 || '", "total": 5100}')::jsonb, v_user_id, now() - interval '32 days'),
    (v_org_id, ct_rachel, d7, c_meridian, 'INVOICE_STATUS_CHANGED', 'Invoice INV-0009 marked as PAID', NULL,
     ('{"invoice_id": "' || inv9 || '", "from": "SENT", "to": "PAID"}')::jsonb, v_user_id, now() - interval '20 days'),

    -- Invoice 10 — Vertex cancelled
    (v_org_id, ct_david, d6, c_vertex, 'INVOICE_CREATED', 'Created invoice INV-0010', NULL,
     ('{"invoice_id": "' || inv10 || '", "total": 27500}')::jsonb, v_user_id, now() - interval '6 days'),
    (v_org_id, ct_david, d6, c_vertex, 'INVOICE_STATUS_CHANGED', 'Invoice INV-0010 cancelled — duplicate', NULL,
     ('{"invoice_id": "' || inv10 || '", "from": "DRAFT", "to": "CANCELLED"}')::jsonb, v_user_id, now() - interval '6 days');

  -- ========== RECURRING INVOICE ==========

  -- Set up monthly retainer for Meridian booking system
  INSERT INTO public.recurring_invoices (org_id, source_invoice_id, frequency, next_run_date, end_date, runs_count, max_runs, status, created_by)
  VALUES (
    v_org_id, inv5, 'MONTHLY',
    (CURRENT_DATE + interval '30 days')::date,
    NULL,
    0, 12, 'ACTIVE',
    v_user_id
  );

  RAISE NOTICE 'Invoice seed complete: 10 invoices (2 PAID, 2 SENT, 4 DRAFT, 1 OVERDUE, 1 CANCELLED), 15 activities, 1 recurring schedule';
END $$;
