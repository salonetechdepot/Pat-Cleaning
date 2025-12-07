"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Phone, Camera, CheckCircle } from "lucide-react"
import { markOnTheWay, markComplete, uploadJobPhotos } from "../lib/staff-actions"

export function JobCard({ job, onStatusUpdate }: { job: any; onStatusUpdate: () => void }) {
  const [photos, setPhotos] = useState<File[]>([])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setPhotos(files)
    await uploadJobPhotos(job.id, files)
    onStatusUpdate()
    alert("Photos uploaded!")
  }

  return (
    <Card className="relative">
      {job.status === "CONFIRMED" && (
        <div className="absolute top-2 right-2">
          <Button size="sm" onClick={() => { markOnTheWay(job.id); onStatusUpdate() }}>
            <CheckCircle className="h-4 w-4 mr-2" /> On the Way
          </Button>
        </div>
      )}
      {job.status === "IN_PROGRESS" && (
        <div className="absolute top-2 right-2">
          <Button size="sm" onClick={() => { markComplete(job.id); onStatusUpdate() }}>
            <CheckCircle className="h-4 w-4 mr-2" /> Complete
          </Button>
        </div>
      )}

      <CardHeader>
        <CardTitle>{job.services.map((s: any) => s.service.name).join(", ")}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Calendar className="h-4 w-4" />
          {new Date(job.bookingDate).toLocaleDateString()}
          <Clock className="h-4 w-4" />
          {new Date(job.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          <span>{job.address || job.customer.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4" />
          <span>{job.customer.phone || "No phone"}</span>
        </div>
        {job.notes && (
          <div className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-2">
            Notes: {job.notes}
          </div>
        )}

        {job.status === "IN_PROGRESS" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Before / After Photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}