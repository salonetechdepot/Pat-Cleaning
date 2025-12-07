// actions/staff.ts
"use server"

import { prisma } from "@/lib/prisma"

export async function getAllStaff() {
  return prisma.staff.findMany({
    orderBy: { name: "asc" },
  })
}
