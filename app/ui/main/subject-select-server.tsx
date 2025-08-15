import { getSubjects } from "@/app/lib/actions/subjects/actions";
import SubjectSelectClient from "./subject-select-client";

export default async function SubjectSelectServer() {
  const res = await getSubjects();
  const subjects = res?.data ?? [];

  return <SubjectSelectClient subjects={subjects} />;
}
