import { Eye } from "lucide-react";
import Link from "next/link";

export default function ViewPostButton({ post }: { post: { id: string; name: string } }) {

  return (
    <Link
    href={`/gemif/main/view-main-post/${post.id}`}
      aria-label={`Ver detalles del recurso ${post.name}`}
      className="flex w-12 items-center justify-center rounded-r-xl hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      tabIndex={0}
    >
      <Eye className="w-5 h-5 text-blue-500 hover:text-blue-600" aria-hidden="true" />
    </Link>
  )
}