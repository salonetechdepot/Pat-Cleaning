"use client"

import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PDFDownloadLink } from "@react-pdf/renderer"
import ReceiptPDF from "./receipt-pdf"

type Receipt = {
  id: string
  amount: number
  customer_email: string
  payment_status: string
  services: { name: string; qty: number; price: number }[]
}

export default function PaidSuccess({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/stripe/session?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setReceipt(data))
      .catch(console.error)
  }, [sessionId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
          <CardTitle className="text-2xl">Payment Successful</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Your booking is now paid. A confirmation email has been sent.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {receipt ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice #</span>
                  <span className="font-mono">{receipt.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>${(receipt.amount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{receipt.customer_email}</span>
                </div>
              </div>

              <PDFDownloadLink
                document={
                  <ReceiptPDF
                    id={receipt.id}
                    customer={{ name: receipt.customer_email.split("@")[0], email: receipt.customer_email }}
                    services={receipt.services}
                    date={new Date().toISOString()}
                    amount={receipt.amount}
                  />
                }
                fileName={`invoice-${receipt.id}.pdf`}
              >
                {({ loading }) => (
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Preparing PDF…" : "Download Receipt (PDF)"}
                  </Button>
                )}
              </PDFDownloadLink>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Loading receipt…</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}