import FeaturedGallery from "./FeaturedGallery";

export default function GalleryShowcase() {
  return (
    <section className="w-full">
      {/* Mobile/Tablet: simple gallery */}
      <div className="lg:hidden">
        <FeaturedGallery />
      </div>

      {/* Desktop: render normally without internal scrolling */}
      <div className="hidden lg:block w-full">
        <div className="w-full p-4">
          <FeaturedGallery showTitle={false} />
        </div>
      </div>
    </section>
  );
}
