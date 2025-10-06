import { redirect, unauthorized } from "next/navigation";
import { SessionPayload } from "@/app/lib/definitions";
import { verifySession } from "@/auth/dal";
import { dbGetSubjects } from "@/db/subjects";
import { connection } from "next/server";
import { dbGetResourcesPost } from "@/db/main-posts/main-posts";
import { redirectErrorUrl } from "@/lib/utils";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";

export default async function SubjectSelectServer({ id }: { id: string }) {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { userId } = session;

  const [subjectsResult, postResult] = await Promise.all([dbGetSubjects({ id: userId }), dbGetResourcesPost({ id })]);
  if (isFailure(subjectsResult)) return redirectErrorUrl(unwrapError(subjectsResult))
  if (isFailure(postResult)) return redirectErrorUrl(unwrapError(postResult))

  const subjects = unwrap(subjectsResult);
  const mainPost = unwrap(postResult);

  return (
    <div>
      <label htmlFor="subject" className="label">
        <div>
          <p>Asignatura </p>
          <p className="text-[11px] text-muted">La asignatura a la que pertenece la publicación</p>
        </div>
      </label>
      <select id="subject" name="subjectId" defaultValue={mainPost.subjectId} className="select select-md w-full">
        <option value="11111111">General</option>
        {subjects.filter(s => s.primitiveId !== '00000000').map(subject => (
          <option key={subject.id} value={subject.primitiveId}>{subject.name}</option>
        ))}
      </select>
    </div>
  );
}

