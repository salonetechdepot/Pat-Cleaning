// lib/stripe-server.ts
import Stripe from "stripe";
import { Prisma, Service } from '@prisma/client'; 
import { prisma } from "./prisma";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});


// lib/stripe-server.ts
// export async function createStripePriceIfNeeded(
//   service: Pick<Service, 'id' | 'name' | 'price' | 'stripePriceId'>
// ): Promise<string> {
//   if (service.stripePriceId) return service.stripePriceId;

//   const product = await stripe.products.create({ name: service.name });
//   const price = await stripe.prices.create({
//     product: product.id,
//     unit_amount: Math.round(service.price * 100),
//     currency: 'usd',
//   });

//   await prisma.service.update({
//     where: { id: service.id },
//     data: { stripePriceId: price.id },
//   });

//   return price.id;
// }
export async function createStripePriceIfNeeded(
  service: Pick<Service, 'id' | 'name' | 'price' | 'stripePriceId'>
) {
  if (service.stripePriceId) return service.stripePriceId

  console.log('Creating Stripe product/price for:', service.name, service.price) // ← NEW

  const product = await stripe.products.create({ name: service.name })
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(service.price * 100),
    currency: 'usd',
  })

  await prisma.service.update({
    where: { id: service.id },
    data: { stripePriceId: price.id },
  })

  return price.id
}