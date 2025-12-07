"use client"

import { useState } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Camera, CheckCircle, MapPin, Phone } from "lucide-react"
import { JobCard } from "./job-card"
import { toast } from "sonner"
import { markOnTheWay, markComplete, uploadJobPhotos } from "../lib/staff-actions"

type Props = { staff: any; bookings: any[] }

export function StaffDashboard({ staff, bookings }: Props) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [photos, setPhotos] = useState<File[]>([])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayJobs = bookings.filter((b) => new Date(b.bookingDate).toDateString() === today.toDateString())
  const upcoming = bookings.filter((b) => new Date(b.bookingDate) > today)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-primary">Staff Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welcome, {staff.name}</span>
            <Button variant="outline" size="sm" onClick={() => signOut(() => router.push("/"))}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <h2 className="text-2xl font-bold">Today’s Jobs</h2>
            {todayJobs.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {todayJobs.map((job) => (
                  <JobCard key={job.id} job={job} onStatusUpdate={() => window.location.reload()} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">No jobs scheduled for today.</CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <h2 className="text-2xl font-bold">Upcoming Jobs</h2>
            {upcoming.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((job) => (
                  <JobCard key={job.id} job={job} onStatusUpdate={() => window.location.reload()} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">No upcoming jobs.</CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}