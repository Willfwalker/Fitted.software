"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import Stripe from "stripe"

export type PaymentActionState = {
  error?: string
  success?: boolean
  url?: string
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

export async function createCheckoutSession(
  invoiceId: string
): Promise<PaymentActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Fetch invoice with contact/company
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name, email)")
    .eq("id", invoiceId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!invoice) return { error: "Invoice not found" }
  if (invoice.status === "PAID") return { error: "Invoice is already paid" }
  if (invoice.status === "CANCELLED") return { error: "Invoice is cancelled" }
  if (invoice.status === "DRAFT") return { error: "Invoice must be sent before payment" }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // Find or create Stripe customer
  const contact = invoice.contact as { first_name: string; last_name: string; email: string | null } | null
  const company = invoice.company as { name: string; email: string | null } | null
  const customerEmail = contact?.email || company?.email
  let stripeCustomerId: string | undefined

  if (customerEmail) {
    // Check if we already have a Stripe customer for this contact/company
    const { data: existing } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("org_id", ctx.orgId)
      .or(
        [
          invoice.contact_id ? `contact_id.eq.${invoice.contact_id}` : null,
          invoice.company_id ? `company_id.eq.${invoice.company_id}` : null,
        ]
          .filter(Boolean)
          .join(",")
      )
      .limit(1)
      .maybeSingle()

    if (existing?.stripe_customer_id) {
      stripeCustomerId = existing.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: contact
          ? `${contact.first_name} ${contact.last_name}`
          : company?.name || undefined,
      })
      stripeCustomerId = customer.id

      // Save mapping
      await supabase.from("stripe_customers").insert({
        org_id: ctx.orgId,
        contact_id: invoice.contact_id || null,
        company_id: invoice.company_id || null,
        stripe_customer_id: customer.id,
        email: customerEmail,
      })
    }
  }

  // Build line items for Stripe checkout
  const items = (invoice.items as { description: string; quantity: number; rate: number; amount: number }[]) || []

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: (invoice.currency || "USD").toLowerCase(),
      product_data: {
        name: item.description,
      },
      unit_amount: Math.round(item.rate * 100), // Stripe uses cents
    },
    quantity: Math.ceil(item.quantity), // Stripe needs integer quantity
  }))

  // If there's a discount or the simple line items don't match total, use a single line item
  if (invoice.discount_amount > 0 || invoice.tax_amount > 0) {
    // Simpler approach: single line item for total
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (invoice.currency || "USD").toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `${items.length} item(s)`,
            },
            unit_amount: Math.round(invoice.total * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/invoice/${invoice.share_token || invoiceId}?payment=success`,
      cancel_url: `${appUrl}/invoice/${invoice.share_token || invoiceId}?payment=cancelled`,
      metadata: {
        invoice_id: invoiceId,
        org_id: ctx.orgId,
        invoice_number: invoice.invoice_number,
      },
    })

    // Store checkout session info
    await supabase
      .from("invoices")
      .update({
        stripe_checkout_session_id: session.id,
        payment_url: session.url,
      })
      .eq("id", invoiceId)
      .eq("org_id", ctx.orgId)

    return { success: true, url: session.url! }
  }

  // Standard checkout with line items
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${appUrl}/invoice/${invoice.share_token || invoiceId}?payment=success`,
    cancel_url: `${appUrl}/invoice/${invoice.share_token || invoiceId}?payment=cancelled`,
    metadata: {
      invoice_id: invoiceId,
      org_id: ctx.orgId,
      invoice_number: invoice.invoice_number,
    },
  })

  // Store checkout session info
  await supabase
    .from("invoices")
    .update({
      stripe_checkout_session_id: session.id,
      payment_url: session.url,
    })
    .eq("id", invoiceId)
    .eq("org_id", ctx.orgId)

  return { success: true, url: session.url! }
}
