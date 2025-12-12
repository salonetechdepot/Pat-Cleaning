"use server"

// ❌ DO NOT create Resend at top-level
// const resend = new Resend(process.env.RESEND_API_KEY!)
// const from = process.env.NEXT_PUBLIC_FROM_EMAIL as string

/** Safe lazy loader */
function getResend() {
  const Resend = require("resend").Resend;

  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
  if (!process.env.NEXT_PUBLIC_FROM_EMAIL) {
    throw new Error("Missing NEXT_PUBLIC_FROM_EMAIL");
  }
  return process.env.NEXT_PUBLIC_FROM_EMAIL;
}

/* ---------------------------------------------------------
   1️⃣ Booking Status Update Email
--------------------------------------------------------- */
export async function sendBookingUpdate(
  to: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "RESCHEDULED",
  bookingId: number,
  customerName: string,
  serviceNames: string,
  date: string,
  payUrl?: string
) {
  try {
    const resend = getResend();

    const subject =
      status === "CONFIRMED"
        ? "Booking Confirmed ✅"
        : status === "CANCELLED"
        ? "Booking Cancelled ❌"
        : status === "COMPLETED"
        ? "Booking Completed 🎉"
        : "Booking Rescheduled 🔄";

    const html = `
      <p>Hi ${customerName},</p>
      <p>Your booking <strong>#${bookingId}</strong> is now <b>${status.toLowerCase()}</b>.</p>

      <ul>
        <li>Services: ${serviceNames}</li>
        <li>Date: ${new Date(date).toLocaleString()}</li>
      </ul>

      ${
        payUrl
          ? `<a href="${payUrl}" 
               style="background:#635bff;color:white;padding:12px 24px;
               border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">
               Click here to pay
             </a>`
          : ""
      }

      <p>Thank you for choosing Pat Pro Cleaning!</p>
    `;

    await resend.emails.send({
      from: fromAddress(),
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("sendBookingUpdate ERROR:", err);
  }
}

/* ---------------------------------------------------------
   2️⃣ Customer Confirmation Email
--------------------------------------------------------- */
export async function sendCustomerConfirmation(
  to: string,
  customerName: string,
  bookingId: number,
  serviceNames: string,
  date: string
) {
  try {
    const resend = getResend();

    const html = `
      <p>Hi ${customerName},</p>
      <p>Your booking is <strong>confirmed</strong>.</p>
      
      <ul>
        <li>Booking ID: #${bookingId}</li>
        <li>Services: ${serviceNames}</li>
        <li>Date: ${new Date(date).toLocaleString()}</li>
      </ul>

      <p>You may manage your booking in your dashboard.</p>
    `;

    await resend.emails.send({
      from: fromAddress(),
      to,
      subject: "Booking Confirmed ✔️",
      html,
    });
  } catch (err) {
    console.error("sendCustomerConfirmation ERROR:", err);
  }
}

/* ---------------------------------------------------------
   3️⃣ Notify Admin New Booking
--------------------------------------------------------- */
export async function notifyAdminNewBooking(
  bookingId: number,
  customerName: string,
  customerEmail: string,
  serviceNames: string,
  date: string
) {
  try {
    const resend = getResend();

    const html = `
      <p><strong>New Booking Received</strong></p>
      <ul>
        <li>ID: #${bookingId}</li>
        <li>Customer: ${customerName} (${customerEmail})</li>
        <li>Services: ${serviceNames}</li>
        <li>Date: ${new Date(date).toLocaleString()}</li>
      </ul>
    `;

    await resend.emails.send({
      from: fromAddress(),
      to: process.env.ADMIN_EMAIL!,
      subject: `📩 New Booking #${bookingId}`,
      html,
    });
  } catch (err) {
    console.error("notifyAdminNewBooking ERROR:", err);
  }
}
