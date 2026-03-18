import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"

const SYSTEM_PROMPT = `You are an automation configuration generator for a CRM/project management SaaS.

Given a natural language description of an automation, you must return a valid JSON object with these exact fields:

{
  "name": "short descriptive name",
  "description": "what this automation does",
  "trigger_type": "one of the valid trigger types",
  "trigger_config": { ... filter conditions ... },
  "action_type": "one of the valid action types",
  "action_config": { ... action parameters ... }
}

VALID TRIGGER TYPES:
- DEAL_STAGE_CHANGED — fires when a deal moves stages. trigger_config can have: { "to_stage": "WON"|"LOST"|"LEAD"|"QUALIFIED"|"PROPOSAL"|"NEGOTIATION", "from_stage": "..." }
- TASK_STATUS_CHANGED — fires when a task moves columns. trigger_config can have: { "to_column_name": "Done"|"In Progress"|etc }
- INVOICE_STATUS_CHANGED — fires when invoice status changes. trigger_config can have: { "to_status": "PAID"|"SENT"|"OVERDUE"|"CANCELLED" }
- FORM_SUBMITTED — fires on form submission. trigger_config can have: { "form_id": "uuid" }
- TIME_LOGGED — fires when time is logged. trigger_config can have: { "billable": true|false }
- PAYMENT_RECEIVED — fires when Stripe payment completes. trigger_config: {}
- EMAIL_RECEIVED — fires when inbound email arrives. trigger_config: {}

VALID ACTION TYPES:
- CREATE_TASK — creates a task. action_config: { "title": "...", "board_id": "uuid", "column_id": "uuid", "description": "...", "priority": "LOW"|"MEDIUM"|"HIGH", "assigned_to": "uuid" }
- SEND_EMAIL — sends an email. action_config: { "recipient_email": "...", "subject": "...", "body": "..." }
- SEND_NOTIFICATION — sends in-app notification. action_config: { "title": "...", "body": "...", "link": "/path" }
- UPDATE_DEAL_STAGE — moves a deal. action_config: { "stage": "WON"|"LOST"|etc }
- CREATE_EVENT — creates calendar event. action_config: { "title": "...", "description": "...", "start_offset_hours": 24 }
- CREATE_INVOICE — creates draft invoice. action_config: { "item_description": "...", "quantity": 1, "rate": 100 }

TEMPLATE VARIABLES: In action_config string values, you can use {{variable}} placeholders that get replaced with trigger data at runtime:
- {{deal_title}}, {{deal_id}} — available for deal triggers
- {{task_title}}, {{task_id}}, {{to_column_name}} — available for task triggers
- {{invoice_number}}, {{invoice_id}} — available for invoice triggers
- {{contact_id}}, {{company_id}} — available for most triggers
- {{email}}, {{subject}} — available for email triggers

RULES:
- Return ONLY the JSON object, no markdown, no explanation
- Use sensible defaults for fields the user doesn't specify
- For board_id/column_id/form_id, use placeholder "REPLACE_ME" and note it in the description
- If the request is unclear or impossible, return: { "error": "explanation" }
- Keep names concise (under 60 chars)
- Keep descriptions under 200 chars`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)

  const orgId = memberships?.[0]?.org_id
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 })

  const { prompt } = await request.json()
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 500 })
  }

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""

    // Parse the JSON response
    let config: Record<string, unknown>
    try {
      // Strip any markdown code fences if present
      const cleaned = text.replace(/^```json?\n?/m, "").replace(/\n?```$/m, "").trim()
      config = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw: text }, { status: 422 })
    }

    // Check for AI-reported errors
    if (config.error) {
      return NextResponse.json({ error: config.error as string }, { status: 422 })
    }

    // Create the automation
    const { data: automation, error: insertError } = await supabase
      .from("automations")
      .insert({
        org_id: orgId,
        name: config.name as string,
        description: config.description as string || null,
        trigger_type: config.trigger_type as string,
        trigger_config: config.trigger_config || {},
        action_type: config.action_type as string,
        action_config: config.action_config || {},
        enabled: true,
        created_by: user.id,
      })
      .select("id, name, trigger_type, action_type, description")
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      automation,
      config,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
