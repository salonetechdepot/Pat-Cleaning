"use server"

import { prisma } from "./prisma"
import { auth } from "@clerk/nextjs/server"

export async function getRecentAdminBookings() {
  const session = await auth()
  if (!session?.userId) return []

  return prisma.booking.findMany({
    where: {
      createdByClerkId: session.userId, // ✅ FILTER ADMIN ONLY
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      customer: true,
      services: { include: { service: true } },
      assignedStaff: true,
    },
  })
}
