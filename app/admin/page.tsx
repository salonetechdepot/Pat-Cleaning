import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/prisma"
import { AdminDashboard } from "../../components/admin-dashboard"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.userId) redirect("/sign-in")

  const [services, customers, staff, bookings] = await Promise.all([
  prisma.service.findMany({ orderBy: { id: "asc" } }),
  prisma.customer.findMany({ orderBy: { id: "asc" } }),
  prisma.staff.findMany({ orderBy: { id: "asc" } }),
  prisma.booking.findMany({
    include: { customer: true, services: { include: { service: true } } },
    orderBy: { bookingDate: "desc" },
  }),
])

  return <AdminDashboard serverServices={services} serverCustomers={customers} serverBookings={bookings} serverStaff={staff} />
}