import { getUser } from "@/app/lib/actions/user/actions";
import { getSubjects } from "@/app/lib/actions/subjects/actions";
import AddMainPostClient from "./add-main-post-client";
import ErrorPage from "../../error";
import ModalWrapper from "../../modal-wrapper";

export default async function AddMainPostServer({ route }: { route?: string }) {
  const [user, subjects] = await Promise.all([
    getUser(),
    getSubjects(),
  ]);

  if (!user.data || user.error) return <ErrorPage error={user.error ?? 'Error al recuperar el usuario'} />;
  if (!subjects.data || subjects.error) return <ErrorPage error={subjects.error ?? 'Error al recuperar las asignaturas'} />;

  // Pass fetched data as props to the Client Component
  return (
    <ModalWrapper route={route}>
      <AddMainPostClient initialUser={user.data} initialSubjects={subjects.data} />
    </ModalWrapper>
  )
}