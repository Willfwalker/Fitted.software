import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// Use service role for webhook processing (no user context)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    const invoiceId = session.metadata?.invoice_id
    const orgId = session.metadata?.org_id
    const invoiceNumber = session.metadata?.invoice_number

    if (!invoiceId || !orgId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Update invoice to PAID
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "PAID",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", invoiceId)
      .eq("org_id", orgId)

    if (updateError) {
      console.error("Failed to update invoice:", updateError)
      return NextResponse.json({ error: "Database update failed" }, { status: 500 })
    }

    // Fetch invoice for activity context
    const { data: invoice } = await supabase
      .from("invoices")
      .select("contact_id, company_id, deal_id, created_by")
      .eq("id", invoiceId)
      .single()

    // Log PAYMENT_RECEIVED activity
    await supabase.from("activities").insert({
      org_id: orgId,
      deal_id: invoice?.deal_id || null,
      contact_id: invoice?.contact_id || null,
      company_id: invoice?.company_id || null,
      type: "PAYMENT_RECEIVED",
      title: `Payment received for invoice ${invoiceNumber || invoiceId}`,
      metadata: {
        invoice_id: invoiceId,
        stripe_session_id: session.id,
        amount: session.amount_total ? session.amount_total / 100 : null,
        currency: session.currency,
      },
      created_by: invoice?.created_by || "00000000-0000-0000-0000-000000000000",
    })

    // Create notification
    await supabase.from("notifications").insert({
      org_id: orgId,
      user_id: invoice?.created_by,
      title: `Payment received: Invoice ${invoiceNumber}`,
      body: `$${session.amount_total ? (session.amount_total / 100).toFixed(2) : "0"} payment completed via Stripe`,
      link: `/invoicing/${invoiceId}`,
      icon: "CreditCard",
      source_type: "invoice",
      source_id: invoiceId,
    })
  }

  return NextResponse.json({ received: true })
}
