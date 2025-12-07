import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "../../lib/prisma"
import { StaffDashboard } from "../../components/staff-dashboard"

export default async function StaffPage() {
  const session = await auth()
  if (!session?.userId) redirect("/sign-in")

  const user = await (await clerkClient()).users.getUser(session.userId)

  // ensure staff record exists (auto-create on first login)
  let staff = await prisma.staff.findUnique({ where: { clerkId: session.userId } })
  if (!staff) {
    // check by email first to avoid duplicate
    const existing = await prisma.staff.findFirst({ where: { email: user.emailAddresses[0]?.emailAddress } })
    if (existing) {
      // convert existing row to real staff
      staff = await prisma.staff.update({
        where: { id: existing.id },
        data: { clerkId: session.userId, status: "active" },
      })
    } else {
      staff = await prisma.staff.create({
        data: {
          clerkId: session.userId,
          email: user.emailAddresses[0]?.emailAddress || "",
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "",
        },
      })
    }
  }

  // today + upcoming jobs assigned to this staff
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      assignedStaffId: staff.id,
    },
    include: { customer: true, services: { include: { service: true } } },
    orderBy: { bookingDate: "asc" },
  })

  return <StaffDashboard staff={staff} bookings={bookings} />
}