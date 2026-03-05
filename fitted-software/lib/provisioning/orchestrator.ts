import { createServiceClient } from "@/lib/supabase/server"
import type { ProvisionConfig, ProvisionContext, LogEntry } from "./types"
import { stepGithub } from "./steps/01-github"
import { stepSupabase } from "./steps/02-supabase"
import { stepSupabaseAuth } from "./steps/03-supabase-auth"
import { stepSupabaseStorage } from "./steps/04-supabase-storage"
import { stepVercel } from "./steps/05-vercel"
import { stepFinalize } from "./steps/06-finalize"
import { rollback } from "./rollback"

type Step = {
  name: string
  label: string
  fn: (ctx: ProvisionContext) => Promise<Partial<ProvisionContext>>
}

const STEPS: Step[] = [
  { name: "github", label: "Create GitHub repository", fn: stepGithub },
  { name: "supabase", label: "Create Supabase project & run schemas", fn: stepSupabase },
  { name: "supabase-auth", label: "Configure authentication", fn: stepSupabaseAuth },
  { name: "supabase-storage", label: "Set up file storage", fn: stepSupabaseStorage },
  { name: "vercel", label: "Deploy to Vercel", fn: stepVercel },
  { name: "finalize", label: "Push config & trigger deploy", fn: stepFinalize },
]

export async function runProvisioning(config: ProvisionConfig) {
  const supabase = createServiceClient()

  console.log(`\n🚀 Starting provisioning for "${config.businessName}" (${config.slug})`)
  console.log(`   Modules: ${config.modules.join(", ")}`)

  // Create the provisioned_clients record
  const { data: client, error: insertError } = await supabase
    .from("provisioned_clients")
    .insert({
      slug: config.slug,
      business_name: config.businessName,
      contact_email: config.contactEmail,
      status: "provisioning",
      config: {
        accentColor: config.accentColor,
        customDomain: config.customDomain,
        modules: config.modules,
      },
      provision_log: [],
    })
    .select()
    .single()

  if (insertError || !client) {
    console.error(`❌ Failed to create client record: ${insertError?.message}`)
    throw new Error(`Failed to create client record: ${insertError?.message}`)
  }

  console.log(`   Record created: ${client.id}`)

  let ctx: ProvisionContext = {
    ...config,
    clientId: client.id,
  }

  const log: LogEntry[] = []
  const startTime = Date.now()

  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i]
    const stepStart = Date.now()

    console.log(`\n   [${i + 1}/${STEPS.length}] ${step.label}...`)

    // Mark step as running
    log.push({ step: step.name, status: "running", timestamp: new Date().toISOString() })
    await updateLog(supabase, client.id, log)

    try {
      const result = await step.fn(ctx)
      ctx = { ...ctx, ...result }

      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)

      // Mark step as done
      const entry = log.find((l) => l.step === step.name)!
      entry.status = "done"
      entry.message = `Completed in ${elapsed}s`
      entry.timestamp = new Date().toISOString()
      await updateLog(supabase, client.id, log, {
        github_repo: ctx.githubRepo,
        supabase_ref: ctx.supabaseRef,
        supabase_url: ctx.supabaseUrl,
        vercel_project_id: ctx.vercelProjectId,
        vercel_url: ctx.vercelUrl,
      })

      console.log(`   ✓ ${step.label} (${elapsed}s)`)
      if (step.name === "github") console.log(`     Repo: ${ctx.githubRepo}`)
      if (step.name === "supabase") console.log(`     URL: ${ctx.supabaseUrl}`)
      if (step.name === "vercel") console.log(`     URL: ${ctx.vercelUrl}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1)

      console.error(`   ✗ ${step.label} FAILED (${elapsed}s)`)
      console.error(`     Error: ${message}`)

      // Mark step as error
      const entry = log.find((l) => l.step === step.name)!
      entry.status = "error"
      entry.message = message
      entry.timestamp = new Date().toISOString()

      await supabase
        .from("provisioned_clients")
        .update({
          status: "failed",
          error_message: message,
          provision_log: log,
        })
        .eq("id", client.id)

      // Attempt rollback
      console.log(`\n   🔄 Rolling back...`)
      try {
        await rollback(ctx)
        await supabase
          .from("provisioned_clients")
          .update({ status: "rolled_back" })
          .eq("id", client.id)
        console.log(`   ✓ Rollback complete`)
      } catch (rbErr) {
        const rbMsg = rbErr instanceof Error ? rbErr.message : String(rbErr)
        console.error(`   ✗ Rollback failed: ${rbMsg}`)
      }

      return
    }
  }

  // All steps done
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  await supabase
    .from("provisioned_clients")
    .update({
      status: "active",
      completed_at: new Date().toISOString(),
    })
    .eq("id", client.id)

  console.log(`\n✅ Provisioning complete in ${totalTime}s`)
  console.log(`   App: https://${ctx.vercelUrl}`)
  console.log(`   Repo: https://github.com/${ctx.githubRepo}`)
  console.log(`   DB: ${ctx.supabaseUrl}\n`)
}

async function updateLog(
  supabase: ReturnType<typeof createServiceClient>,
  clientId: string,
  log: LogEntry[],
  extra?: Record<string, string | undefined>
) {
  const update: Record<string, unknown> = { provision_log: log }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined) update[k] = v
    }
  }
  await supabase.from("provisioned_clients").update(update).eq("id", clientId)
}
