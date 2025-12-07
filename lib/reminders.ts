import { Resend } from "resend"
import Twilio from "twilio"

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)
const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function send24hReminder(
  customer: { name: string; email: string; phone?: string },
  booking: { id: number; bookingDate: Date; services: any[] }
) {
  const dateStr = new Date(booking.bookingDate).toLocaleString()
  const serviceNames = booking.services.map((s) => s.service.name).join(", ")

  // Customer email
  await resend.emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL as string,
    to: customer.email,
    subject: "Reminder – Cleaning Tomorrow",
    html: `<p>Hi ${customer.name},</p><p>Your <strong>${serviceNames}</strong> cleaning is scheduled for <strong>${dateStr}</strong>.</p><p>Our pro will arrive on time. You can reschedule or cancel anytime from your dashboard.</p><p>Thanks, Pat Pro 🧼</p>`,
  })

  // Customer SMS (if phone exists)
  if (customer.phone) {
    await twilio.messages.create({
      body: `Reminder: Your ${serviceNames} cleaning is scheduled for ${dateStr}. See you then! – Pat Pro`,
      from: process.env.TWILIO_PHONE,
      to: customer.phone,
    })
  }

  // Admin email
  await resend.emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL as string,
    to: process.env.ADMIN_EMAIL as string,
    subject: `Reminder – Booking #${booking.id} Tomorrow`,
    html: `<p>Booking #${booking.id} is scheduled for <strong>${dateStr}</strong>.</p><p>Customer: ${customer.name} (${customer.email})</p><p>Services: ${serviceNames}</p>`,
  })
}