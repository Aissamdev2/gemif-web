import { redirect } from "next/navigation";
import { redirectErrorUrl } from "@/lib/utils";
import { dbGetResourcesPost } from "@/db/main-posts/main-posts";
import { isFailure, unwrapError } from "@/lib/errors/result";

export default async function EditMainPostServer({ id }: { id: string }) {

  const postResult = await dbGetResourcesPost({ id })
  if (isFailure(postResult)) return redirectErrorUrl(unwrapError(postResult))

  const mainPost = postResult.data

  // Render the client component with the pre-fetched data
  return (
    <>
      <input type="hidden" name="id" value={mainPost?.id} />
      <input type='hidden' name="folderName" value={mainPost.folderName} />
      <div className='sm:min-w-36 md:min-w-56'>
        <label htmlFor="name" className="label">
          <div>
            <p>Título </p>
            <p className="text-[11px] text-muted">El nombre principal de la publicación</p>
          </div>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={mainPost?.name}
          className="input input-md w-full"
          placeholder="Ej. Horario"
        />
      </div>
      <div>
        <label htmlFor="description" className="label">
          <div>
            <p>Descripción <span className="text-[11px] text-muted">(opcional)</span></p>
            <p className="text-[11px] text-muted">Una descripción más detallada de la publicación</p>
          </div>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={mainPost?.description ?? ''}
          className="input input-md w-full"
          placeholder="Ej. Horario de clases GEMiF 2025/2026"
        />
      </div>
    </>
  );
}

