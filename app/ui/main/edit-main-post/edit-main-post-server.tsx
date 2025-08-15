// app/components/edit-main-post-server.tsx

import { getUser } from "@/app/lib/actions/user/actions";
import { getSubjects } from "@/app/lib/actions/subjects/actions";
import { getMainPost } from "@/app/lib/actions/main-posts/actions";
import EditMainPostClient from "./edit-main-post-client";
import ErrorPage from "../../error";
import ModalWrapper from "@/app/ui/modal-wrapper";

export default async function EditMainPostServer({ id, route }: { id: string, route?: string }) {
  // Fetch all necessary data in parallel on the server
  const [user, subjects, mainPost] = await Promise.all([
    getUser(),
    getSubjects(),
    getMainPost({ id }),
  ]);

  // Handle errors on the server before rendering
  if (!user.data || user.error) return <ErrorPage error={user.error ?? 'Error al recuperar el usuario'} />;
  if (!subjects.data || subjects.error) return <ErrorPage error={subjects.error ?? 'Error al recuperar las asignaturas'} />;
  if (!mainPost.data || mainPost.error) return <ErrorPage error={mainPost.error ?? 'Error al recuperar la publicación'} />;

  // Render the client component with the pre-fetched data
  return (
    <ModalWrapper route={route}>
      <EditMainPostClient
        initialUser={user.data}
        initialSubjects={subjects.data}
        initialMainPost={mainPost.data}
      />
    </ModalWrapper>
  );
}