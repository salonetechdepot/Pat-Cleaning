import { prisma } from "@/lib/prisma"
import { createStripePriceIfNeeded } from "@/lib/stripe-server"

async function seed() {
  const svc = await prisma.service.upsert({
    where: { id: 1 },                 // pick any id
    update: {},
    create: {
      name: "Test Deep Clean",
      price: 75,
      durationMin: 120,
      category: "Residential",
    },
  })
  await createStripePriceIfNeeded(svc) // creates price_xxx in Stripe
  console.log("✅ Service & Stripe price ready:", svc.name, svc.stripePriceId)
}
seed().catch(console.error).finally(() => prisma.$disconnect())