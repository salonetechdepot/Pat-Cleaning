import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("session_id")
  if (!id) return NextResponse.json({ error: "Missing session_id" }, { status: 400 })

  const session = await stripe.checkout.sessions.retrieve(id, {
    expand: ["line_items.data.price.product"],
  })

  const services = session.line_items!.data.map((li) => ({
    name: li.description || (li.price?.product as any).name,
    qty: li.quantity || 1,
    price: li.amount_total!,
  }))

  return NextResponse.json({
    id: session.id,
    amount: session.amount_total!,
    customer_email: session.customer_details?.email || "",
    payment_status: session.payment_status,
    services,
  })
}