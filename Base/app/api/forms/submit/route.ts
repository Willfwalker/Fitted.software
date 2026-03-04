import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { buildSubmissionValidator } from "@/lib/validations/forms"
import type { FormField } from "@/lib/types/forms"
import { processSubmissionNotification } from "@/lib/actions/submissions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { share_token, data } = body

    if (!share_token || !data) {
      return NextResponse.json(
        { error: "Missing share_token or data" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch form by share_token
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, org_id, name, fields, status, created_by")
      .eq("share_token", share_token)
      .single()

    if (formError || !form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      )
    }

    if (form.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This form is no longer accepting submissions" },
        { status: 400 }
      )
    }

    // Validate submission data against field definitions
    const fields = form.fields as FormField[]
    const validator = buildSubmissionValidator(fields)
    const parsed = validator.safeParse(data)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Get client info
    const sourceIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null
    const userAgent = request.headers.get("user-agent") || null

    // Insert submission
    const { data: submission, error: insertError } = await supabase
      .from("form_submissions")
      .insert({
        org_id: form.org_id,
        form_id: form.id,
        data: parsed.data,
        source_ip: sourceIp,
        user_agent: userAgent,
      })
      .select("id")
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to save submission" },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from("activities").insert({
      org_id: form.org_id,
      type: "FORM_SUBMITTED",
      title: `New submission on "${form.name}"`,
      metadata: { form_id: form.id, submission_id: submission.id },
      created_by: form.created_by,
    })

    // Notify form owner
    await processSubmissionNotification(
      form.id,
      form.name,
      form.org_id,
      form.created_by,
      submission.id
    )

    return NextResponse.json(
      { success: true, submissionId: submission.id },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
