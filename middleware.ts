import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isStaffRoute = createRouteMatcher(["/staff(.*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // allow sign-in/out pages
  if (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up") {
    return NextResponse.next()
  }

  // block suspended/removed users from staff routes
  if (userId && isStaffRoute(req)) {
    const user = await (await clerkClient()).users.getUser(userId)
    if (user.publicMetadata?.suspended || user.publicMetadata?.removed) {
      return NextResponse.redirect(new URL("/suspended", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}