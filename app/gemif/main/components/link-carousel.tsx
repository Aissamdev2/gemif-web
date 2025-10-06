"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

type LinkCarouselProps = {
  items: { label: string; href: string }[]
}

export default function LinkCarousel({ items }: LinkCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollTo = (direction: "left" | "right") => {
    if (!containerRef.current) return
    const container = containerRef.current
    const itemWidth = container.offsetWidth
    container.scrollBy({
      left: direction === "left" ? -itemWidth : itemWidth,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative h-full max-w-60 max-h-8">
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="h-full flex overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar"
      >
        {items.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="snap-center shrink-0 w-full flex items-center justify-center p-1 text-center text-xs hover:bg-gray-50 transition"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Left Button */}
      <button
        onClick={() => scrollTo("left")}
        className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 p-3"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Right Button */}
      <button
        onClick={() => scrollTo("right")}
        className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 p-3"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
