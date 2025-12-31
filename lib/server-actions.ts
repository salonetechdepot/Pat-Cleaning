"use server"

import { prisma } from "./prisma"
import { revalidatePath } from "next/cache"
import {notifyAdminNewBooking, sendBookingUpdate} from "../lib/mailer"
import { send24hReminder } from "../lib/reminders"
import { sendCustomerConfirmation } from "../lib/mailer"
import { auth} from "@clerk/nextjs/server"
import { stripe } from "@/lib/stripe-server"
import { createStripePriceIfNeeded } from "@/lib/stripe-server"

// import { auth } from "@clerk/nextjs/server"

// const { userId, sessionClaims } = await auth()
// if (!userId || sessionClaims?.publicMetadata?.role !== "admin") {
//   throw new Error("Unauthorized")
// }


export async function createService(data: {
  name: string
  description: string
  price: number
  durationMin: number
  category?: string
  imageUrl?: string
}) {
  "use server"
  await prisma.service.create({ data })
  revalidatePath("/admin")
}

export async function deleteService(id: number) {
  "use server"
  await prisma.service.delete({ where: { id } })
  revalidatePath("/admin")
}

export async function updateService(
  id: number,
  data: {
    name: string
    description: string
    price: number
    durationMin: number
    category?: string
    imageUrl?: string
  }
) {
  "use server"
  await prisma.service.update({ where: { id }, data })
  revalidatePath("/admin")
}

//Bookinf action
// export async function createBooking(data: {
//   serviceIds: number[]
//   bookingDate: Date
//   address?: string
//   notes?: string
//   clerkId: string
//   email: string
//   name: string
//   phone?: string
//   createdByClerkId?: string
// }) {
//   "use server"

//   // 1. ensure customer exists
//   let customer = await prisma.customer.findUnique({ where: { clerkId: data.clerkId } })
//   if (!customer) {
//     customer = await prisma.customer.create({
//       data: {
//         clerkId: data.clerkId,
//         email: data.email,
//         name: data.name,
//         phone: data.phone,
//         address: data.address,
//       },
//     })
//   }

//   // 2. create booking with include
//   const booking = await prisma.booking.create({
//     data: {
//       customerId: customer.id,
//       bookingDate: data.bookingDate,
//       status: "PENDING",
//       phone: data.phone,
//       notes: data.notes,
//       createdByClerkId: data.createdByClerkId ?? null,
//       services: { create: data.serviceIds.map((id) => ({ serviceId: id, qty: 1 })) },
//     },
//     include: { services: { include: { service: true } } }, // ⬅ required for email
//   })

//   // 3. send friendly confirmation
//   await sendCustomerConfirmation(
//     customer.email,
//     customer.name,
//     booking.id,
//     booking.services.map((s) => s.service.name).join(", "),
//     booking.bookingDate.toISOString()
//   )

//  // 4. schedule 24 h reminder (email + SMS to customer & email to admin)
// // const reminderTime = new Date(booking.bookingDate.getTime() - 24 * 60 * 60 * 1000)
// // setTimeout(() => send24hReminder(
// //   { name: customer.name, email: customer.email, phone: customer.phone || undefined },
// //   booking
// // ), reminderTime.getTime() - Date.now())

// //testing immediate reminder
// // 1-minute reminder for testing
// const reminderTime = new Date(Date.now() + 1 * 60 * 1000) // 1 min from now
// setTimeout(() => send24hReminder(
//   { name: customer.name, email: customer.email, phone: customer.phone || undefined },
//   booking
// ), 1 * 60 * 1000)

//   // 4. notify admin
//   await notifyAdminNewBooking(
//   booking.id,
//   customer.name,
//   customer.email,
//   booking.services.map((s) => s.service.name).join(", "),
//   booking.bookingDate.toISOString()
// )

//   revalidatePath("/account")
//   return booking
// }
export async function createBooking(data: {
  serviceIds: number[]
  bookingDate: Date
  address?: string
  notes?: string
  clerkId: string
  email: string
  name: string
  phone?: string
  assignedStaffId?: number | null
  // createdByClerkId?: string
}) {
  "use server"
  const user = await auth()
  if (!user) throw new Error("Unauthorized")

  // 1. ensure customer exists
  let customer = await prisma.customer.findUnique({
    where: { clerkId: data.clerkId },
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
      },
    })
  }

  // 2. create booking
  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      bookingDate: data.bookingDate,
      status: "PENDING",
      phone: data.phone,
      notes: data.notes,
      assignedStaffId: data.assignedStaffId ?? null,
      createdByClerkId: data.clerkId || user.userId,

      services: {
        create: data.serviceIds.map((id) => ({
          serviceId: id,
          qty: 1,
        })),
      },
    },
    include: {
      services: { include: { service: true } },
      customer: true,
      assignedStaff: true,
    },
  })

  revalidatePath("/admin")
  return booking
}




//booking status update
// export async function confirmBooking(id: number) {
//   "use server"
//   const booking = await prisma.booking.update({
//     where: { id },
//     data: { status: "CONFIRMED" },
//     include: { customer: true, services: { include: { service: true } } },
//   })
//   await sendBookingUpdate(
//     booking.customer.email,
//     "CONFIRMED",
//     booking.id,
//     booking.customer.name,
//     booking.services.map((s) => s.service.name).join(", "),
//     booking.bookingDate.toISOString()
//   )
//   revalidatePath("/admin")
// }



// lib/server-actions.ts
export async function confirmBooking(id: number) {
  "use server"

  /* 1.  fetch with customer ---------------------------------- */
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      services: { include: { service: true } },
    },
  })
  if (!booking) throw new Error("Booking not found")
  if (booking.status === "CANCELLED") throw new Error("Cannot confirm a cancelled booking")
  if (booking.status === "CONFIRMED") return booking

  /* 2.  mark confirmed --------------------------------------- */
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CONFIRMED" },
    include: {
      customer: true,
      services: { include: { service: true } },
    },
  })

  // /* 3.  Stripe price for first service ----------------------- */
  // if (updated.services.length === 0) throw new Error("No services in booking")
  // const firstService = updated.services[0].service
  // const priceId = await createStripePriceIfNeeded(firstService)

  // /* 4.  create CheckoutSession ------------------------------- */
  // const session = await stripe.checkout.sessions.create({
  //   mode: "payment",
  //   payment_method_types: ["card"],
  //   customer_email: updated.customer.email,
  //   client_reference_id: String(updated.id),
  //   line_items: [{ price: priceId, quantity: 1 }],
  //   success_url: `${process.env.NEXT_PUBLIC_URL}/paid/success?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url:  `${process.env.NEXT_PUBLIC_URL}/paid/cancel?session_id={CHECKOUT_SESSION_ID}`,
  //   metadata: { bookingId: String(updated.id) },
  // })
   /* ----- build one Checkout item per service ----- */
const lineItems = await Promise.all(
  updated.services.map(async (s) => {
    const priceId = await createStripePriceIfNeeded(s.service)
    return { price: priceId, quantity: s.qty ?? 1 }
  })
)

/* ----- create Checkout session ----------------- */
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  payment_method_types: ["card"],
  customer_email: updated.customer.email,
  client_reference_id: String(updated.id),
  line_items: lineItems,               // ← multi-service
  success_url: `${process.env.NEXT_PUBLIC_URL}/paid/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_URL}/paid/cancel?session_id={CHECKOUT_SESSION_ID}`,
  metadata: { bookingId: String(updated.id) },
})

  const payUrl = session.url ?? undefined
    await prisma.booking.update({
      where: { id: updated.id },
      data: { payUrl },
  })

  /* 5.  send e-mail (7th arg is the pay link) --------------- */
  await sendBookingUpdate(
    updated.customer.email,
    "CONFIRMED",
    updated.id,
    updated.customer.name,
    updated.services.map((s) => s.service.name).join(", "),
    updated.bookingDate.toISOString(),
    payUrl
  )

  revalidatePath("/admin")
  revalidatePath("/account")
  return updated
}


// export async function cancelBooking(id: number) {
//   "use server"
//   const booking = await prisma.booking.update({
//     where: { id },
//     data: { status: "CANCELLED" },
//     include: { customer: true, services: { include: { service: true } } },
//   })
//   await sendBookingUpdate(
//     booking.customer.email,
//     "CANCELLED",
//     booking.id,
//     booking.customer.name,
//     booking.services.map((s) => s.service.name).join(", "),
//     booking.bookingDate.toISOString()
//   )
//   revalidatePath("/admin")
// }

export async function cancelBooking(id: number) {
  "use server"

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      services: { include: { service: true } },
    },
  })

  if (!booking) {
    throw new Error("Booking not found")
  }

  if (booking.status === "CANCELLED") {
    return booking
  }

  if (booking.status === "COMPLETED") {
    throw new Error("Completed bookings cannot be cancelled")
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: {
      customer: true,
      services: { include: { service: true } },
    },
  })

  await sendBookingUpdate(
    updated.customer.email,
    "CANCELLED",
    updated.id,
    updated.customer.name,
    updated.services.map((s) => s.service.name).join(", "),
    updated.bookingDate.toISOString()
  )

  revalidatePath("/admin")
  revalidatePath("/account")

  return updated
}


export async function completeBooking(id: number) {
  "use server"
  const booking = await prisma.booking.update({
    where: { id },
    data: { status: "COMPLETED" },
    include: { customer: true, services: { include: { service: true } } },
  })
  await sendBookingUpdate(
    booking.customer.email,
    "COMPLETED",
    booking.id,
    booking.customer.name,
    booking.services.map((s) => s.service.name).join(", "),
    booking.bookingDate.toISOString()
  )
  revalidatePath("/admin")
}

//costumer dashboard action

// export async function rescheduleBooking(id: number, newDate: Date) {
//   "use server"

//   const booking = await prisma.booking.findUnique({
//     where: { id },
//     include: {
//       customer: true,
//       services: { include: { service: true } },
//     },
//   })

//   if (!booking) {
//     throw new Error("Booking not found")
//   }

//   if (["CANCELLED", "COMPLETED"].includes(booking.status)) {
//     throw new Error("This booking cannot be rescheduled")
//   }

//   const updated = await prisma.booking.update({
//     where: { id },
//     data: { bookingDate: newDate },
//     include: {
//       customer: true,
//       services: { include: { service: true } },
//     },
//   })

//   await sendBookingUpdate(
//     updated.customer.email,
//     "RESCHEDULED",
//     updated.id,
//     updated.customer.name,
//     updated.services.map((s) => s.service.name).join(", "),
//     updated.bookingDate.toISOString()
//   )

//   revalidatePath("/admin")
//   revalidatePath("/account")

//   return updated
// }
export async function rescheduleBooking(id: number, newDate: Date) {
  "use server"

  const updated = await prisma.booking.update({
    where: { id },
    data: { bookingDate: newDate },
    include: {
      customer: true,
      services: { include: { service: true } },
    },
  })

  await sendBookingUpdate(
    updated.customer.email,
    "RESCHEDULED", // ✅ now fully supported
    updated.id,
    updated.customer.name,
    updated.services.map((s) => s.service.name).join(", "),
    updated.bookingDate.toISOString()
  )

  revalidatePath("/admin")
  revalidatePath("/account")
}



export async function updateCustomerProfile(
  clerkId: string,
  data: { name?: string; phone?: string; address?: string }
) {
  "use server"
  await prisma.customer.update({ where: { clerkId }, data })
  revalidatePath("/account")
}

export async function bookAgain(customerId: number, serviceIds: number[]) {
  "use server"
  await prisma.booking.create({
    data: {
      customerId,
      bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow 9 am
      status: "PENDING",
      services: { create: serviceIds.map((id) => ({ serviceId: id, qty: 1 })) },
    },
  })
  revalidatePath("/account")
}

export async function adminRescheduleBooking(
  id: number,
  newDate: Date
) {
  "use server"

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      bookingDate: newDate,
      status: "RESCHEDULED",
    },
    include: {
      customer: true,
      services: { include: { service: true } },
    },
  })

  await sendBookingUpdate(
    booking.customer.email,
    "RESCHEDULED",
    booking.id,
    booking.customer.name,
    booking.services.map((s) => s.service.name).join(", "),
    booking.bookingDate.toISOString()
  )

  revalidatePath("/admin")
  return booking
}
