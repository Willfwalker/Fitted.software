-- ============================================
-- CRM Seed Data for Fitted Software
-- Run this in the Supabase SQL Editor AFTER schema.sql
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
  ct_marcus uuid;
  ct_rachel uuid;
  ct_tom uuid;
  -- Deals
  d1 uuid; d2 uuid; d3 uuid; d4 uuid; d5 uuid; d6 uuid; d7 uuid; d8 uuid;
BEGIN
  -- Get the org owned by the current user (Fitted Software)
  SELECT om.org_id, om.user_id INTO v_org_id, v_user_id
  FROM public.organization_members om
  WHERE om.role = 'OWNER'
  ORDER BY om.created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Sign up first.';
  END IF;

  -- ========== COMPANIES ==========

  INSERT INTO public.companies (id, org_id, name, domain, industry, phone, email, address, notes, created_by)
  VALUES
    (gen_random_uuid(), v_org_id, 'Meridian Studios', 'meridianstudios.com', 'Media & Entertainment', '(415) 555-0142', 'hello@meridianstudios.com', '450 Market St, San Francisco, CA 94105', 'Full-service creative studio. Looking to rebuild their client portal and booking system.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Oak & Stone Properties', 'oakandstone.co', 'Real Estate', '(512) 555-0188', 'info@oakandstone.co', '200 Congress Ave, Austin, TX 78701', 'Boutique real estate firm. Need a property listing platform with CRM integration.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Pulse Health', 'pulsehealth.io', 'Healthcare Tech', '(646) 555-0231', 'partnerships@pulsehealth.io', '88 Pine St, New York, NY 10005', 'Digital health startup. Series A funded. Need patient dashboard and appointment system.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Vertex Capital', 'vertexcap.com', 'Finance', '(312) 555-0167', 'deals@vertexcap.com', '333 N Michigan Ave, Chicago, IL 60601', 'VC firm looking for a modern portfolio tracking dashboard. High budget, fast timeline.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Harbor Collective', 'harborcollective.com', 'E-Commerce', '(503) 555-0199', 'team@harborcollective.com', '1221 SW 4th Ave, Portland, OR 97204', 'DTC brand collective. Want a unified storefront with analytics dashboard.', v_user_id);

  -- Fetch all company IDs
  SELECT id INTO c_meridian FROM public.companies WHERE org_id = v_org_id AND name = 'Meridian Studios';
  SELECT id INTO c_oak FROM public.companies WHERE org_id = v_org_id AND name = 'Oak & Stone Properties';
  SELECT id INTO c_pulse FROM public.companies WHERE org_id = v_org_id AND name = 'Pulse Health';
  SELECT id INTO c_vertex FROM public.companies WHERE org_id = v_org_id AND name = 'Vertex Capital';
  SELECT id INTO c_harbor FROM public.companies WHERE org_id = v_org_id AND name = 'Harbor Collective';

  -- ========== CONTACTS ==========

  INSERT INTO public.contacts (id, org_id, first_name, last_name, email, phone, title, company_id, notes, created_by)
  VALUES
    (gen_random_uuid(), v_org_id, 'Sarah', 'Chen', 'sarah@meridianstudios.com', '(415) 555-0143', 'Creative Director', c_meridian, 'Primary decision maker. Prefers Slack for communication.', v_user_id),
    (gen_random_uuid(), v_org_id, 'James', 'Mitchell', 'james@oakandstone.co', '(512) 555-0189', 'Managing Partner', c_oak, 'Met at Austin Tech Week. Very hands-on with product decisions.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Maya', 'Rodriguez', 'maya@pulsehealth.io', '(646) 555-0232', 'CTO', c_pulse, 'Technical buyer. Wants to see architecture docs before committing.', v_user_id),
    (gen_random_uuid(), v_org_id, 'David', 'Park', 'david@vertexcap.com', '(312) 555-0168', 'Partner', c_vertex, 'Budget holder. Needs board-ready reporting features.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Elena', 'Vasquez', 'elena@harborcollective.com', '(503) 555-0200', 'Head of Digital', c_harbor, 'Referred by James Mitchell. Looking for long-term agency partner.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Marcus', 'Webb', 'marcus@pulsehealth.io', '(646) 555-0233', 'Head of Product', c_pulse, 'Works closely with Maya. Owns the patient experience roadmap.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Rachel', 'Kim', 'rachel@meridianstudios.com', '(415) 555-0144', 'VP Operations', c_meridian, 'Handles contracts and billing. Very detail-oriented.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Tom', 'Bradley', 'tom.bradley@gmail.com', '(206) 555-0177', 'Founder', NULL, 'Freelance consultant exploring a new SaaS idea. Early stage, no company yet.', v_user_id);

  -- Fetch contact IDs
  SELECT id INTO ct_sarah FROM public.contacts WHERE org_id = v_org_id AND email = 'sarah@meridianstudios.com';
  SELECT id INTO ct_james FROM public.contacts WHERE org_id = v_org_id AND email = 'james@oakandstone.co';
  SELECT id INTO ct_maya FROM public.contacts WHERE org_id = v_org_id AND email = 'maya@pulsehealth.io';
  SELECT id INTO ct_david FROM public.contacts WHERE org_id = v_org_id AND email = 'david@vertexcap.com';
  SELECT id INTO ct_elena FROM public.contacts WHERE org_id = v_org_id AND email = 'elena@harborcollective.com';
  SELECT id INTO ct_marcus FROM public.contacts WHERE org_id = v_org_id AND email = 'marcus@pulsehealth.io';
  SELECT id INTO ct_rachel FROM public.contacts WHERE org_id = v_org_id AND email = 'rachel@meridianstudios.com';
  SELECT id INTO ct_tom FROM public.contacts WHERE org_id = v_org_id AND email = 'tom.bradley@gmail.com';

  -- ========== DEALS ==========

  INSERT INTO public.deals (id, org_id, title, value, stage, priority, contact_id, company_id, expected_close_date, position, notes, created_by)
  VALUES
    -- LEAD
    (gen_random_uuid(), v_org_id, 'Harbor Storefront Rebuild', 45000, 'LEAD', 'MEDIUM', ct_elena, c_harbor, '2026-04-15', 0, 'Initial inquiry. Elena wants to unify 3 brand storefronts into one platform.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Tom Bradley SaaS MVP', 18000, 'LEAD', 'LOW', ct_tom, NULL, '2026-05-01', 1, 'Early stage idea. Needs discovery session to define scope.', v_user_id),
    -- QUALIFIED
    (gen_random_uuid(), v_org_id, 'Oak & Stone Property Platform', 72000, 'QUALIFIED', 'HIGH', ct_james, c_oak, '2026-03-30', 0, 'James approved budget. Need to send proposal by end of week.', v_user_id),
    (gen_random_uuid(), v_org_id, 'Meridian Booking System', 35000, 'QUALIFIED', 'MEDIUM', ct_sarah, c_meridian, '2026-04-10', 1, 'Sarah liked our portfolio. Rachel reviewing contract terms.', v_user_id),
    -- PROPOSAL
    (gen_random_uuid(), v_org_id, 'Pulse Patient Dashboard', 95000, 'PROPOSAL', 'HIGH', ct_maya, c_pulse, '2026-03-20', 0, 'Proposal sent. Maya reviewing architecture. Marcus aligned on UX direction.', v_user_id),
    -- NEGOTIATION
    (gen_random_uuid(), v_org_id, 'Vertex Portfolio Tracker', 120000, 'NEGOTIATION', 'HIGH', ct_david, c_vertex, '2026-03-15', 0, 'Final pricing discussion. David wants to include mobile app in Phase 2.', v_user_id),
    -- WON
    (gen_random_uuid(), v_org_id, 'Meridian Client Portal v1', 28000, 'WON', 'MEDIUM', ct_rachel, c_meridian, NULL, 0, 'Completed last month. Great relationship — led to booking system deal.', v_user_id),
    -- LOST
    (gen_random_uuid(), v_org_id, 'Harbor Analytics Dashboard', 30000, 'LOST', 'LOW', ct_elena, c_harbor, NULL, 0, 'Lost to in-house team. But Elena came back with the storefront project.', v_user_id);

  -- Set closed_at for WON/LOST deals
  UPDATE public.deals SET closed_at = now() - interval '12 days' WHERE org_id = v_org_id AND stage = 'WON';
  UPDATE public.deals SET closed_at = now() - interval '25 days' WHERE org_id = v_org_id AND stage = 'LOST';

  -- Fetch deal IDs for activities
  SELECT id INTO d1 FROM public.deals WHERE org_id = v_org_id AND title = 'Harbor Storefront Rebuild';
  SELECT id INTO d2 FROM public.deals WHERE org_id = v_org_id AND title = 'Tom Bradley SaaS MVP';
  SELECT id INTO d3 FROM public.deals WHERE org_id = v_org_id AND title = 'Oak & Stone Property Platform';
  SELECT id INTO d4 FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Booking System';
  SELECT id INTO d5 FROM public.deals WHERE org_id = v_org_id AND title = 'Pulse Patient Dashboard';
  SELECT id INTO d6 FROM public.deals WHERE org_id = v_org_id AND title = 'Vertex Portfolio Tracker';
  SELECT id INTO d7 FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Client Portal v1';
  SELECT id INTO d8 FROM public.deals WHERE org_id = v_org_id AND title = 'Harbor Analytics Dashboard';

  -- ========== ACTIVITIES ==========

  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, content, metadata, created_by, created_at)
  VALUES
    -- Vertex deal activity
    (v_org_id, ct_david, d6, c_vertex, 'DEAL_CREATED', 'Created deal "Vertex Portfolio Tracker"', NULL, '{"value": 120000, "stage": "LEAD"}', v_user_id, now() - interval '18 days'),
    (v_org_id, ct_david, d6, c_vertex, 'MEETING', 'Discovery call with David', 'Discussed portfolio tracking requirements. They need real-time market data integration, LP reporting, and deal flow management. David wants mobile-responsive design.', NULL, v_user_id, now() - interval '16 days'),
    (v_org_id, ct_david, d6, c_vertex, 'DEAL_STAGE_CHANGED', 'Moved "Vertex Portfolio Tracker" from LEAD to QUALIFIED', NULL, '{"from": "LEAD", "to": "QUALIFIED"}', v_user_id, now() - interval '14 days'),
    (v_org_id, ct_david, d6, c_vertex, 'EMAIL', 'Sent proposal document', 'Attached SOW and pricing breakdown. Total $120K across 3 phases. Phase 1: Core dashboard ($55K), Phase 2: Mobile app ($40K), Phase 3: Analytics ($25K).', NULL, v_user_id, now() - interval '10 days'),
    (v_org_id, ct_david, d6, c_vertex, 'DEAL_STAGE_CHANGED', 'Moved "Vertex Portfolio Tracker" from QUALIFIED to PROPOSAL', NULL, '{"from": "QUALIFIED", "to": "PROPOSAL"}', v_user_id, now() - interval '10 days'),
    (v_org_id, ct_david, d6, c_vertex, 'CALL', 'Pricing negotiation call', 'David wants to bundle Phase 1 and 2 for a discount. Offered 10% if they sign this week. He''s taking it to the partners meeting Thursday.', NULL, v_user_id, now() - interval '5 days'),
    (v_org_id, ct_david, d6, c_vertex, 'DEAL_STAGE_CHANGED', 'Moved "Vertex Portfolio Tracker" from PROPOSAL to NEGOTIATION', NULL, '{"from": "PROPOSAL", "to": "NEGOTIATION"}', v_user_id, now() - interval '5 days'),

    -- Pulse deal activity
    (v_org_id, ct_maya, d5, c_pulse, 'DEAL_CREATED', 'Created deal "Pulse Patient Dashboard"', NULL, '{"value": 95000, "stage": "LEAD"}', v_user_id, now() - interval '22 days'),
    (v_org_id, ct_maya, d5, c_pulse, 'MEETING', 'Technical deep-dive with Maya and Marcus', 'Reviewed their existing stack (React + Django). They want to migrate to Next.js. HIPAA compliance is critical. Need BAA in place before starting.', NULL, v_user_id, now() - interval '20 days'),
    (v_org_id, ct_marcus, d5, c_pulse, 'NOTE', 'UX requirements from Marcus', 'Marcus shared Figma mockups of their ideal patient dashboard. Key features: appointment scheduling, medication tracking, provider messaging, and health records viewer.', NULL, v_user_id, now() - interval '15 days'),
    (v_org_id, ct_maya, d5, c_pulse, 'EMAIL', 'Sent architecture proposal', 'Proposed Next.js + Supabase stack with row-level security for HIPAA compliance. Maya wants to review with their security team.', NULL, v_user_id, now() - interval '8 days'),
    (v_org_id, ct_maya, d5, c_pulse, 'DEAL_STAGE_CHANGED', 'Moved "Pulse Patient Dashboard" from QUALIFIED to PROPOSAL', NULL, '{"from": "QUALIFIED", "to": "PROPOSAL"}', v_user_id, now() - interval '8 days'),

    -- Oak & Stone activity
    (v_org_id, ct_james, d3, c_oak, 'DEAL_CREATED', 'Created deal "Oak & Stone Property Platform"', NULL, '{"value": 72000, "stage": "LEAD"}', v_user_id, now() - interval '14 days'),
    (v_org_id, ct_james, d3, c_oak, 'MEETING', 'Intro meeting with James at Austin Tech Week', 'Met at the networking mixer. James is frustrated with their current WordPress site. Wants a modern property listing platform with map search, virtual tours, and agent CRM.', NULL, v_user_id, now() - interval '14 days'),
    (v_org_id, ct_james, d3, c_oak, 'CALL', 'Follow-up call — budget discussion', 'James confirmed $70-80K budget range. Timeline: launch by end of Q2. They have 150+ active listings to migrate.', NULL, v_user_id, now() - interval '9 days'),
    (v_org_id, ct_james, d3, c_oak, 'DEAL_STAGE_CHANGED', 'Moved "Oak & Stone Property Platform" from LEAD to QUALIFIED', NULL, '{"from": "LEAD", "to": "QUALIFIED"}', v_user_id, now() - interval '7 days'),

    -- Meridian booking activity
    (v_org_id, ct_sarah, d4, c_meridian, 'DEAL_CREATED', 'Created deal "Meridian Booking System"', NULL, '{"value": 35000, "stage": "LEAD"}', v_user_id, now() - interval '10 days'),
    (v_org_id, ct_sarah, d4, c_meridian, 'NOTE', 'Sarah''s requirements', 'Needs online booking for studio sessions, equipment rentals, and post-production suites. Integration with Google Calendar and Stripe for payments.', NULL, v_user_id, now() - interval '8 days'),
    (v_org_id, ct_sarah, d4, c_meridian, 'DEAL_STAGE_CHANGED', 'Moved "Meridian Booking System" from LEAD to QUALIFIED', NULL, '{"from": "LEAD", "to": "QUALIFIED"}', v_user_id, now() - interval '6 days'),

    -- Harbor lead activity
    (v_org_id, ct_elena, d1, c_harbor, 'DEAL_CREATED', 'Created deal "Harbor Storefront Rebuild"', NULL, '{"value": 45000, "stage": "LEAD"}', v_user_id, now() - interval '3 days'),
    (v_org_id, ct_elena, d1, c_harbor, 'EMAIL', 'Initial outreach from Elena', 'Elena reached out after the analytics dashboard project didn''t work out with their in-house team. Wants to consolidate 3 Shopify stores into a custom unified storefront.', NULL, v_user_id, now() - interval '3 days'),

    -- Tom lead activity
    (v_org_id, ct_tom, d2, NULL, 'DEAL_CREATED', 'Created deal "Tom Bradley SaaS MVP"', NULL, '{"value": 18000, "stage": "LEAD"}', v_user_id, now() - interval '2 days'),
    (v_org_id, ct_tom, d2, NULL, 'CALL', 'Intro call with Tom', 'Tom has an idea for a freelancer management tool. Very early stage — no designs or specs yet. Suggested a paid discovery engagement to define the MVP.', NULL, v_user_id, now() - interval '2 days'),

    -- Won deal activity
    (v_org_id, ct_rachel, d7, c_meridian, 'DEAL_CREATED', 'Created deal "Meridian Client Portal v1"', NULL, '{"value": 28000, "stage": "LEAD"}', v_user_id, now() - interval '60 days'),
    (v_org_id, ct_rachel, d7, c_meridian, 'DEAL_STAGE_CHANGED', 'Moved "Meridian Client Portal v1" from LEAD to WON', NULL, '{"from": "PROPOSAL", "to": "WON"}', v_user_id, now() - interval '12 days'),
    (v_org_id, ct_rachel, d7, c_meridian, 'NOTE', 'Project wrapped up successfully', 'Delivered on time and under budget. Rachel was thrilled with the result. They''re now referring us for the booking system project with Sarah.', NULL, v_user_id, now() - interval '12 days'),

    -- Contact-level activities (not tied to deals)
    (v_org_id, ct_sarah, NULL, c_meridian, 'CONTACT_CREATED', 'Created contact Sarah Chen', NULL, NULL, v_user_id, now() - interval '65 days'),
    (v_org_id, ct_james, NULL, c_oak, 'CONTACT_CREATED', 'Created contact James Mitchell', NULL, NULL, v_user_id, now() - interval '14 days'),
    (v_org_id, ct_maya, NULL, c_pulse, 'CONTACT_CREATED', 'Created contact Maya Rodriguez', NULL, NULL, v_user_id, now() - interval '22 days'),
    (v_org_id, ct_david, NULL, c_vertex, 'CONTACT_CREATED', 'Created contact David Park', NULL, NULL, v_user_id, now() - interval '18 days'),
    (v_org_id, ct_elena, NULL, c_harbor, 'CONTACT_CREATED', 'Created contact Elena Vasquez', NULL, NULL, v_user_id, now() - interval '4 days'),

    -- Company-level activities
    (v_org_id, NULL, NULL, c_meridian, 'COMPANY_CREATED', 'Created company Meridian Studios', NULL, NULL, v_user_id, now() - interval '65 days'),
    (v_org_id, NULL, NULL, c_oak, 'COMPANY_CREATED', 'Created company Oak & Stone Properties', NULL, NULL, v_user_id, now() - interval '14 days'),
    (v_org_id, NULL, NULL, c_pulse, 'COMPANY_CREATED', 'Created company Pulse Health', NULL, NULL, v_user_id, now() - interval '22 days'),
    (v_org_id, NULL, NULL, c_vertex, 'COMPANY_CREATED', 'Created company Vertex Capital', NULL, NULL, v_user_id, now() - interval '18 days'),
    (v_org_id, NULL, NULL, c_harbor, 'COMPANY_CREATED', 'Created company Harbor Collective', NULL, NULL, v_user_id, now() - interval '4 days');

  RAISE NOTICE 'Seed complete: 5 companies, 8 contacts, 8 deals, 34 activities';
END $$;
