// app/asignaturas/components/asignatura-option.tsx
import Image, { StaticImageData } from "next/image"
import Link from "next/link";

interface AsignaturaOptionProps {
  href: string;
  title: string
  description: string
  image?: string | StaticImageData
  hoverScale?: number
}

export default function OptionCard({ href, title, description, image, hoverScale = 1 }: AsignaturaOptionProps) {
  return (
    <Link href={href} className={`panel p-6 border-border bg-surface rounded-lg shadow-sm hover:shadow-lg hover:scale-[var(--hover-scale)] transition flex flex-col gap-2`}
      style={{ "--hover-scale": hoverScale.toString() } as React.CSSProperties}
    >
      {image && (
        <div className="w-full h-32 overflow-hidden rounded-md">
          <Image 
            src={image} 
            alt={title} 
            width={400} 
            height={200} 
            className="w-full h-full object-contain"
            placeholder="blur"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h2 className="heading-md">{title}</h2>
        <p className="text-muted">{description}</p>
      </div>
    </Link>
  )
}
