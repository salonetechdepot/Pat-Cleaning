export function About() {
  return (
    <section id="about" className="py-16 md:py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              Excellence in every detail
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                At Pat Pro Cleaning, we're passionate about delivering exceptional cleaning services that transform
                spaces and exceed expectations. Our team of trained professionals brings years of experience and
                attention to detail to every job.
              </p>
              <p>
                We understand that your home or business is important to you, which is why we use eco-friendly products
                and proven techniques to ensure a thorough, safe clean every time.
              </p>
              <p>
                From residential homes to commercial offices, we tailor our services to meet your specific needs,
                working around your schedule to provide convenient, reliable cleaning solutions.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-xl">
              <img
                src="/cleaning-supplies-and-equipment-professional-setup.jpg"
                alt="Professional cleaning supplies and equipment"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
