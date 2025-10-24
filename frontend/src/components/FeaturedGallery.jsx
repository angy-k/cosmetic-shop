"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function FeaturedGallery({ showTitle = true, revealRoot }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const rootEl = typeof revealRoot === "string" ? document.querySelector(revealRoot) : null;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.getAttribute("data-delay") || "0ms";
            el.style.animationDelay = delay;
            el.classList.add("fade-in-up");
            io.unobserve(el);
          }
        });
      },
      { root: rootEl, threshold: 0.05, rootMargin: "100px 0px 100px 0px" }
    );

    const nodes = rootRef.current.querySelectorAll("[data-reveal]");
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [revealRoot]);
  return (
    <section className="w-full" ref={rootRef}>
      {showTitle && (
        <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--foreground)" }}>Featured collections</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid gap-4 auto-rows-[180px] sm:auto-rows-[220px] lg:auto-rows-[260px]">
        <figure data-reveal data-delay="0ms" className="rounded-lg border overflow-hidden row-span-2" style={{ borderColor: "var(--border)" }}>
          <div className="relative h-full w-full">
            <Image
              src="/static/images/proizvod-5-sprej.webp"
              alt="Spray product"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </figure>
        <figure data-reveal data-delay="80ms" className="rounded-lg border overflow-hidden row-span-1" style={{ borderColor: "var(--border)" }}>
          <div className="relative h-full w-full">
            <Image
              src="/static/images/proizvod-8-dezodorans-krema.webp"
              alt="Cream deodorant"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </figure>
        </div>

        <div className="grid gap-4 auto-rows-[180px] sm:auto-rows-[220px] lg:auto-rows-[260px]">
        <figure data-reveal data-delay="160ms" className="rounded-lg border overflow-hidden row-span-1" style={{ borderColor: "var(--border)" }}>
          <div className="relative h-full w-full">
            <Image
              src="/static/images/proizvod-2-dnevna-i-nocna-krema-za-lice.webp"
              alt="Day and night face cream"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </figure>
        <figure data-reveal data-delay="240ms" className="rounded-lg border overflow-hidden row-span-1" style={{ borderColor: "var(--border)" }}>
          <div className="relative h-full w-full">
            <Image
              src="/static/images/proizvod-4-tonirana.webp"
              alt="Tinted product"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </figure>
        <figure data-reveal data-delay="320ms" className="rounded-lg border overflow-hidden row-span-1" style={{ borderColor: "var(--border)" }}>
          <div className="relative h-full w-full">
            <Image
              src="/static/images/proizvod-9-balzam.webp"
              alt="Lip balm"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </figure>
        </div>

        <div className="grid gap-4 auto-rows-[180px] sm:auto-rows-[220px] lg:auto-rows-[260px]">
        <figure data-reveal data-delay="400ms" className="rounded-lg border overflow-hidden row-span-1" style={{ borderColor: "var(--border)" }}>
          <div className="relative h-full w-full">
            <Image
              src="/static/images/proizvod-1-dnevna-krema.webp"
              alt="Day cream"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </figure>
        <figure data-reveal data-delay="480ms" className="rounded-lg border overflow-hidden row-span-2" style={{ borderColor: "var(--border)" }}>
          <div className="relative h-full w-full">
            <Image
              src="/static/images/proizvod-6-mleko.webp"
              alt="Body milk"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        </figure>
        </div>
      </div>
    </section>
  );
}
