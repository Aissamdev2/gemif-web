import ViewPostClientAdmin from "./view-post-client-admin";
import { redirect, unauthorized } from "next/navigation";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";
import { redirectErrorUrl } from "@/lib/utils";
import { dbGetSubjects } from "@/db/subjects";
import { dbGetResourcesPost, dbGetResourcesPostWithSubjectAndUser } from "@/db/main-posts/main-posts";
import { verifySession } from "@/auth/dal";
import SubjectTag from "@/app/ui/subject-tag";
import FileLink from "./file-link";
import Link from "next/link";
import ViewPostClientUser from "./view-post-client-user";

export default async function ViewPostServer({ id }: { id: string }) {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { userId, role } = session;

  const result = await dbGetResourcesPostWithSubjectAndUser({ id })
  if (isFailure(result)) redirectErrorUrl(unwrapError(result))
  const data = unwrap(result)

  if (!data) redirect('/gemif/resources/posts/')

  const { post, subject, user } = data
  
  console.log(post)
  return (
    <>
      <div
          className="panel-body w-full flex-1 overflow-y-auto p-3 flex gap-10"
        >
          {/* Title/Description/Subject */}
          <div className="flex-1 overflow-y-auto p-6 bg-white text-black">
            {/* Two-column layout */}
            <div className="flex flex-col md:flex-row md:justify-between gap-8 w-full">

              {/* Left column: Title + Description */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-1 rounded-lg border border-border">
                  <p className="text-body bg-surface-hover border-b border-border p-2">Título</p>
                  <div className="text-body p-3">{post.name}</div>
                </div>

                {post.description && (
                  <div className="flex flex-col gap-1 rounded-lg border border-border">
                    <p className="text-body bg-surface-hover border-b border-border p-2">Descripción</p>
                    <div className="text-muted bg-gray-50 rounded-lg p-3">
                      {post.description}
                    </div>
                  </div>
                )}

                {/* <div className="flex flex-col gap-1">
                  <p className="text-body">Asignatura</p>
                  <SubjectTag subject={subject.name} />
                </div> */}

                <div className="flex flex-col gap-1 rounded-lg border border-border">
                  <p className="text-body bg-surface-hover border-b border-border p-2">Asignatura</p>
                  <div className="text-muted bg-gray-50 rounded-lg p-3">
                    {subject.name}
                  </div>
                </div>
              </div>

              {/* Right column: Files & Links */}
              <div className="flex-1 flex flex-col gap-4">
                {
                  !post.anonymous && (
                    <div className="flex flex-col gap-1 rounded-lg border border-border">
                      <p className="text-body bg-surface-hover border-b border-border p-2">Autor</p>
                      <div className="text-muted bg-gray-50 rounded-lg p-3">
                        {user.publicName}
                      </div>
                    </div>
                  )
                }

                <div className="flex flex-col gap-1 rounded-lg border border-border">
                  <p className="text-body bg-surface-hover border-b border-border p-2">Fecha de creación</p>
                  <div className="text-muted bg-gray-50 rounded-lg p-3">
                    {(new Date(post.createdAt)).toLocaleDateString()}
                  </div>
                </div>
                {(post.fileNames?.length || 0) > 0 && (
                  <div className="flex flex-col gap-1 rounded-lg border border-border">
                    <p className="text-body bg-surface-hover border-b border-border p-2">Archivos</p>
                    <ul className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                      {post.fileNames.map((filename, idx) => {
                        return (
                          <FileLink key={`${post.folderName}/${filename}`} label={filename} r2Key={`${post.folderName}/${filename}`} />
                        );
                      })}
                    </ul>
                  </div>
                )}

                {(post.links?.length || 0) > 0 && (
                  <div className="flex flex-col gap-1 rounded-lg border border-border">
                    <p className="text-body bg-surface-hover border-b border-border p-2">Links</p>
                    <ul className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                      {post.links.map((link, idx) => (
                        <li
                          key={idx + link}
                          className="text-muted bg-gray-50 rounded-lg px-3 py-1 hover:bg-surface-hover break-all truncate max-w-full"
                        >
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
        {
          role === "admin" || role == "dev" || userId === user.id ? (
            <ViewPostClientAdmin id={post.id} folderName={post.folderName} fileNames={post.fileNames} />
          ) : (
            <ViewPostClientUser />
          )
        }
    </>
  );
}


function NotFound() {
  return (
    <>
      <div
          className="panel-body w-full flex-1 overflow-y-auto p-3 flex gap-10"
        >
          <div className="flex-1 flex justify-center items-center text-muted text-sm overflow-y-auto p-6 bg-white">
            Esta publicación ya no existe
          </div>
        </div>
        <div className="panel-footer w-full flex-none flex justify-start gap-2 items-center border-t border-border">
          <Link href={"/gemif/resources/posts"} className="btn btn-secondary">
            Cerrar
          </Link>
          <button disabled className="btn btn-danger opacity-60">
            Eliminar publicación
          </button>
          <button disabled className="btn btn-primary opacity-60">
            Editar publicación
          </button>
        </div>
    </>
  )
}