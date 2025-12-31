"use client"

import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PaidCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            No charge was made. Your booking is still unpaid.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-center">
            If this was a mistake, you can retry payment from your account or contact us for help.
          </p>

          <div className="flex gap-3">
            <Button asChild variant="default" className="flex-1">
              <Link href="/account">My Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}