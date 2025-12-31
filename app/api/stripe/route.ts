import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { prisma } from "@/lib/prisma"
import { sendBookingUpdate } from "@/lib/mailer"

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const bookingId = Number(session.client_reference_id)

    const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "PAID" },
        include: {                      
            customer: true,
            services: { include: { service: true } },
        },
    })

    //thank-you email
    await sendBookingUpdate(
      booking.customer.email,
      "PAID",
      booking.id,
      booking.customer.name,
      booking.services.map((s) => s.service.name).join(", "),
      booking.bookingDate.toISOString()
    )
  }

  return NextResponse.json({ received: true })
}