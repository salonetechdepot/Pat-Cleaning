const steps = [
  {
    number: "1",
    title: "Book Your Service",
    description:
      "Contact us for a free consultation and quote. We'll discuss your needs and schedule a convenient time.",
  },
  {
    number: "2",
    title: "Customized Plan",
    description: "We create a tailored cleaning plan that addresses your specific requirements and preferences.",
  },
  {
    number: "3",
    title: "Professional Cleaning",
    description: "Our trained team arrives on time with all necessary equipment and delivers exceptional results.",
  },
  {
    number: "4",
    title: "Quality Assurance",
    description:
      "We conduct a thorough inspection to ensure every detail meets our high standards and your satisfaction.",
  },
]

export function Process() {
  return (
    <section id="process" className="py-16 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Our Process</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            A streamlined approach to delivering exceptional cleaning services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
