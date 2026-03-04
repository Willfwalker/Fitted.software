-- ============================================
-- Tasks Seed Data for Fitted Software
-- Run AFTER 005_tasks.sql schema + 001_crm_demo_data.sql
-- ============================================

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  -- Boards
  b_website uuid;
  b_operations uuid;
  -- Columns (Website Redesign)
  col_todo uuid;
  col_progress uuid;
  col_review uuid;
  col_done uuid;
  -- Columns (Operations)
  col_ops_todo uuid;
  col_ops_progress uuid;
  col_ops_review uuid;
  col_ops_done uuid;
  -- Labels
  lbl_design uuid;
  lbl_dev uuid;
  lbl_content uuid;
  lbl_bug uuid;
  lbl_urgent uuid;
  lbl_ops uuid;
  -- CRM references
  c_meridian uuid;
  c_pulse uuid;
  ct_sarah uuid;
  ct_maya uuid;
  d_pulse uuid;
  d_meridian uuid;
  -- Tasks
  t1 uuid; t2 uuid; t3 uuid; t4 uuid; t5 uuid; t6 uuid; t7 uuid; t8 uuid;
  t9 uuid; t10 uuid; t11 uuid; t12 uuid; t13 uuid; t14 uuid;
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
  SELECT id INTO ct_sarah FROM public.contacts WHERE org_id = v_org_id AND email = 'sarah@meridianstudios.com';
  SELECT id INTO ct_maya FROM public.contacts WHERE org_id = v_org_id AND email = 'maya@pulsehealth.io';
  SELECT id INTO d_pulse FROM public.deals WHERE org_id = v_org_id AND title = 'Pulse Patient Dashboard';
  SELECT id INTO d_meridian FROM public.deals WHERE org_id = v_org_id AND title = 'Meridian Booking System';

  -- ========== LABELS ==========

  INSERT INTO public.labels (id, org_id, name, color) VALUES
    (gen_random_uuid(), v_org_id, 'Design', '#A478E8'),
    (gen_random_uuid(), v_org_id, 'Development', '#5B8DEF'),
    (gen_random_uuid(), v_org_id, 'Content', '#5EC69A'),
    (gen_random_uuid(), v_org_id, 'Bug', '#EF5B5B'),
    (gen_random_uuid(), v_org_id, 'Urgent', '#E8A84C'),
    (gen_random_uuid(), v_org_id, 'Operations', '#8A817A');

  SELECT id INTO lbl_design FROM public.labels WHERE org_id = v_org_id AND name = 'Design';
  SELECT id INTO lbl_dev FROM public.labels WHERE org_id = v_org_id AND name = 'Development';
  SELECT id INTO lbl_content FROM public.labels WHERE org_id = v_org_id AND name = 'Content';
  SELECT id INTO lbl_bug FROM public.labels WHERE org_id = v_org_id AND name = 'Bug';
  SELECT id INTO lbl_urgent FROM public.labels WHERE org_id = v_org_id AND name = 'Urgent';
  SELECT id INTO lbl_ops FROM public.labels WHERE org_id = v_org_id AND name = 'Operations';

  -- ========== BOARD 1: Website Redesign ==========

  INSERT INTO public.boards (id, org_id, name, description, created_by)
  VALUES (gen_random_uuid(), v_org_id, 'Pulse Patient Dashboard', 'Sprint board for the Pulse Health patient dashboard build. $95K project, targeting Q2 launch.', v_user_id);

  SELECT id INTO b_website FROM public.boards WHERE org_id = v_org_id AND name = 'Pulse Patient Dashboard';

  INSERT INTO public.board_columns (id, board_id, name, position, color, wip_limit) VALUES
    (gen_random_uuid(), b_website, 'To Do', 0, '#8A817A', NULL),
    (gen_random_uuid(), b_website, 'In Progress', 1, '#5B8DEF', 4),
    (gen_random_uuid(), b_website, 'In Review', 2, '#E8A84C', 3),
    (gen_random_uuid(), b_website, 'Done', 3, '#5EC69A', NULL);

  SELECT id INTO col_todo FROM public.board_columns WHERE board_id = b_website AND name = 'To Do';
  SELECT id INTO col_progress FROM public.board_columns WHERE board_id = b_website AND name = 'In Progress';
  SELECT id INTO col_review FROM public.board_columns WHERE board_id = b_website AND name = 'In Review';
  SELECT id INTO col_done FROM public.board_columns WHERE board_id = b_website AND name = 'Done';

  -- Tasks for Board 1
  INSERT INTO public.tasks (id, org_id, board_id, column_id, title, description, priority, status, due_date, assigned_to, contact_id, company_id, deal_id, position, created_by, created_at) VALUES
    -- To Do
    (gen_random_uuid(), v_org_id, b_website, col_todo, 'Build medication tracking module', 'Implement the medication list, dosage reminders, and refill request flow. Need to integrate with pharmacy API.', 'HIGH', 'TODO', current_date + interval '10 days', v_user_id, ct_maya, c_pulse, d_pulse, 0, v_user_id, now() - interval '5 days'),
    (gen_random_uuid(), v_org_id, b_website, col_todo, 'Design provider messaging UI', 'Create secure messaging interface between patients and providers. Must be HIPAA compliant. Reference Marcus''s Figma mockups.', 'MEDIUM', 'TODO', current_date + interval '14 days', v_user_id, ct_maya, c_pulse, d_pulse, 1, v_user_id, now() - interval '4 days'),
    (gen_random_uuid(), v_org_id, b_website, col_todo, 'Set up HIPAA-compliant file storage', 'Configure Supabase Storage with encryption at rest for patient documents. Need BAA signed before implementation.', 'HIGH', 'TODO', current_date + interval '7 days', v_user_id, ct_maya, c_pulse, d_pulse, 2, v_user_id, now() - interval '3 days'),
    (gen_random_uuid(), v_org_id, b_website, col_todo, 'Write API documentation', 'Document all patient dashboard API endpoints for Maya''s team. Include auth flows and webhook payloads.', 'LOW', 'TODO', current_date + interval '21 days', v_user_id, ct_maya, c_pulse, d_pulse, 3, v_user_id, now() - interval '2 days'),

    -- In Progress
    (gen_random_uuid(), v_org_id, b_website, col_progress, 'Build appointment scheduling flow', 'Full appointment booking: calendar view, provider availability, confirmation emails, and reminder notifications.', 'HIGH', 'IN_PROGRESS', current_date + interval '5 days', v_user_id, ct_maya, c_pulse, d_pulse, 0, v_user_id, now() - interval '6 days'),
    (gen_random_uuid(), v_org_id, b_website, col_progress, 'Implement patient auth + onboarding', 'Supabase Auth with email magic links. Multi-step onboarding: personal info, insurance details, provider selection.', 'URGENT', 'IN_PROGRESS', current_date + interval '3 days', v_user_id, ct_maya, c_pulse, d_pulse, 1, v_user_id, now() - interval '8 days'),

    -- In Review
    (gen_random_uuid(), v_org_id, b_website, col_review, 'Health records viewer component', 'Read-only viewer for patient health records with PDF export. Maya reviewing the data model.', 'MEDIUM', 'IN_REVIEW', current_date + interval '2 days', v_user_id, ct_maya, c_pulse, d_pulse, 0, v_user_id, now() - interval '10 days'),

    -- Done
    (gen_random_uuid(), v_org_id, b_website, col_done, 'Set up project repo + CI/CD', 'Next.js 16 + Supabase + Vercel. GitHub Actions for linting and type checking.', 'MEDIUM', 'DONE', current_date - interval '5 days', v_user_id, ct_maya, c_pulse, d_pulse, 0, v_user_id, now() - interval '14 days'),
    (gen_random_uuid(), v_org_id, b_website, col_done, 'Database schema design', 'Designed patients, appointments, providers, medications, and health_records tables. Maya approved the ERD.', 'HIGH', 'DONE', current_date - interval '3 days', v_user_id, ct_maya, c_pulse, d_pulse, 1, v_user_id, now() - interval '12 days'),
    (gen_random_uuid(), v_org_id, b_website, col_done, 'Design system setup', 'Tailwind config with Pulse Health brand colors. Component library with shadcn/ui. Dark mode support.', 'MEDIUM', 'DONE', current_date - interval '2 days', v_user_id, NULL, c_pulse, d_pulse, 2, v_user_id, now() - interval '11 days');

  -- Fetch task IDs for labels
  SELECT id INTO t1 FROM public.tasks WHERE org_id = v_org_id AND title = 'Build medication tracking module';
  SELECT id INTO t2 FROM public.tasks WHERE org_id = v_org_id AND title = 'Design provider messaging UI';
  SELECT id INTO t3 FROM public.tasks WHERE org_id = v_org_id AND title = 'Set up HIPAA-compliant file storage';
  SELECT id INTO t4 FROM public.tasks WHERE org_id = v_org_id AND title = 'Write API documentation';
  SELECT id INTO t5 FROM public.tasks WHERE org_id = v_org_id AND title = 'Build appointment scheduling flow';
  SELECT id INTO t6 FROM public.tasks WHERE org_id = v_org_id AND title = 'Implement patient auth + onboarding';
  SELECT id INTO t7 FROM public.tasks WHERE org_id = v_org_id AND title = 'Health records viewer component';
  SELECT id INTO t8 FROM public.tasks WHERE org_id = v_org_id AND title = 'Set up project repo + CI/CD';
  SELECT id INTO t9 FROM public.tasks WHERE org_id = v_org_id AND title = 'Database schema design';
  SELECT id INTO t10 FROM public.tasks WHERE org_id = v_org_id AND title = 'Design system setup';

  -- ========== BOARD 2: Meridian Booking System ==========

  INSERT INTO public.boards (id, org_id, name, description, created_by)
  VALUES (gen_random_uuid(), v_org_id, 'Meridian Booking System', 'Planning board for Meridian Studios booking platform. Discovery + design phase.', v_user_id);

  SELECT id INTO b_operations FROM public.boards WHERE org_id = v_org_id AND name = 'Meridian Booking System';

  INSERT INTO public.board_columns (id, board_id, name, position, color) VALUES
    (gen_random_uuid(), b_operations, 'To Do', 0, '#8A817A'),
    (gen_random_uuid(), b_operations, 'In Progress', 1, '#5B8DEF'),
    (gen_random_uuid(), b_operations, 'In Review', 2, '#E8A84C'),
    (gen_random_uuid(), b_operations, 'Done', 3, '#5EC69A');

  SELECT id INTO col_ops_todo FROM public.board_columns WHERE board_id = b_operations AND name = 'To Do';
  SELECT id INTO col_ops_progress FROM public.board_columns WHERE board_id = b_operations AND name = 'In Progress';
  SELECT id INTO col_ops_review FROM public.board_columns WHERE board_id = b_operations AND name = 'In Review';
  SELECT id INTO col_ops_done FROM public.board_columns WHERE board_id = b_operations AND name = 'Done';

  INSERT INTO public.tasks (id, org_id, board_id, column_id, title, description, priority, status, due_date, assigned_to, contact_id, company_id, deal_id, position, created_by, created_at) VALUES
    -- To Do
    (gen_random_uuid(), v_org_id, b_operations, col_ops_todo, 'Stripe integration for payments', 'Set up Stripe Connect for studio session payments. Need to support deposits and full payments.', 'HIGH', 'TODO', current_date + interval '18 days', v_user_id, ct_sarah, c_meridian, d_meridian, 0, v_user_id, now() - interval '3 days'),
    (gen_random_uuid(), v_org_id, b_operations, col_ops_todo, 'Build equipment rental flow', 'Catalog of rentable equipment with availability calendar. Linked to studio bookings.', 'MEDIUM', 'TODO', current_date + interval '25 days', v_user_id, ct_sarah, c_meridian, d_meridian, 1, v_user_id, now() - interval '2 days'),

    -- In Progress
    (gen_random_uuid(), v_org_id, b_operations, col_ops_progress, 'Google Calendar sync', 'Two-way sync between booking system and Sarah''s team Google Calendars. Use Google Calendar API.', 'HIGH', 'IN_PROGRESS', current_date + interval '8 days', v_user_id, ct_sarah, c_meridian, d_meridian, 0, v_user_id, now() - interval '4 days'),

    -- Done
    (gen_random_uuid(), v_org_id, b_operations, col_ops_done, 'Discovery session with Sarah', 'Mapped out all booking types: studio sessions (half/full day), equipment rentals, post-production suites. Sarah provided rate cards.', 'MEDIUM', 'DONE', current_date - interval '4 days', v_user_id, ct_sarah, c_meridian, d_meridian, 0, v_user_id, now() - interval '6 days');

  SELECT id INTO t11 FROM public.tasks WHERE org_id = v_org_id AND title = 'Stripe integration for payments';
  SELECT id INTO t12 FROM public.tasks WHERE org_id = v_org_id AND title = 'Build equipment rental flow';
  SELECT id INTO t13 FROM public.tasks WHERE org_id = v_org_id AND title = 'Google Calendar sync';
  SELECT id INTO t14 FROM public.tasks WHERE org_id = v_org_id AND title = 'Discovery session with Sarah';

  -- ========== TASK LABELS ==========

  INSERT INTO public.task_labels (task_id, label_id) VALUES
    -- Pulse board
    (t1, lbl_dev),
    (t2, lbl_design),
    (t3, lbl_dev),
    (t3, lbl_urgent),
    (t4, lbl_content),
    (t5, lbl_dev),
    (t5, lbl_design),
    (t6, lbl_dev),
    (t6, lbl_urgent),
    (t7, lbl_dev),
    (t8, lbl_dev),
    (t9, lbl_dev),
    (t10, lbl_design),
    -- Meridian board
    (t11, lbl_dev),
    (t12, lbl_dev),
    (t13, lbl_dev),
    (t14, lbl_ops);

  -- ========== TASK ACTIVITIES ==========

  INSERT INTO public.activities (org_id, contact_id, deal_id, company_id, type, title, metadata, created_by, created_at) VALUES
    (v_org_id, ct_maya, d_pulse, c_pulse, 'TASK_CREATED', 'Created task "Build appointment scheduling flow"', jsonb_build_object('task_id', t5, 'board_id', b_website), v_user_id, now() - interval '6 days'),
    (v_org_id, ct_maya, d_pulse, c_pulse, 'TASK_CREATED', 'Created task "Implement patient auth + onboarding"', jsonb_build_object('task_id', t6, 'board_id', b_website), v_user_id, now() - interval '8 days'),
    (v_org_id, ct_maya, d_pulse, c_pulse, 'TASK_STATUS_CHANGED', 'Moved "Health records viewer component" from In Progress to In Review', jsonb_build_object('task_id', t7), v_user_id, now() - interval '2 days'),
    (v_org_id, ct_maya, d_pulse, c_pulse, 'TASK_STATUS_CHANGED', 'Moved "Set up project repo + CI/CD" from In Progress to Done', jsonb_build_object('task_id', t8), v_user_id, now() - interval '5 days'),
    (v_org_id, ct_sarah, d_meridian, c_meridian, 'TASK_CREATED', 'Created task "Google Calendar sync"', jsonb_build_object('task_id', t13, 'board_id', b_operations), v_user_id, now() - interval '4 days');

  RAISE NOTICE 'Tasks seed complete: 2 boards, 8 columns, 14 tasks, 6 labels, 17 label assignments, 5 task activities';
END $$;
