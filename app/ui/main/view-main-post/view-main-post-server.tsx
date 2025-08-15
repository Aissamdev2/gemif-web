import { getUser } from "@/app/lib/actions/user/actions";
import { getSubjects } from "@/app/lib/actions/subjects/actions";
import { getMainPost, getMainPosts } from "@/app/lib/actions/main-posts/actions";
import ViewMainPostClient from "./view-main-post-client";
import ModalWrapper from "../../modal-wrapper";
import ErrorPage from "../../error";

export default async function ViewMainPostServer({ id, route }: { id: string, route?: string }) {
  const [user, subjects, mainPost] = await Promise.all([
    getUser(),
    getSubjects(),
    getMainPost({ id }),
  ]);

  if (!user.data || user.error) return <ErrorPage error={user.error ?? 'Error al recuperar el usuario'} />;
  if (!subjects.data || subjects.error) return <ErrorPage error={subjects.error ?? 'Error al recuperar las asignaturas'} />;
  if (!mainPost.data || mainPost.error) return <ErrorPage error={mainPost.error ?? 'Error al recuperar la publicación'} />;

  return (
    <ModalWrapper route={route}>
      <ViewMainPostClient initialUser={user.data} initialSubjects={subjects.data} initialMainPost={mainPost.data} />
    </ModalWrapper>
  );
}