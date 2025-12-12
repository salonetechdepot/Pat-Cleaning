"use server"

import { Resend } from "resend"

// --- Resend Setup ---
const resend = new Resend(process.env.RESEND_API_KEY)
const from = process.env.NEXT_PUBLIC_FROM_EMAIL as string

// ---------------------------------------------------------------------
// 1️⃣ Booking Status Update Email (CONFIRMED, CANCELLED, COMPLETED, RESCHEDULED)
// ---------------------------------------------------------------------
export async function sendBookingUpdate(
  to: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "RESCHEDULED",
  bookingId: number,
  customerName: string,
  serviceNames: string,
  date: string,
  payUrl?: string // optional Stripe payment link
) {
  try {
    const subject =
      status === "CONFIRMED"
        ? "Booking Confirmed ✅"
        : status === "CANCELLED"
        ? "Booking Cancelled ❌"
        : status === "COMPLETED"
        ? "Booking Completed 🎉"
        : "Booking Rescheduled 🔄"

    const html = `
      <p>Hi ${customerName},</p>
      <p>Your cleaning booking <strong>#${bookingId}</strong> has been 
      <strong>${status.toLowerCase()}</strong>.</p>

      <ul>
        <li>Services: ${serviceNames}</li>
        <li>Date: ${new Date(date).toLocaleString()}</li>
      </ul>

      ${
        payUrl
          ? `<a href="${payUrl}" 
               style="background:#635bff;color:white;padding:12px 24px;
               border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
               Pay now with Stripe
             </a>`
          : ""
      }

      <p>Thank you for choosing Pat Pro Cleaning!</p>
    `

    await resend.emails.send({ from, to, subject, html })
  } catch (error) {
    console.error("Failed to send booking update email:", error)
  }
}

// ---------------------------------------------------------------------
// 2️⃣ Customer Confirmation Email (after they submit a booking)
// ---------------------------------------------------------------------
export async function sendCustomerConfirmation(
  to: string,
  customerName: string,
  bookingId: number,
  serviceNames: string,
  date: string
) {
  try {
    const html = `
      <p>Hi ${customerName},</p>
      <p>Your cleaning is <strong>confirmed</strong> for 
      <strong>${new Date(date).toLocaleString()}</strong>.</p>
      
      <ul>
        <li>Services: ${serviceNames}</li>
        <li>Booking ID: #${bookingId}</li>
      </ul>

      <p>You can reschedule or cancel anytime from your dashboard.</p>
      <p>Thanks for choosing Pat Pro! 🧼</p>
    `

    await resend.emails.send({
      from,
      to,
      subject: "✅ Cleaning Confirmed – See You Soon!",
      html,
    })
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error)
  }
}

// ---------------------------------------------------------------------
// 3️⃣ Admin Notification Email (sent when a new booking is created)
// ---------------------------------------------------------------------
export async function notifyAdminNewBooking(
  bookingId: number,
  customerName: string,
  customerEmail: string,
  serviceNames: string,
  date: string
) {
  try {
    const html = `
      <p>New booking received!</p>
      <ul>
        <li>Booking ID: #${bookingId}</li>
        <li>Customer: ${customerName} (${customerEmail})</li>
        <li>Services: ${serviceNames}</li>
        <li>Date: ${new Date(date).toLocaleString()}</li>
      </ul>

      <p><a href="https://yourdomain.com/admin">
        View in admin dashboard
      </a></p>
    `

    await resend.emails.send({
      from,
      to: process.env.ADMIN_EMAIL as string,
      subject: `📩 New Booking #${bookingId} – Admin Action Needed`,
      html,
    })
  } catch (error) {
    console.error("Failed to send admin notification email:", error)
  }
}
