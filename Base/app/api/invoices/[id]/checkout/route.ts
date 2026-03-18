import { NextResponse, type NextRequest } from "next/server"
import { createCheckoutSession } from "@/lib/actions/payments"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const result = await createCheckoutSession(id)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ url: result.url })
}
