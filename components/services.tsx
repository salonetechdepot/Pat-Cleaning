
import { Card, CardContent } from "@/components/ui/card"
import { Home, Building2, Sparkles, Droplets } from "lucide-react"
import { prisma } from "../lib/prisma"

// map DB service names to icons & images
const iconMap: Record<string, any> = {
  "Standard Clean": Home,
  "Deep Clean": Sparkles,
  "Move-in / Move-out": Droplets,
  "Office Cleaning": Building2,
}

const imageMap: Record<string, string> = {
  "Standard Clean": "/clean-modern-home-interior--living-room.jpg",
  "Deep Clean": "/deep-cleaning--sparkling-clean-kitchen.jpg",
  "Move-in / Move-out": "/carpet-cleaning--window-washing-service.jpg",
  "Office Cleaning": "/clean-modern-office-space--professional-workspace.jpg",
}

export async function Services() {
  const services = await prisma.service.findMany({ orderBy: { id: "asc" } })

  return (
    <section id="services" className="py-16 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Our Services</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Comprehensive cleaning solutions designed to meet your unique needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service) => {
            const Icon = iconMap[service.name] ?? Sparkles
            const img = service.imageUrl || imageMap[service.name] || "/placeholder.svg"
            return (
              <Card key={service.id} className="border-border hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-video overflow-hidden">
                  <img src={img} alt={service.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <CardContent className="p-6 md:p-8">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{service.name}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}