import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { CustomerDashboard } from "../../components/customer-dashboard";

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the Clerk user (Clerk v6 safe API)
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch all catalog services
  const allServices = await prisma.service.findMany({
    orderBy: { id: "asc" },
  });

  // Ensure customer exists in DB
  let customer = await prisma.customer.findUnique({
    where: { clerkId: userId },
  });

  // Create new customer from Clerk profile
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || "",
        phone: user.phoneNumbers[0]?.phoneNumber || "",
      },
    });
  }

  // Load customer bookings
  const bookings = await prisma.booking.findMany({
    where: { customerId: customer.id },
    include: {
      services: {
        include: {
          service: true,
        },
      },
    },
    orderBy: { bookingDate: "desc" },
  });

  // Normalize structure for UI
  const normalizedCustomer = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || undefined,
  };

  return (
    <CustomerDashboard
      serverBookings={bookings}
      customer={normalizedCustomer}
      services={allServices}
    />
  );
}
