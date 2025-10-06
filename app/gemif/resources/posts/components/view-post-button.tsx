import Link from "next/link";

export default function ViewPostButton({ id }: { id: string }) {

  return (
    <Link
      href={`/gemif/resources/posts/view-main-post/${id}`}
      className="btn btn-icon btn-icon-md hover:bg-surface-hover-dark"
      aria-label="Más información"
      title="Ver más información"
    >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-400"
          aria-hidden
        >
          <circle cx="5" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" />
        </svg>
    </Link>
  )
}