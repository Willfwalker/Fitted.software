# Supabase SQL Scripts

All scripts are run manually in the **Supabase SQL Editor**.
Files are numbered (`001_`, `002_`, …) to indicate execution order within each folder.

## Folder Structure

```
supabase/
├── schemas/       # Table & enum definitions (run once, in order)
│   ├── 001_base.sql                 # Core tables: orgs, members, projects, time
│   ├── 002_crm.sql                  # CRM: companies, contacts, deals, activities
│   ├── 003_invoicing_tags.sql       # Invoices, line items, tags
│   └── 004_pdf_email_recurring.sql  # Share tokens, recurring invoices
│
├── migrations/    # ALTER TABLE / additive changes to existing tables
│   └── 001_invoice_enhancements.sql # Add discount, currency, payment terms cols
│
├── fixes/         # Hotfixes & policy patches
│   ├── 001_rls_recursion.sql        # Initial RLS infinite-recursion fix
│   └── 002_rls_recursion_v2.sql     # Comprehensive RLS fix (supersedes 001)
│
├── seeds/         # Demo / test data
│   └── 001_crm_demo_data.sql        # Sample companies, contacts, deals
│
├── config.toml    # Supabase CLI config
└── README.md      # ← You are here
```

## When to use each folder

| Folder         | Use when…                                                    |
|----------------|--------------------------------------------------------------|
| `schemas/`     | Creating new tables, enums, triggers, or functions           |
| `migrations/`  | Adding columns, changing defaults, or altering existing tables |
| `fixes/`       | Patching RLS policies, fixing bugs in DB logic               |
| `seeds/`       | Adding demo data or test fixtures                            |

## Naming convention

```
NNN_short_description.sql
```

- `NNN` = three-digit sequence number (e.g. `001`, `002`)
- Use underscores, lowercase, keep it short
- The number sets execution order **within** its folder
