"use server"
import { prisma } from "../lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { uploadToCloudinary } from "../lib/cloudinary-client"
import { clerkClient } from "@clerk/nextjs/server"

export async function markOnTheWay(bookingId: number) {
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "IN_PROGRESS" } })
  revalidatePath("/staff")
}

export async function markComplete(bookingId: number) {
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } })
  revalidatePath("/staff")
}

export async function uploadJobPhotos(bookingId: number, files: File[]) {
  const urls = await Promise.all(files.map((f) => uploadToCloudinary(f)))
  await prisma.booking.update({
    where: { id: bookingId },
    data: { photos: { push: urls } }, // simple array push (or create Photo table later)
  })
  revalidatePath("/staff")
}


export async function inviteStaff(data: { name: string; email: string; phone?: string; role: string }) {
  "use server"
  const session = await auth()
  if (!session?.userId) throw new Error("Unauthorized")

  // duplicate check
  const existing = await prisma.staff.findFirst({ where: { email: data.email } })
  if (existing) return { ok: false, message: "Staff with this email already exists." }

  // invite to Clerk
  const res = await fetch("https://api.clerk.com/v1/invitations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: data.email,
      public_metadata: { role: data.role, invitedBy: session.userId },
      redirect_url: `${process.env.NEXT_PUBLIC_URL}/staff`,
    }),
  }).then((r) => r.json())

  if (!res.id) return { ok: false, message: "Clerk invite failed." }

  // create staff row
  await prisma.staff.create({
    data: {
      clerkId: `invite_${res.id}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      status: "invited",
    },
  })

  return { ok: true, message: "Invitation sent." }
}

export async function assignStaffToBooking(bookingId: number, staffId: number | null) {
  "use server"
  await prisma.booking.update({
    where: { id: bookingId },
    data: { assignedStaffId: staffId },
  })
  revalidatePath("/admin")
}

//staff action

export async function suspendStaff(staffId: number) {
  "use server"
  const staff = await prisma.staff.findUnique({ where: { id: staffId } })
  if (!staff) throw new Error("Staff not found")
  // suspend the actual Clerk user
  await (await clerkClient()).users.updateUser(staff.clerkId, { publicMetadata: { suspended: true } })
  await prisma.staff.update({ where: { id: staffId }, data: { status: "suspended" } })
  revalidatePath("/admin")
}

export async function removeStaff(staffId: number) {
  "use server"
  const staff = await prisma.staff.findUnique({ where: { id: staffId } })
  if (!staff) throw new Error("Staff not found")
  // permanently delete from Clerk + DB
  await (await clerkClient()).users.deleteUser(staff.clerkId)
  await prisma.staff.delete({ where: { id: staffId } })
  revalidatePath("/admin")
}

export async function reinstateStaff(staffId: number) {
  "use server"
  const staff = await prisma.staff.findUnique({ where: { id: staffId } })
  if (!staff) throw new Error("Staff not found")
  // reactivate the actual Clerk user
  await (await clerkClient()).users.updateUser(staff.clerkId, { publicMetadata: { suspended: false } })
  await prisma.staff.update({ where: { id: staffId }, data: { status: "active" } })
  revalidatePath("/admin")
}