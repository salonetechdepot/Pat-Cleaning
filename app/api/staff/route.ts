import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const staff = await prisma.staff.findMany({
    where: { status: "active" },
    orderBy: { id: "asc" },
  })
  return NextResponse.json(staff)
}
