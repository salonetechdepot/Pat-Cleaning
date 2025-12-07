// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.service.createMany({
    data: [
      { name: 'Standard Clean',        description: 'Living areas, dusting, vacuum, mop', price: 80,  durationMin: 120 },
      { name: 'Deep Clean',            description: 'Everything in Standard + inside cabinets, baseboards', price: 150, durationMin: 240 },
      { name: 'Move-in / Move-out',   description: 'Complete empty-home sanitization', price: 200, durationMin: 300 },
      { name: 'Office Cleaning',       description: 'Desks, trash, common areas', price: 100, durationMin: 90 },
    ],
    skipDuplicates: true,
  })
  console.log('✔ Cleaning services seeded')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })