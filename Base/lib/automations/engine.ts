"use server"

import { createClient } from "@/lib/supabase/server"
import { renderTemplate } from "@/lib/types/messaging"
import type { TriggerType, ActionType, Automation } from "@/lib/types/automations"

/**
 * Core automation runner.
 * Called from various action handlers when events occur.
 * Fetches matching enabled automations and executes their actions.
 */
export async function runAutomations(
  orgId: string,
  userId: string,
  triggerType: TriggerType,
  triggerData: Record<string, unknown>
) {
  const supabase = await createClient()

  // Fetch enabled automations matching this trigger
  const { data: automations, error } = await supabase
    .from("automations")
    .select("*")
    .eq("org_id", orgId)
    .eq("trigger_type", triggerType)
    .eq("enabled", true)

  if (error || !automations || automations.length === 0) return

  for (const automation of automations as Automation[]) {
    try {
      // Check trigger_config conditions
      if (!matchesTriggerConfig(automation, triggerData)) continue

      // Execute the action
      const result = await executeAction(
        supabase,
        orgId,
        userId,
        automation.action_type as ActionType,
        automation.action_config,
        triggerData
      )

      // Log success
      await supabase.from("automation_logs").insert({
        automation_id: automation.id,
        org_id: orgId,
        trigger_data: triggerData,
        action_result: result,
        status: "SUCCESS",
      })

      // Update run stats
      await supabase
        .from("automations")
        .update({
          last_run_at: new Date().toISOString(),
          run_count: automation.run_count + 1,
        })
        .eq("id", automation.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"

      // Log failure
      await supabase.from("automation_logs").insert({
        automation_id: automation.id,
        org_id: orgId,
        trigger_data: triggerData,
        status: "FAILED",
        error_message: errorMessage,
      })
    }
  }
}

/**
 * Check if trigger data matches the automation's trigger_config filters.
 * For example, DEAL_STAGE_CHANGED with trigger_config { to_stage: "WON" }
 * only fires when the deal moves to WON.
 */
function matchesTriggerConfig(
  automation: Automation,
  triggerData: Record<string, unknown>
): boolean {
  const config = automation.trigger_config
  if (!config || Object.keys(config).length === 0) return true

  // Stage-based triggers
  if (config.to_stage && triggerData.to !== config.to_stage) return false
  if (config.from_stage && triggerData.from !== config.from_stage) return false

  // Status-based triggers
  if (config.to_status && triggerData.to !== config.to_status) return false

  // Form-specific trigger
  if (config.form_id && triggerData.form_id !== config.form_id) return false

  // Billable filter for time logging
  if (config.billable !== undefined && triggerData.billable !== config.billable) return false

  return true
}

/**
 * Execute an action based on the action_type.
 * Uses template variable substitution from trigger data.
 */
async function executeAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  actionType: ActionType,
  actionConfig: Record<string, unknown>,
  triggerData: Record<string, unknown>
): Promise<Record<string, unknown>> {
  // Build template values from trigger data (flatten for substitution)
  const templateValues: Record<string, string> = {}
  for (const [key, value] of Object.entries(triggerData)) {
    if (typeof value === "string" || typeof value === "number") {
      templateValues[key] = String(value)
    }
  }

  switch (actionType) {
    case "CREATE_TASK": {
      const title = renderTemplate(
        (actionConfig.title as string) || "Auto-created task",
        templateValues
      )
      const boardId = actionConfig.board_id as string
      const columnId = actionConfig.column_id as string

      if (!boardId || !columnId) return { error: "board_id and column_id required" }

      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("column_id", columnId)

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          org_id: orgId,
          board_id: boardId,
          column_id: columnId,
          title,
          description: actionConfig.description
            ? renderTemplate(actionConfig.description as string, templateValues)
            : null,
          priority: actionConfig.priority || "MEDIUM",
          status: "TODO",
          position: count ?? 0,
          assigned_to: (actionConfig.assigned_to as string) || null,
          contact_id: (triggerData.contact_id as string) || null,
          company_id: (triggerData.company_id as string) || null,
          deal_id: (triggerData.deal_id as string) || null,
          created_by: userId,
        })
        .select("id")
        .single()

      if (error) throw new Error(error.message)
      return { task_id: data.id }
    }

    case "SEND_EMAIL": {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)

      const recipientEmail = renderTemplate(
        (actionConfig.recipient_email as string) || (triggerData.email as string) || "",
        templateValues
      )
      const subject = renderTemplate(
        (actionConfig.subject as string) || "Notification",
        templateValues
      )
      const body = renderTemplate(
        (actionConfig.body as string) || "",
        templateValues
      )

      if (!recipientEmail) return { error: "No recipient email" }

      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single()

      const orgName = org?.name ?? "Company"
      const resendDomain = process.env.RESEND_DOMAIN || "resend.dev"

      const { error } = await resend.emails.send({
        from: `${orgName} <automations@${resendDomain}>`,
        to: recipientEmail,
        subject,
        html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      })

      if (error) throw new Error(error.message)
      return { sent_to: recipientEmail }
    }

    case "SEND_NOTIFICATION": {
      const title = renderTemplate(
        (actionConfig.title as string) || "Automation notification",
        templateValues
      )
      const body = actionConfig.body
        ? renderTemplate(actionConfig.body as string, templateValues)
        : undefined

      await supabase.from("notifications").insert({
        org_id: orgId,
        user_id: userId,
        title,
        body: body || null,
        link: (actionConfig.link as string) || null,
        icon: (actionConfig.icon as string) || "Zap",
        source_type: "automation",
      })

      return { notified: true }
    }

    case "UPDATE_DEAL_STAGE": {
      const dealId = (triggerData.deal_id as string) || (actionConfig.deal_id as string)
      const newStage = actionConfig.stage as string

      if (!dealId || !newStage) return { error: "deal_id and stage required" }

      const { error } = await supabase
        .from("deals")
        .update({ stage: newStage })
        .eq("id", dealId)
        .eq("org_id", orgId)

      if (error) throw new Error(error.message)
      return { deal_id: dealId, new_stage: newStage }
    }

    case "CREATE_EVENT": {
      const title = renderTemplate(
        (actionConfig.title as string) || "Auto-created event",
        templateValues
      )

      const startAt = actionConfig.start_offset_hours
        ? new Date(Date.now() + Number(actionConfig.start_offset_hours) * 3600000).toISOString()
        : new Date().toISOString()

      const { data, error } = await supabase
        .from("calendar_events")
        .insert({
          org_id: orgId,
          title,
          description: actionConfig.description
            ? renderTemplate(actionConfig.description as string, templateValues)
            : null,
          start_at: startAt,
          status: "SCHEDULED",
          contact_id: (triggerData.contact_id as string) || null,
          company_id: (triggerData.company_id as string) || null,
          deal_id: (triggerData.deal_id as string) || null,
          assigned_to: (actionConfig.assigned_to as string) || userId,
          created_by: userId,
        })
        .select("id")
        .single()

      if (error) throw new Error(error.message)
      return { event_id: data.id }
    }

    case "CREATE_INVOICE": {
      // Simplified: create a draft invoice with template values
      const { data: numResult } = await supabase
        .rpc("next_invoice_number", { p_org_id: orgId })

      const items = [{
        description: renderTemplate(
          (actionConfig.item_description as string) || "Service",
          templateValues
        ),
        quantity: Number(actionConfig.quantity) || 1,
        rate: Number(actionConfig.rate) || 0,
        amount: (Number(actionConfig.quantity) || 1) * (Number(actionConfig.rate) || 0),
      }]

      const total = items[0].amount

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          org_id: orgId,
          invoice_number: numResult || "AUTO",
          contact_id: (triggerData.contact_id as string) || null,
          company_id: (triggerData.company_id as string) || null,
          deal_id: (triggerData.deal_id as string) || null,
          status: "DRAFT",
          items,
          subtotal: total,
          tax_rate: 0,
          tax_amount: 0,
          total,
          discount_type: null,
          discount_value: 0,
          discount_amount: 0,
          issue_date: new Date().toISOString().split("T")[0],
          payment_terms: "NET_30",
          currency: "USD",
          created_by: userId,
        })
        .select("id")
        .single()

      if (error) throw new Error(error.message)
      return { invoice_id: data.id }
    }

    default:
      return { error: `Unknown action type: ${actionType}` }
  }
}
