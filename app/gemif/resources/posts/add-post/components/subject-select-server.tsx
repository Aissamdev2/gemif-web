import { redirect, unauthorized } from "next/navigation";
import { SessionPayload } from "@/app/lib/definitions";
import { verifySession } from "@/auth/dal";
import { dbGetSubjects } from "@/db/subjects";
import { connection } from "next/server";
import { isFailure, unwrap, unwrapError } from "@/lib/errors/result";
import { redirectErrorUrl } from "@/lib/utils";

export default async function SubjectSelectServer() {
  // Validate session [START]
  const sessionResult = await verifySession();
  if (isFailure(sessionResult)) redirectErrorUrl(unwrapError(sessionResult))
  const session = unwrap(sessionResult)
  if (!session) unauthorized()
  // Validate session [END]

  const { userId } = session;

  const subjectsResult = await dbGetSubjects({ id: userId });
  if (isFailure(subjectsResult)) redirectErrorUrl(unwrapError(subjectsResult))
  const subjects = unwrap(subjectsResult)

  return (
    <div>
      <label htmlFor="subject" className="label">
        <div>
          <p>Asignatura </p>
          <p className="text-[11px] text-muted">La asignatura a la que pertenece la publicación</p>
        </div>
      </label>
      <select id="subject" name="subjectId" defaultValue="11111111" className="select select-md w-full">
        {subjects.filter(s => s.primitiveId !== '00000000').map(subject => (
          <option key={subject.id} value={subject.primitiveId}>{subject.name}</option>
        ))}
      </select>
    </div>
  );
}

