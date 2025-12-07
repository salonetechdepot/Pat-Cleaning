import { Resend } from "resend"

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)
const from = process.env.NEXT_PUBLIC_FROM_EMAIL as string

// export async function sendBookingUpdate(
//   to: string,
//   status: "CONFIRMED" | "CANCELLED" | "COMPLETED"| "RESCHEDULED",
//   bookingId: number,
//   customerName: string,
//   serviceNames: string,
//   date: string
// ) {
//   const subject =
//     status === "CONFIRMED"
//       ? "Booking Confirmed ✅"
//       : status === "CANCELLED"
//       ? "Booking Cancelled ❌"
//       : "Booking Completed 🎉"

//   const html = `
//     <p>Hi ${customerName},</p>
//     <p>Your cleaning booking <strong>#${bookingId}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
//     <ul>
//       <li>Services: ${serviceNames}</li>
//       <li>Date: ${new Date(date).toLocaleString()}</li>
//     </ul>
//     <p>Thank you for choosing Pat Pro Cleaning!</p>
//   `

//   await resend.emails.send({ from, to, subject, html })
// }
// export async function sendBookingUpdate(
//   to: string,
//   status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "RESCHEDULED",
//   bookingId: number,
//   customerName: string,
//   serviceNames: string,
//   date: string
// ) {
//   try {
//     const subject =
//       status === "CONFIRMED"
//         ? "Booking Confirmed ✅"
//         : status === "CANCELLED"
//         ? "Booking Cancelled ❌"
//         : status === "COMPLETED"
//         ? "Booking Completed 🎉"
//         : "Booking Rescheduled 🔄"

//     const html = `
//       <p>Hi ${customerName},</p>
//       <p>Your cleaning booking <strong>#${bookingId}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
//       <ul>
//         <li>Services: ${serviceNames}</li>
//         <li>Date: ${new Date(date).toLocaleString()}</li>
//       </ul>
//       <p>Thank you for choosing Pat Pro Cleaning!</p>
//     `

//     await resend.emails.send({ from, to, subject, html })
//   } catch (err) {
//     console.error("Email failed:", err)
   
//   }
// }
export async function sendBookingUpdate(
  to: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "RESCHEDULED",
  bookingId: number,
  customerName: string,
  serviceNames: string,
  date: string,
  payUrl?: string          // ← NEW optional 7th arg
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
      <p>Your cleaning booking <strong>#${bookingId}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
      <ul>
        <li>Services: ${serviceNames}</li>
        <li>Date: ${new Date(date).toLocaleString()}</li>
      </ul>
      ${
        payUrl
          ? `<a href="${payUrl}" style="background:#635bff;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px;">Pay now with Stripe</a>`
          : ""
      }
      <p>Thank you for choosing Pat Pro Cleaning!</p>
    `

    await resend.emails.send({ from, to, subject, html })
  } catch (err) {
    console.error("Email failed:", err)
  }
}

export async function sendCustomerConfirmation(
  to: string,
  customerName: string,
  bookingId: number,
  serviceNames: string,
  date: string
) {
  const html = `
    <p>Hi ${customerName},</p>
    <p>Your cleaning is <strong>confirmed</strong> for <strong>${new Date(date).toLocaleString()}</strong>.</p>
    <ul>
      <li>Services: ${serviceNames}</li>
      <li>Booking ID: #${bookingId}</li>
    </ul>
    <p>Our pro will arrive on time. You can reschedule or cancel anytime from your dashboard.</p>
    <p>Thanks for choosing Pat Pro! 🧼</p>
  `

  await resend.emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL as string,
    to,
    subject: "✅ Cleaning Confirmed – See You Soon!",
    html,
  })
}

export async function notifyAdminNewBooking(
  bookingId: number,
  customerName: string,
  customerEmail: string,
  serviceNames: string,
  date: string
) {
  const html = `
    <p>New booking received!</p>
    <ul>
      <li>Booking ID: #${bookingId}</li>
      <li>Customer: ${customerName} (${customerEmail})</li>
      <li>Services: ${serviceNames}</li>
      <li>Date: ${new Date(date).toLocaleString()}</li>
    </ul>
    <p><a href="https://yourdomain.com/admin">View in admin dashboard</a></p>
  `

  await resend.emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL as string,
    to: process.env.ADMIN_EMAIL as string, // new env var
    subject: `New Booking #${bookingId} – Action Required`,
    html,
  })
}