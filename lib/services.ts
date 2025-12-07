// actions/services.ts
"use server"

import { prisma } from "@/lib/prisma"

export async function getAllServices() {
  return prisma.service.findMany({
    orderBy: { name: "asc" },
  })
}
