import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/prisma"
import { CustomerDashboard } from "../../components/customer-dashboard"

export default async function AccountPage() {
  const session = await auth()
   const user = await (await clerkClient()).users.getUser(session?.userId!)
  if (!session?.userId) redirect("/sign-in")
   

  const allServices = await prisma.service.findMany({ orderBy: { id: "asc" } })
  
  // 1. ensure customer row exists (auto-create if first visit)
  let customer = await prisma.customer.findUnique({ where: { clerkId: session.userId } })
  if (!customer) {
  customer = await prisma.customer.create({
    data: {
      clerkId: session.userId,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: user.fullName || "",
      phone: user.phoneNumbers?.[0]?.phoneNumber || "",
      
    },
  })
}

  // 2. fetch customer’s real bookings
  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    include: { services: { include: { service: true } } },
    orderBy: { bookingDate: "desc" },
  })

  // normalize `customer` for UI components: convert `null` -> `undefined`
  const normalizedCustomer = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? undefined
  }

  return (
    <CustomerDashboard
      serverBookings={bookings}
      customer={normalizedCustomer}
      services={allServices}
    />
  )
}