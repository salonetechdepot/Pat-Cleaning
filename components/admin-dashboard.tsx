"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Booking , BookingStatus} from "@prisma/client"
import { inviteStaff } from "@/lib/staff-actions"
import { reinstateStaff, suspendStaff, removeStaff } from "../lib/staff-actions"
import { createBooking } from "../lib/server-actions"
import { sendCustomerConfirmation } from "../lib/mailer"
import {sendBookingUpdate} from "../lib/mailer"

// import {getAllStaff} from "../lib/staff"
// import { getAllServices } from "@/lib/services"
import { useUser } from "@clerk/nextjs"

import { getRecentAdminBookings } from "@/lib/admin-bookings"


import { uploadToCloudinary } from "../lib/cloudinary-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  LogOut,
  Users,
  XCircle,
  CalendarDays,
  Plus,
  Edit,
  Trash2,
  Star,
  User,
  Mail,
  Phone,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { createService } from "../lib/server-actions"
import { deleteService } from "../lib/server-actions"
import { updateService } from "../lib/server-actions"
import { confirmBooking, cancelBooking, completeBooking } from "../lib/server-actions"
import { assignStaffToBooking} from "../lib/staff-actions"
import {adminRescheduleBooking} from "../lib/server-actions"

type Props = { 
  serverServices: any[] 
  serverCustomers: any[]
  serverBookings?: any[]
  serverStaff?: any[]
}






type Staff = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: "active" | "inactive"
  assignedJobs: number
}



type Lead = {
  id: string
  name: string
  email: string
  phone: string
  service: string
  message: string
  status: "new" | "contacted" | "converted" | "lost"
  createdAt: string
}

type Feedback = {
  id: string
  customerName: string
  service: string
  rating: number
  comment: string
  date: string
  status: "pending" | "approved" | "rejected"
}


export function AdminDashboard({
  serverServices = [],
  serverCustomers = [],
  serverBookings = [],
  serverStaff = [],
}: Props) {

  const router = useRouter()
  const { user } = useUser()

  //service refresh state
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  //customer
 const [view, setView] = useState<{ open: boolean; customer: any }>({ open: false, customer: null })
 
  const [bookings, setBookings] = useState(serverBookings)
  const [customers, setCustomers] = useState(serverCustomers)
  const [services, setServices] = useState(serverServices)

  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [staffForm, setStaffForm] = useState({ name: "", email: "", phone: "", role: "cleaner" })

  const [filePreview, setFilePreview] = useState<string | null>(null)

  const [inviting, setInviting] = useState(false)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)

  

  

  const [leads] = useState<Lead[]>([
    {
      id: "1",
      name: "Alice Williams",
      email: "alice@example.com",
      phone: "(555) 444-5555",
      service: "Deep Cleaning",
      message: "Interested in weekly deep cleaning service for my home",
      status: "new",
      createdAt: "2025-01-12",
    },
    {
      id: "2",
      name: "Tom Anderson",
      email: "tom@example.com",
      phone: "(555) 555-6666",
      service: "Office Cleaning",
      message: "Need regular office cleaning for 5000 sq ft space",
      status: "contacted",
      createdAt: "2025-01-11",
    },
    {
      id: "3",
      name: "Lisa Martinez",
      email: "lisa@example.com",
      phone: "(555) 666-7777",
      service: "Move In/Out Cleaning",
      message: "Moving out next month, need thorough cleaning",
      status: "converted",
      createdAt: "2025-01-10",
    },
  ])

  const [feedback] = useState<Feedback[]>([
    {
      id: "1",
      customerName: "John Doe",
      service: "Deep Cleaning",
      rating: 5,
      comment: "Excellent service! The team was professional and thorough. My home has never been cleaner.",
      date: "2025-01-14",
      status: "approved",
    },
    {
      id: "2",
      customerName: "Jane Smith",
      service: "Regular Cleaning",
      rating: 4,
      comment: "Great job overall. Would appreciate if they could arrive on time consistently.",
      date: "2025-01-13",
      status: "approved",
    },
    {
      id: "3",
      customerName: "Bob Johnson",
      service: "Office Cleaning",
      rating: 5,
      comment: "Outstanding work! Our office looks amazing. Highly recommend Pat Pro Cleaning.",
      date: "2025-01-12",
      status: "pending",
    },
  ])


  

  const totalRevenue = bookings.reduce(
  (sum: number, b) =>
    sum +
    b.services.reduce(
      (inner: number, s: { service: { price: number }; qty: number }) =>
        inner + s.service.price * s.qty,
      0
    ),
  0
)
//calculate other stats
const pendingBookings = bookings.filter((b) => b.status === "PENDING").length
const recentBookings = bookings.slice(0, 5) // last 5 bookings
const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length

//booking action handlers
// const confirmBookingLocal = async (id: number) => {
//   await confirmBooking(id)
//   setBookings(prev => prev.map(b => (b.id === id ? { ...b, status: "CONFIRMED" } : b)))
//   toast.success("Booking confirmed")
// }

// const cancelBookingLocal = async (id: number) => {
//   await cancelBooking(id)
//   setBookings(prev =>
//     prev.map(b => (b.id === id ? { ...b, status: "CANCELLED" } : b))
//   )
//   toast.success("Booking cancelled")
// }

// const completeBookingLocal = async (id: number) => {
//   await completeBooking(id)
//   setBookings(prev =>
//     prev.map(b => (b.id === id ? { ...b, status: "COMPLETED" } : b))
//   )
//   toast.success("Booking completed")
// }
const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

const confirmBookingLocal = async (id: number) => {
  try {
    setActionLoadingId(id)
    await confirmBooking(id)

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "CONFIRMED" } : b
      )
    )

    toast.success("Booking confirmed")
  } catch (err) {
    console.error(err)
    toast.error("Failed to confirm booking")
  } finally {
    setActionLoadingId(null)
  }
}

const cancelBookingLocal = async (id: number) => {
  try {
    setActionLoadingId(id)
    await cancelBooking(id)

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "CANCELLED" } : b
      )
    )

    toast.success("Booking cancelled")
  } catch (err) {
    console.error(err)
    toast.error("Failed to cancel booking")
  } finally {
    setActionLoadingId(null)
  }
}

const completeBookingLocal = async (id: number) => {
  try {
    setActionLoadingId(id)
    await completeBooking(id)

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "COMPLETED" } : b
      )
    )

    toast.success("Booking completed")
  } catch (err) {
    console.error(err)
    toast.error("Failed to complete booking")
  } finally {
    setActionLoadingId(null)
  }
}



//services
const handleDelete = async (id: number) => {
  await deleteService(id)
  setServices(prev => prev.filter(s => s.id !== id))
  toast.success("Service deleted")
}

 const getStatusBadge = (status: Booking["status"]) => {
  const variants: Record<BookingStatus, "default" | "secondary"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  COMPLETED: "default",
  CANCELLED: "secondary",
  IN_PROGRESS: "default",
  RESCHEDULED: "secondary",
}

const colors: Record<BookingStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  CONFIRMED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  COMPLETED: "bg-green-100 text-green-800 hover:bg-green-100",
  CANCELLED: "bg-red-100 text-red-800 hover:bg-red-100",
  IN_PROGRESS: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  RESCHEDULED: "bg-orange-100 text-orange-800 hover:bg-orange-100",
}

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  )
}

  const getLeadStatusBadge = (status: Lead["status"]) => {
    const colors = {
      new: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      contacted: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      converted: "bg-green-100 text-green-800 hover:bg-green-100",
      lost: "bg-red-100 text-red-800 hover:bg-red-100",
    }

    return (
      <Badge variant="secondary" className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getFeedbackStatusBadge = (status: Feedback["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      approved: "bg-green-100 text-green-800 hover:bg-green-100",
      rejected: "bg-red-100 text-red-800 hover:bg-red-100",
    }

    return (
      <Badge variant="secondary" className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-primary">PAT PRO CLEANING - Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, Sahr</span>
              <Button variant="outline" size="sm" >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Manage bookings, customers, and business operations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedBookings}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">Active customers</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="book-customer">Book for Customers</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter((l) => l.status === "new").length}</div>
                    <p className="text-xs text-muted-foreground">Awaiting contact</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingBookings}</div>
                    <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customers.length}</div>
                    <p className="text-xs text-muted-foreground">Active customers</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentBookings.map((b) => (
                          <div key={b.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                            <div>
                              <p className="font-medium">{b.customer.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {b.services.map((s: { service: { name: string } }) => s.service.name).join(", ")}
                              </p>
                            </div>
                            {getStatusBadge(b.status)}
                            <select
                              value={b.assignedStaffId ?? ""}
                              onChange={async (e) => {
                                await assignStaffToBooking(b.id, e.target.value ? Number(e.target.value) : null)
                                router.refresh()
                              }}
                              className="mt-2 text-sm border rounded px-2 py-1"
                            >
                              <option value="">Unassigned</option>
                              {serverStaff.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {feedback.slice(0, 3).map((item) => (
                        <div key={item.id} className="border-b pb-3 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{item.customerName}</p>
                            {renderStars(item.rating)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>Track and manage potential customer inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Service Interest</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{lead.service}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{lead.message}</TableCell>
                        <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getLeadStatusBadge(lead.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Contact
                            </Button>
                            <Button size="sm" variant="outline">
                              Convert
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>Manage and track all service bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => {
                      const serviceNames = b.services.map((s: any) => s.service.name).join(", ")
                      return (
                        <TableRow key={b.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{b.customer.name}</p>
                              <p className="text-sm text-muted-foreground">{b.customer.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{serviceNames}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4" />
                              {new Date(b.bookingDate).toLocaleDateString()}
                              <Clock className="h-4 w-4 ml-2" />
                              {new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell>{b.customer.address || "-"}</TableCell>
                          <TableCell>{b.customer.phone || "No phone"}</TableCell>
                          <TableCell>${b.services.reduce((sum: number, s:any) => sum + s.service.price * s.qty, 0)}</TableCell>
                          <TableCell>{getStatusBadge(b.status)}</TableCell>
                          <TableCell>
                            {b.status === "PENDING" && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() =>  confirmBookingLocal(b.id) }>
                                  <CheckCircle className="h-4 w-4 mr-1" /> Confirm
                                </Button>
                                <Button size="sm" variant="outline" onClick={ () =>  cancelBookingLocal(b.id)}>
                                  <XCircle className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            )}
                            {b.status === "CONFIRMED" && (
                              <Button size="sm" variant="outline" onClick={ () => completeBookingLocal(b.id)}>
                                <CheckCircle className="h-4 w-4 mr-1" /> Complete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })} 
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback</CardTitle>
                <CardDescription>Manage customer reviews and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <CardTitle className="text-base">{item.customerName}</CardTitle>
                              {renderStars(item.rating)}
                            </div>
                            <CardDescription>
                              {item.service} • {new Date(item.date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          {getFeedbackStatusBadge(item.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">{item.comment}</p>
                        {item.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>View and manage customer information</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Last Booking</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => {
                  const total = bookings.filter((b) => b.customerId === c.id).length
                  const last = bookings
                    .filter((b) => b.customerId === c.id)
                    .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())[0]

                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.phone || "-"}</TableCell>
                      <TableCell>{total}</TableCell>
                      <TableCell>
                        {last ? new Date(last.bookingDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setView({ open: true, customer: c })}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff Management</CardTitle>
                    <CardDescription>Manage your cleaning staff and assignments</CardDescription>
                  </div>
                  {/* <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription>Enter the details of the new staff member</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="staff-name">Full Name</Label>
                          <Input id="staff-name" placeholder="Enter full name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-email">Email</Label>
                          <Input id="staff-email" type="email" placeholder="Enter email" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-phone">Phone</Label>
                          <Input id="staff-phone" placeholder="Enter phone number" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-role">Role</Label>
                          <Select>
                            <SelectTrigger id="staff-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cleaner">Cleaner</SelectItem>
                              <SelectItem value="senior">Senior Cleaner</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Add Staff Member</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog> */}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serverStaff?.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.phone || "—"}</TableCell>
                        <TableCell>{s.role}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {s.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await suspendStaff(s.id)
                                toast.success("Staff suspended")
                              }}
                            >
                              Suspend
                            </Button>
                          )}
                          {s.status === "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await reinstateStaff(s.id)
                                toast.success("Staff reinstated")
                              }}
                            >
                              Reinstate
                          </Button>
                          )}
                          {(s.status === "suspended") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (confirm("Are you sure you want to permanently delete this staff? This cannot be undone.")) {
                                  await removeStaff(s.id)
                                  toast.success("Staff permanently removed")
                                }
                              }}
                            >
                              Delete Forever
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Add Staff</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        setInviting(true)
                        try {
                          await inviteStaff(staffForm)
                          toast.success("Invitation sent")
                          setAddStaffOpen(false)
                        } catch (err: any) {
                          toast.error(err.message)
                        } finally {
                          setInviting(false)
                        }
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>Add New Staff</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Label>Name</Label>
                        <Input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} required />
                        <Label>Email</Label>
                        <Input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
                        <Label>Phone</Label>
                        <Input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} />
                        <Label>Role</Label>
                        <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cleaner">Cleaner</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={inviting}>
                          {inviting ? "Sending…" : "Send Invitation"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Service Management</CardTitle>
                    <CardDescription>Manage your cleaning services and pricing</CardDescription>
                  </div>
                  <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form
                        action={async (fd) => {
                        "use client"
                        const file = fd.get("image") as File
                        let imageUrl: string | undefined
                        if (file && file.size > 0) {
                          const bytes = await file.arrayBuffer()
                          const base64 = Buffer.from(bytes).toString("base64")
                          const dataUri = `data:${file.type};base64,${base64}`
                          imageUrl = await uploadToCloudinary(file) 
                        }

                        await createService({
                          name: fd.get("name") as string,
                          description: fd.get("description") as string,
                          price: Number(fd.get("price")),
                          durationMin: Number(fd.get("durationMin")),
                          category: fd.get("category") as string,
                          imageUrl,
                        })
                        setAddOpen(false)
                        setServices(prev => [...prev, { /* optimistic stub */ }])
                      }}
                      >
                        <DialogHeader>
                          <DialogTitle>Add New Service</DialogTitle>
                          <DialogDescription>Create a new cleaning service offering</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="service-name">Service Name</Label>
                            <Input name="name" id="service-name" placeholder="Enter service name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="service-description">Description</Label>
                            <Textarea name="description" id="service-description" placeholder="Enter service description" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="service-price">Price ($)</Label>
                              <Input name="price" id="service-price" type="number" placeholder="0" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="service-duration">Duration (minutes)</Label>
                              <Input name="durationMin" id="service-duration" type="number" placeholder="120" required />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="service-category">Category</Label>
                          <Select name="category" defaultValue="Residential">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Residential">Residential</SelectItem>
                              <SelectItem value="Commercial">Commercial</SelectItem>
                              <SelectItem value="Specialty">Specialty</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Image</Label>
                          <input
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) setFilePreview(URL.createObjectURL(f))
                              else setFilePreview(null)
                            }}
                          />
                          {filePreview && (
                            <img src={filePreview} alt="Preview" className="w-32 h-20 object-cover rounded border" />
                          )}
                        </div>

                        <DialogFooter>
                          <Button type="submit">Add Service</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  {/* editing dialog */}
                  {/* ======  EDIT DIALOG  ====== */}
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                      <form
                       action={async (fd) => {
                        "use client"
                        const file = fd.get("image") as File
                        const currentImage = fd.get("currentImage") as string
                        let imageUrl: string | undefined = currentImage || undefined
                        if (file && file.size > 0) {
                          const bytes = await file.arrayBuffer()
                          const base64 = Buffer.from(bytes).toString("base64")
                          const dataUri = `data:${file.type};base64,${base64}`
                          imageUrl = await uploadToCloudinary(file)
                        }
                          console.log("uploaded URL", imageUrl)
                          
                        await updateService(editing.id, {
                          name: fd.get("name") as string,
                          description: fd.get("description") as string,
                          price: Number(fd.get("price")),
                          durationMin: Number(fd.get("durationMin")),
                          category: fd.get("category") as string,
                          imageUrl,
                        })

                        setEditOpen(false)
                        setServices(prev =>
                          prev.map(svc =>
                            svc.id === editing.id
                              ? {
                                  ...svc,
                                  name: fd.get("name") as string,
                                  description: fd.get("description") as string,
                                  price: Number(fd.get("price")),
                                  durationMin: Number(fd.get("durationMin")),
                                  category: fd.get("category") as string,
                                  imageUrl,
                                }
                              : svc
                          )
                        )
                      }}
                      >
                        <DialogHeader>
                          <DialogTitle>Edit Service</DialogTitle>
                          <DialogDescription>Update service details</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Service Name</Label>
                            <Input name="name" defaultValue={editing?.name} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea name="description" defaultValue={editing?.description} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Price ($)</Label>
                              <Input name="price" type="number" defaultValue={editing?.price} required />
                            </div>
                            <div className="space-y-2">
                              <Label>Duration (minutes)</Label>
                              <Input name="durationMin" type="number" defaultValue={editing?.durationMin} required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="service-category">Category</Label>
                              <Select name="category" defaultValue={editing?.category || "Residential"}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Residential">Residential</SelectItem>
                                  <SelectItem value="Commercial">Commercial</SelectItem>
                                  <SelectItem value="Specialty">Specialty</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                            <Label>Image</Label>
                            <input
                              name="image"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0]
                                if (f) setFilePreview(URL.createObjectURL(f))
                                else setFilePreview(null)
                              }}
                            />
                            {filePreview && (
                              <img src={filePreview} alt="Preview" className="w-32 h-20 object-cover rounded border" />
                            )}
                          </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
             
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                  <Card key={service.id} className="border-border hover:shadow-lg transition-shadow overflow-hidden">
                    {service.imageUrl && (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-32 object-cover rounded-t"
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      />
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          <Badge variant="secondary" className="mt-2">
                            {service.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(service)
                              setEditOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => await handleDelete(service.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Price:</span>
                          <span className="font-semibold">${service.price}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Duration:</span>
                          <span className="text-sm">{service.durationMin} min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Calendar</CardTitle>
                <CardDescription>View and manage booking schedule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline">Today</Button>
                      <Button variant="outline">Week</Button>
                      <Button variant="outline">Month</Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg p-8">
                    <div className="flex items-center justify-center h-96 text-muted-foreground">
                      <div className="text-center">
                        <CalendarDays className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">Calendar View</p>
                        <p className="text-sm">Interactive calendar with drag-and-drop scheduling</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Today's Jobs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">5</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">This Week</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">23</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Next Week</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">18</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* <TabsContent value="admin-users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Book for Customer</CardTitle>
                    <CardDescription>Create bookings for new or existing customer</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Admin User</DialogTitle>
                        <DialogDescription>Create a new admin account with specific permissions</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-name">Full Name</Label>
                          <Input id="admin-name" placeholder="Enter full name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-email">Email</Label>
                          <Input id="admin-email" type="email" placeholder="Enter email" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-role">Role</Label>
                          <Select>
                            <SelectTrigger id="admin-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-password">Temporary Password</Label>
                          <Input id="admin-password" type="password" placeholder="Enter temporary password" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Create Admin User</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {admin.role
                              .split("_")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{admin.lastLogin}</TableCell>
                        <TableCell>
                          <Badge variant={admin.status === "active" ? "default" : "secondary"}>{admin.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent> */}
          <TabsContent value="book-customer" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Book for Customers</h2>
                <p className="text-muted-foreground">Create bookings for new or existing customers</p>
              </div>
              <Button onClick={() => setShowNewCustomerModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </div>

            {/* New Customer Modal */}
            {showNewCustomerModal && (
              <NewCustomerBookingModal
                onClose={() => setShowNewCustomerModal(false)}
                onSuccess={() => {
                  setShowNewCustomerModal(false)
                  toast.success("Booking created successfully!")
                }}
              />
            )}

            {/* Recent Bookings Created by Admin */}
            <RecentAdminBookings />
          </TabsContent>
            {/* profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>Manage your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <Button variant="outline">Change Photo</Button>
                      <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF. Max size 2MB</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Full Name</Label>
                      <Input id="profile-name"  />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input id="profile-email" type="email"  />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Phone</Label>
                      <Input id="profile-phone" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-role">Role</Label>
                      <Input id="profile-role" defaultValue="Super Admin" disabled />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Change Password</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button>Save Changes</Button>
                    <Button variant="outline">Cancel</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            {/* settings tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Settings</CardTitle>
                  <CardDescription>Configure your business information and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Business Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name</Label>
                        <Input id="business-name" defaultValue="Pat Pro Cleaning" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business-phone">Business Phone</Label>
                        <Input id="business-phone" placeholder="(555) 123-4567" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business-email">Business Email</Label>
                        <Input id="business-email" type="email" placeholder="info@patpro.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business-website">Website</Label>
                        <Input id="business-website" placeholder="www.patpro.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-address">Business Address</Label>
                      <Textarea id="business-address" placeholder="Enter full business address" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notification Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New Booking Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive alerts for new bookings</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Lead Notifications</Label>
                          <p className="text-sm text-muted-foreground">Get notified about new leads</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Feedback Notifications</Label>
                          <p className="text-sm text-muted-foreground">Alerts for new customer feedback</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive email updates</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Booking Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="booking-buffer">Booking Buffer Time (minutes)</Label>
                        <Input id="booking-buffer" type="number" defaultValue="30" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advance-booking">Advance Booking Days</Label>
                        <Input id="advance-booking" type="number" defaultValue="30" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-confirm Bookings</Label>
                        <p className="text-sm text-muted-foreground">Automatically confirm new bookings</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button>Save Settings</Button>
                    <Button variant="outline">Reset to Default</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
            {/* custumer details dialog */}
      <Dialog open={view.open} onOpenChange={(open) => setView((v) => ({ ...v, open }))}>
                  
                    <DialogContent >
                      <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2 py-4">
                        <p><strong>Name:</strong> {view.customer?.name}</p>
                        <p><strong>Email:</strong> {view.customer?.email}</p>
                        <p><strong>Phone:</strong> {view.customer?.phone || "-"}</p>
                        <p><strong>Address:</strong> {view.customer?.address || "-"}</p>
                        <p><strong>Total Bookings:</strong> {bookings.filter((b) => b.customerId === view.customer?.id).length}</p>
                        <p><strong>Member since:</strong> {view.customer?.createdAt ? new Date(view.customer.createdAt).toLocaleDateString() : "-"}</p>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => setView({ open: false, customer: null })}>Close</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
    </div>
  )
}

//Recent Admin booking function

function RecentAdminBookings() {

  const [bookings, setBookings] = useState<any[]>([])

const [rescheduleId, setRescheduleId] = useState<number | null>(null)
const [newDate, setNewDate] = useState("")

const [actionLoading, setActionLoading] = useState<{
  id: number
  type: "confirm" | "cancel" | "complete" | "reschedule"
} | null>(null)



const confirmBookingLocal = async (id: number) => {
  try {
    setActionLoading({ id, type: "confirm" })
    await confirmBooking(id)

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "CONFIRMED" } : b
      )
    )

    toast.success("Booking confirmed")
  } catch (err) {
    console.error(err)
    toast.error("Failed to confirm booking")
  } finally {
    setActionLoading(null)
  }
}



const cancelBookingLocal = async (id: number) => {
  try {
    setActionLoading({ id, type: "cancel" })
    await cancelBooking(id)

    // ✅ REMOVE cancelled booking from UI
    setBookings((prev) => prev.filter((b) => b.id !== id))

    toast.success("Booking cancelled")
  } catch (err) {
    console.error(err)
    toast.error("Failed to cancel booking")
  } finally {
    setActionLoading(null)
  }
}


const completeBookingLocal = async (id: number) => {
  try {
    setActionLoading({ id, type: "complete" })
    await completeBooking(id)

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: "COMPLETED" } : b
      )
    )

    toast.success("Booking completed")
  } catch (err) {
    console.error(err)
    toast.error("Failed to complete booking")
  } finally {
    setActionLoading(null)
  }
}
const rescheduleBookingLocal = async (id: number) => {
  if (!newDate) {
    toast.error("Select a new date")
    return
  }

  try {
    setActionLoading({ id, type: "reschedule" })

    const updated = await adminRescheduleBooking(
      id,
      new Date(newDate)
    )

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    )

    setRescheduleId(null)
    setNewDate("")
    toast.success("Booking rescheduled")
  } catch (err) {
    console.error(err)
    toast.error("Failed to reschedule booking")
  } finally {
    setActionLoading(null)
  }
}




  // fetch recent bookings created by admin 
//   useEffect(() => {
//   async function loadBookings() {
//     try {
//       const res = await fetch("/api/admin/recent-bookings")
//       const data = await res.json()
//       setBookings(data)
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   loadBookings()
// }, [])

useEffect(() => {
  async function loadBookings() {
    try {
      const data = await getRecentAdminBookings()
      setBookings(data)
    } catch (err) {
      console.error(err)
    }
  }

  loadBookings()
}, [])




  // return (
  //   <div>
  //     <h3 className="text-lg font-semibold mb-4">Recent Admin Bookings</h3>
  //     {bookings.length ? (
  //       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  //         {bookings.map((b) => (
  //           <Card key={b.id}>
  //             <CardHeader>
  //               <CardTitle>{b.services.map((s: any) => s.service.name).join(", ")}</CardTitle>
  //               <CardDescription>{b.customer.name}</CardDescription>
  //             </CardHeader>
  //             <CardContent>
  //               <div className="flex items-center gap-2 text-sm text-muted-foreground">
  //                 <Calendar className="h-4 w-4" />
  //                 {new Date(b.bookingDate).toLocaleDateString()}
  //                 <Clock className="h-4 w-4 ml-2" />
  //                 {new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  //               </div>
  //               <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
  //                 <span className="font-semibold">
  //                   $
  //                   {b.services.reduce(
  //                     (sum: number, s: any) => sum + (s.service?.price || 0) * (s.qty || 1),
  //                     0
  //                   )}
  //                 </span>
  //                 <div className="mt-4 flex gap-2 flex-wrap">
  //                   {b.status === "PENDING" && (
  //                     <Button
  //                       size="sm"
  //                       disabled={actionLoadingId === b.id}
  //                       onClick={() => confirmBookingLocal(b.id)}
  //                     >
  //                       {actionLoadingId === b.id ? "Confirming..." : "Confirm"}
  //                     </Button>
  //                   )}

  //                   {b.status !== "CANCELLED" && (
  //                     <Button
  //                       size="sm"
  //                       variant="destructive"
  //                       disabled={actionLoadingId === b.id}
  //                       onClick={() => cancelBookingLocal(b.id)}
  //                     >
  //                       {actionLoadingId === b.id ? "Cancelling..." : "Cancel"}
  //                     </Button>
  //                   )}

  //                   {b.status === "CONFIRMED" && (
  //                     <Button
  //                       size="sm"
  //                       variant="outline"
  //                       disabled={actionLoadingId === b.id}
  //                       onClick={() => completeBookingLocal(b.id)}
  //                     >
  //                       {actionLoadingId === b.id ? "Completing..." : "Complete"}
  //                     </Button>
  //                   )}
  //                 </div>

  //                 {b.assignedStaff && (
  //                 <div className="text-sm mt-2">
  //                   Assigned to: <span className="font-medium">{b.assignedStaff.name}</span>
  //                 </div>
  //               )}

  //               </div>
  //             </CardContent>
  //           </Card>
  //         ))}
  //       </div>
  //     ) : (
  //       <Card>
  //         <CardContent className="py-10 text-center text-muted-foreground">No recent bookings</CardContent>
  //       </Card>
  //     )}
  //   </div>
  // )
  return (
  <div className="w-full">
    <h3 className="text-lg font-semibold mb-4">Recent Admin Bookings</h3>

    {bookings.length ? (
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((b) => {
          const totalAmount = b.services.reduce(
            (sum: number, s: any) =>
              sum + (s.service?.price || 0) * (s.qty || 1),
            0
          )

          return (
            <Card key={b.id} className="flex flex-col justify-between">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold line-clamp-2">
                  {b.services.map((s: any) => s.service.name).join(", ")}
                </CardTitle>

                <CardDescription className="flex items-center justify-between">
                  <span>{b.customer.name}</span>

                  {/* STATUS BADGE */}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium
                      ${b.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : ""}
                      ${b.status === "CONFIRMED" ? "bg-blue-100 text-blue-800" : ""}
                      ${b.status === "COMPLETED" ? "bg-green-100 text-green-800" : ""}
                      ${b.status === "CANCELLED" ? "bg-red-100 text-red-800" : ""}
                    `}
                  >
                    {b.status}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* DATE & TIME */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(b.bookingDate).toLocaleDateString()}
                  </span>

                  <Clock className="h-4 w-4 ml-2" />
                  <span>
                    {new Date(b.bookingDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* PRICE & STAFF */}
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-foreground">
                    ${totalAmount}
                  </span>

                  {b.assignedStaff && (
                    <div className="text-muted-foreground text-sm">
                      Assigned to:{" "}
                      <span className="font-medium">
                        {b.assignedStaff.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {b.status === "PENDING" && (
                    <Button
                      size="sm"
                      disabled={actionLoading?.id === b.id}
                      onClick={() => confirmBookingLocal(b.id)}
                    >
                      {actionLoading?.id === b.id && actionLoading?.type === "confirm"
                        ? "Confirming..."
                        : "Confirm"}
                    </Button>

                  )}

                  {b.status !== "CANCELLED" &&
                    b.status !== "COMPLETED" && (
                      <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading?.id === b.id}
                      onClick={() => cancelBookingLocal(b.id)}
                    >
                      {actionLoading?.id === b.id && actionLoading?.type === "cancel"
                        ? "Cancelling..."
                        : "Cancel"}
                    </Button>

                    )}

                  {b.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoading?.id === b.id}
                      onClick={() => completeBookingLocal(b.id)}
                    >
                      {actionLoading?.id === b.id && actionLoading?.type === "complete"
                        ? "Completing..."
                        : "Complete"}
                    </Button>

                  )}
                  {b.status !== "CANCELLED" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setRescheduleId(b.id)}
                    >
                      Reschedule
                    </Button>
                  )}
                  
                </div>
                {rescheduleId === b.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      type="datetime-local"
                      className="border rounded px-2 py-1 text-sm"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => rescheduleBookingLocal(b.id)}
                        disabled={actionLoading?.id === b.id}
                      >
                        {actionLoading?.type === "reschedule" ? "Saving..." : "Save"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRescheduleId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          )
        })}
      </div>
    ) : (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No recent bookings
        </CardContent>
      </Card>
    )}
  </div>
)

}

// New Customer Booking Modal Component

function NewCustomerBookingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [bookingForm, setBookingForm] = useState({
    serviceIds: [] as number[],
    date: "",
    notes: "",
    staffId: null as string | null,
  })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // fetch services for dropdown
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])

  useEffect(() => {
  async function loadData() {
    try {
      const [servicesRes, staffRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/staff"),
      ])

      const servicesData = await servicesRes.json()
      const staffData = await staffRes.json()

      setServices(servicesData)
      setStaff(staffData)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load services or staff")
    }
  }

  loadData() // ✅ YOU WERE MISSING THIS
}, [])

//   }

//   setLoading(true)

//   try {
//     // 1. create booking (admin is proxy – no customer creation)
//     const booking = await createBooking({
//       serviceIds: bookingForm.serviceIds,
//       bookingDate: new Date(bookingForm.date),
//       address: customerForm.address,
//       notes: bookingForm.notes,
//       phone: customerForm.phone,
//       clerkId: "", // no customer – admin is proxy
//       email: customerForm.email,
//       name: customerForm.name,
//     })

//     // 2. send confirmation email to the person (not a customer)
//     await sendCustomerConfirmation(
//       customerForm.email,
//       customerForm.name,
//       booking.id,
//       booking.services.map((s) => s.service.name).join(", "),
//       booking.bookingDate.toISOString()
//     )

//     onSuccess()
//   } catch (err: any) {
//     toast.error(err.message)
//   } finally {
//     setLoading(false)
//   }
// }
  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()

  if (
    !customerForm.name ||
    !customerForm.email ||
    !bookingForm.date ||
    bookingForm.serviceIds.length === 0
  ) {
    toast.error("Please fill all required fields")
    return
  }

  setLoading(true)

  try {
    // ✅ 1. Create booking FIRST (NO staff here)
    const booking = await createBooking({
      serviceIds: bookingForm.serviceIds,
      bookingDate: new Date(bookingForm.date),
      address: customerForm.address,
      notes: bookingForm.notes,
      phone: customerForm.phone,
      clerkId: "ADMIN_PROXY",
      email: customerForm.email,
      name: customerForm.name,
    })

    // ✅ 2. Assign staff ONLY if selected
    if (bookingForm.staffId) {
      await assignStaffToBooking(
        booking.id,
        Number(bookingForm.staffId)
      )
    }

    // ✅ 3. Send confirmation email
    await sendCustomerConfirmation(
      customerForm.email,
      customerForm.name,
      booking.id,
      booking.services
        .map((s) => s.service.name)
        .join(", "),
      booking.bookingDate.toISOString()
    )

    toast.success("Booking created successfully")
    onSuccess()
    onClose()
  } catch (err: any) {
    console.error(err)
    toast.error(err.message || "Booking failed")
  } finally {
    setLoading(false)
  }
}


  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Book for New Customer</DialogTitle>
          <DialogDescription>Fill in customer and booking details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="Full Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  placeholder="Email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="Phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="Service Address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Booking Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
  <Label>Services</Label>

  <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
    {services.length > 0 ? (
      services.map((s) => (
        <label key={s.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={bookingForm.serviceIds.includes(s.id)}
            onChange={(e) => {
              setBookingForm((prev) => ({
                ...prev,
                serviceIds: e.target.checked
                  ? [...prev.serviceIds, s.id]
                  : prev.serviceIds.filter((id) => id !== s.id),
              }))
            }}
          />
          {s.name} – ${s.price}
        </label>
      ))
    ) : (
      <p className="text-sm text-muted-foreground">
        No services available
      </p>
    )}
  </div>
</div>


              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Extra notes"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign Staff (optional)</Label>
                <Select
  value={bookingForm.staffId ?? "unassigned"}
  onValueChange={(val) =>
    setBookingForm({
      ...bookingForm,
      staffId: val === "unassigned" ? null : val,
    })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Select staff" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="unassigned">Unassigned</SelectItem>

    {staff.length > 0 ? (
      staff.map((s) => (
        <SelectItem key={s.id} value={String(s.id)}>
          {s.name}
        </SelectItem>
      ))
    ) : (
      <SelectItem value="no-staff" disabled>
        No staff available
      </SelectItem>
    )}
  </SelectContent>
</Select>

              </div>
            </div>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}