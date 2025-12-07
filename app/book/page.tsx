import { Metadata } from "next"
import { prisma } from "../../lib/prisma"
import { BookingCTA } from "../../components/booking-cta"

export const metadata: Metadata = {
  title: "Book a Cleaning – Pat Pro",
  description: "Schedule professional cleaning in 60 seconds.",
}

export default async function BookPage() {
  const services = await prisma.service.findMany({ orderBy: { id: "asc" } })
  return <BookingCTA services={services} />
}