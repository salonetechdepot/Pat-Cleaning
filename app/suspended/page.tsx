import { Card } from "@/components/ui/card"
export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-6">
        <h1 className="text-xl font-bold">Account Suspended</h1>
        <p className="text-muted-foreground mt-2">Please contact admin for support.</p>
      </Card>
    </div>
  )
}