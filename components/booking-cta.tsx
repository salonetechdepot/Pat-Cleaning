"use client"

import { useState } from "react"
import {  useUser } from "@clerk/nextjs"
import { BookingForm } from "../components/booking-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Star, ChevronRight } from "lucide-react"
import { toast } from "sonner"

type Props = { services: any[] }

export function BookingCTA({ services }: Props) {
    
  
  const { user, isLoaded } = useUser()
  const [showForm, setShowForm] = useState(false)

  if (!isLoaded) return <p className="text-center py-10">Loading…</p>

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
          Sparkling Clean in 60 Seconds
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Trusted by hundreds of homes & offices. Pick a service, choose a time, relax.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Button size="lg" onClick={() => setShowForm(true)}>
              Book Now <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={() => window.location.href = "/sign-in"}>
              Sign In to Book
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => setShowForm(true)}>
            View Prices
          </Button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="relative overflow-hidden hover:shadow-xl transition-shadow">
              {s.imageUrl && (
                <img
                  src={s.imageUrl}
                  alt={s.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{s.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{s.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">${s.price}</span>
                  <span className="text-sm text-muted-foreground">{s.durationMin} min</span>
                </div>
                <Button className="w-full mt-4" onClick={() => setShowForm(true)}>
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3 text-center">
          <div>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Pick a Service</h3>
            <p className="text-sm text-muted-foreground">Choose from residential, commercial, or specialty cleaning.</p>
          </div>
          <div>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Choose Time</h3>
            <p className="text-sm text-muted-foreground">Select a slot that fits your schedule—same-day available.</p>
          </div>
          <div>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Relax</h3>
            <p className="text-sm text-muted-foreground">Our pros arrive fully equipped—leave the rest to us.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Amara J.", text: "Outstanding deep clean! My apartment has never looked this good.", rating: 5 },
            { name: "David K.", text: "Reliable, punctual, and very thorough. Highly recommend.", rating: 5 },
            { name: "Lisa M.", text: "Booked online in 2 minutes. Cleaner arrived on time and was super polite.", rating: 5 },
          ].map((t) => (
            <Card key={t.name} className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-4">“{t.text}”</p>
              <p className="font-semibold text-sm">— {t.name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready for a Sparkling Space?</h2>
        <p className="text-lg text-muted-foreground mb-8">Book in 60 seconds. Satisfaction guaranteed.</p>
        <Button size="lg" onClick={() => setShowForm(true)}>
          Book Your Cleaning <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Booking Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Book a Service</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                ✕
              </Button>
            </div>
            <div className="p-6">
             <BookingForm
                services={services}
                customer={user ? { email: user.primaryEmailAddress?.emailAddress, name: user.fullName } : undefined}
                onSuccess={() => {
                    setShowForm(false)
                    toast.success("Booking submitted!")
                }}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}