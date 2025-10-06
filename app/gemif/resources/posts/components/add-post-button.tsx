import Link from "next/link";

export default function AddPostButton() {
  return (
    <Link
      href="/gemif/resources/posts/add-post"
      className="btn btn-primary btn-md whitespace-nowrap"
      aria-label="Añadir nuevo recurso"
    >
      Añadir recurso
    </Link>
  )

};