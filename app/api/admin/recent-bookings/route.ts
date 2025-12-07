import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const bookings = await prisma.booking.findMany({
    where: {
      createdByClerkId: "ADMIN",
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      customer: true,
      services: { include: { service: true } },
      assignedStaff: true,
    },
  })

  return NextResponse.json(bookings)
}
