import { Webhook } from "svix"
import { headers } from "next/headers"
import { prisma } from "../../../../lib/prisma"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const payload = await req.text()
  const headerPayload = Object.fromEntries(await headers())
  const svix = new Webhook(webhookSecret)
  const evt = svix.verify(payload, headerPayload) as any

  if (evt.type === "user.created") {
    const user = evt.data
    const invitedId = user.public_metadata?.invitedId
    if (invitedId) {
      // convert invite row to real staff
      await prisma.staff.update({
        where: { clerkId: `invite_${invitedId}` },
        data: { clerkId: user.id, status: "active" },
      })
    }
  }
  return new Response("OK", { status: 200 })
}