"use client"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { BookingForm } from "../components/booking-form"
import { toast } from "sonner"
import { Calendar, Clock, Home, Plus, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { useClerk } from "@clerk/nextjs"
import { cancelBooking } from "../lib/server-actions"
import { rescheduleBooking } from "../lib/server-actions"
import { updateCustomerProfile } from "../lib/server-actions"
import { bookAgain } from "../lib/server-actions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Sun, Moon } from "lucide-react"

import { ClientOnly } from "./client-only"
import { Countdown } from "./countdown"


type Props = {
  serverBookings: any[]
  customer: { id: number; name: string; email: string; phone?: string; address?: string }
   services: any[] 
}

export function CustomerDashboard({ serverBookings, customer, services }: Props) {
  if (!customer) return <p>Loading customer…</p>
  const { signOut } = useClerk() 
  const { user } = useUser()
  const router = useRouter()


  const [bookings] = useState(serverBookings) // local state for future edits
  const [showBookingForm, setShowBookingForm] = useState(false)

  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduling, setRescheduling] = useState<any>(null)

  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: customer.name,
    phone: customer.phone || "",
    address: customer.address || "",
  })

  const upcoming = bookings.filter((b) => b.status === "PENDING")
  const past = bookings.filter((b) => b.status === "COMPLETED" || b.status === "CANCELLED")

  if (!user) return <p>Please sign in.</p>



  return (
    // your existing JSX stays identical—just replace hard-coded data with:
    // customer.name, customer.email, bookings.length, upcoming.length, etc.
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-primary">PAT PRO CLEANING</h1>
            <div className="flex items-center gap-4">
              
              <span className="text-sm text-muted-foreground">Welcome, {customer.name}</span>
              <Button variant="outline" size="sm" onClick={() => signOut(() => router.push("/"))}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h2>
          <p className="text-muted-foreground">Manage your bookings and account</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="new">New Booking</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* live stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Cleanings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcoming.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Past Bookings</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{past.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* upcoming bookings */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Upcoming Bookings</h3>
              {upcoming.length > 0 ? (
                <div className="grid gap-4">
                  {upcoming.map((b) => (
                    <Card key={b.id}>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          {b.services[0]?.service.imageUrl && (
                            <img
                              src={b.services[0].service.imageUrl}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <CardTitle>{b.services.map((s: any) => s.service.name).join(", ")}</CardTitle>
                            <CardDescription>
                              {b.services.map((s: any) => (
                                <span key={s.service.id} className="inline-block mr-2 mb-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                                  {s.service.category}
                                </span>
                              ))}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(b.bookingDate).toLocaleDateString()}
                          <ClientOnly>
                            <Countdown date={new Date(b.bookingDate)} />
                          </ClientOnly>
                        </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setRescheduling(b); setRescheduleOpen(true) }}>
                            Reschedule
                          </Button>
                          <Button variant="outline" size="sm" onClick={async () => { await cancelBooking(b.id); toast.success("Booking cancelled"); router.refresh(); }}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No upcoming bookings</p>
                    <Button className="mt-4" onClick={() => setShowBookingForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Book a Service
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* past bookings */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Past Bookings</h3>
              {past.length > 0 ? (
                <div className="grid gap-4">
                  {past.map((b) => (
                    <Card key={b.id}>
                      <CardHeader>
                        <CardTitle>{b.services.map((s: any) => s.service.name).join(", ")}</CardTitle>
                        <CardDescription>{b.address || customer.address}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(b.bookingDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                         <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                            <span>
                              Total: <span className="font-semibold text-foreground">${b.services.reduce((sum: number, s: any) => sum + s.service.price * s.qty, 0)}</span>
                            </span>
                          </div>
                        <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 bg-transparent"
                        onClick={async () => {
                          const ids = b.services.map((s: any) => s.service.id)
                          await bookAgain(customer.id, ids)
                          toast.success("New booking created for tomorrow 9 AM")
                          router.push("/account?tab=bookings")
                        }}
                      >
                        Book Again
                      </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No past bookings</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="new">
           <BookingForm services={services} onSuccess={() => { setShowBookingForm(false); toast.success("Booking created!") }} />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                {editingProfile ? (
                  <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      await updateCustomerProfile(user.id, profileForm)
                      toast.success("Profile updated")
                      setEditingProfile(false)
                    }}
                  >
                    <Label>Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                    <Label>Phone</Label>
                    <Input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                    <Label>Address</Label>
                    <Input
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Save</Button>
                      <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                    {customer.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
                    <Button variant="outline" className="mt-4" onClick={() => setEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
  <DialogContent>
    <form
      action={async (fd) => {
        "use client"
        const newDate = fd.get("newDate") as string
        await rescheduleBooking(rescheduling.id, new Date(newDate))
        setRescheduleOpen(false)
        toast.success("Booking rescheduled")
        router.refresh()
      }}
    >
      <DialogHeader>
        <DialogTitle>Reschedule Booking</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <Label>New Date & Time</Label>
        <Input name="newDate" type="datetime-local" required />
      </div>
      <DialogFooter>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
    </div>
  )
}