import Image from "next/image";
import Link from "next/link";
import GalleryShowcase from "@/components/GalleryShowcase";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Banner Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/static/images/proizvod-1-dnevna-krema.webp"
            alt="Premium cosmetics background"
            fill
            priority
            className="object-cover"
            style={{ filter: 'brightness(0.4)' }}
          />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Discover Your
            <span className="block" style={{ color: 'var(--brand)' }}>
              Natural Beauty
            </span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Premium cosmetics crafted with natural ingredients for radiant, healthy skin. 
            Experience the perfect blend of science and nature.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/products"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{ 
                background: 'var(--brand)', 
                color: 'white',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              Shop Collection
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-all duration-300 hover:scale-105"
              style={{ 
                borderColor: 'white', 
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Gallery */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
            Featured Collections
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--muted)' }}>
            Explore our carefully curated selection of premium skincare and beauty products
          </p>
        </div>
        
        <GalleryShowcase />
        
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
            style={{ 
              background: 'var(--brand-2)', 
              color: 'var(--foreground)',
              border: '1px solid var(--border)'
            }}
          >
            View All Products
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4" style={{ background: 'var(--brand-2)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Natural Ingredients
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Carefully sourced natural ingredients for gentle, effective skincare
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Fast Delivery
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Quick and secure delivery to your doorstep within 2-3 business days
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Expert Care
              </h3>
              <p style={{ color: 'var(--muted)' }}>
                Professional skincare advice and personalized recommendations
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
