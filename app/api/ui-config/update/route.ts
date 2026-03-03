import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "@/lib/actions/helpers"
import type { UiConfig, EntityType } from "@/lib/types/ui-config"

const SECTION_CONTEXT: Record<string, string> = {
  contacts: `Section: Contacts
Built-in fields: first_name, last_name, email, phone, company_id, title, source, notes, metadata
Built-in sorts: recent (created_at desc), name (first_name asc), company (company_id asc)
Built-in columns: Name, Email, Phone, Company, Title
You can add: custom fields, filters, columns, sorts`,

  companies: `Section: Companies
Built-in fields: name, domain, industry, email, phone, website, address, notes, metadata
Built-in sorts: recent (created_at desc), name (name asc)
Built-in columns: Name, Domain, Industry, Email, Phone
You can add: custom fields, filters, columns, sorts`,

  deals: `Section: Deals (Kanban pipeline)
Built-in fields: title, value, currency, stage, priority, expected_close, contact_id, company_id, notes, metadata
Built-in filters: priority (ALL/HIGH/MEDIUM/LOW)
No table columns (kanban view). No sorts (ordered by position).
You can add: custom fields, filters`,

  invoices: `Section: Invoices
Built-in fields: invoice_number, status, contact_id, company_id, deal_id, subtotal, tax_rate, total, due_date, notes, metadata
Built-in filters: status tabs (ALL/DRAFT/SENT/PAID/OVERDUE/CANCELLED)
Built-in columns: Invoice#, Status, Client, Amount, Due Date, Created
No built-in sort dropdown.
You can add: filters, columns, sorts`,

  reports: `Section: Reports — COMING SOON. Acknowledge the user's request and let them know this section will be customizable in a future update. Do not add any config.`,

  dashboard: `Section: Dashboard — COMING SOON. Acknowledge the user's request and let them know this section will be customizable in a future update. Do not add any config.`,
}

const SYSTEM_PROMPT = `You are a UI configuration assistant for a business management platform. You modify JSON configs that define custom fields, filters, table columns, and sort options.

You will be told which section the user is customizing. Return a JSON object with these keys:
- "fields": array of custom field definitions (for forms)
- "filters": array of filter definitions (for list/table filtering)
- "columns": array of column definitions (for table display)
- "sorts": array of sort option definitions (for sort dropdowns)
- "message": a single short sentence confirming what you did

All arrays are optional — only include the ones you're modifying. Always preserve existing items in arrays you're modifying unless explicitly asked to remove them. Return unchanged arrays as-is.

## Schema for each type:

### Fields (max 20)
{"key": "snake_case_key", "label": "Human Label", "type": "text|email|phone|number|date|select|textarea|url|checkbox", "required": boolean, "placeholder": "optional"}
For select fields: include "options": [{"label": "Display", "value": "stored_value"}]
Do NOT use keys that conflict with built-in fields for that section.

### Filters (max 10)
{"key": "snake_case_key", "label": "Human Label", "type": "select|text|date-range|boolean", "column": "db_column_or_metadata->>field_key"}
For select filters: include "options": [{"label": "Display", "value": "stored_value"}]
- "column": use the actual DB column name (e.g. "industry") or "metadata->>custom_key" for metadata/custom fields
- "key" is used as the URL param name (prefixed filter_ at runtime)
- IMPORTANT: When the user asks to "filter by X" without specifying options, use type "text" — this renders a search input that does case-insensitive partial matching (e.g. "filter by title" → type "text"). Only use type "select" when the user provides specific option values or the field has a known finite set of values.
- "text" filters render as a small search input in the toolbar and match via ILIKE %value% — great for alphabetical/freeform filtering on text columns like title, name, notes, etc.

### Columns (max 10)
{"key": "snake_case_key", "label": "Header Label", "source": "field|metadata", "column": "db_column_or_metadata_key", "visible": true}
- "source": "field" for direct DB columns, "metadata" for custom fields stored in metadata JSONB
- "column": the DB column name or the metadata key (without metadata->> prefix for metadata source)

### Sorts (max 10)
{"key": "snake_case_key", "label": "Display Label", "column": "db_column_or_metadata->>field_key", "ascending": boolean, "castType": "text|number|date"}
- "castType": set to "number" for numeric metadata fields, "date" for date metadata fields, "text" (default) otherwise. Only matters for metadata->> columns.

## Rules:
- Use snake_case for all keys
- Preserve existing config items unless asked to remove/modify them
- Return ONLY the JSON object, no markdown, no code fences, no explanation outside "message"`

const VALID_FIELD_TYPES = new Set([
  "text", "email", "phone", "number", "date", "select", "textarea", "url", "checkbox",
])
const VALID_FILTER_TYPES = new Set(["select", "text", "date-range", "boolean"])
const VALID_COLUMN_SOURCES = new Set(["field", "metadata"])
const VALID_CAST_TYPES = new Set(["text", "number", "date"])

function validateConfig(config: unknown): config is UiConfig {
  if (!config || typeof config !== "object") return false
  const c = config as Record<string, unknown>

  // Fields validation
  if (c.fields !== undefined) {
    if (!Array.isArray(c.fields)) return false
    if (c.fields.length > 20) return false
    for (const field of c.fields) {
      if (!field.key || typeof field.key !== "string") return false
      if (!field.label || typeof field.label !== "string") return false
      if (!field.type || !VALID_FIELD_TYPES.has(field.type)) return false
      if (field.type === "select" && !Array.isArray(field.options)) return false
    }
  }

  // Filters validation
  if (c.filters !== undefined) {
    if (!Array.isArray(c.filters)) return false
    if (c.filters.length > 10) return false
    for (const filter of c.filters) {
      if (!filter.key || typeof filter.key !== "string") return false
      if (!filter.label || typeof filter.label !== "string") return false
      if (!filter.type || !VALID_FILTER_TYPES.has(filter.type)) return false
      if (!filter.column || typeof filter.column !== "string") return false
      if (filter.type === "select" && !Array.isArray(filter.options)) return false
    }
  }

  // Columns validation
  if (c.columns !== undefined) {
    if (!Array.isArray(c.columns)) return false
    if (c.columns.length > 10) return false
    for (const col of c.columns) {
      if (!col.key || typeof col.key !== "string") return false
      if (!col.label || typeof col.label !== "string") return false
      if (!col.source || !VALID_COLUMN_SOURCES.has(col.source)) return false
      if (!col.column || typeof col.column !== "string") return false
      if (typeof col.visible !== "boolean") return false
    }
  }

  // Sorts validation
  if (c.sorts !== undefined) {
    if (!Array.isArray(c.sorts)) return false
    if (c.sorts.length > 10) return false
    for (const sort of c.sorts) {
      if (!sort.key || typeof sort.key !== "string") return false
      if (!sort.label || typeof sort.label !== "string") return false
      if (!sort.column || typeof sort.column !== "string") return false
      if (typeof sort.ascending !== "boolean") return false
      if (sort.castType && !VALID_CAST_TYPES.has(sort.castType)) return false
    }
  }

  return true
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const ctx = await getOrgId()
    if (!ctx) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    const { orgId } = ctx

    // Check user is OWNER or ADMIN
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single()

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { entityType, userRequest, currentConfig } = await request.json() as {
      entityType: EntityType
      userRequest: string
      currentConfig: UiConfig
    }

    if (!entityType || !userRequest) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sectionContext = SECTION_CONTEXT[entityType] || ""

    const anthropic = new Anthropic()

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${sectionContext}\n\nCurrent config for ${entityType}:\n${JSON.stringify(currentConfig, null, 2)}\n\nUser request: ${userRequest}`,
        },
      ],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    const confirmMessage = parsed.message || "Done."

    // Build the new config by merging: keep existing arrays, override with AI response
    const newConfig: UiConfig = {
      fields: parsed.fields ?? currentConfig.fields ?? [],
      ...(parsed.filters !== undefined ? { filters: parsed.filters } : currentConfig.filters ? { filters: currentConfig.filters } : {}),
      ...(parsed.columns !== undefined ? { columns: parsed.columns } : currentConfig.columns ? { columns: currentConfig.columns } : {}),
      ...(parsed.sorts !== undefined ? { sorts: parsed.sorts } : currentConfig.sorts ? { sorts: currentConfig.sorts } : {}),
    }

    if (!validateConfig(newConfig)) {
      return NextResponse.json({ error: "AI returned invalid config" }, { status: 500 })
    }

    // For coming-soon sections, don't save config, just return the message
    if (entityType === "reports" || entityType === "dashboard") {
      return NextResponse.json({ config: currentConfig, message: confirmMessage })
    }

    // Upsert to database
    const { error } = await supabase.from("ui_configs").upsert(
      {
        org_id: orgId,
        entity_type: entityType,
        config: newConfig,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,entity_type" }
    )

    if (error) {
      return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
    }

    return NextResponse.json({ config: newConfig, message: confirmMessage })
  } catch (err) {
    console.error("UI config update error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
