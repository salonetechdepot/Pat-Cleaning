// "use client"

// import { useState } from "react"
// import { useUser } from "@clerk/nextjs"
// import { createBooking } from "../lib/server-actions"
// import { sendCustomerConfirmation } from "../lib/mailer"
// import { toast } from "sonner"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"


// type Props = { services: any[]; onSuccess?: () => void; customer?: any}

// export function BookingForm({ services, onSuccess, customer }: Props) {
//   const { user, isLoaded } = useUser()
//   const [selected, setSelected] = useState<number[]>([])
//   const [date, setDate] = useState("")
//   const [address, setAddress] = useState("")
//   const [phone, setPhone] = useState("")
//   const [notes, setNotes] = useState("")
//   const [loading, setLoading] = useState(false)

//   if (!isLoaded) return <p>Loading user…</p>
//   if (!user) return <p>Please sign in to book.</p>

//   async function handleSubmit(fd: FormData) {
//     setLoading(true)
//     const booking = await createBooking({
//       serviceIds: selected,
//       bookingDate: new Date(date),
//       address,
//       notes,
//       clerkId: user.id,
//       email: user.primaryEmailAddress?.emailAddress || "",
//       name: user.fullName || "",
//       phone: user.primaryPhoneNumber?.phoneNumber || undefined,
      
//     }
    
//   )
//     await sendCustomerConfirmation(
//       customer.email,
//       customer.name,
//       booking.id,
//       booking.services.map((s) => s.service.name).join(", "),
//       booking.bookingDate.toISOString()
//     )
//     setLoading(false)
//     onSuccess?.()
//     toast.success("Booking created successfully!")
//   }

//   return (
//     <form action={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block font-medium mb-2">Choose service(s)</label>
//         {services.map((s) => (
//           <label key={s.id} className="flex items-center gap-2 mb-2">
//             <input
//               type="checkbox"
//               checked={selected.includes(s.id)}
//               onChange={(e) =>
//                 setSelected((prev) =>
//                   e.target.checked ? [...prev, s.id] : prev.filter((i) => i !== s.id)
//                 )
//               }
//             />
//             {s.name} – ${s.price}
//           </label>
//         ))}
//       </div>

//       <input
//         name="date"
//         type="datetime-local"
//         required
//         value={date}
//         onChange={(e) => setDate(e.target.value)}
//         className="w-full border rounded px-3 py-2"
//       />

//       <textarea
//         name="address"
//         placeholder="Service address"
//         required
//         value={address}
//         onChange={(e) => setAddress(e.target.value)}
//         className="w-full border rounded px-3 py-2"
//       />
//       <div className="space-y-2">
//       <Label>Phone (optional)</Label>
//       <Input
//         name="phone"
//         type="tel"
//         placeholder="Phone (optional)"
//         value={phone}
//         onChange={(e) => setPhone(e.target.value)}
//         className="w-full border rounded px-3 py-2"
//       />
//     </div>

//       <textarea
//         name="notes"
//         placeholder="Extra notes (optional)"
//         value={notes}
//         onChange={(e) => setNotes(e.target.value)}
//         className="w-full border rounded px-3 py-2"
//       />

//       <button
//         type="submit"
//         disabled={loading || selected.length === 0}
//         className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
//       >
//         {loading ? "Booking..." : "Submit Booking"}
//       </button>
//     </form>
//   )
// }



// components/booking-form.tsx
"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { createBooking } from "../lib/server-actions"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { services: any[]; onSuccess?: () => void; customer?: any }

export function BookingForm({ services, onSuccess, customer }: Props) {
  const { user, isLoaded } = useUser()
  const [selected, setSelected] = useState<number[]>([])
  const [date, setDate] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isLoaded) return <p>Loading user…</p>
  if (!user) return <p>Please sign in to book.</p>

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selected.length === 0) {
      toast.error("Please choose at least one service.")
      return
    }
    if (!date) {
      toast.error("Please select a date and time.")
      return
    }
    setLoading(true)

    try {
      const booking = await createBooking({
        serviceIds: selected,
        bookingDate: new Date(date),
        address,
        notes,
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || "",
        phone: user.primaryPhoneNumber?.phoneNumber || undefined,
      })

      setLoading(false)
      onSuccess?.()
      toast.success("Booking created successfully!")
    } catch (err: any) {
      console.error("Booking failed:", err)
      setLoading(false)
      toast.error(err?.message || "Booking failed.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-2">Choose service(s)</label>
        {services.map((s) => (
          <label key={s.id} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selected.includes(s.id)}
              onChange={(e) =>
                setSelected((prev) =>
                  e.target.checked ? [...prev, s.id] : prev.filter((i) => i !== s.id)
                )
              }
            />
            {s.name} – ${s.price}
          </label>
        ))}
      </div>

      <input
        name="date"
        type="datetime-local"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <textarea
        name="address"
        placeholder="Service address"
        required
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <div className="space-y-2">
        <Label>Phone (optional)</Label>
        <Input
          name="phone"
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <textarea
        name="notes"
        placeholder="Extra notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />

      <button
        type="submit"
        disabled={loading || selected.length === 0}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Booking..." : "Submit Booking"}
      </button>
    </form>
  )
}
